'use client';
import { useEffect, useMemo, useState } from 'react';
import { GiHourglass, GiLaurelsTrophy } from 'react-icons/gi';
import { LuArrowRight, LuCheck, LuRotateCcw, LuTimer } from 'react-icons/lu';
import Modal from '@/components/Modal';
import Button from '@/components/Button';
import { fill, useTextTable } from '@/i18n/gameText';
import { canStartFrom, legalMoves, tapKind, type Square } from '@/games/knights-tour/engine';
import {
  SHOW_SIZES, showElapsed, showNext, showRemaining, showRetry, showRunning, showTap, showTick, startShow, type ShowRun,
} from '@/games/knights-tour/show';
import { TEXT, type KnightsText } from '@/games/knights-tour/text';
import GameFrame, { BTN, BTN_PRIMARY, type Place } from './GameFrame';
import HowToPlay from './HowToPlay';
import TourBoard from './TourBoard';
import { saveBest, useBestTimes } from './records';
import { formatTime, shake, sizeLabel, squareName } from './ui';

type Note = 'notKnight' | 'badStart' | null;

/**
 * 節目挑戰：6×6 → 7×7 → 8×8，總時限 60 分鐘，犯規或卡住就整關清空（規則在 games/knights-tour/show.ts）。
 * 跟節目一樣沒有悔棋、沒有提示、沒有「還走不走得完」—— 只有奇數盤的起點會先標出來（調查的建議）。
 */
export default function ShowGame({ onMenu, onPractice }: {
  onMenu: () => void;
  /** 時間到之後「去練習」：直接開卡住的那一關的大小 */
  onPractice: (n: number) => void;
}) {
  const t = useTextTable<KnightsText>(TEXT);
  const best = useBestTimes();
  const [run, setRun] = useState<ShowRun>(startShow);
  const [now, setNow] = useState(0);
  const [note, setNote] = useState<Note>(null);
  /** 奇數盤點了走不完的起點：先警告，再點同一格才放 */
  const [armed, setArmed] = useState<Square | null>(null);
  const [helpOpen, setHelpOpen] = useState(false);
  const [endClosed, setEndClosed] = useState(false);
  const [record, setRecord] = useState<{ isNew: boolean; previous?: number } | null>(null);

  const running = showRunning(run);
  useEffect(() => {
    if (!running) return;
    const id = window.setInterval(() => {
      const at = Date.now();
      setNow(at);
      setRun((r) => showTick(r, at));
    }, 250);
    return () => window.clearInterval(id);
  }, [running]);

  const { tour, status } = run;
  const n = tour.n;
  const playing = status === 'playing';
  const targets = useMemo(() => new Set(playing && tour.path.length ? legalMoves(tour) : []), [playing, tour]);
  const dead = useMemo(() => new Set(playing && !tour.path.length && n % 2
    ? Array.from({ length: n * n }, (_, sq) => sq).filter((sq) => !canStartFrom(n, sq)) : []), [playing, tour, n]);

  const tap = (sq: Square, el: HTMLElement) => {
    if (!playing) return;
    const kind = tapKind(tour, sq);
    if (kind === 'current' || kind === 'over') return;
    if (kind === 'notKnight') { setNote('notKnight'); shake(el); return; }
    if (kind === 'start' && !canStartFrom(n, sq) && armed !== sq) { setArmed(sq); setNote('badStart'); shake(el); return; }
    const at = Date.now();
    const next = showTap(run, sq, at);
    setArmed(null);
    setNote(null);
    setNow(at);
    setRun(next);
    if (next.status === 'won') setRecord(saveBest('show', showElapsed(next, at)));
  };

  const act = (f: (r: ShowRun, at: number) => ShowRun) => () => {
    const at = Date.now();
    setNow(at);
    setRun(f(run, at));
    setArmed(null);
    setNote(null);
  };
  const again = () => {
    setRun(startShow());
    setNow(0);
    setNote(null);
    setArmed(null);
    setRecord(null);
    setEndClosed(false);
  };

  const elapsed = showElapsed(run, now);
  const remaining = showRemaining(run, now);
  const size = sizeLabel(n);
  const attempt = run.attempts[run.level] ?? 1;
  const over = status === 'won' || status === 'timeUp';

  const alert = status === 'failed' ? (run.failure?.reason === 'revisit' ? t.failRevisit : t.failStuck) : null;
  const message = status === 'cleared' ? fill(t.levelClear, { size })
    : note === 'badStart' ? t.badStart
    : note === 'notKnight' ? t.notKnight
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

  const status_ = (place: Place) => (
    <div className="flex flex-col gap-3">
      <div className="flex items-stretch gap-2">
        <ol className="flex flex-1 gap-1.5">
          {SHOW_SIZES.map((s, i) => {
            const done = i < run.splits.length;
            const active = i === run.level && !done;
            return (
              <li key={s} aria-current={active ? 'step' : undefined}
                className={`flex flex-1 flex-col items-center justify-center rounded-xl px-1 py-1.5 ${
                  done ? 'bg-tile-amber text-tile-ink' : active ? 'bg-tile-ink text-tile-cream' : 'bg-tile-ink/[0.07] text-ink-soft'}`}>
                <span className="text-[10px] font-bold leading-none opacity-80">{fill(t.level, { i: i + 1 })}</span>
                <span className="mt-0.5 flex items-center gap-0.5 text-sm font-black tabular-nums leading-tight">
                  {done && <LuCheck aria-hidden="true" className="shrink-0" />}{sizeLabel(s)}
                </span>
              </li>
            );
          })}
        </ol>
        <div className={`flex min-w-[5.5rem] flex-col items-end justify-center rounded-xl px-3 py-1.5 ${remaining < 5 * 60_000 && running ? 'bg-tile-red text-tile-cream' : 'bg-tile-ink/[0.07]'}`}>
          <span className="flex items-center gap-1 text-[10px] font-bold leading-none opacity-80"><LuTimer aria-hidden="true" />{t.timeLeft}</span>
          <span className="mt-0.5 text-xl font-black tabular-nums leading-tight" role="timer">{formatTime(remaining, true)}</span>
        </div>
      </div>
      <div className={`flex min-h-10 flex-col justify-center ${place === 'bar' ? 'items-center text-center' : ''}`} aria-live="polite">
        {alert
          ? <p className="rounded-lg bg-tile-red px-2.5 py-1 text-sm font-black text-tile-cream">{alert}</p>
          : <p className={`text-sm font-bold leading-snug ${note ? 'text-tile-ink' : 'text-ink-soft'}`}>{message}</p>}
        {attempt > 1 && !over && <p className="mt-1 text-xs font-bold text-ink-soft">{fill(t.attempt, { k: attempt })}</p>}
      </div>
    </div>
  );

  const controls = (place: Place) => {
    const cls = place === 'bar' ? 'w-full' : '';
    if (status === 'cleared') {
      return (
        <button type="button" onClick={act(showNext)} className={`${BTN_PRIMARY} ${cls}`}>
          {fill(t.next, { size: sizeLabel(SHOW_SIZES[run.level + 1]) })}<LuArrowRight aria-hidden="true" className="shrink-0" />
        </button>
      );
    }
    if (over) return <button type="button" onClick={again} className={`${BTN_PRIMARY} ${cls}`}><LuRotateCcw aria-hidden="true" className="shrink-0" />{t.again}</button>;
    return (
      <button type="button" onClick={act(showRetry)} disabled={status === 'playing' && tour.path.length === 0}
        className={`${status === 'failed' ? BTN_PRIMARY : BTN} ${cls}`}>
        <LuRotateCcw aria-hidden="true" className="shrink-0" />{t.retry}
      </button>
    );
  };

  // 時間到的時候正在挑戰第幾關（已經走完的關數 + 1）
  const stoppedAt = Math.min(run.splits.length, SHOW_SIZES.length - 1);
  const bestShow = best.show;

  return (
    <>
      <GameFrame title={t.title} subtitle={`${t.showMode} · ${SHOW_SIZES.map(sizeLabel).join(' → ')}`}
        menuLabel={t.menu} helpLabel={t.rules} onMenu={onMenu} onHelp={() => setHelpOpen(true)}
        status={status_} controls={controls}
        board={<TourBoard n={n} path={tour.path} targets={targets} dead={dead} failed={run.failure?.square ?? null}
          label={label} boardLabel={`${t.board} ${size}`} onTap={tap} />} />

      <HowToPlay open={helpOpen} onClose={() => setHelpOpen(false)} />

      <Modal isOpen={status === 'won' && !endClosed} onClose={() => setEndClosed(true)} title={t.wonTitle} kicker={t.title}
        icon={GiLaurelsTrophy} band={{ className: 'bg-tile-amber', fg: 'text-tile-ink' }}
        footer={<>
          <Button color="bg-tile-ink/[0.07] text-tile-ink" handleClickEvent={onMenu}>{t.menu}</Button>
          <Button color="bg-tile-ink text-tile-cream" handleClickEvent={again}>{t.again}</Button>
        </>}>
        <div className="flex flex-col gap-4">
          <div className="flex items-end justify-between gap-3">
            <p className="text-5xl font-black tabular-nums leading-none">{formatTime(elapsed)}</p>
            {record?.isNew
              ? <p className="rounded-lg bg-tile-ink px-2.5 py-1 text-sm font-black text-tile-cream">{t.newBest}</p>
              : bestShow !== undefined && <p className="text-sm font-bold text-ink-soft">{fill(t.bestWas, { time: formatTime(bestShow) })}</p>}
          </div>
          <p className="text-sm font-bold leading-relaxed">{fill(t.wonBody, { time: formatTime(elapsed) })}</p>
          <ol className="flex flex-col gap-1.5">
            {SHOW_SIZES.map((s, i) => (
              <li key={s} className="flex items-center justify-between rounded-xl bg-tile-ink/[0.05] px-3 py-2 text-sm font-bold">
                <span className="font-black tabular-nums">{sizeLabel(s)}</span>
                <span className="text-ink-soft">{(run.attempts[i] ?? 1) > 1 ? fill(t.attempt, { k: run.attempts[i] }) : ''}</span>
                <span className="font-black tabular-nums">{formatTime((run.splits[i] ?? 0) - (run.splits[i - 1] ?? 0))}</span>
              </li>
            ))}
          </ol>
        </div>
      </Modal>

      <Modal isOpen={status === 'timeUp' && !endClosed} onClose={() => setEndClosed(true)} title={t.timeUpTitle} kicker={t.title}
        icon={GiHourglass} band={{ className: 'bg-tile-ink', fg: 'text-tile-cream' }}
        footer={<>
          <Button color="bg-tile-ink/[0.07] text-tile-ink" handleClickEvent={() => onPractice(SHOW_SIZES[stoppedAt])}>{t.toPractice}</Button>
          <Button color="bg-tile-ink text-tile-cream" handleClickEvent={again}>{t.again}</Button>
        </>}>
        <p className="text-sm font-bold leading-relaxed">{fill(t.timeUpBody, { i: stoppedAt + 1, size: sizeLabel(SHOW_SIZES[stoppedAt]) })}</p>
      </Modal>
    </>
  );
}
