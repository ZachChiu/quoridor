'use client';
import { useEffect, useMemo, useState } from 'react';
import { GiChessKnight } from 'react-icons/gi';
import { LuCheck, LuCircleHelp, LuGrid3X3, LuLightbulb, LuRotateCcw, LuTimer, LuUndo2, LuX } from 'react-icons/lu';
import Modal from '@/components/Modal';
import Button from '@/components/Button';
import { fill, useTextTable } from '@/i18n/gameText';
import {
  canStartFrom, createTour, hint as findHint, isComplete, isStuck, legalMoves, move, tapKind, truncate, undo, verdict,
  type Hint, type Square, type Tour,
} from '@/games/knights-tour/engine';
import { TEXT, type KnightsText } from '@/games/knights-tour/text';
import GameFrame, { BTN, BTN_PRIMARY, type Place } from './GameFrame';
import HowToPlay from './HowToPlay';
import SizePicker from './SizePicker';
import TourBoard from './TourBoard';
import { practiceKey, saveBest, useBestTimes } from './records';
import { formatTime, shake, sizeLabel, squareName } from './ui';

type Note = 'notKnight' | 'badStart' | 'revisited' | null;

/**
 * 練習模式：5×5–10×10 自選，可以悔棋、看提示，每走一步就判定「從這裡還走不走得完」
 * （engine 的解題器，有節點上限，算不完就顯示「算不出來」，不會卡住畫面）。
 * 用過提示的那一局不列入最佳紀錄；悔棋與判定可以用 —— 它們本來就是練習的一部分。
 */
export default function PracticeGame({ n, onMenu, onSize }: { n: number; onMenu: () => void; onSize: (n: number) => void }) {
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

  const running = startedAt !== null && endedAt === null;
  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => setNow(Date.now()), 500);
    return () => window.clearInterval(id);
  }, [running]);

  const done = isComplete(tour);
  const stuck = isStuck(tour);
  // 每一步都問一次解題器。正常局面零點幾毫秒；最壞跑滿節點上限，桌機約 10ms
  const solvable = useMemo(() => (tour.path.length && !done ? verdict(tour) : null), [tour, done]);
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
    const kind = tapKind(tour, sq);
    if (kind === 'current' || kind === 'over') return;
    if (kind === 'notKnight' || kind === 'revisit') { setNote(kind === 'revisit' ? 'revisited' : 'notKnight'); shake(el); return; }
    if (kind === 'start' && !canStartFrom(n, sq) && armed !== sq) { setArmed(sq); setNote('badStart'); shake(el); return; }
    const at = Date.now();
    const next = move(tour, sq);
    commit(next);
    setNow(at);
    const start = startedAt ?? at;
    if (startedAt === null) setStartedAt(at);
    if (isComplete(next)) {
      setEndedAt(at);
      const ms = at - start;
      setResult({ ms, isNew: assisted ? false : saveBest(practiceKey(n), ms).isNew, open: true });
    }
  };

  const restart = () => {
    commit(createTour(n));
    setStartedAt(null);
    setEndedAt(null);
    setNow(0);
    setAssisted(false);
    setResult(null);
  };

  const askHint = () => {
    setShown({ path: tour.path, hint: findHint(tour) });
    setAssisted(true);
  };

  const elapsed = startedAt === null ? 0 : (endedAt ?? Math.max(now, startedAt)) - startedAt;
  const size = sizeLabel(n);
  const total = n * n;

  const message = note === 'badStart' ? t.badStart
    : note === 'notKnight' ? t.notKnight
    : note === 'revisited' ? t.revisited
    : hint?.kind === 'move' ? (hint.sure ? t.hintMove : t.hintGuess)
    : hint?.kind === 'undo' ? (hint.keep ? fill(t.hintUndo, { k: hint.keep }) : t.hintUndoStart)
    : stuck ? t.stuck
    : done ? fill(t.doneBody, { size, time: formatTime(elapsed) })
    : tour.path.length === 0 ? (n % 2 ? t.placeKnightOdd : t.placeKnight)
    : t.moveKnight;

  const label = (sq: Square, order: number) => {
    const name = squareName(n, sq);
    if (order && sq === tour.path[tour.path.length - 1]) return fill(t.squareKnight, { sq: name });
    if (order) return fill(t.squareVisited, { sq: name, k: order });
    if (targets.has(sq)) return fill(t.squareTarget, { sq: name });
    if (dead.has(sq)) return fill(t.squareBad, { sq: name });
    return name;
  };

  const chip = solvable === 'yes' ? { text: t.canFinish, icon: LuCheck, cls: 'bg-tile-ink/[0.07] text-tile-ink' }
    : solvable === 'no' ? { text: t.cannotFinish, icon: LuX, cls: 'bg-tile-red text-tile-cream' }
    : solvable === 'unknown' ? { text: t.unsure, icon: LuCircleHelp, cls: 'bg-tile-ink/[0.07] text-ink-soft' }
    : null;

  const status = (place: Place) => (
    <div className="flex flex-col gap-3">
      <div className="flex items-stretch gap-2">
        {/* 窄的時候（橫放手機的右欄、英文的長字）判定換到第二行，不在字中間斷開 */}
        <div className="flex flex-1 flex-wrap items-center gap-x-3 gap-y-1 rounded-xl bg-tile-ink/[0.07] px-3 py-1.5">
          <span className="whitespace-nowrap text-xl font-black tabular-nums">{size}</span>
          <span className="whitespace-nowrap text-sm font-bold tabular-nums text-ink-soft">{tour.path.length} / {total}</span>
          {chip && (
            <span className={`ml-auto flex items-center gap-1 whitespace-nowrap rounded-full px-2.5 py-1 text-xs font-black ${chip.cls}`}>
              <chip.icon aria-hidden="true" className="shrink-0" />{chip.text}
            </span>
          )}
        </div>
        <div className="flex min-w-[5.5rem] flex-col items-end justify-center rounded-xl bg-tile-ink/[0.07] px-3 py-1.5">
          <span className="flex items-center gap-1 text-[10px] font-bold leading-none text-ink-soft"><LuTimer aria-hidden="true" />{t.elapsed}</span>
          <span className="mt-0.5 text-xl font-black tabular-nums leading-tight">{formatTime(elapsed)}</span>
        </div>
      </div>
      <div className={`flex min-h-10 flex-col justify-center gap-1.5 ${place === 'bar' ? 'items-center text-center' : 'items-start'}`} aria-live="polite">
        <p className={`text-sm font-bold leading-snug ${note || hint ? 'text-tile-ink' : 'text-ink-soft'}`}>{message}</p>
        {hint?.kind === 'undo' && (
          <button type="button" onClick={() => commit(truncate(tour, hint.keep))}
            className="rounded-lg bg-tile-ink px-3 py-1.5 text-xs font-black text-tile-cream transition active:scale-[0.97]">
            {hint.keep ? fill(t.undoTo, { k: hint.keep }) : t.reselectStart}
          </button>
        )}
        {assisted && !done && <p className="text-xs font-bold text-ink-soft">{t.assisted}</p>}
      </div>
    </div>
  );

  const controls = (place: Place) => {
    const bar = place === 'bar';
    const cls = bar ? `${BTN} flex-col gap-0.5 px-1 text-xs` : BTN;
    return (
      <div className={`grid gap-2 ${bar ? 'grid-cols-4' : 'grid-cols-2'}`}>
        <button type="button" onClick={() => commit(undo(tour))} disabled={!tour.path.length || done} className={cls}>
          <LuUndo2 aria-hidden="true" className="shrink-0 text-lg" />{t.undo}
        </button>
        <button type="button" onClick={askHint} disabled={done} className={cls}>
          <LuLightbulb aria-hidden="true" className="shrink-0 text-lg" />{t.hint}
        </button>
        <button type="button" onClick={restart} disabled={!tour.path.length && startedAt === null} className={done ? `${BTN_PRIMARY}${bar ? ' flex-col gap-0.5 px-1 text-xs' : ''}` : cls}>
          <LuRotateCcw aria-hidden="true" className="shrink-0 text-lg" />{t.restart}
        </button>
        <button type="button" onClick={() => setSizeOpen(true)} className={cls}>
          <LuGrid3X3 aria-hidden="true" className="shrink-0 text-lg" />{t.changeSize}
        </button>
      </div>
    );
  };

  const bestHere = best[practiceKey(n)];

  return (
    <>
      <GameFrame title={t.title} subtitle={`${t.practiceMode} · ${size}`}
        menuLabel={t.menu} helpLabel={t.rules} onMenu={onMenu} onHelp={() => setHelpOpen(true)}
        status={status} controls={controls}
        board={<TourBoard n={n} path={tour.path} targets={targets} dead={dead}
          hinted={hint?.kind === 'move' ? hint.square : null} failed={stuck ? tour.path[tour.path.length - 1] : null}
          label={label} boardLabel={`${t.board} ${size}`} onTap={tap} />} />

      <HowToPlay open={helpOpen} onClose={() => setHelpOpen(false)} />
      <SizePicker open={sizeOpen} current={n} onClose={() => setSizeOpen(false)}
        onPick={(next) => { setSizeOpen(false); if (next === n) restart(); else onSize(next); }} />

      <Modal isOpen={!!result?.open} onClose={() => setResult((r) => (r ? { ...r, open: false } : r))}
        title={t.doneTitle} kicker={`${t.practiceMode} · ${size}`} icon={GiChessKnight}
        band={{ className: 'bg-tile-amber', fg: 'text-tile-ink' }}
        footer={<>
          <Button color="bg-tile-ink/[0.07] text-tile-ink" handleClickEvent={() => { setResult((r) => (r ? { ...r, open: false } : r)); setSizeOpen(true); }}>{t.changeSize}</Button>
          <Button color="bg-tile-ink text-tile-cream" handleClickEvent={restart}>{t.again}</Button>
        </>}>
        <div className="flex flex-col gap-3">
          <div className="flex items-end justify-between gap-3">
            <p className="text-5xl font-black tabular-nums leading-none">{formatTime(result?.ms ?? 0)}</p>
            {result?.isNew
              ? <p className="rounded-lg bg-tile-ink px-2.5 py-1 text-sm font-black text-tile-cream">{t.newBest}</p>
              : bestHere !== undefined && <p className="text-sm font-bold text-ink-soft">{fill(t.bestWas, { time: formatTime(bestHere) })}</p>}
          </div>
          <p className="text-sm font-bold leading-relaxed">{fill(t.doneBody, { size, time: formatTime(result?.ms ?? 0) })}</p>
          {assisted && <p className="text-xs font-bold text-ink-soft">{t.assisted}</p>}
        </div>
      </Modal>
    </>
  );
}
