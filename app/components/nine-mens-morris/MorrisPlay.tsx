'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { GiScales } from 'react-icons/gi';
import { LuArrowLeft, LuCircleHelp, LuHouse, LuRotateCcw, LuUndo2 } from 'react-icons/lu';
import Modal from '@/components/Modal';
import Button from '@/components/Button';
import { useTransition } from '@/contexts/TransitionContext';
import { useMessages } from '@/i18n/LocaleProvider';
import { fill, useTextTable } from '@/i18n/gameText';
import { localePath, type Locale } from '@/i18n/locales';
import { PLATFORM_HOME } from '@/i18n/routes';
import {
  allInMills, applyMove, cellOf, countOnBoard, createGame, decodeMoves, encodeMoves, lastMills, legalMoves, other, phaseOf,
  removable, replay, undoPoint, undoTurn, type MorrisState, type Move, type Point, type Side,
} from '@/games/nine-mens-morris/engine';
import { chooseTurn } from '@/games/nine-mens-morris/ai';
import { TEXT } from '@/games/nine-mens-morris/text';
import { BlackPieceIcon, MorrisBoard, PieceGlyph, WhitePieceIcon } from './MorrisBoard';
import MorrisFrame from './MorrisFrame';
import { MorrisRulesModal } from './MorrisRules';
import { clearSession, saveSession, type Session } from './session';

const LEVELS = ['easy', 'normal', 'hard'] as const;

/** 接回存著的棋譜；壞掉（被改過、規則對不上）就開新局，不畫一盤錯的棋 */
function restore(session: Session): MorrisState {
  try {
    return replay(decodeMoves(session.moves), { showRules: session.showRules });
  } catch {
    return createGame({ showRules: session.showRules });
  }
}

/**
 * 九子棋的對局畫面。版面照 Bagh Chal 的對局頁：
 * - 手機：上方是回平台的房子鈕、標題與這一局的設定、說明鈕；下面狀態、棋盤，最下面一排悔棋／重來／換模式（拇指搆得到）
 * - 桌機（lg）：棋盤在左，右邊一欄放狀態與有字的按鈕
 *
 * 一個回合可能是兩段：放（走）一手成三之後，同一個人再點一顆對方的子拿掉。
 * 拿子是獨立的一步（engine 的 removing），狀態列的「拿子」亮成羊皮紙色、可以拿的子會發光並帶 ×，
 * 剛連成的那條線用羊皮紙色粗線標出來 —— 新手最容易卡在「成三之後要做什麼」。
 *
 * 整頁包在《遊戲之書》的畫框裡（MorrisFrame）：群青底上的字是羊皮紙色，按鈕與狀態卡是羊皮紙、沒有框線。
 */
export default function MorrisPlay({ locale, session, onMenu }: { locale: Locale; session: Session; onMenu: () => void }) {
  const t = useTextTable(TEXT);
  const m = useMessages();
  const { navigate } = useTransition();
  const { mode, showRules } = session;
  const [game, setGame] = useState<MorrisState>(() => restore(session));
  const [selected, setSelected] = useState<Point | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);
  // 結算視窗關掉之後就留在終局盤面（看最後一手、或悔棋）；局面一變就重新算
  const [closedFor, setClosedFor] = useState<MorrisState | null>(null);
  /** 電腦這一回合成三時預先算好的拿子，跟「拿子前的那個局面」綁在一起，局面一變（悔棋、重來）就作廢 */
  const plan = useRef<{ before: MorrisState; move: Move } | null>(null);

  const human: Side | null = mode.kind === 'ai' ? mode.human : null;
  const aiTurn = !!human && !game.winner && game.turn !== human;
  const legal = useMemo(() => (aiTurn ? [] : legalMoves(game)), [game, aiTurn]);

  // 每一步都存起來，重新整理能接回；分出勝負就清掉
  useEffect(() => {
    if (game.winner) clearSession();
    else saveSession({ ...session, moves: encodeMoves(game.history) });
  }, [game, session]);

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

  const commit = (mv: Move) => { setGame(applyMove(game, mv)); setSelected(null); };

  const movable = new Set(legal.flatMap((x) => (x.kind === 'move' ? [x.from] : [])));
  const pick = (p: Point) => {
    if (aiTurn || game.winner) return;
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
    if (game.board[p] === cellOf(game.turn)) { setSelected(selected === p || !movable.has(p) ? null : p); return; }
    const mv = legal.find((x) => x.kind === 'move' && x.from === selected && x.to === p);
    if (mv) commit(mv);
    else setSelected(null);
  };

  const targets = new Map<Point, 'place' | 'move'>();
  for (const x of legal) {
    if (x.kind === 'place') targets.set(x.to, 'place');
    else if (x.kind === 'move' && x.from === selected) targets.set(x.to, 'move');
  }
  const removableNow = new Set(aiTurn ? [] : removable(game));
  const h = game.history;
  const last = h[h.length - 1];
  const prev = h[h.length - 2];
  // 這一回合（成三的話是拿子之前那一手）放下或走動的子
  const step = last?.kind === 'remove' ? prev : last;
  const lastTo = step && step.kind !== 'remove' ? step.to : undefined;
  const lastFrom = step?.kind === 'move' ? step.from : undefined;
  const lastRemoved = last?.kind === 'remove' ? last.at : undefined;
  const mills = lastMills(game);
  // 成三了卻沒進入拿子（節目規則：對方的子全在線上）
  const millNoRemoval = !game.removing && last !== undefined && last.kind !== 'remove' && mills.length > 0;

  const name = (s: Side) => (s === 'black' ? t.black : t.white);
  // 狀態卡上的名字：跟電腦下時寫「你／電腦」（是哪一色看旁邊的棋子），兩人同一台寫黑方／白方。
  // 兩個都寫會太長（日文「白 · コンピューター」在手機上被截掉）
  const label = (s: Side) => (human ? (s === human ? t.you : t.computer) : name(s));
  const phase = game.removing ? 'remove' : phaseOf(game);

  const undoSide = human ?? undefined;
  const canUndo = !aiTurn && undoPoint(game, undoSide) >= 0;
  const doUndo = () => { plan.current = null; setGame(undoTurn(game, undoSide)); setSelected(null); };
  const restart = () => { plan.current = null; setGame(createGame({ showRules })); setSelected(null); };
  const home = () => navigate(localePath(locale, PLATFORM_HOME));

  const levels = [m.solo.level1, m.solo.level2, m.solo.level3];
  // 這一局的設定（標題下面那一行）。傳統規則是預設，只有開了節目規則才寫出來
  const summary = [
    mode.kind === 'ai' ? `${t.vsAi} · ${mode.human === 'black' ? t.first : t.second} · ${levels[LEVELS.indexOf(mode.difficulty)]}` : t.local,
    ...(showRules ? [t.showRules] : []),
  ].join(' · ');

  const resultTitle = !game.winner ? '' : game.winner === 'draw' ? t.draw
    : human ? (game.winner === human ? t.youWin : t.aiWins) : fill(t.win, { side: name(game.winner) });
  const loser = game.winner && game.winner !== 'draw' ? other(game.winner) : null;
  const resultBody = game.reason === 'pieces' && loser ? fill(t.reason.pieces, { side: name(loser) })
    : game.reason === 'blocked' && loser ? fill(t.reason.blocked, { side: name(loser) })
    : game.reason === 'repetition' ? t.reason.repetition
    : game.reason === 'quiet' ? t.reason.quiet
    : game.reason === 'standoff' ? (loser ? fill(t.reason.standoff, { side: name(loser) }) : t.reason.standoffDraw) : '';

  const status = game.winner ? resultTitle : aiTurn ? t.thinking : human ? t.yourTurn : fill(t.turnOf, { side: name(game.turn) });
  const hint = game.winner ? resultBody
    : aiTurn ? (game.removing ? t.hint.aiRemoving : '')
    : game.removing ? (allInMills(game.board, other(game.turn)) ? t.hint.removeAny : t.hint.remove)
    : millNoRemoval ? t.hint.noRemoval
    : phase === 'place' ? t.hint.place
    : selected !== null ? t.hint.moveSelected
    : phase === 'fly' ? t.hint.fly : t.hint.move;

  // 群青底上的按鈕一律羊皮紙色、沒有框線（照 Wall Go 的次要按鈕：中性、安靜）
  const round = 'grid size-11 shrink-0 place-items-center rounded-full bg-[#eee0c4] text-xl text-[#1e120a] transition hover:bg-[#e3c99c] disabled:opacity-40';
  const wide = 'flex h-12 items-center justify-center gap-2 rounded-2xl bg-[#eee0c4] px-2 text-sm font-black text-[#1e120a] transition hover:bg-[#e3c99c] disabled:opacity-40';
  const stacked = 'flex h-14 flex-col items-center justify-center gap-0.5 rounded-2xl bg-[#eee0c4] px-1 text-xs font-black text-[#1e120a] transition hover:bg-[#e3c99c] disabled:opacity-40 [&_svg]:text-lg';

  // 兩方的狀態：輪到的那方亮成羊皮紙（墨字），另一方淡淡的半透明。棋子放在羊皮紙小圓上，亮暗都看得清楚
  const statusCards = (
    <div className="grid w-full grid-cols-2 gap-3">
      {(['black', 'white'] as const).map((s) => {
        const active = !game.winner && game.turn === s;
        const onBoard = countOnBoard(game.board, s);
        const hand = game.inHand[s];
        return (
          <div key={s} className={`flex min-w-0 flex-col gap-1 rounded-2xl px-3.5 py-2.5 ${active ? 'bg-[#eee0c4] text-[#1e120a]' : 'bg-[#eee0c4]/[0.14] text-[#eee0c4]/85'}`}>
            <p className="flex min-w-0 items-center gap-2 text-sm font-bold">
              <span className="grid size-7 shrink-0 place-items-center rounded-full bg-[#eee0c4]"><PieceGlyph side={s} className="size-5" /></span>
              <span className="truncate">{label(s)}</span>
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
          <span className={`rounded-full px-2.5 py-0.5 text-xs font-black ${phase === 'remove' ? 'bg-[#eee0c4] text-[#1e120a]' : 'bg-[#eee0c4]/[0.16] text-[#eee0c4]'}`}>
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
        <button type="button" onClick={home} aria-label={t.home} className={round}><LuHouse aria-hidden="true" /></button>
        <div className="min-w-0 flex-1">
          <h1 className="truncate text-lg font-black leading-tight">{t.title}</h1>
          <p className="text-xs font-bold leading-snug text-[#eee0c4]/80">{summary}</p>
        </div>
        <button type="button" onClick={() => setHelpOpen(true)} aria-label={t.rulesHeading} className={round}><LuCircleHelp aria-hidden="true" /></button>
      </div>
      <div className="mt-3 flex w-full max-w-[520px] flex-col items-center gap-2 lg:hidden">
        {statusCards}
        {statusLine}
      </div>

      {/* 棋盤在剩下的高度裡置中 */}
      <div className="flex w-full max-w-[520px] flex-1 items-center py-2 lg:max-w-[min(620px,calc(100dvh-5rem))] lg:flex-none lg:py-0">
        <MorrisBoard board={game.board} targets={targets} movable={selected === null ? movable : new Set()} removable={removableNow}
          selected={selected} lastTo={lastTo} lastFrom={lastFrom} lastRemoved={lastRemoved} mills={mills}
          labels={{ black: t.black, white: t.white, empty: t.empty, remove: t.phase.remove }} onPick={pick} />
      </div>

      {/* 手機的下方一排 */}
      <div className="grid w-full max-w-[520px] grid-cols-3 gap-2 lg:hidden">
        <button type="button" onClick={doUndo} disabled={!canUndo} className={stacked}><LuUndo2 aria-hidden="true" />{t.undo}</button>
        <button type="button" onClick={restart} className={stacked}><LuRotateCcw aria-hidden="true" />{t.restart}</button>
        <button type="button" onClick={onMenu} className={stacked}><LuArrowLeft aria-hidden="true" />{t.menu}</button>
      </div>

      {/* 桌機的右邊一欄 */}
      <aside className="hidden w-[340px] shrink-0 flex-col gap-5 lg:flex">
        <div className="flex items-start gap-3">
          <button type="button" onClick={home} aria-label={t.home} className={round}><LuHouse aria-hidden="true" /></button>
          <div className="min-w-0">
            <h1 className="text-3xl font-black leading-none">{t.title}</h1>
            <p className="mt-1.5 text-sm font-bold text-[#eee0c4]/80">{summary}</p>
          </div>
        </div>
        {statusCards}
        {statusLine}
        <div className="grid grid-cols-2 gap-2.5">
          <button type="button" onClick={doUndo} disabled={!canUndo} className={wide}><LuUndo2 aria-hidden="true" />{t.undo}</button>
          <button type="button" onClick={restart} className={wide}><LuRotateCcw aria-hidden="true" />{t.restart}</button>
          <button type="button" onClick={() => setHelpOpen(true)} className={wide}><LuCircleHelp aria-hidden="true" />{t.rulesHeading}</button>
          <button type="button" onClick={onMenu} className={wide}><LuArrowLeft aria-hidden="true" />{t.menu}</button>
        </div>
      </aside>

      <MorrisRulesModal t={t} open={helpOpen} onClose={() => setHelpOpen(false)} showRules={showRules} />

      <Modal isOpen={!!game.winner && closedFor !== game} onClose={() => setClosedFor(game)} title={resultTitle} kicker={t.title}
        icon={game.winner === 'draw' ? GiScales : game.winner === 'white' ? WhitePieceIcon : BlackPieceIcon}
        band={game.winner === 'draw' ? { className: 'bg-[#1e120a]', fg: 'text-[#eee0c4]' } : { className: 'bg-[#4b4577]', fg: 'text-[#eee0c4]' }}
        panelClassName="!bg-[#eee0c4]"
        footer={
          <>
            <Button color="bg-[#1e120a]/[0.08] text-[#1e120a]" handleClickEvent={onMenu}>{t.menu}</Button>
            <Button color="bg-[#1e120a] text-[#eee0c4]" handleClickEvent={restart}>{t.again}</Button>
          </>
        }>
        <p className="text-sm leading-relaxed text-[#1e120a]">{resultBody}</p>
      </Modal>
    </MorrisFrame>
  );
}
