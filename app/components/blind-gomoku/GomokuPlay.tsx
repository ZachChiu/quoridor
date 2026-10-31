'use client';
import { useCallback, useEffect, useState } from 'react';
import { GiRuleBook } from 'react-icons/gi';
import { LuCircleHelp, LuHouse, LuRotateCcw, LuUndo2 } from 'react-icons/lu';
import Modal from '@/components/Modal';
import Button from '@/components/Button';
import { useMessages } from '@/i18n/LocaleProvider';
import { fill, useTextTable } from '@/i18n/gameText';
import { TEXT } from '@/games/blind-gomoku/text';
import {
  COLORS, applyMove, createGame, isLegal, play, pointName, undo,
  type GomokuState, type Point, type StoneColor,
} from '@/games/blind-gomoku/engine';
import { GomokuBoard, Ghost, revealMs } from './GomokuBoard';
import { ColorPicker } from './ColorPicker';
import { HowToPlay, colorName } from './HowToPlay';
import { BlackStoneIcon, KEY_HEX, PairStonesIcon, SideFace, WhiteStoneIcon } from './Stone';
import { useGomokuAi } from './useGomokuAi';
import type { GomokuMode } from './modeHash';

/**
 * 盲眼五子棋的對局畫面。四種模式共用：盲棋／一般 × 對電腦／兩人同機。
 *
 * - 手機：上方一排小圓鈕（換模式、標題、說明、悔棋（只有一般模式）、重來），下面狀態、棋盤、選色盤與「下子」。
 *   390×844 一個畫面放得下，不捲動
 * - 桌機（lg）：棋盤在左，右邊一欄放狀態、選色盤與有字的按鈕
 *
 * 盲棋的規矩（docs/games-deep-s1.md §3 的建議）：沒有悔棋、沒有「停在子上偷看黑白」；
 * 電腦落子那顆亮一下就淡掉；結束時依下子順序把每顆子翻開，翻完才畫連線、跳結算。
 */
export default function GomokuPlay({ mode, onMenu }: { mode: GomokuMode; onMenu: () => void }) {
  const t = useTextTable(TEXT);
  const ui = useMessages().ui;
  const [game, setGame] = useState<GomokuState>(createGame);
  const [color, setColor] = useState<StoneColor>(COLORS[0]);
  const [aim, setAim] = useState<Point | null>(null);
  /** 盲棋結算：子翻到黑白那面了 */
  const [flipped, setFlipped] = useState(false);
  /** 結束的動畫跑完了：畫連線、跳結算 */
  const [settled, setSettled] = useState(false);
  const [resultOpen, setResultOpen] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);

  const vsAi = mode.opponent === 'ai';
  const level = mode.opponent === 'ai' ? mode.level : null;
  const { blind } = mode;
  const { ask, cancel } = useGomokuAi(vsAi);
  const aiTurn = vsAi && !game.winner && game.turn === 'white';
  const canPlay = !game.winner && !aiTurn;

  // 電腦的回合：問 Worker，回來時局面沒變才下（中途重來、悔棋的答案丟掉）
  useEffect(() => {
    if (!aiTurn || !level) return;
    const asked = game;
    ask(asked, level, (m) => setGame((g) => (g === asked && isLegal(g, m.at) ? play(g, m) : g)));
    return cancel;
  }, [aiTurn, level, game, ask, cancel]);

  // 分出勝負：盲棋先等最後一顆子落定、亮一下，再依序翻開；翻完才畫線、跳結算
  useEffect(() => {
    if (!game.winner) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const timers: number[] = [];
    if (blind) {
      const flipAt = reduce ? 0 : 400;
      timers.push(window.setTimeout(() => setFlipped(true), flipAt));
      timers.push(window.setTimeout(() => { setSettled(true); setResultOpen(true); }, flipAt + (reduce ? 0 : revealMs(game.moves.length)) + 450));
    } else {
      timers.push(window.setTimeout(() => { setSettled(true); setResultOpen(true); }, 800));
    }
    return () => timers.forEach((id) => window.clearTimeout(id));
  }, [game.winner, game.moves.length, blind]);

  const place = useCallback((p: Point) => {
    if (!canPlay || !isLegal(game, p)) return;
    setGame(applyMove(game, { at: p, color: blind ? color : COLORS[0] }));
    setAim(null);
  }, [canPlay, game, blind, color]);

  const restart = () => {
    cancel();
    setGame(createGame());
    setAim(null);
    setFlipped(false);
    setSettled(false);
    setResultOpen(false);
  };
  // 悔棋只有一般模式；對電腦時退到「又輪到你」（電腦已經回了就退兩手）
  const undoSteps = vsAi ? 2 : 1;
  const canUndo = !blind && canPlay && game.moves.length >= undoSteps;
  const doUndo = () => { setGame(undo(game, undoSteps)); setAim(null); };

  const resultTitle = game.winner === 'draw' ? t.draw
    : vsAi ? (game.winner === 'black' ? t.youWin : t.youLose)
    : game.winner === 'black' ? t.blackWins : t.whiteWins;
  const resultBody = game.winner === 'draw' ? t.drawBody
    : vsAi ? fill(game.winner === 'black' ? t.winBodyYou : t.winBodyAi, { n: game.moves.length })
    : fill(t.winBodySide, { side: game.winner === 'black' ? t.black : t.white, n: game.moves.length });
  const status = game.winner ? (settled || !blind ? resultTitle : t.revealing)
    : aiTurn ? t.thinking
    : vsAi ? t.yourTurn
    : game.turn === 'black' ? t.blackTurn : t.whiteTurn;
  const hint = game.winner ? (settled && blind ? t.revealBody : '')
    : blind ? (vsAi ? t.aiCopies : t.localBlindHint)
    : vsAi ? t.youAreBlack : '';
  const moveNo = fill(t.moveN, { n: game.winner ? game.moves.length : game.moves.length + 1 });
  const modeLabel = level
    ? `${blind ? t.blindAi : t.classicAi} · ${t.levels[level].name}`
    : `${t.local} · ${blind ? t.blind : t.classic}`;
  const ended = !!game.winner && settled && !resultOpen;

  const describe = (p: Point) => {
    const s = game.board[p];
    const name = pointName(p).toUpperCase();
    if (!s) return `${name} ${t.empty}`;
    if (blind && !flipped) return `${name} ${colorName(t, s.color)}`;
    return `${name} ${s.side === 'black' ? t.stoneBlack : t.stoneWhite}`;
  };

  const band = game.winner === 'black' ? { className: 'bg-tile-ink', fg: 'text-tile-cream' }
    : game.winner === 'white' ? { className: 'bg-white', fg: 'text-tile-ink' }
    : { style: { background: KEY_HEX }, fg: 'text-tile-ink' };

  const round = 'grid size-11 shrink-0 place-items-center rounded-full bg-tile-ink/[0.07] text-xl text-ink-soft transition fine:hover:bg-tile-ink/[0.12] disabled:opacity-35';
  const wide = 'flex h-12 items-center justify-center gap-2 rounded-2xl bg-tile-ink/[0.07] text-sm font-black text-tile-ink transition fine:hover:bg-tile-ink/[0.12] disabled:opacity-35';
  const ink = 'flex h-12 items-center justify-center gap-2 rounded-2xl bg-tile-ink text-sm font-black text-tile-cream transition active:scale-[0.98] disabled:opacity-35';

  const statusBlock = (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0" aria-live="polite">
        <p className="text-base font-black leading-tight">{status}</p>
        {hint && <p className="mt-0.5 text-xs font-bold leading-snug text-ink-soft">{hint}</p>}
        {canPlay && <p className="mt-0.5 hidden text-xs font-bold leading-snug text-ink-soft coarse:block">{t.aimHint}</p>}
      </div>
      <span className="flex shrink-0 items-center gap-1.5 rounded-full bg-tile-ink/[0.07] py-1 pl-1.5 pr-2.5 text-xs font-black tabular-nums">
        <SideFace side={game.winner && game.winner !== 'draw' ? game.winner : game.turn} className="size-4" />
        {moveNo}
      </span>
    </div>
  );

  const picker = blind && (
    <ColorPicker value={color} onChange={setColor} disabled={!canPlay} label={t.pickColor} nameOf={(c) => colorName(t, c)} />
  );
  const afterGame = (
    <div className="grid grid-cols-2 gap-2.5">
      <button type="button" onClick={onMenu} className={wide}>{t.menu}</button>
      <button type="button" onClick={restart} className={ink}>{t.again}</button>
    </div>
  );

  return (
    <div className="flex min-h-dvh flex-col items-center px-4 pb-5 pt-3 font-[family-name:var(--font-app)] lg:flex-row lg:items-center lg:justify-center lg:gap-12 lg:py-8">
      {/* 手機的上方一排 */}
      <div className="flex w-full max-w-[520px] items-center justify-between gap-2 lg:hidden">
        <button type="button" onClick={onMenu} aria-label={t.menu} className={round}><LuHouse aria-hidden="true" /></button>
        <div className="min-w-0 text-center">
          <h1 className="truncate text-lg font-black leading-tight">{t.title}</h1>
          <p className="truncate text-[11px] font-bold text-ink-soft">{modeLabel}</p>
        </div>
        <div className="flex gap-1.5">
          <button type="button" onClick={() => setHelpOpen(true)} aria-label={t.rules} className={round}><LuCircleHelp aria-hidden="true" /></button>
          {!blind && <button type="button" onClick={doUndo} disabled={!canUndo} aria-label={t.undo} className={round}><LuUndo2 aria-hidden="true" /></button>}
          <button type="button" onClick={restart} aria-label={t.restart} className={round}><LuRotateCcw aria-hidden="true" /></button>
        </div>
      </div>
      <div className="mt-2 w-full max-w-[520px] lg:hidden">{statusBlock}</div>

      {/* 棋盤：手機在剩下的高度裡置中；寬度同時受高度限制，矮的手機也放得下下面的選色盤 */}
      <div className="flex w-full max-w-[min(520px,calc(100dvh-17rem))] flex-1 items-center py-2 lg:max-w-[min(640px,calc(100dvh-4rem))] lg:flex-none lg:py-0">
        <GomokuBoard
          board={game.board}
          moves={game.moves}
          blind={blind}
          revealed={flipped}
          aim={canPlay ? aim : null}
          ghost={<Ghost blind={blind} color={color} side={game.turn} />}
          glow={blind && !flipped}
          lastMark={!blind && !game.winner}
          line={settled ? game.line : null}
          interactive={canPlay}
          label={t.board}
          describe={describe}
          onAim={setAim}
          onPlace={place}
        />
      </div>

      {/* 手機的下方：選色盤與「下子」；結束後換成換模式／再來一局 */}
      <div className="flex w-full max-w-[520px] flex-col gap-2.5 lg:hidden">
        {ended ? afterGame : (
          <>
            {picker}
            <button type="button" onClick={() => aim !== null && place(aim)} disabled={!canPlay || aim === null || !!game.board[aim]}
              className={`${ink} hidden coarse:flex`}>
              {t.place}
            </button>
          </>
        )}
      </div>

      {/* 桌機的右邊一欄 */}
      <aside className="hidden w-[340px] shrink-0 flex-col gap-5 lg:flex">
        <div>
          <h1 className="text-4xl font-black leading-none">{t.title}</h1>
          <p className="mt-1.5 text-sm font-bold text-ink-soft">{modeLabel}</p>
        </div>
        {statusBlock}
        {ended ? afterGame : picker && (
          <div className="flex flex-col gap-2">
            <p className="text-xs font-black text-ink-soft">{t.pickColor}</p>
            {picker}
          </div>
        )}
        <div className="grid grid-cols-2 gap-2.5">
          {!blind && <button type="button" onClick={doUndo} disabled={!canUndo} className={wide}><LuUndo2 aria-hidden="true" />{t.undo}</button>}
          <button type="button" onClick={restart} className={wide}><LuRotateCcw aria-hidden="true" />{t.restart}</button>
          <button type="button" onClick={() => setHelpOpen(true)} className={wide}><LuCircleHelp aria-hidden="true" />{t.rules}</button>
          <button type="button" onClick={onMenu} className={wide}><LuHouse aria-hidden="true" />{t.menu}</button>
        </div>
      </aside>

      <Modal isOpen={helpOpen} onClose={() => setHelpOpen(false)} title={t.rules} kicker={t.title}
        icon={GiRuleBook} band={{ className: 'bg-tile-forest', fg: 'text-tile-cream' }}>
        <HowToPlay t={t} prev={ui.prev} next={ui.next} done={ui.close} onDone={() => setHelpOpen(false)} />
      </Modal>

      {/* 關掉結算還留在棋盤上，可以看翻開後的盤面；下面換成換模式／再來一局 */}
      <Modal isOpen={resultOpen} onClose={() => setResultOpen(false)} title={resultTitle} kicker={t.title}
        icon={game.winner === 'black' ? BlackStoneIcon : game.winner === 'white' ? WhiteStoneIcon : PairStonesIcon}
        band={band}
        footer={
          <>
            <Button color="bg-tile-ink/[0.07] text-tile-ink" handleClickEvent={onMenu}>{t.menu}</Button>
            <Button color="bg-tile-ink text-tile-cream" handleClickEvent={restart}>{t.again}</Button>
          </>
        }>
        <p className="text-sm leading-relaxed">{resultBody}</p>
        {blind && <p className="mt-2 text-sm leading-relaxed">{t.revealBody}</p>}
      </Modal>
    </div>
  );
}
