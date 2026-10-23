'use client';
import { useCallback, useEffect, useRef, useState } from 'react';
import { GiRuleBook } from 'react-icons/gi';
import { LuCircleHelp, LuHouse, LuRotateCcw, LuUndo2, LuVolume2, LuVolumeX } from 'react-icons/lu';
import Modal from '@/components/Modal';
import { ShareResultModal, useShareCard } from '@/components/ShareResultModal';
import { useGameText, useLocale, useMessages } from '@/i18n/LocaleProvider';
import { fill, useTextTable } from '@/i18n/gameText';
import { localePath } from '@/i18n/locales';
import { BLIND_GOMOKU } from '@/i18n/routes';
import { useSound } from '@/hook/useSound';
import { TEXT } from '@/games/blind-gomoku/text';
import {
  COLORS, applyMove, createGame, isLegal, lastColor, other, play, pointName, undo,
  type GomokuState, type Point, type StoneColor,
} from '@/games/blind-gomoku/engine';
import { GomokuBoard, Ghost, revealMs } from './GomokuBoard';
import { ColorPicker } from './ColorPicker';
import { HowToPlay, colorName } from './HowToPlay';
import { SideFace } from './Stone';
import { GMK_BAND, GMK_PANEL } from './palette';
import GomokuFrame from './GomokuFrame';
import { useGomokuAi } from './useGomokuAi';
import { colorString, playEnd, playPick, playReveal, playStone, stringOf } from './sounds';
import { drawGomokuCard } from './shareCard';
import type { GomokuMode } from './modeHash';

/**
 * 盲眼五子棋的對局畫面。四種模式共用：盲棋／一般 × 對電腦／兩人同機。
 *
 * - 手機：上方一排小圓鈕（換模式、聲音、標題、說明、重來），下面狀態、棋盤、選色盤與「下子」。
 *   悔棋（只有一般模式）放在「下子」旁邊：上方加了聲音鈕之後再放悔棋，標題會被擠成「盲五…」
 *   390×844 一個畫面放得下，不捲動
 * - 桌機（lg）：棋盤在左，右邊一欄放狀態、選色盤與有字的按鈕
 *
 * 盲棋的規矩（docs/games-deep-s1.md §3 的建議）：沒有悔棋、沒有「停在子上偷看黑白」；
 * 電腦落子那顆亮一下就淡掉；結束時依下子順序把每顆子翻開，翻完才畫連線、跳結算。
 *
 * 聲音（sounds.ts）：每個顏色是一根伽倻琴的弦，AI 跟色時彈的就是你剛才那根；翻開時刮過整排弦。
 * 結算就是分享圖（shareCard.ts，跟 Wall Go、尼泊爾虎棋一樣的做法），關掉之後停在翻開的終局盤面上。
 */
export default function GomokuPlay({ mode, onMenu }: { mode: GomokuMode; onMenu: () => void }) {
  const t = useTextTable(TEXT);
  const ui = useMessages().ui;
  const g = useGameText();
  const locale = useLocale();
  const { prefs: soundPrefs, setPrefs: setSoundPrefs } = useSound();
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
  // 聲音跟著走：翻開時刮過整排弦，連線畫出來時贏／輸／和局（對電腦看你贏沒有；兩人同機有人贏就是贏的那一句）
  const endSound = game.winner === 'draw' ? 'draw' : vsAi && game.winner === 'white' ? 'lose' : 'win';
  useEffect(() => {
    if (!game.winner) return;
    const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    const timers: number[] = [];
    const settle = () => { setSettled(true); setResultOpen(true); playEnd(endSound); };
    if (blind) {
      const flipAt = reduce ? 0 : 400;
      timers.push(window.setTimeout(() => { setFlipped(true); playReveal(); }, flipAt));
      timers.push(window.setTimeout(settle, flipAt + (reduce ? 0 : revealMs(game.moves.length)) + 450));
    } else {
      timers.push(window.setTimeout(settle, 800));
    }
    return () => timers.forEach((id) => window.clearTimeout(id));
  }, [game.winner, game.moves.length, blind, endSound]);

  // 落子的聲音：剛好多一手才響（悔棋、重來不響）。盲棋的音高只看顏色、兩方一樣，聽不出是誰的子
  const heard = useRef(game.moves.length);
  useEffect(() => {
    const prev = heard.current;
    heard.current = game.moves.length;
    if (game.moves.length !== prev + 1) return;
    const m = game.moves[game.moves.length - 1];
    const stone = game.board[m.at];
    if (stone) playStone(stringOf(stone, blind));
  }, [game, blind]);

  const pickColor = (c: StoneColor) => { setColor(c); playPick(colorString(c)); };

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
  /** 標題大約幾個字寬（中日韓一個字 1、粗體的拉丁與泰文約 0.7），手機上方一排用它決定字級 */
  const titleEm = Array.from(t.title).reduce((n, ch) => n + (ch.charCodeAt(0) >= 0x2e80 ? 1 : ch === ' ' ? 0.3 : 0.7), 0).toFixed(2);

  const describe = (p: Point) => {
    const s = game.board[p];
    const name = pointName(p).toUpperCase();
    if (!s) return `${name} ${t.empty}`;
    if (blind && !flipped) return `${name} ${colorName(t, s.color)}`;
    return `${name} ${s.side === 'black' ? t.stoneBlack : t.stoneWhite}`;
  };

  // 結算就是分享圖（shareCard.ts）：翻開的終局盤面、連成的五子、誰贏、第幾手
  const card = {
    board: game.board, line: game.line, winner: game.winner ?? 'draw', blind, lastColor: lastColor(game),
    text: {
      kicker: `${g.champion.matchOver} · ${modeLabel}`,
      name: t.title,
      sub: t.subtitle,
      title: resultTitle,
      body: resultBody,
      brand: t.title,
      from: fill(g.share.cardFrom, { show: t.showName }),
      host: new URL(process.env.SITE_URL || 'https://quoridorgame.com').host,
    },
  } as const;
  const font = typeof document === 'undefined' ? 'system-ui' : getComputedStyle(document.documentElement).getPropertyValue('--font-app').trim() || 'system-ui';
  const share = useShareCard({
    isOpen: resultOpen,
    draw: drawGomokuCard({ ...card, font }),
    contentKey: JSON.stringify({ ...card, board: game.moves.length }),
    fileName: 'blind-gomoku',
    homePath: localePath(locale, BLIND_GOMOKU),
    campaign: 'blind-gomoku',
    fonts: [
      { font: `900 40px ${font}`, text: card.text.name + card.text.title + card.text.brand },
      { font: `700 40px ${font}`, text: card.text.kicker + card.text.sub + card.text.body + card.text.from },
    ],
  });

  // 按鈕是一塊塊布（globals.css 的 .gmk-*）：角落的小鈕與次要動作是半透明的苧麻布，主要動作是拼起來的青綠布
  const round = 'gmk-patch is-ramie grid size-11 shrink-0 place-items-center text-xl text-ink-soft disabled:opacity-35';
  const wide = 'gmk-patch is-ramie flex h-12 items-center justify-center gap-2 text-sm font-black disabled:opacity-35';
  const ink = 'gmk-patch is-pieced flex h-12 items-center justify-center gap-2 text-sm font-black active:scale-[0.98] disabled:opacity-35';

  const statusBlock = (
    <div className="flex items-start justify-between gap-3">
      <div className="min-w-0" aria-live="polite">
        <p className="text-base font-black leading-tight">{status}</p>
        {hint && <p className="mt-0.5 text-xs font-bold leading-snug text-ink-soft">{hint}</p>}
        {canPlay && <p className="mt-0.5 hidden text-xs font-bold leading-snug text-ink-soft coarse:block">{t.aimHint}</p>}
      </div>
      <span className="gmk-patch is-ramie flex shrink-0 items-center gap-1.5 py-1.5 pl-2 pr-3 text-xs font-black tabular-nums">
        <SideFace side={game.winner && game.winner !== 'draw' ? game.winner : game.turn} className="size-4" />
        {moveNo}
      </span>
    </div>
  );

  const picker = blind && (
    <ColorPicker value={color} onChange={pickColor} disabled={!canPlay} label={t.pickColor} nameOf={(c) => colorName(t, c)} />
  );
  const soundButton = (
    <button type="button" onClick={() => setSoundPrefs({ sfx: !soundPrefs.sfx })} aria-pressed={soundPrefs.sfx} aria-label={g.sound.button} className={round}>
      {soundPrefs.sfx ? <LuVolume2 aria-hidden="true" /> : <LuVolumeX aria-hidden="true" />}
    </button>
  );
  const afterGame = (
    <div className="grid grid-cols-2 gap-2.5">
      <button type="button" onClick={onMenu} className={wide}>{t.menu}</button>
      <button type="button" onClick={restart} className={ink}>{t.again}</button>
    </div>
  );

  return (
    <GomokuFrame className="items-center px-4 pb-5 pt-3 lg:flex-row lg:items-center lg:justify-center lg:gap-12 lg:py-8">
      {/* 手機的上方一排 */}
      <div className="flex w-full max-w-[520px] items-center justify-between gap-1.5 lg:hidden">
        {/* 左邊：換模式、聲音（跟 Wall Go 一樣聲音在左上）；右邊：說明、重來。兩邊一樣寬，標題才在正中間 */}
        <div className="flex shrink-0 gap-1">
          <button type="button" onClick={onMenu} aria-label={t.menu} className={round}><LuHouse aria-hidden="true" /></button>
          {soundButton}
        </div>
        <div className="min-w-0 text-center">
          {/* 名字的長度差很多（盲五子棋、Blind Gomoku、ブラインド五目並べ）：字級照「兩組圓鈕中間剩多寬」縮，最大 18px */}
          <h1 className="truncate font-black leading-tight" style={{ fontSize: `clamp(12px, calc((100vw - 268px) / ${titleEm}), 18px)` }}>{t.title}</h1>
          <p className="truncate text-[11px] font-bold text-ink-soft">{modeLabel}</p>
        </div>
        <div className="flex shrink-0 gap-1">
          <button type="button" onClick={() => setHelpOpen(true)} aria-label={t.rules} className={round}><LuCircleHelp aria-hidden="true" /></button>
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
          idle={!blind && !game.winner ? other(game.turn) : null}
          interactive={canPlay}
          label={t.board}
          describe={describe}
          onAim={setAim}
          onPlace={place}
        />
      </div>

      {/* 手機的下方：選色盤、悔棋（一般模式）與「下子」；結束後換成換模式／再來一局 */}
      <div className="flex w-full max-w-[520px] flex-col gap-2.5 lg:hidden">
        {ended ? afterGame : (
          <>
            {picker}
            {/* 盲棋沒有悔棋：滑鼠的畫面上這一排是空的，整排藏起來 */}
            <div className={`gap-2.5 ${blind ? 'hidden coarse:flex' : 'flex'}`}>
              {!blind && (
                <button type="button" onClick={doUndo} disabled={!canUndo} className={`${wide} flex-1 coarse:flex-none coarse:px-5`}>
                  <LuUndo2 aria-hidden="true" />{t.undo}
                </button>
              )}
              <button type="button" onClick={() => aim !== null && place(aim)} disabled={!canPlay || aim === null || !!game.board[aim]}
                className={`${ink} hidden flex-1 coarse:flex`}>
                {t.place}
              </button>
            </div>
          </>
        )}
      </div>

      {/* 桌機的右邊一欄 */}
      <aside className="hidden w-[340px] shrink-0 flex-col gap-5 lg:flex">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-4xl font-black leading-none">{t.title}</h1>
            <p className="mt-1.5 text-sm font-bold text-ink-soft">{modeLabel}</p>
          </div>
          {soundButton}
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
        icon={GiRuleBook} band={GMK_BAND} panelClassName={GMK_PANEL}>
        <HowToPlay t={t} prev={ui.prev} next={ui.next} done={ui.close} onDone={() => setHelpOpen(false)} />
      </Modal>

      {/* 結算就是分享圖。關掉還留在棋盤上，可以看翻開後的盤面；下面換成換模式／再來一局。
          暗遮罩上的按鈕也是這款的布：再來一局是拼起來的青綠布、分享是白絲布；比例切換是白絲的小布塊 */}
      <ShareResultModal isOpen={resultOpen} onClose={() => setResultOpen(false)} title={resultTitle} card={share}
        onRestart={restart} restartLabel={t.again}
        srText={`${resultTitle} ${resultBody}${blind ? ` ${t.revealBody}` : ''}`}
        frameClassName="rounded-[3px]"
        classes={{
          primary: 'gmk-patch is-pieced',
          secondary: 'gmk-patch',
          toggle: '!rounded-[3px] bg-[#f2e4c9]/15',
          toggleOn: '!rounded-[2px] bg-[#f2e4c9] text-[#2a2525]',
          toggleOff: '!rounded-[2px] text-[#f2e4c9]/75 hover:text-[#f2e4c9]',
          button: 'font-black',
          placeholder: 'bg-[#f2e4c9]/20',
        }} />
    </GomokuFrame>
  );
}
