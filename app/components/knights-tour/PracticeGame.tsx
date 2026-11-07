'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useLeaveGuard } from '@/hook/useLeaveGuard';
import { LuCheck, LuCircleHelp, LuGrid3X3, LuImage, LuLightbulb, LuRotateCcw, LuTimer, LuUndo2, LuX } from 'react-icons/lu';
import { ShareResultModal } from '@/components/ShareResultModal';
import { fill, useTextTable } from '@/i18n/gameText';
import {
  canStartFrom, createTour, hint as findHint, isClosedTour, isComplete, isStuck, legalMoves, move, tapKind, truncate, undo, verdict,
  type Hint, type Square, type Tour,
} from '@/games/knights-tour/engine';
import { TEXT, type KnightsText } from '@/games/knights-tour/text';
import GameFrame, { type Place } from './GameFrame';
import HowToPlay from './HowToPlay';
import SizePicker from './SizePicker';
import LeaveModal from './LeaveModal';
import TourBoard from './TourBoard';
import { finaleMs, reducedMotion } from './motion';
import { closedKey, practiceKey, saveBest, useBestTimes } from './records';
import { track } from '@/utils/analytics';

/** GA：練習是一盤，開始＝第一步，結束＝走完（卡住可以悔棋，不算結束）；回到原點要走完而且跳得回起點才算結束 */
const gaOf = (closed: boolean) => ({ game: 'knights-tour', mode: closed ? 'closed' : 'practice', players: 1 } as const);
import { isClosed } from './shareCard';
import { playJump, playKt } from './sounds';
import { formatTime, shake, sizeLabel, squareName } from './ui';
import { BTN, BTN_PRIMARY, KT_SHARE } from './styles';
import { useKtShare } from './useKtShare';

type Note = 'notKnight' | 'badStart' | 'revisited' | null;

/**
 * 練習模式：5×5–10×10 自選，可以悔棋、看提示，每走一步就判定「從這裡還走不走得完」
 * （engine 的解題器，有節點上限，算不完就顯示「算不出來」，不會卡住畫面）。
 * 用過提示的那一局不列入最佳紀錄；悔棋與判定可以用 —— 它們本來就是練習的一部分。
 *
 * 聲音在點擊當下放（sounds.ts）：只有真的走了、悔了、點錯了才響，重新整理、換大小不會響。
 * 重來不是一下清空：騎士照走過的順序一格一格倒跳回第 1 格（一路彈著那段旋律倒過來），站一下才清空、翻一頁紙
 * （11/7 Zach：「重來的話可以讓他快速從順序跳回去嗎」）。整段不到一秒，倒帶時點棋盤、悔棋、提示都不理。
 * 走完時先讓騎士在棋盤上收尾（motion.ts 的 finale），再跳出結算 —— 結算就是分享圖（shareCard.ts），
 * 關掉就停在走完的棋盤上。
 *
 * `closed`：「回到原點」挑戰（封閉巡遊，docs/puzzle-reels.md B）。同一個畫面，只差在過關的條件：
 * 每一格都走過、而且最後一格跳得回第 1 格。走完卻跳不回去不算過關，跟卡住一樣可以悔棋、看提示；
 * 判定與提示改問「還回不回得到起點」（engine 的 solve(…, closed)）。只有偶數邊（mode.ts 擋掉單數邊）。
 */
export default function PracticeGame({ n, closed = false, onMenu, onSize }: { n: number; closed?: boolean; onMenu: () => void; onSize: (n: number) => void }) {
  const GA = gaOf(closed);
  const recordKey = closed ? closedKey(n) : practiceKey(n);
  const t = useTextTable<KnightsText>(TEXT);
  const best = useBestTimes();
  const [tour, setTour] = useState<Tour>(() => createTour(n));
  const [startedAt, setStartedAt] = useState<number | null>(null);
  const [endedAt, setEndedAt] = useState<number | null>(null);
  const [now, setNow] = useState(0);
  const [note, setNote] = useState<Note>(null);
  const [armed, setArmed] = useState<Square | null>(null);
  /** 按了提示：記下是對哪一個局面給的，走了下一步就自動失效 */
  const [shown, setShown] = useState<{ path: readonly Square[]; hint: Hint } | null>(null);
  const [assisted, setAssisted] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [sizeOpen, setSizeOpen] = useState(false);
  const [result, setResult] = useState<{ ms: number; isNew: boolean; open: boolean } | null>(null);
  /** 走完到跳出結算之間的那段收尾 */
  const finaleTimer = useRef(0);
  useEffect(() => () => window.clearTimeout(finaleTimer.current), []);
  /** 重來的倒帶：每一跳多長（倒帶中才有值）與計時器 */
  const [rewindMs, setRewindMs] = useState<number | null>(null);
  const rewindTimer = useRef(0);
  useEffect(() => () => { window.clearInterval(rewindTimer.current); window.clearTimeout(rewindTimer.current); }, []);

  const running = startedAt !== null && endedAt === null;
  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(id);
  }, [running]);

  /** 過關：練習是走完，回到原點還要最後一步跳得回起點 */
  const done = closed ? isClosedTour(tour) : isComplete(tour);
  /** 回到原點：每一格都走過了，但最後一格跳不回起點（還沒過關，可以悔棋） */
  const openEnd = closed && isComplete(tour) && !done;
  // 走到一半回選單先問（房子鈕、返回鍵）；換大小不必問，但一樣先退掉守門（hook/useLeaveGuard.ts）
  const leave = useLeaveGuard({ live: !done, inProgress: !done && tour.path.length > 0 });
  const stuck = isStuck(tour) || openEnd;
  // 每一步都問一次解題器。正常局面零點幾毫秒；最壞跑滿節點上限，桌機約 10ms
  const solvable = useMemo(() => (tour.path.length && !done ? verdict(tour, undefined, closed) : null), [tour, done, closed]);
  const targets = useMemo(() => new Set(tour.path.length && !done ? legalMoves(tour) : []), [tour, done]);
  const dead = useMemo(() => new Set(!tour.path.length && n % 2
    ? Array.from({ length: n * n }, (_, sq) => sq).filter((sq) => !canStartFrom(n, sq)) : []), [tour, n]);
  const hint = shown && shown.path === tour.path ? shown.hint : null;

  const commit = (next: Tour) => {
    setTour(next);
    setNote(null);
    setArmed(null);
  };

  const tap = (sq: Square, el: HTMLElement) => {
    if (rewindMs !== null) return;
    const kind = tapKind(tour, sq);
    if (kind === 'current' || kind === 'over') return;
    if (kind === 'notKnight' || kind === 'revisit') { setNote(kind === 'revisit' ? 'revisited' : 'notKnight'); shake(el); playKt('wrong'); return; }
    if (kind === 'start' && !canStartFrom(n, sq) && armed !== sq) { setArmed(sq); setNote('badStart'); shake(el); playKt('wrong'); return; }
    const at = Date.now();
    const next = move(tour, sq);
    commit(next);
    setNow(at);
    playJump(n, sq, kind === 'start');
    const start = startedAt ?? at;
    if (startedAt === null) { setStartedAt(at); track('game_start', { ...GA, board_size: n }); }
    if (closed && isComplete(next) && !isClosedTour(next)) {
      playKt('stuck', 0.3);
    } else if (isComplete(next)) {
      setEndedAt(at);
      const ms = at - start;
      track('game_end', { ...GA, board_size: n, result: 'win', ended: 'natural', turns: next.path.length, duration_sec: Math.round(ms / 1000) });
      const closed = isClosed(next);
      playKt('complete', 0.3);
      if (closed) playKt('closed', 0.95);
      setResult({ ms, isNew: assisted ? false : saveBest(recordKey, ms).isNew, open: false });
      finaleTimer.current = window.setTimeout(() => setResult((r) => (r ? { ...r, open: true } : r)), finaleMs(n * n) + (closed ? 500 : 0));
    } else if (isStuck(next)) {
      playKt('stuck', 0.3);
    }
  };

  const back = (next: Tour) => {
    if (rewindMs !== null) return;
    commit(next);
    playKt('undo');
  };

  const clear = () => {
    if (tour.path.length) playKt('clear');
    commit(createTour(n));
    setStartedAt(null);
    setEndedAt(null);
    setNow(0);
    setAssisted(false);
    setResult(null);
  };

  const restart = () => {
    window.clearTimeout(finaleTimer.current);
    if (rewindMs !== null) return;
    const hops = tour.path.length - 1;
    if (hops < 2 || reducedMotion()) { clear(); return; }
    // 步數越多每一跳越快：整段 0.9 秒上下，最慢 90ms 一跳（短的路才不會像慢動作）
    const every = Math.round(Math.max(40, Math.min(90, 900 / hops)));
    setResult(null);
    setRewindMs(every * 2);
    let at = tour;
    rewindTimer.current = window.setInterval(() => {
      at = undo(at);
      commit(at);
      playJump(n, at.path[at.path.length - 1]);
      if (at.path.length > 1) return;
      window.clearInterval(rewindTimer.current);
      // 站回第 1 格，落地了再清空
      rewindTimer.current = window.setTimeout(() => { setRewindMs(null); clear(); }, every * 2 + 120);
    }, every);
  };

  const askHint = () => {
    if (rewindMs !== null) return;
    setShown({ path: tour.path, hint: findHint(tour, undefined, closed) });
    setAssisted(true);
  };

  const elapsed = startedAt === null ? 0 : (endedAt ?? Math.max(now, startedAt)) - startedAt;
  const size = sizeLabel(n);
  const total = n * n;
  const modeName = closed ? t.closedMode : t.practiceMode;

  const message = note === 'badStart' ? t.badStart
    : note === 'notKnight' ? t.notKnight
    : note === 'revisited' ? t.revisited
    : hint?.kind === 'move' ? (hint.sure ? t.hintMove : t.hintGuess)
    : hint?.kind === 'undo' ? (hint.keep ? fill(closed ? t.hintUndoClosed : t.hintUndo, { k: hint.keep }) : t.hintUndoStart)
    : openEnd ? t.notClosed
    : stuck ? t.stuck
    : done ? fill(closed ? t.closedDoneBody : t.doneBody, { size, time: formatTime(elapsed) })
    : tour.path.length === 0 ? (closed ? t.placeKnightClosed : n % 2 ? t.placeKnightOdd : t.placeKnight)
    : closed ? t.moveKnightClosed : t.moveKnight;

  const label = (sq: Square, order: number) => {
    const name = squareName(n, sq);
    if (order && sq === tour.path[tour.path.length - 1]) return fill(t.squareKnight, { sq: name });
    if (order) return fill(t.squareVisited, { sq: name, k: order });
    if (targets.has(sq)) return fill(t.squareTarget, { sq: name });
    if (dead.has(sq)) return fill(t.squareBad, { sq: name });
    return name;
  };

  const chip = solvable === 'yes' ? { text: closed ? t.canReturn : t.canFinish, icon: LuCheck, cls: 'kt-plate' }
    : solvable === 'no' ? { text: closed ? t.cannotReturn : t.cannotFinish, icon: LuX, cls: 'kt-chalk' }
    : solvable === 'unknown' ? { text: t.unsure, icon: LuCircleHelp, cls: 'kt-plate text-ink-soft' }
    : null;

  const status = (place: Place) => (
    <div className="flex flex-col gap-3">
      <div className="flex items-stretch gap-2">
        {/* 窄的時候（橫放手機的右欄、英文的長字）判定換到第二行，不在字中間斷開 */}
        <div className="kt-plate flex flex-1 flex-wrap items-center gap-x-3 gap-y-1 px-3.5 py-2">
          <span className="whitespace-nowrap text-xl font-black tabular-nums">{size}</span>
          <span className="whitespace-nowrap text-sm font-bold tabular-nums text-ink-soft">{tour.path.length} / {total}</span>
        </div>
        <div className="kt-plate flex min-w-[5.5rem] flex-col items-end justify-center px-3.5 py-2">
          <span className="flex items-center gap-1 text-[10px] font-bold leading-none text-ink-soft"><LuTimer aria-hidden="true" />{t.elapsed}</span>
          <span className="mt-0.5 text-xl font-black tabular-nums leading-tight">{formatTime(elapsed)}</span>
        </div>
      </div>
      <div className={`flex min-h-10 flex-col justify-center gap-1.5 ${place === 'bar' ? 'items-center text-center' : 'items-start'}`} aria-live="polite">
        <p className={`text-sm font-bold leading-snug ${note || hint ? 'text-[#322e2a]' : 'text-ink-soft'}`}>{message}</p>
        {hint?.kind === 'undo' && (
          <button type="button" onClick={() => back(truncate(tour, hint.keep))}
            className="kt-chalk px-3 py-1.5 text-xs font-black active:scale-[0.97]">
            {hint.keep ? fill(t.undoTo, { k: hint.keep }) : t.reselectStart}
          </button>
        )}
        {/* 走不走得完只在按過提示之後才講（11/1 Zach：沒按提示就別先講）；跟「用過提示」放同一行，不另外撐高 */}
        {assisted && !done && (
          <p className="flex flex-wrap items-center gap-x-2 gap-y-1 text-xs font-bold text-ink-soft">
            {chip && <span className={`flex items-center gap-1 whitespace-nowrap px-2 py-1 font-black ${chip.cls}`}><chip.icon aria-hidden="true" className="shrink-0" />{chip.text}</span>}
            {t.assisted}
          </p>
        )}
      </div>
    </div>
  );

  const controls = (place: Place) => {
    const bar = place === 'bar';
    const cls = bar ? `${BTN} flex-col gap-0.5 px-1 text-xs` : BTN;
    return (
      <div className={`grid gap-2 ${bar ? 'grid-cols-4' : 'grid-cols-2'}`}>
        <button type="button" onClick={() => back(undo(tour))} disabled={!tour.path.length || done} className={cls}>
          <LuUndo2 aria-hidden="true" className="shrink-0 text-lg" />{t.undo}
        </button>
        {/* 走完之後提示沒用了，換成叫回結算（關掉之後原本叫不回來，11/1 Zach） */}
        {done && result ? (
          <button type="button" onClick={() => setResult((r) => (r ? { ...r, open: true } : r))} className={cls}>
            <LuImage aria-hidden="true" className="shrink-0 text-lg" />{t.viewResult}
          </button>
        ) : (
          <button type="button" onClick={askHint} disabled={done} className={cls}>
            <LuLightbulb aria-hidden="true" className="shrink-0 text-lg" />{t.hint}
          </button>
        )}
        <button type="button" onClick={restart} disabled={!tour.path.length && startedAt === null} className={done ? `${BTN_PRIMARY}${bar ? ' flex-col gap-0.5 px-1 text-xs' : ''}` : cls}>
          <LuRotateCcw aria-hidden="true" className="shrink-0 text-lg" />{t.restart}
        </button>
        <button type="button" onClick={() => setSizeOpen(true)} className={cls}>
          <LuGrid3X3 aria-hidden="true" className="shrink-0 text-lg" />{t.changeSize}
        </button>
      </div>
    );
  };

  const bestHere = best[recordKey];
  const share = useKtShare({
    isOpen: !!result?.open,
    plates: [{ n, path: tour.path }],
    time: formatTime(result?.ms ?? 0),
    isNew: !!result?.isNew,
    kicker: `${modeName} · ${size}`,
    title: closed ? t.closedDoneTitle : t.doneTitle,
  });

  return (
    <>
      <GameFrame title={t.title} subtitle={`${modeName} · ${size}`}
        menuLabel={t.menu} helpLabel={t.rules} onMenu={() => leave.request(onMenu)} onHelp={() => setHelpOpen(true)}
        status={status} controls={controls}
        board={<TourBoard n={n} path={tour.path} targets={targets} dead={dead}
          hinted={hint?.kind === 'move' ? hint.square : null} failed={stuck ? tour.path[tour.path.length - 1] : null}
          idle={tour.path.length > 0 && !done && !stuck && !hint}
          label={label} boardLabel={`${t.board} ${size}`} onTap={tap} rewindMs={rewindMs ?? undefined} />} />

      <HowToPlay open={helpOpen} onClose={() => setHelpOpen(false)} />
      <SizePicker open={sizeOpen} current={n} closed={closed} onClose={() => setSizeOpen(false)}
        onPick={(next) => { setSizeOpen(false); if (next === n) restart(); else leave.skip(() => onSize(next)); }} />
      <LeaveModal leave={leave} />

      {/* 結算就是分享圖：一張銅版圖版（shareCard.ts）。關掉就停在走完的棋盤上，換大小在棋盤下面 */}
      <ShareResultModal isOpen={!!result?.open} onClose={() => setResult((r) => (r ? { ...r, open: false } : r))}
        title={closed ? t.closedDoneTitle : t.doneTitle} card={share} onRestart={() => { track('game_restart', { ...GA, board_size: n }); restart(); }} restartLabel={t.again}
        classes={KT_SHARE} frameClassName="rounded-[2px]"
        srText={[
          fill(closed ? t.closedDoneBody : t.doneBody, { size, time: formatTime(result?.ms ?? 0) }),
          result?.isNew ? t.newBest : bestHere !== undefined ? fill(t.bestWas, { time: formatTime(bestHere) }) : '',
          done && isClosed(tour) ? t.closedTour : '',
          assisted ? t.assisted : '',
        ].filter(Boolean).join(' ')} />
    </>
  );
}
