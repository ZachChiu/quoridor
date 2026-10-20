'use client';
import { useEffect, useMemo, useState } from 'react';
import { LuCircleHelp, LuHouse, LuRotateCcw, LuUndo2 } from 'react-icons/lu';
import Modal from '@/components/Modal';
import { useRouter } from 'next/navigation';
import { useMessages } from '@/i18n/LocaleProvider';
import { localePath, type Locale } from '@/i18n/locales';
import { BAGH_CHAL } from '@/i18n/routes';
import { createGame, legalMoves, applyMove, undo, GOATS, type BaghState, type Point, type Side, type Move } from '@/games/bagh-chal/engine';
import { chooseMove, type Difficulty } from '@/games/bagh-chal/ai';
import { BaghBoard } from './BaghBoard';
import { GoatToken, RulesToken, TigerToken } from './tokens';
import { RulesStepsPaged } from './BaghRulesSteps';
import BaghFrame from './BaghFrame';
import { BAGH_PRIMARY, BAGH_ROUND, BAGH_SECONDARY } from './styles';

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
 * - 手機：上方一排小圓鈕（回遊戲首頁、標題、說明、悔棋、重來），下面狀態與棋盤。
 *   Bagh Chal 只要點棋盤就能玩，不需要 Wall Go 那種底部控制盤
 * - 桌機（lg）：棋盤在左，右邊一欄放狀態、提示與有字的按鈕
 * 說明是彈窗（一步一步附小棋盤），對局中不必離開頁面。平台 logo 不放（Zach：遊戲頁面內不要有）。
 */
export default function BaghPlay({ locale, mode }: { locale: Locale; mode: BaghMode }) {
  const t = useMessages();
  const b = t.baghChal;
  const router = useRouter();
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
  const [endClosed, setEndClosed] = useState(false);
  const again = mode.kind === 'online' ? mode.newRoom : restart;
  const side = (s: Side) => (s === 'tiger' ? b.tiger : b.goat);
  const whoAmI = mode.kind === 'local' ? '' : mode.kind === 'online' ? b.youAre.replace('{side}', side(mode.human)) : `${b.playAs}：${side(mode.human)}`;
  // 虎羊棋裡面換頁不播轉場（開門特效只在平台進虎羊棋）
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

  const targets = new Map<Point, Move>();
  for (const m of legal) {
    if (m.kind === 'place') { if (game.turn === 'goat') targets.set(m.to, m); }
    else if (m.from === selected) targets.set(m.to, m);
  }
  const movable = new Set(legal.flatMap((m) => (m.kind === 'place' ? [] : [m.from])));
  // 吃子要一眼看得懂（Zach：不確定可不可以吃）：能吃的老虎閃、選了之後會被吃的羊加外框
  const capturers = new Set(legal.flatMap((m) => (m.kind === 'jump' ? [m.from] : [])));
  const victims = new Set(legal.flatMap((m) => (m.kind === 'jump' && m.from === selected ? [m.over] : [])));
  const last = game.history[game.history.length - 1];
  // 跟電腦下時退到「又輪到你」：電腦已經回了就退兩手。電腦先手（你當老虎）的第一手不能退
  const undoSteps = mode.kind === 'ai' ? (game.turn === mode.human ? 2 : 1) : 1;
  const canUndo = !locked && !online && game.history.length >= undoSteps;
  const doUndo = () => { setGame(undo(game, undoSteps)); setSelected(null); };

  const status = game.winner ? '' : aiTurn ? b.thinking : theirTurn ? b.opponentTurn
    : mode.kind === 'local' ? (game.turn === 'tiger' ? b.turnTiger : b.turnGoat) : b.yourTurn;
  // 第二行提示：新手最常卡住的兩件事 —— 羊不能吃、老虎要「跳過」才吃得到
  const canCapture = game.turn === 'tiger' && capturers.size > 0 && selected === null;
  const hint = game.winner || locked ? ''
    : game.turn === 'tiger' ? (canCapture ? b.hintCapture : b.hintTiger)
    : game.goatsInHand > 0 ? b.hintPlace : b.hintGoat;
  const result = game.winner === 'tiger' ? { title: b.winTiger, body: b.winTigerBody, band: 'bg-[#e3a43c]', fg: 'text-tile-ink' }
    : game.winner === 'goat' ? { title: b.winGoat, body: b.winGoatBody, band: 'bg-[#5b6620]', fg: 'text-tile-cream' }
    : { title: b.draw, body: b.drawBody, band: 'bg-tile-ink', fg: 'text-tile-cream' };

  // 虎羊棋自己的按鈕（BaghUi）：紙色底、橄欖綠外圈的圓鈕，深墨框的寬鈕 —— 不沿用 Wall Go 的灰色無框鈕
  const round = BAGH_ROUND;
  const wide = `${BAGH_SECONDARY} h-12 text-sm`;

  // 兩行：上面圖示＋哪一方，下面數字。數字跟圖示擠同一行的話，「還有 14 隻羊要放」在手機上會斷成三行
  const statusCards = (
    <div className="grid w-full grid-cols-2 gap-2.5">
      <div className={`flex flex-col gap-1 rounded-2xl px-2.5 py-3 ${game.turn === 'tiger' && !game.winner ? 'bg-[#e3a43c] text-tile-ink' : 'bg-[#4a2616]/[0.07] text-ink-soft'}`}>
        <p className="flex items-center gap-2 text-sm font-bold"><TigerToken className="shrink-0 text-[28px]" />{b.tiger}</p>
        <p className="whitespace-nowrap text-[14px] font-black leading-tight">{fmt(b.captured, game.captured)}</p>
      </div>
      <div className={`flex flex-col gap-1 rounded-2xl px-2.5 py-3 ${game.turn === 'goat' && !game.winner ? 'bg-[#5b6620] text-tile-cream' : 'bg-[#4a2616]/[0.07] text-ink-soft'}`}>
        <p className="flex items-center gap-2 text-sm font-bold"><GoatToken className="shrink-0 text-[28px]" />{b.goat}</p>
        <p className="whitespace-nowrap text-[14px] font-black leading-tight">{game.goatsInHand > 0 ? fmt(b.goatsInHand, game.goatsInHand) : `${GOATS - game.captured} / ${GOATS}`}</p>
      </div>
    </div>
  );

  const statusLine = (
    <div className="flex min-h-12 flex-col items-center text-center lg:items-start lg:text-left" aria-live="polite">
      <p className="text-sm font-black">{status}</p>
      {/* 有得吃的時候用番紅花底襯深墨字，跟老虎那張狀態卡同色 */}
      {hint && <p className={`mt-1 text-xs font-bold ${canCapture ? 'rounded-md bg-[#e3a43c] px-2 py-0.5 text-tile-ink' : 'text-ink-soft'}`}>{hint}</p>}
    </div>
  );

  return (
    <BaghFrame variant="play">
    <div className="flex flex-1 flex-col items-center p-3 lg:flex-row lg:items-center lg:justify-center lg:gap-12 lg:py-8">
      {/* 手機的上方一排只放三樣：回首頁、標題、說明（Zach：手機上面排列很亂）。
          悔棋與重來移到棋盤下面，做成有字的按鈕 —— 一排五顆圓鈕擠在一起，分不出哪顆是什麼 */}
      <div className="grid w-full max-w-[520px] grid-cols-[2.75rem_1fr_2.75rem] items-center lg:hidden">
        <button type="button" onClick={home} aria-label={b.menu} className={round}><LuHouse aria-hidden="true" /></button>
        <h1 className="text-center text-xl font-black tracking-[0.08em]">{b.subtitle}</h1>
        <button type="button" onClick={() => setHelpOpen(true)} aria-label={b.rulesHeading} className={round}><LuCircleHelp aria-hidden="true" /></button>
      </div>
      <div className="mt-4 flex w-full max-w-[520px] flex-col items-center gap-3 lg:hidden">
        {statusCards}
        {statusLine}
      </div>

      {/* 手機：棋盤在剩下的高度裡置中，不貼在狀態列下面、底下空一大塊 */}
      <div className="flex w-full max-w-[520px] flex-1 items-center py-2 lg:max-w-[min(620px,calc(100dvh-5rem))] lg:flex-none lg:py-0">
        <BaghBoard board={game.board} targets={targets} capturers={capturers} victims={victims} movable={movable}
          selected={selected} last={last} labels={{ tiger: b.tiger, goat: b.goat }} onPick={pick} />
      </div>

      {/* 手機：棋盤下面的悔棋、重來（連線局沒有） */}
      {!online && (
        <div className="grid w-full max-w-[520px] grid-cols-2 gap-2.5 lg:hidden">
          <button type="button" onClick={doUndo} disabled={!canUndo} className={wide}><LuUndo2 aria-hidden="true" />{b.undo}</button>
          <button type="button" onClick={restart} className={wide}><LuRotateCcw aria-hidden="true" />{b.restart}</button>
        </div>
      )}

      {/* 桌機的右邊一欄 */}
      <aside className="hidden w-[360px] shrink-0 flex-col gap-5 lg:flex">
        <div>
          <h1 className="text-4xl font-black leading-none tracking-[0.06em]">{b.subtitle}</h1>
          <p className="mt-1.5 text-sm font-bold text-ink-soft">{mode.kind === 'local' ? b.local : mode.kind === 'online' ? `${b.onlineTitle} · ${whoAmI}` : whoAmI}</p>
        </div>
        {statusCards}
        {statusLine}
        <div className="grid grid-cols-2 gap-2.5">
          {!online && <>
            <button type="button" onClick={doUndo} disabled={!canUndo} className={wide}><LuUndo2 aria-hidden="true" />{b.undo}</button>
            <button type="button" onClick={restart} className={wide}><LuRotateCcw aria-hidden="true" />{b.restart}</button>
          </>}
          <button type="button" onClick={() => setHelpOpen(true)} className={wide}><LuCircleHelp aria-hidden="true" />{b.rulesHeading}</button>
          <button type="button" onClick={home} className={wide}><LuHouse aria-hidden="true" />{b.menu}</button>
        </div>
      </aside>

      {whoAmI && <p className="mt-3 text-xs font-bold text-ink-soft lg:hidden">{whoAmI}</p>}

      <Modal skin="bagh" isOpen={helpOpen} onClose={() => setHelpOpen(false)} title={b.rulesHeading} kicker={b.title}
        icon={RulesToken} band={{ className: 'bg-[#5b6620]', fg: 'text-tile-cream' }}>
        <RulesStepsPaged rules={b.rules} prev={t.ui.prev} next={t.ui.next} done={t.ui.close} onDone={() => setHelpOpen(false)} />
      </Modal>

      <Modal skin="bagh" isOpen={!!game.winner && !(online && endClosed)} onClose={online ? () => setEndClosed(true) : restart} title={result.title}
        icon={game.winner === 'goat' ? GoatToken : TigerToken} band={{ className: result.band, fg: result.fg }}
        footer={
          <>
            <button type="button" onClick={home} className={`${BAGH_SECONDARY} flex-1`}>{b.menu}</button>
            <button type="button" onClick={again} className={`${BAGH_PRIMARY} flex-1`}>{b.again}</button>
          </>
        }>
        <p className="text-sm leading-relaxed">{result.body}</p>
      </Modal>
    </div>
    </BaghFrame>
  );
}
