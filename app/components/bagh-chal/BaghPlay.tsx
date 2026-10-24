'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { LuCircleHelp, LuHouse, LuRotateCcw, LuUndo2, LuVolume2, LuVolumeX } from 'react-icons/lu';
import Modal from '@/components/Modal';
import { ShareResultModal, useShareCard } from '@/components/ShareResultModal';
import { fmt as fill } from '@/i18n/content/game';
import { useRouter } from 'next/navigation';
import { useGameText, useMessages } from '@/i18n/LocaleProvider';
import { useSound } from '@/hook/useSound';
import { playBagh } from './sounds';
import { localePath, type Locale } from '@/i18n/locales';
import { BAGH_CHAL, baghChal } from '@/i18n/routes';
import { createGame, legalMoves, applyMove, undo, GOATS, type BaghState, type Point, type Side, type Move } from '@/games/bagh-chal/engine';
import { chooseMove, type Difficulty } from '@/games/bagh-chal/ai';
import { BaghBoard } from './BaghBoard';
import { GoatToken, RulesToken, TigerToken } from './tokens';
import { RulesStepsPaged } from './BaghRulesSteps';
import BaghFrame from './BaghFrame';
import { BAGH_PRIMARY, BAGH_ROUND, BAGH_SECONDARY } from './styles';
import BaghWordmark from './BaghWordmark';
import { labelled } from './BaghUi';
import { BAGH_CARD_IMAGES, drawBaghCard } from './shareCard';

export type BaghMode =
  | { kind: 'local' }
  | { kind: 'ai'; human: Side; difficulty: Difficulty }
  /** 連線：局面由房間推導（BaghOnline 持有），這裡只負責畫與把自己的那一手交出去 */
  | { kind: 'online'; human: Side; game: BaghState; onMove: (m: Move) => void; newRoom: () => void };

const fmt = (s: string, n: number) => s.replace('{n}', String(n));

/**
 * Bagh Chal 的對局畫面（/bagh-chal/solo、/bagh-chal/local）。
 *
 * 跟 Wall Go 一樣分桌機與手機：
 * - 手機：上方只留回首頁、標題、音效、說明；下面兩張狀態卡＋一行提示、棋盤，悔棋與重來在棋盤下面。
 *   原本上方一排五顆圓鈕再加兩行狀態，Zach 10/24：手機版上面偏亂。
 *   Bagh Chal 只要點棋盤就能玩，不需要 Wall Go 那種底部控制盤
 * - 桌機（lg）：棋盤在左，右邊一欄放狀態、提示與有字的按鈕
 * 說明是彈窗（一步一步附小棋盤），對局中不必離開頁面。平台 logo 不放（Zach：遊戲頁面內不要有）。
 */
export default function BaghPlay({ locale, mode }: { locale: Locale; mode: BaghMode }) {
  const t = useMessages();
  const g = useGameText();
  const b = t.baghChal;
  const router = useRouter();
  const { prefs: soundPrefs, setPrefs: setSoundPrefs } = useSound();
  const [localGame, setGame] = useState<BaghState>(createGame);
  const game = mode.kind === 'online' ? mode.game : localGame;
  const online = mode.kind === 'online';
  const [selected, setSelected] = useState<Point | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);

  const aiSide: Side | null = mode.kind === 'ai' ? (mode.human === 'tiger' ? 'goat' : 'tiger') : null;
  const aiTurn = !!aiSide && !game.winner && game.turn === aiSide;
  // 連線時輪到對方：跟電腦的回合一樣不能動，但狀態寫「輪到對方」
  const theirTurn = online && !game.winner && game.turn !== mode.human;
  const locked = aiTurn || theirTurn;
  const legal = useMemo(() => (locked ? [] : legalMoves(game)), [game, locked]);

  // 電腦的回合：讓出一格畫面再算（搜尋在主執行緒，幾毫秒），停一下看起來也像在想
  useEffect(() => {
    if (!aiTurn || mode.kind !== 'ai') return;
    const id = window.setTimeout(() => {
      setGame((g) => { const m = chooseMove(g, mode.difficulty); return m ? applyMove(g, m) : g; });
    }, 450);
    return () => window.clearTimeout(id);
  }, [aiTurn, mode, game]);

  const restart = () => { setGame(createGame()); setSelected(null); };
  // 連線局沒有悔棋與重來（要兩個人都同意，先不做）；結束後「再來一局」是再開一間房、重新傳連結
  // 結算關掉之後停在終局的盤面上（記住是哪一局關的，重來就是新的一局）
  const [closedFor, setClosedFor] = useState<BaghState | null>(null);
  const again = mode.kind === 'online' ? mode.newRoom : restart;
  const side = (s: Side) => (s === 'tiger' ? b.tiger : b.goat);
  const whoAmI = mode.kind === 'local' ? '' : mode.kind === 'online' ? b.youAre.replace('{side}', side(mode.human)) : labelled(locale, b.playAs, side(mode.human));
  // 自己是哪一邊（本機對戰沒有「自己」）：那張狀態卡多一圈同色的框，中間留一道縫（跟 Wall Go 的比分一樣），手機上就不必再寫一行「你要當：老虎」
  const mine: Side | null = mode.kind === 'local' ? null : mode.human;

  // 音效（跟 Wall Go 共用開關）：剛好多一手才響 —— 悔棋、重整、連線一次補好幾手都不響
  const heard = useRef(game.history.length);
  useEffect(() => {
    const prev = heard.current;
    heard.current = game.history.length;
    if (game.history.length !== prev + 1) return;
    // 虎羊棋自己的一套（不是 Wall Go 的木頭聲，Zach 10/24）：羊是頸上的銅鈴、老虎是手鼓、吃羊加一聲低吼
    const m = game.history[game.history.length - 1];
    playBagh(m.kind === 'jump' ? 'capture' : m.kind === 'place' ? 'place' : game.board[m.to] === 'T' ? 'tiger' : 'goat');
    if (game.winner) {
      const won = mode.kind === 'local' || game.winner === mode.human;
      window.setTimeout(() => playBagh(won ? 'win' : 'lose'), 480);
    } else if (mode.kind === 'online' && game.turn === mode.human) {
      // 對方下完、換你：分頁在背景也聽得到
      window.setTimeout(() => playBagh('turn'), 360);
    }
  }, [game, mode]);
  // 虎羊棋裡面換頁不播轉場（木窗門只留在從平台卡片進來的那一下）
  const home = () => router.push(localePath(locale, BAGH_CHAL));

  const commit = (m: Move) => {
    if (mode.kind === 'online') mode.onMove(m);
    else setGame(applyMove(game, m));
  };

  const pick = (p: Point) => {
    if (locked || game.winner) return;
    if (game.turn === 'goat' && game.goatsInHand > 0) {
      const m = legal.find((x) => x.kind === 'place' && x.to === p);
      if (m) commit(m);
      return;
    }
    const own = game.turn === 'tiger' ? 'T' : 'G';
    if (game.board[p] === own) { setSelected(selected === p ? null : p); return; }
    if (selected !== null) {
      const m = legal.find((x) => x.kind !== 'place' && x.from === selected && x.to === p);
      if (m) { commit(m); setSelected(null); }
    }
  };

  // 只標選起來那顆可以去的點；放羊不標（每個空點都能放，Zach 10/24：一開始不要有符號）
  const targets = new Map<Point, Move>();
  for (const m of legal) if (m.kind !== 'place' && m.from === selected) targets.set(m.to, m);
  const movable = new Set(legal.flatMap((m) => (m.kind === 'place' ? [] : [m.from])));
  // 老虎可以吃羊時不給任何提示（Zach 10/24）：不閃、不加框、不寫「可以吃羊」，吃子的落點跟一般落點一樣是那朵小花 ——
  // 看不看得出來有羊可以吃是老虎那一方自己的功課。（先前做過老虎一直閃、會被吃的羊加紅框、提示字，都拿掉了）
  const last = game.history[game.history.length - 1];
  // 跟電腦下時退到「又輪到你」：電腦已經回了就退兩手。電腦先手（你當老虎）的第一手不能退
  const undoSteps = mode.kind === 'ai' ? (game.turn === mode.human ? 2 : 1) : 1;
  const canUndo = !locked && !online && game.history.length >= undoSteps;
  const doUndo = () => { setGame(undo(game, undoSteps)); setSelected(null); };

  const status = game.winner ? '' : aiTurn ? b.thinking : theirTurn ? b.opponentTurn
    : mode.kind === 'local' ? (game.turn === 'tiger' ? b.turnTiger : b.turnGoat) : b.yourTurn;
  // 第二行提示：新手最常卡住的兩件事 —— 羊不能吃、老虎要「跳過」才吃得到
  const hint = game.winner || locked ? ''
    : game.turn === 'tiger' ? b.hintTiger
    : game.goatsInHand > 0 ? b.hintPlace : b.hintGoat;
  const result = game.winner === 'tiger' ? { title: b.winTiger, body: b.winTigerBody }
    : game.winner === 'goat' ? { title: b.winGoat, body: b.winGoatBody }
    : { title: b.draw, body: b.drawBody };

  // 結算就是分享圖（Zach 10/24：「結尾 Modal 一樣做成可分享的圖片」），圖長得像這款自己的頁面（shareCard.ts）
  const endOpen = !!game.winner && closedFor !== game;
  const modeLabel = mode.kind === 'local' ? b.local : mode.kind === 'online' ? b.onlineTitle : b.vsAi;
  const card = {
    board: game.board, winner: game.winner ?? 'draw', captured: game.captured, plies: game.history.length,
    text: {
      kicker: `${g.champion.matchOver} · ${modeLabel}`,
      title: result.title,
      name: b.name,
      capturedLabel: `${b.tiger} ${fmt(b.captured, game.captured)}`,
      moves: fmt(b.cardMoves, game.history.length),
      brand: b.name,
      from: fill(g.share.cardFrom, { show: t.meta.showName }),
      host: new URL(process.env.SITE_URL || 'https://quoridorgame.com').host,
    },
  } as const;
  const font = typeof document === 'undefined' ? 'system-ui' : getComputedStyle(document.documentElement).getPropertyValue('--font-app').trim() || 'system-ui';
  const share = useShareCard({
    isOpen: endOpen,
    draw: drawBaghCard({ ...card, font }),
    contentKey: JSON.stringify(card),
    fileName: 'bagh-chal',
    homePath: localePath(locale, baghChal()),
    campaign: 'bagh-chal',
    fonts: [{ font: `900 40px ${font}`, text: card.text.title + card.text.name }, { font: `700 40px ${font}`, text: card.text.kicker + card.text.from }],
    images: BAGH_CARD_IMAGES,
    layouts: ['story'],
    icon: '/icons/bagh-chal-192.png',
  });

  // 虎羊棋自己的按鈕（BaghUi）：紙色底、橄欖綠外圈的圓鈕，深墨框的寬鈕 —— 不沿用 Wall Go 的灰色無框鈕
  const round = BAGH_ROUND;
  const wide = `${BAGH_SECONDARY} h-12 text-sm`;

  // 兩行：上面圖示＋哪一方，下面數字。數字跟圖示擠同一行的話，「還有 14 隻羊要放」在手機上會斷成三行
  const statusCards = (
    <div className="grid w-full grid-cols-2 gap-3">
      <div className={`flex flex-col gap-1 rounded-2xl p-3 ${game.turn === 'tiger' && !game.winner ? 'bg-[#e3a43c] text-tile-ink' : 'bg-[#4a2616]/[0.07] text-ink-soft'} ${mine === 'tiger' ? 'ring ring-[#e3a43c] ring-offset-2 ring-offset-[#fbf4e1]' : ''}`}>
        <p className="flex items-center gap-2 text-sm font-bold"><TigerToken className="shrink-0 text-[28px]" />{b.tiger}</p>
        <p className="text-[15px] font-black leading-tight">{fmt(b.captured, game.captured)}</p>
      </div>
      <div className={`flex flex-col gap-1 rounded-2xl p-3 ${game.turn === 'goat' && !game.winner ? 'bg-[#5b6620] text-tile-cream' : 'bg-[#4a2616]/[0.07] text-ink-soft'} ${mine === 'goat' ? 'ring ring-[#5b6620] ring-offset-2 ring-offset-[#fbf4e1]' : ''}`}>
        <p className="flex items-center gap-2 text-sm font-bold"><GoatToken className="shrink-0 text-[28px]" />{b.goat}</p>
        <p className="text-[15px] font-black leading-tight">{game.goatsInHand > 0 ? fmt(b.goatsInHand, game.goatsInHand) : `${GOATS - game.captured} / ${GOATS}`}</p>
      </div>
    </div>
  );

  const statusLine = (
    <div className="flex min-h-12 flex-col items-center text-center lg:items-start lg:text-left" aria-live="polite">
      <p className="text-sm font-black">{status}</p>
      {hint && <p className="mt-1 text-xs font-bold text-ink-soft">{hint}</p>}
    </div>
  );

  // 手機只留一行：在等電腦／對方時寫在等誰，輪到人時寫怎麼下（輪到誰看亮起來的那張狀態卡就知道）
  const mobileLine = (
    <p className="min-h-6 py-1 text-center text-xs font-bold text-ink-soft" aria-live="polite">
      {locked ? status : hint}
    </p>
  );

  // 結算關掉之後留在終局的盤面上看，狀態那一行換成叫回結算的鈕（Zach 10/24：「結尾 Modal 點掉以後沒有地方可以點回來」）
  const reopen = !!game.winner && !endOpen && (
    <button type="button" onClick={() => setClosedFor(null)} className={`${BAGH_PRIMARY} h-12 w-full px-4 text-sm`}>
      {game.winner === 'tiger' ? <TigerToken className="shrink-0 text-[26px]" /> : game.winner === 'goat' ? <GoatToken className="shrink-0 text-[26px]" /> : null}
      {result.title} · {g.champion.seeResult}
    </button>
  );

  const soundButton = (
    <button type="button" onClick={() => setSoundPrefs({ sfx: !soundPrefs.sfx })} aria-pressed={soundPrefs.sfx} aria-label={g.sound.button} className={round}>
      {soundPrefs.sfx ? <LuVolume2 aria-hidden="true" /> : <LuVolumeX aria-hidden="true" />}
    </button>
  );

  return (
    <BaghFrame variant="play">
    <div className="flex flex-1 flex-col items-center p-3 lg:flex-row lg:items-center lg:justify-center lg:gap-12 lg:py-8">
      {/* 手機的上方一排 */}
      {/* 三欄：左右兩邊的圓鈕數量不同（1 顆對 2 顆），用 justify-between 標題會被擠歪（Zach 10/24），兩側各佔 1fr 標題才會在正中間 */}
      <div className="grid w-full max-w-[520px] grid-cols-[1fr_auto_1fr] items-center lg:hidden">
        <button type="button" onClick={home} aria-label={b.menu} className={`${round} justify-self-start`}><LuHouse aria-hidden="true" /></button>
        <h1 aria-label={`${b.title} ${b.subtitle}`}><BaghWordmark className="h-[22px] w-auto" /></h1>
        <div className="flex gap-1.5 justify-self-end">
          {soundButton}
          <button type="button" onClick={() => setHelpOpen(true)} aria-label={b.rulesHeading} className={round}><LuCircleHelp aria-hidden="true" /></button>
        </div>
      </div>
      <div className="mt-4 flex w-full max-w-[520px] flex-col items-center gap-2 lg:hidden">
        {statusCards}
        {reopen || mobileLine}
      </div>

      {/* 手機：棋盤在剩下的高度裡置中，不貼在狀態列下面、底下空一大塊 */}
      <div className="flex w-full max-w-[520px] flex-1 items-center py-2 lg:max-w-[min(620px,calc(100svh-5rem))] lg:flex-none lg:py-0">
        <BaghBoard board={game.board} targets={targets} movable={movable}
          selected={selected} last={last} plies={game.history.length}
          placing={!locked && !game.winner && game.turn === 'goat' && game.goatsInHand > 0}
          idle={game.winner ? null : game.turn === 'tiger' ? 'goat' : 'tiger'}
          labels={{ tiger: b.tiger, goat: b.goat }} onPick={pick} />
      </div>

      {/* 手機：悔棋、重來放在棋盤下面（連線局沒有） */}
      {!online && (
        <div className="grid w-full max-w-[520px] grid-cols-2 gap-2.5 pt-1 lg:hidden">
          <button type="button" onClick={doUndo} disabled={!canUndo} className={wide}><LuUndo2 aria-hidden="true" />{b.undo}</button>
          <button type="button" onClick={restart} className={wide}><LuRotateCcw aria-hidden="true" />{b.restart}</button>
        </div>
      )}

      {/* 桌機的右邊一欄 */}
      <aside className="hidden w-[360px] shrink-0 flex-col gap-5 lg:flex">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 aria-label={`${b.title} ${b.subtitle}`} className="flex flex-col items-start gap-1"><BaghWordmark className="h-11 w-auto" /><span className="text-xl font-black">{b.subtitle}</span></h1>
            <p className="mt-1 text-sm font-bold text-ink-soft">{mode.kind === 'local' ? b.local : mode.kind === 'online' ? `${b.onlineTitle} · ${whoAmI}` : whoAmI}</p>
          </div>
          {soundButton}
        </div>
        {statusCards}
        {reopen || statusLine}
        <div className="grid grid-cols-2 gap-2.5">
          {!online && <>
            <button type="button" onClick={doUndo} disabled={!canUndo} className={wide}><LuUndo2 aria-hidden="true" />{b.undo}</button>
            <button type="button" onClick={restart} className={wide}><LuRotateCcw aria-hidden="true" />{b.restart}</button>
          </>}
          <button type="button" onClick={() => setHelpOpen(true)} className={wide}><LuCircleHelp aria-hidden="true" />{b.rulesHeading}</button>
          <button type="button" onClick={home} className={wide}><LuHouse aria-hidden="true" />{b.menu}</button>
        </div>
      </aside>

      <Modal skin="bagh" isOpen={helpOpen} onClose={() => setHelpOpen(false)} title={b.rulesHeading} kicker={b.name}
        icon={RulesToken} band={{ className: 'bg-[#5b6620]', fg: 'text-tile-cream' }}>
        <RulesStepsPaged rules={b.rules} prev={t.ui.prev} next={t.ui.next} done={t.ui.close} onDone={() => setHelpOpen(false)} />
      </Modal>

      {/* 關掉就留在終局的盤面上看（跟 Wall Go 一樣）；再來一局在圖下面 */}
      <ShareResultModal isOpen={endOpen} onClose={() => setClosedFor(game)} title={result.title} card={share}
        onRestart={again} restartLabel={b.again} srText={`${result.title} ${result.body} ${card.text.capturedLabel} · ${card.text.moves}`}
        frameClassName=""
        classes={{
          primary: 'bagh-line-on bg-[#5b6620] text-[#fbf4e1] hover:bg-[#4d5719]',
          secondary: 'bagh-line bg-[#f2e4c4] text-tile-ink hover:bg-[#ead8ad]',
          button: 'font-black', placeholder: 'bg-[#e3a43c]/30',
        }} />
    </div>
    </BaghFrame>
  );
}
