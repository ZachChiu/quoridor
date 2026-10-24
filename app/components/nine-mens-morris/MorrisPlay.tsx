'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { LuArrowLeft, LuCircleHelp, LuHouse, LuRotateCcw, LuUndo2, LuVolume2, LuVolumeX } from 'react-icons/lu';
import { ShareResultModal, useShareCard } from '@/components/ShareResultModal';
import { useSound } from '@/hook/useSound';
import { useGameText, useMessages } from '@/i18n/LocaleProvider';
import { fill, useTextTable } from '@/i18n/gameText';
import { localePath, type Locale } from '@/i18n/locales';
import { NINE_MENS_MORRIS } from '@/i18n/routes';
import {
  NEIGHBORS, PIECES, allInMills, applyMove, cellOf, countOnBoard, createGame, decodeMoves, encodeMoves, lastMills, legalMoves, other, phaseOf,
  removable, replay, sideOf, undoPoint, undoTurn, type MorrisState, type Move, type Point, type Side,
} from '@/games/nine-mens-morris/engine';
import { chooseTurn } from '@/games/nine-mens-morris/ai';
import { TEXT } from '@/games/nine-mens-morris/text';
import { MorrisBoard, PieceGlyph } from './MorrisBoard';
import MorrisFrame from './MorrisFrame';
import { MorrisRulesModal } from './MorrisRules';
import { clearSession, saveSession, type MorrisMode } from './session';
import { drawMorrisCard } from './shareCard';
import { playMorris } from './sounds';

const LEVELS = ['easy', 'normal', 'hard'] as const;

/** 接回存著的棋譜；壞掉（被改過、規則對不上）就開新局，不畫一盤錯的棋 */
function restore(moves: string, showRules: boolean): MorrisState {
  try {
    return replay(decodeMoves(moves), { showRules });
  } catch {
    return createGame({ showRules });
  }
}

/**
 * 連線對戰（MorrisOnline）：局面由房間的走法字串重走出來、從外面傳進來；自己的一手交給 onMove 寫進房間。
 * 結算的「再來一局」是再開一間房（newRoom），沒有悔棋與重來（要兩個人都同意，先不做，跟虎羊棋一樣）。
 */
export type OnlineMode = { kind: 'online'; human: Side; game: MorrisState; onMove: (m: Move) => void; newRoom: () => void };
export type PlayMode = MorrisMode | OnlineMode;

/**
 * 九子棋的對局畫面。版面照 Bagh Chal 的對局頁：
 * - 手機：上方是回九子棋首頁的房子鈕、標題與這一局的設定、說明鈕；下面狀態、棋盤，最下面一排悔棋／重來／換模式（拇指搆得到）
 * - 桌機（lg）：棋盤在左，右邊一欄放狀態與有字的按鈕
 *
 * 一個回合可能是兩段：放（走）一手成三之後，同一個人再點一顆對方的子拿掉。
 * 拿子是獨立的一步（engine 的 removing），狀態列的「拿子」亮成朱紅、可以拿的子以腳底為軸搖晃（像快被推倒），
 * 剛連成的那條線用粉筆畫出來 —— 新手最容易卡在「成三之後要做什麼」。被拿掉的子倒下、躺到棋盤下方。
 *
 * 整頁包在《遊戲之書》的畫框裡（MorrisFrame）：群青底上的字是羊皮紙色，按鈕與狀態卡是羊皮紙、沒有框線。
 *
 * 左上角的房子與「換模式」都是 onMenu：回九子棋自己的首頁（選模式的畫面），不回平台、不播轉場
 * （Zach 10/24：九子棋裡面換畫面直接換，跟虎羊棋一樣）。本機與跟電腦下是同一頁換回選單，連線是 router.push 回首頁。
 */
export default function MorrisPlay({ locale, mode, showRules, moves = '', onMenu }: {
  locale: Locale;
  mode: PlayMode;
  showRules: boolean;
  /** 重新整理接回的棋譜（本機、跟電腦下；連線的局面在 mode.game） */
  moves?: string;
  onMenu: () => void;
}) {
  const t = useTextTable(TEXT);
  const m = useMessages();
  const g = useGameText();
  const { prefs: soundPrefs, setPrefs: setSoundPrefs } = useSound();
  const [localGame, setGame] = useState<MorrisState>(() => restore(moves, showRules));
  const online = mode.kind === 'online';
  const game = mode.kind === 'online' ? mode.game : localGame;
  const [selected, setSelected] = useState<Point | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);
  // 結算視窗關掉之後就留在終局盤面（看最後一手、或悔棋）；局面一變就重新算
  const [closedFor, setClosedFor] = useState<MorrisState | null>(null);
  /** 電腦這一回合成三時預先算好的拿子，跟「拿子前的那個局面」綁在一起，局面一變（悔棋、重來）就作廢 */
  const plan = useRef<{ before: MorrisState; move: Move } | null>(null);

  const human: Side | null = mode.kind === 'local' ? null : mode.human;
  const aiTurn = mode.kind === 'ai' && !game.winner && game.turn !== mode.human;
  // 連線時輪到對方：跟電腦的回合一樣不能動，狀態寫「輪到對方」
  const theirTurn = online && !game.winner && game.turn !== human;
  const locked = aiTurn || theirTurn;
  const legal = useMemo(() => (locked ? [] : legalMoves(game)), [game, locked]);

  // 每一步都存起來，重新整理能接回；分出勝負就清掉。連線局不存（房間裡就有整串走法）
  useEffect(() => {
    if (mode.kind === 'online') return;
    if (game.winner) clearSession();
    else saveSession({ mode, showRules, moves: encodeMoves(game.history) });
  }, [game, mode, showRules]);

  // 電腦的回合：讓出一格畫面再算（困難級約 0.2 秒），停一下也像在想。
  // 成三的話先只落那一手，讓人看到連成的線，隔一下再拿子（下一輪 effect 用預先算好的那一顆）
  useEffect(() => {
    if (!aiTurn || mode.kind !== 'ai') return;
    const id = window.setTimeout(() => {
      const planned = plan.current;
      plan.current = null;
      if (planned && planned.before === game) { setGame(applyMove(game, planned.move)); return; }
      const turn = chooseTurn(game, mode.difficulty);
      if (turn.length === 0) return;
      const after = applyMove(game, turn[0]);
      if (turn[1]) plan.current = { before: after, move: turn[1] };
      setGame(after);
    }, game.removing ? 750 : 450);
    return () => window.clearTimeout(id);
  }, [aiTurn, game, mode]);

  // 音效（跟 Wall Go 共用開關）：剛好多一手才響 —— 悔棋、重來、重整接回、連線一次補好幾手都不響。九子棋自己的一套見 sounds.ts
  const heard = useRef(game.history.length);
  useEffect(() => {
    const prev = heard.current;
    heard.current = game.history.length;
    if (game.history.length !== prev + 1) return;
    const mv = game.history[game.history.length - 1];
    playMorris(mv.kind === 'remove' ? 'remove' : mv.kind === 'place' ? 'place' : NEIGHBORS[mv.from].includes(mv.to) ? 'move' : 'fly');
    if (mv.kind !== 'remove' && lastMills(game).length) window.setTimeout(() => playMorris('mill'), 200);
    if (game.winner) {
      const result = game.winner === 'draw' ? 'draw' : !human || game.winner === human ? 'win' : 'lose';
      window.setTimeout(() => playMorris(result), 700);
    } else if (online && game.turn === human && !game.removing) {
      // 對方下完（成三的話是拿完子）、換你：分頁在背景也聽得到
      window.setTimeout(() => playMorris('turn'), 450);
    }
  }, [game, human, online]);

  const commit = (mv: Move) => {
    if (mode.kind === 'online') mode.onMove(mv);
    else setGame(applyMove(game, mv));
    setSelected(null);
  };

  const movable = new Set(legal.flatMap((x) => (x.kind === 'move' ? [x.from] : [])));
  const pick = (p: Point) => {
    if (locked || game.winner) return;
    if (game.removing) {
      const mv = legal.find((x) => x.kind === 'remove' && x.at === p);
      if (mv) commit(mv);
      return;
    }
    if (game.inHand[game.turn] > 0) {
      const mv = legal.find((x) => x.kind === 'place' && x.to === p);
      if (mv) commit(mv);
      return;
    }
    if (game.board[p] === cellOf(game.turn)) {
      const next = selected === p || !movable.has(p) ? null : p;
      if (next !== null) playMorris('select');
      setSelected(next);
      return;
    }
    const mv = legal.find((x) => x.kind === 'move' && x.from === selected && x.to === p);
    if (mv) commit(mv);
    else setSelected(null);
  };

  const targets = new Map<Point, 'place' | 'move'>();
  for (const x of legal) {
    if (x.kind === 'place') targets.set(x.to, 'place');
    else if (x.kind === 'move' && x.from === selected) targets.set(x.to, 'move');
  }
  // 電腦或對方在挑要拿哪一顆時，自己的子不搖（跟電腦下一樣，提示列寫「正在挑」）
  const removableNow = new Set(locked ? [] : removable(game));
  const h = game.history;
  const last = h[h.length - 1];
  const prev = h[h.length - 2];
  // 這一回合（成三的話是拿子之前那一手）放下或走動的子
  const step = last?.kind === 'remove' ? prev : last;
  const lastTo = step && step.kind !== 'remove' ? step.to : undefined;
  const lastFrom = step?.kind === 'move' ? step.from : undefined;
  // 被拿掉的是哪一方：拿子前那一手的子（成三的那一顆）還在盤上，它的對手就是被拿的
  const removedSide = last?.kind === 'remove' && prev && prev.kind !== 'remove' && game.board[prev.to] ? other(sideOf(game.board[prev.to]!)) : undefined;
  const removedCount = (s: Side) => PIECES - game.inHand[s] - countOnBoard(game.board, s);
  const removed = { black: removedCount('black'), white: removedCount('white') };
  const mills = lastMills(game);
  // 成三了卻沒進入拿子（節目規則：對方的子全在線上）
  const millNoRemoval = !game.removing && last !== undefined && last.kind !== 'remove' && mills.length > 0;

  const name = (s: Side) => (s === 'black' ? t.black : t.white);
  // 狀態卡上的名字：跟電腦下時寫「你／電腦」（是哪一色看旁邊的棋子），兩人同一台與連線寫黑方／白方。
  // 兩個都寫會太長（日文「白 · コンピューター」在手機上被截掉）。
  // 連線不寫「你／對方」：自己那張卡多一圈拱框（.is-mine），用記號不用字 —— Zach 在 Wall Go 選過「寫『你』太直白」
  const label = (s: Side) => (mode.kind === 'ai' ? (s === mode.human ? t.you : t.computer) : name(s));
  const phase = game.removing ? 'remove' : phaseOf(game);

  const undoSide = human ?? undefined;
  const canUndo = !locked && !online && undoPoint(game, undoSide) >= 0;
  const doUndo = () => { plan.current = null; setGame(undoTurn(game, undoSide)); setSelected(null); };
  const restart = () => { plan.current = null; setGame(createGame({ showRules })); setSelected(null); };
  const again = mode.kind === 'online' ? mode.newRoom : restart;

  const levels = [m.solo.level1, m.solo.level2, m.solo.level3];
  // 這一局的設定（標題下面那一行）。傳統規則是預設，只有開了節目規則才寫出來
  const summary = [
    mode.kind === 'ai' ? `${t.vsAi} · ${mode.human === 'black' ? t.first : t.second} · ${levels[LEVELS.indexOf(mode.difficulty)]}`
      : mode.kind === 'online' ? `${t.online} · ${mode.human === 'black' ? t.first : t.second}` : t.local,
    ...(showRules ? [t.showRules] : []),
  ].join(' · ');

  const resultTitle = !game.winner ? '' : game.winner === 'draw' ? t.draw
    : mode.kind === 'ai' ? (game.winner === mode.human ? t.youWin : t.aiWins) : fill(t.win, { side: name(game.winner) });
  const loser = game.winner && game.winner !== 'draw' ? other(game.winner) : null;
  const resultBody = game.reason === 'pieces' && loser ? fill(t.reason.pieces, { side: name(loser) })
    : game.reason === 'blocked' && loser ? fill(t.reason.blocked, { side: name(loser) })
    : game.reason === 'repetition' ? t.reason.repetition
    : game.reason === 'quiet' ? t.reason.quiet
    : game.reason === 'standoff' ? (loser ? fill(t.reason.standoff, { side: name(loser) }) : t.reason.standoffDraw) : '';

  // 連線也寫「輪到黑方／白方」，是不是自己看亮起來的那張卡有沒有那圈拱框
  const status = game.winner ? resultTitle : aiTurn ? t.thinking : mode.kind === 'ai' ? t.yourTurn : fill(t.turnOf, { side: name(game.turn) });
  const hint = game.winner ? resultBody
    : aiTurn ? (game.removing ? t.hint.aiRemoving : '')
    : theirTurn ? (game.removing ? fill(t.hint.sideRemoving, { side: name(game.turn) }) : '')
    : game.removing ? (allInMills(game.board, other(game.turn)) ? t.hint.removeAny : t.hint.remove)
    : millNoRemoval ? t.hint.noRemoval
    : phase === 'place' ? t.hint.place
    : selected !== null ? t.hint.moveSelected
    : phase === 'fly' ? t.hint.fly : t.hint.move;

  const endOpen = !!game.winner && closedFor !== game;
  // 標題本來就是英文名（英文、泰文）就不重複寫兩次
  const brand = /^[ -~’]+$/.test(t.title) ? t.title : `${t.title} ${t.subtitle}`;
  const card = {
    board: game.board, removed,
    text: {
      kicker: `${t.title} · ${summary}`,
      title: resultTitle,
      reason: resultBody,
      moves: fill(t.cardMoves, { n: h.filter((x) => x.kind !== 'remove').length }),
      brand,
      from: fill(g.share.cardFrom, { show: t.show }),
      host: new URL(process.env.SITE_URL || 'https://quoridorgame.com').host,
    },
  };
  const font = typeof document === 'undefined' ? 'system-ui' : getComputedStyle(document.documentElement).getPropertyValue('--font-app').trim() || 'system-ui';
  const share = useShareCard({
    isOpen: endOpen,
    draw: drawMorrisCard({ ...card, font }),
    contentKey: JSON.stringify(card),
    fileName: 'nine-mens-morris',
    homePath: localePath(locale, NINE_MENS_MORRIS),
    campaign: 'nine-mens-morris',
    fonts: [{ font: `900 40px ${font}`, text: card.text.title + card.text.brand }, { font: `700 40px ${font}`, text: card.text.kicker + card.text.reason + card.text.from + card.text.moves }],
    // 只留 9:16（Zach 10/24：「感覺可以留 9:16 就好」，跟虎羊棋一樣）；只有一種就不顯示比例切換
    layouts: ['story'],
  });

  // 群青底上的按鈕是拱頂的羊皮紙小拱（手抄本插圖框的形狀，globals.css 的 .nmm-arch）
  const round = 'nmm-arch is-small grid size-11 shrink-0 place-items-center pt-1 text-xl disabled:opacity-40';
  const soundButton = (
    <button type="button" onClick={() => setSoundPrefs({ sfx: !soundPrefs.sfx })} aria-pressed={soundPrefs.sfx} aria-label={g.sound.button} className={round}>
      {soundPrefs.sfx ? <LuVolume2 aria-hidden="true" /> : <LuVolumeX aria-hidden="true" />}
    </button>
  );
  const wide = 'nmm-arch is-small flex h-12 items-center justify-center gap-2 px-2 pt-1 text-sm font-black disabled:opacity-40';
  const stacked = 'nmm-arch is-small flex h-14 flex-col items-center justify-center gap-0.5 px-1 pt-1.5 text-xs font-black disabled:opacity-40 [&_svg]:text-lg';

  // 兩方的狀態：輪到的那方亮成羊皮紙（墨字），另一方淡淡的半透明。棋子放在羊皮紙小圓上，亮暗都看得清楚。
  // 連線時自己那張多一圈拱框（.is-mine：隔一道縫、一條羊皮紙細線加朱紅的邊，跟整頁最外緣的畫框同一個做法），讀屏另外念「你」
  const statusCards = (
    <div className="grid w-full grid-cols-2 gap-3">
      {(['black', 'white'] as const).map((s) => {
        const active = !game.winner && game.turn === s;
        const onBoard = countOnBoard(game.board, s);
        const hand = game.inHand[s];
        return (
          <div key={s} className={`nmm-arch is-small flex min-w-0 flex-col gap-1 px-3.5 pb-2.5 pt-3.5 ${active ? 'is-on' : 'is-dim'} ${online && s === human ? 'is-mine' : ''}`}>
            <p className="flex min-w-0 items-center gap-2 text-sm font-bold">
              <span className="grid size-7 shrink-0 place-items-center rounded-full bg-[#eee0c4]"><PieceGlyph side={s} className="size-5" /></span>
              <span className="truncate">{label(s)}</span>
              {online && s === human && <span className="sr-only">（{t.you}）</span>}
            </p>
            <p className="flex flex-wrap gap-x-2 text-sm font-black tabular-nums leading-tight">
              {hand > 0 && <span>{fill(t.inHand, { n: hand })}</span>}
              <span>{fill(t.onBoard, { n: onBoard })}</span>
              {hand === 0 && onBoard === 3 && <span>{t.phase.fly}</span>}
            </p>
          </div>
        );
      })}
    </div>
  );

  const statusLine = (
    <div className="flex min-h-[3.25rem] w-full flex-col items-center gap-1 text-center lg:items-start lg:text-left" aria-live="polite">
      <div className="flex items-center gap-2">
        {!game.winner && (
          <span className={`rounded-[3px] px-2.5 py-0.5 text-xs font-black ${phase === 'remove' ? 'bg-[#c54915] text-[#eee0c4]' : 'bg-[#eee0c4]/[0.16] text-[#eee0c4]'}`}>
            {t.phase[phase]}
          </span>
        )}
        <p className="text-sm font-black">{status}</p>
      </div>
      {hint && <p className="text-xs font-bold text-[#eee0c4]/80">{hint}</p>}
    </div>
  );

  return (
    <MorrisFrame className="items-center px-4 pb-4 pt-3 lg:flex-row lg:items-center lg:justify-center lg:gap-12 lg:py-10">
      {/* 手機的上方一排 */}
      <div className="flex w-full max-w-[520px] items-center gap-3 lg:hidden">
        <button type="button" onClick={onMenu} aria-label={t.home} className={round}><LuHouse aria-hidden="true" /></button>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-black leading-tight">{t.title}</h1>
          <p className="text-xs font-bold leading-snug text-[#eee0c4]/80">{summary}</p>
        </div>
        {soundButton}
        <button type="button" onClick={() => setHelpOpen(true)} aria-label={t.rulesHeading} className={round}><LuCircleHelp aria-hidden="true" /></button>
      </div>
      <div className="mt-3 flex w-full max-w-[520px] flex-col items-center gap-2 lg:hidden">
        {statusCards}
        {statusLine}
      </div>

      {/* 棋盤在剩下的高度裡置中 */}
      {/* 棋盤比寬多一段（下方放被拿掉的子，106:118），桌機照高度算寬 */}
      <div className="flex w-full max-w-[500px] flex-1 items-center py-2 lg:max-w-[min(580px,calc((100svh-5rem)*0.9))] lg:flex-none lg:py-0">
        <MorrisBoard board={game.board} targets={targets} movable={selected === null ? movable : new Set()} removable={removableNow}
          selected={selected} lastTo={lastTo} lastFrom={lastFrom} mills={mills} removed={removed} last={last} removedSide={removedSide}
          plies={h.length} idle={game.winner ? null : other(game.turn)} ghost={phase === 'place' && !locked ? game.turn : undefined}
          labels={{ black: t.black, white: t.white, empty: t.empty, remove: t.phase.remove }} onPick={pick} />
      </div>

      {/* 手機的下方一排（連線局沒有悔棋、重來，要離開按左上的房子） */}
      {!online && (
        <div className="grid w-full max-w-[520px] grid-cols-3 gap-2 lg:hidden">
          <button type="button" onClick={doUndo} disabled={!canUndo} className={stacked}><LuUndo2 aria-hidden="true" />{t.undo}</button>
          <button type="button" onClick={restart} className={stacked}><LuRotateCcw aria-hidden="true" />{t.restart}</button>
          <button type="button" onClick={onMenu} className={stacked}><LuArrowLeft aria-hidden="true" />{t.menu}</button>
        </div>
      )}

      {/* 桌機的右邊一欄 */}
      <aside className="hidden w-[340px] shrink-0 flex-col gap-5 lg:flex">
        <div className="flex items-start gap-3">
          <button type="button" onClick={onMenu} aria-label={t.home} className={round}><LuHouse aria-hidden="true" /></button>
          <div className="min-w-0 flex-1">
            <h1 className="text-3xl font-black leading-none">{t.title}</h1>
            <p className="mt-1.5 text-sm font-bold text-[#eee0c4]/80">{summary}</p>
          </div>
          {soundButton}
        </div>
        {statusCards}
        {statusLine}
        <div className="grid grid-cols-2 gap-2.5">
          {!online && <>
            <button type="button" onClick={doUndo} disabled={!canUndo} className={wide}><LuUndo2 aria-hidden="true" />{t.undo}</button>
            <button type="button" onClick={restart} className={wide}><LuRotateCcw aria-hidden="true" />{t.restart}</button>
          </>}
          <button type="button" onClick={() => setHelpOpen(true)} className={wide}><LuCircleHelp aria-hidden="true" />{t.rulesHeading}</button>
          <button type="button" onClick={onMenu} className={wide}><LuArrowLeft aria-hidden="true" />{t.menu}</button>
        </div>
      </aside>

      <MorrisRulesModal t={t} open={helpOpen} onClose={() => setHelpOpen(false)} showRules={showRules} />

      {/* 結算就是分享圖（Zach 10/24：每款都要有結尾的可分享畫面），圖長得像這款自己的頁面（shareCard.ts）；
          關掉就留在終局的盤面上看，換模式在頁面上 */}
      <ShareResultModal isOpen={endOpen} onClose={() => setClosedFor(game)} title={resultTitle} card={share}
        onRestart={again} restartLabel={t.again} srText={`${resultBody} ${card.text.moves}`} frameClassName="rounded-[3px]"
        classes={{
          primary: 'nmm-arch is-small is-red', secondary: 'nmm-arch is-small',
          toggle: 'bg-[#eee0c4]/15', toggleOn: 'bg-[#eee0c4] text-[#1e120a]', toggleOff: 'text-[#eee0c4]/75 hover:text-[#eee0c4]',
          button: 'pb-3 pt-4 font-black', placeholder: 'bg-[#4b4577]/70',
        }} />
    </MorrisFrame>
  );
}
