'use client';
import { useEffect, useMemo, useState } from 'react';
import { GiGoat, GiRuleBook, GiTigerHead } from 'react-icons/gi';
import { LuCircleHelp, LuHouse, LuRotateCcw, LuUndo2 } from 'react-icons/lu';
import Modal from '@/components/Modal';
import Button from '@/components/Button';
import { useTransition } from '@/contexts/TransitionContext';
import { useMessages } from '@/i18n/LocaleProvider';
import { localePath, type Locale } from '@/i18n/locales';
import { BAGH_CHAL } from '@/i18n/routes';
import { createGame, legalMoves, applyMove, undo, GOATS, type BaghState, type Point, type Side, type Move } from '@/games/bagh-chal/engine';
import { chooseMove, type Difficulty } from '@/games/bagh-chal/ai';
import { BaghBoard } from './BaghBoard';
import { RulesStepsPaged } from './BaghRulesSteps';

export type BaghMode = { kind: 'local' } | { kind: 'ai'; human: Side; difficulty: Difficulty };

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
  const { navigate } = useTransition();
  const [game, setGame] = useState<BaghState>(createGame);
  const [selected, setSelected] = useState<Point | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);

  const aiSide: Side | null = mode.kind === 'ai' ? (mode.human === 'tiger' ? 'goat' : 'tiger') : null;
  const aiTurn = !!aiSide && !game.winner && game.turn === aiSide;
  const legal = useMemo(() => (aiTurn ? [] : legalMoves(game)), [game, aiTurn]);

  // 電腦的回合：讓出一格畫面再算（搜尋在主執行緒，幾毫秒），停一下看起來也像在想
  useEffect(() => {
    if (!aiTurn || mode.kind !== 'ai') return;
    const id = window.setTimeout(() => {
      setGame((g) => { const m = chooseMove(g, mode.difficulty); return m ? applyMove(g, m) : g; });
    }, 450);
    return () => window.clearTimeout(id);
  }, [aiTurn, mode, game]);

  const restart = () => { setGame(createGame()); setSelected(null); };
  const home = () => navigate(localePath(locale, BAGH_CHAL));

  const pick = (p: Point) => {
    if (aiTurn || game.winner) return;
    if (game.turn === 'goat' && game.goatsInHand > 0) {
      const m = legal.find((x) => x.kind === 'place' && x.to === p);
      if (m) setGame(applyMove(game, m));
      return;
    }
    const own = game.turn === 'tiger' ? 'T' : 'G';
    if (game.board[p] === own) { setSelected(selected === p ? null : p); return; }
    if (selected !== null) {
      const m = legal.find((x) => x.kind !== 'place' && x.from === selected && x.to === p);
      if (m) { setGame(applyMove(game, m)); setSelected(null); }
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
  const canUndo = !aiTurn && game.history.length >= undoSteps;
  const doUndo = () => { setGame(undo(game, undoSteps)); setSelected(null); };

  const status = game.winner ? '' : aiTurn ? b.thinking : mode.kind === 'ai' ? b.yourTurn : game.turn === 'tiger' ? b.turnTiger : b.turnGoat;
  // 第二行提示：新手最常卡住的兩件事 —— 羊不能吃、老虎要「跳過」才吃得到
  const canCapture = game.turn === 'tiger' && capturers.size > 0 && selected === null;
  const hint = game.winner || aiTurn ? ''
    : game.turn === 'tiger' ? (canCapture ? b.hintCapture : b.hintTiger)
    : game.goatsInHand > 0 ? b.hintPlace : b.hintGoat;
  const result = game.winner === 'tiger' ? { title: b.winTiger, body: b.winTigerBody, band: 'bg-tile-orange', fg: 'text-tile-ink' }
    : game.winner === 'goat' ? { title: b.winGoat, body: b.winGoatBody, band: 'bg-tile-ink', fg: 'text-tile-cream' }
    : { title: b.draw, body: b.drawBody, band: 'bg-tile-ink', fg: 'text-tile-cream' };

  const round = 'grid size-11 place-items-center rounded-full bg-tile-ink/[0.07] text-xl text-ink-soft transition hover:bg-tile-ink/[0.12] disabled:opacity-35';
  const wide = 'flex h-12 items-center justify-center gap-2 rounded-2xl bg-tile-ink/[0.07] text-sm font-black text-tile-ink transition hover:bg-tile-ink/[0.12] disabled:opacity-35';

  // 兩行：上面圖示＋哪一方，下面數字。數字跟圖示擠同一行的話，「還有 14 隻羊要放」在手機上會斷成三行
  const statusCards = (
    <div className="grid w-full grid-cols-2 gap-3">
      <div className={`flex flex-col gap-1 rounded-2xl px-4 py-3 ${game.turn === 'tiger' && !game.winner ? 'bg-tile-orange text-tile-ink' : 'bg-tile-ink/[0.07] text-ink-soft'}`}>
        <p className="flex items-center gap-2 text-sm font-bold"><GiTigerHead aria-hidden="true" className="shrink-0 text-2xl" />{b.tiger}</p>
        <p className="text-base font-black leading-tight">{fmt(b.captured, game.captured)}</p>
      </div>
      <div className={`flex flex-col gap-1 rounded-2xl px-4 py-3 ${game.turn === 'goat' && !game.winner ? 'bg-tile-ink text-tile-cream' : 'bg-tile-ink/[0.07] text-ink-soft'}`}>
        <p className="flex items-center gap-2 text-sm font-bold"><GiGoat aria-hidden="true" className="shrink-0 text-2xl" />{b.goat}</p>
        <p className="text-base font-black leading-tight">{game.goatsInHand > 0 ? fmt(b.goatsInHand, game.goatsInHand) : `${GOATS - game.captured} / ${GOATS}`}</p>
      </div>
    </div>
  );

  const statusLine = (
    <div className="flex min-h-12 flex-col items-center text-center lg:items-start lg:text-left" aria-live="polite">
      <p className="text-sm font-black">{status}</p>
      {/* 有得吃的時候用陶橘底襯深墨字，跟能吃的老虎同色 */}
      {hint && <p className={`mt-1 text-xs font-bold ${canCapture ? 'rounded-md bg-tile-orange px-2 py-0.5 text-tile-ink' : 'text-ink-soft'}`}>{hint}</p>}
    </div>
  );

  return (
    <div className="flex min-h-dvh flex-col items-center px-4 pb-6 pt-4 font-[family-name:var(--font-app)] lg:flex-row lg:items-center lg:justify-center lg:gap-12 lg:py-10">
      {/* 手機的上方一排 */}
      <div className="flex w-full max-w-[520px] items-center justify-between lg:hidden">
        <button type="button" onClick={home} aria-label={b.menu} className={round}><LuHouse aria-hidden="true" /></button>
        <h1 className="text-xl font-black">{b.title}</h1>
        <div className="flex gap-1.5">
          <button type="button" onClick={() => setHelpOpen(true)} aria-label={b.rulesHeading} className={round}><LuCircleHelp aria-hidden="true" /></button>
          <button type="button" onClick={doUndo} disabled={!canUndo} aria-label={b.undo} className={round}><LuUndo2 aria-hidden="true" /></button>
          <button type="button" onClick={restart} aria-label={b.restart} className={round}><LuRotateCcw aria-hidden="true" /></button>
        </div>
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

      {/* 桌機的右邊一欄 */}
      <aside className="hidden w-[320px] shrink-0 flex-col gap-5 lg:flex">
        <div>
          <h1 className="text-4xl font-black leading-none">{b.title}</h1>
          <p className="mt-1.5 text-sm font-bold text-ink-soft">{b.subtitle}{mode.kind === 'ai' ? ` · ${b.playAs}：${mode.human === 'tiger' ? b.tiger : b.goat}` : ` · ${b.local}`}</p>
        </div>
        {statusCards}
        {statusLine}
        <div className="grid grid-cols-2 gap-2.5">
          <button type="button" onClick={doUndo} disabled={!canUndo} className={wide}><LuUndo2 aria-hidden="true" />{b.undo}</button>
          <button type="button" onClick={restart} className={wide}><LuRotateCcw aria-hidden="true" />{b.restart}</button>
          <button type="button" onClick={() => setHelpOpen(true)} className={wide}><LuCircleHelp aria-hidden="true" />{b.rulesHeading}</button>
          <button type="button" onClick={home} className={wide}><LuHouse aria-hidden="true" />{b.menu}</button>
        </div>
      </aside>

      {mode.kind === 'ai' && (
        <p className="mt-3 text-xs font-bold text-ink-soft lg:hidden">{b.playAs}：{mode.human === 'tiger' ? b.tiger : b.goat}</p>
      )}

      <Modal isOpen={helpOpen} onClose={() => setHelpOpen(false)} title={b.rulesHeading} kicker={b.title}
        icon={GiRuleBook} band={{ className: 'bg-tile-forest', fg: 'text-tile-cream' }}>
        <RulesStepsPaged rules={b.rules} prev={t.ui.prev} next={t.ui.next} done={t.ui.close} onDone={() => setHelpOpen(false)} />
      </Modal>

      <Modal isOpen={!!game.winner} onClose={restart} title={result.title}
        icon={game.winner === 'goat' ? GiGoat : GiTigerHead} band={{ className: result.band, fg: result.fg }}
        footer={
          <>
            <Button color="bg-tile-ink/[0.07] text-tile-ink" handleClickEvent={home}>{b.menu}</Button>
            <Button color="bg-tile-ink text-tile-cream" handleClickEvent={restart}>{b.again}</Button>
          </>
        }>
        <p className="text-sm leading-relaxed">{result.body}</p>
      </Modal>
    </div>
  );
}
