'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';
import { GiHut } from 'react-icons/gi';
import { LuChevronFirst, LuChevronLast, LuChevronLeft, LuChevronRight, LuPause, LuPlay } from 'react-icons/lu';
import Chessboard from '@/components/Chessboard';
import GameStatus from '@/components/GameStatus';
import { BOARD_SIZE, replay } from '@/game/engine';
import { evaluate } from '@/game/score';
import { parseWGF } from '@/utils/wgf';
import { useLocale, useMessages } from '@/i18n/LocaleProvider';
import { localePath } from '@/i18n/locales';
import { fmt } from '@/i18n/content/game';

const noop = () => {};

/** 回放控制鍵。定義在元件外面 —— 在 render 裡宣告元件會讓 React 每次
    都當成新型別、整棵子樹重新掛載，也是 react-compiler 在擋的事。 */
function Ctl({ onClick, label, disabled, children }: {
  onClick: () => void; label: string; disabled?: boolean; children: React.ReactNode;
}) {
  return (
    /* 到頭與到尾時真的 disable，不只是按下去沒反應 ——
       一顆看起來能按、按了卻什麼都不動的鍵，會被讀成「這頁壞了」。
       disabled 同時讓讀屏念出「已停用」，而不是讓人反覆嘗試。 */
    <button type="button" onClick={onClick} aria-label={label} disabled={disabled}
            className="grid size-11 place-items-center rounded-xl bg-tile-ink/[0.07] text-xl text-tile-ink transition active:scale-95 disabled:pointer-events-none disabled:opacity-30">
      {children}
    </button>
  );
}

/**
 * 棋譜回放。
 *
 * 棋譜放在網址 hash 而不是 query：WGF 字串可能上百字元，放 hash 就不會被
 * 送到伺服器、也不會留在存取日誌裡。對一份「某兩個人的對局紀錄」來說，
 * 那是該有的預設。
 *
 * 每一格畫面都由 `replay(wgf, turnIndex)` 從空棋盤重建 ——
 * 所以前後跳轉不需要維護任何中間狀態，也不可能跟即時對局算出不同的盤面。
 */
export default function ReplayClient() {
  const t = useMessages();
  const locale = useLocale();

  const [wgf, setWgf] = useState('');
  const [turnIndex, setTurnIndex] = useState(0);
  const [playing, setPlaying] = useState(false);
  const timerRef = useRef<number | null>(null);

  useEffect(() => {
    const sync = () => {
      const params = new URLSearchParams(window.location.hash.replace(/^#/, ''));
      setWgf(params.get('wgf') ?? '');
      setTurnIndex(0);
    };
    sync();
    window.addEventListener('hashchange', sync);
    return () => window.removeEventListener('hashchange', sync);
  }, []);

  const totalTurns = useMemo(() => {
    if (!wgf) return 0;
    try { return parseWGF(wgf).turns.length; } catch { return 0; }
  }, [wgf]);

  const state = useMemo(() => {
    if (!wgf) return null;
    try { return replay(wgf, turnIndex); } catch { return null; }
  }, [wgf, turnIndex]);

  const territories = useMemo(() => (state ? evaluate(state).territories : null), [state]);

  const go = useCallback(
    (next: number) => setTurnIndex(Math.max(0, Math.min(totalTurns, next))),
    [totalTurns]
  );

  const atEnd = turnIndex >= totalTurns;
  // 「正在播放」完全由狀態推導，不在 effect 裡回頭改它 ——
  // 在 effect 中同步 setState 會觸發連鎖渲染。
  const isPlaying = playing && !atEnd;

  useEffect(() => {
    if (!isPlaying) return;
    timerRef.current = window.setTimeout(() => setTurnIndex((i) => i + 1), 700);
    return () => { if (timerRef.current) window.clearTimeout(timerRef.current); };
  }, [isPlaying, turnIndex]);

  /** 播放鍵：已經在結尾時從頭重播。 */
  const togglePlay = useCallback(() => {
    if (atEnd) { setTurnIndex(0); setPlaying(true); return; }
    setPlaying((p) => !p);
  }, [atEnd]);

  // 左右鍵逐手、空白鍵播放／暫停。回放是「看」的介面，手不該一直在滑鼠上。
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'ArrowLeft') go(turnIndex - 1);
      else if (e.key === 'ArrowRight') go(turnIndex + 1);
      else if (e.key === ' ') { e.preventDefault(); togglePlay(); }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [go, turnIndex, togglePlay]);

  if (!state || !territories) {
    return (
      <div className="flex max-w-[22rem] flex-col items-center gap-4 px-6 text-center">
        <h2 className="text-2xl font-black">{t.replay.empty}</h2>
        <p className="text-sm leading-relaxed text-ink-soft">{t.replay.emptyBody}</p>
        <Link href={localePath(locale, '/')}
              className="rounded-2xl bg-tile-ink px-6 py-4 text-lg font-black text-tile-cream transition hover:brightness-110">
          {t.rules.ctaPlay}
        </Link>
      </div>
    );
  }

  return (
    <>
      <Link href={localePath(locale, '/')} aria-label={t.nav.backHome}
            className="fixed left-5 top-5 z-50 grid size-12 place-items-center rounded-full bg-primary-50 text-2xl text-tile-ink transition hover:brightness-95">
        <GiHut />
      </Link>

      <GameStatus
        isLock
        currentPlayer={state.currentPlayer}
        uniqTerritories={territories.owned}
        playersNum={state.playersNum}
      />

      <div className="flex flex-col items-center gap-4">
        <div className="chessboard-container size-[86dvw] md:size-[70dvh]">
          <Chessboard
            size={BOARD_SIZE}
            board={state.board}
            verticalWalls={state.verticalWalls}
            horizontalWalls={state.horizontalWalls}
            currentPlayer={state.currentPlayer}
            selectedChess={null}
            remainSteps={0}
            flattenTerritoriesObj={territories.ownerByCell}
            breakWallCountObj={state.breakWallCount}
            isBreakWallAvailable={false}
            isLock
            isPlacingChess={false}
            selectChess={noop}
            selectWall={noop}
            selectCell={noop}
            setChessPosition={noop}
            onClickBreakWall={noop}
          /* 回放沒有控制盤，這幾個只是型別上的必填 */
          pendingWall={null}
          setPendingWall={() => {}}
          breakMode={false}
          onToggleBreak={() => {}}
          onWallStep={false}
          />
        </div>

        <div className="flex items-center gap-2 rounded-2xl bg-primary-50 px-3 py-2">
          <Ctl onClick={() => go(0)} label={t.replay.first} disabled={turnIndex === 0}><LuChevronFirst /></Ctl>
          <Ctl onClick={() => go(turnIndex - 1)} label={t.replay.prev} disabled={turnIndex === 0}><LuChevronLeft /></Ctl>
          <Ctl onClick={togglePlay} label={isPlaying ? t.replay.pause : t.replay.play}>
            {isPlaying ? <LuPause /> : <LuPlay />}
          </Ctl>
          <Ctl onClick={() => go(turnIndex + 1)} label={t.replay.next} disabled={atEnd}><LuChevronRight /></Ctl>
          <Ctl onClick={() => go(totalTurns)} label={t.replay.last} disabled={atEnd}><LuChevronLast /></Ctl>
          <span className="ml-1 whitespace-nowrap px-2 text-sm font-bold tabular-nums">
            {fmt(t.replay.turn, { n: turnIndex, total: totalTurns })}
          </span>
        </div>
      </div>
    </>
  );
}
