'use client';
import { useEffect, useMemo, useRef, useState } from 'react';
import { useLeaveGuard } from '@/hook/useLeaveGuard';
import { GiHourglass } from 'react-icons/gi';
import { LuArrowRight, LuCheck, LuRotateCcw, LuTimer } from 'react-icons/lu';
import Modal from '@/components/Modal';
import { ShareResultModal } from '@/components/ShareResultModal';
import { fill, useTextTable } from '@/i18n/gameText';
import { canStartFrom, legalMoves, tapKind, type Square } from '@/games/knights-tour/engine';
import {
  SHOW_SIZES, showElapsed, showNext, showRemaining, showRetry, showRunning, showTap, showTick, startShow, type ShowRun,
} from '@/games/knights-tour/show';
import { TEXT, type KnightsText } from '@/games/knights-tour/text';
import GameFrame, { type Place } from './GameFrame';
import HowToPlay from './HowToPlay';
import LeaveModal from './LeaveModal';
import TourBoard from './TourBoard';
import { finaleMs } from './motion';
import { saveBest, useBestTimes } from './records';
import { isClosed } from './shareCard';
import { playJump, playKt } from './sounds';
import { formatTime, shake, sizeLabel, squareName } from './ui';
import { BAND_INK, BTN, BTN_PRIMARY, KT_SHARE, MODAL_PANEL } from './styles';
import { useKtShare } from './useKtShare';

type Note = 'notKnight' | 'badStart' | null;

/**
 * 節目挑戰：6×6 → 7×7 → 8×8，總時限 60 分鐘，犯規或卡住就整關清空（規則在 games/knights-tour/show.ts）。
 * 跟節目一樣沒有悔棋、沒有提示、沒有「還走不走得完」—— 只有奇數盤的起點會先標出來（調查的建議）。
 *
 * 聲音在點擊當下放（sounds.ts）。三關全破時先讓騎士在棋盤上收尾，再跳出結算 —— 結算就是分享圖，
 * 三關的棋盤都畫上去（所以每過一關就把那一關走完的路記下來）。時間到照舊是一般的彈窗（去練習卡住的那一關）。
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
  /** 已經走完的每一關的路（分享圖要畫三張） */
  const [plates, setPlates] = useState<Square[][]>([]);
  /** 三關全破之後，等騎士收尾完才跳出結算 */
  const [endReady, setEndReady] = useState(false);
  const finaleTimer = useRef(0);
  useEffect(() => () => window.clearTimeout(finaleTimer.current), []);

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
    if (kind === 'notKnight') { setNote('notKnight'); shake(el); playKt('wrong'); return; }
    if (kind === 'start' && !canStartFrom(n, sq) && armed !== sq) { setArmed(sq); setNote('badStart'); shake(el); playKt('wrong'); return; }
    const at = Date.now();
    const next = showTap(run, sq, at);
    setArmed(null);
    setNote(null);
    setNow(at);
    setRun(next);
    // 犯規（踩到走過的格子）沒有走出去：只有往下的那一聲。其他都是騎士真的跳了
    if (next.status === 'failed' && next.failure?.reason === 'revisit') { playKt('stuck'); return; }
    if (next.tour.path.length === tour.path.length + 1) playJump(n, sq, kind === 'start');
    const closed = isClosed(next.tour);
    if (next.status === 'failed') playKt('stuck', 0.3);
    if (next.status === 'cleared') playKt('complete', 0.3);
    if (next.status === 'won') playKt('won', 0.3);
    if (closed) playKt('closed', next.status === 'won' ? 1.35 : 0.95);
    if (next.status === 'cleared' || next.status === 'won') setPlates((p) => [...p, [...next.tour.path]]);
    if (next.status === 'won') {
      setRecord(saveBest('show', showElapsed(next, at)));
      finaleTimer.current = window.setTimeout(() => setEndReady(true), finaleMs(n * n) + (closed ? 900 : 300));
    }
  };

  // 時間到：往下的那一聲（計時器每一跳都可能是那一刻，所以看狀態的變化，不在點擊裡）
  const lastStatus = useRef(status);
  useEffect(() => {
    if (status === 'timeUp' && lastStatus.current !== 'timeUp') playKt('stuck');
    lastStatus.current = status;
  }, [status]);

  const act = (f: (r: ShowRun, at: number) => ShowRun) => () => {
    const at = Date.now();
    setNow(at);
    setRun(f(run, at));
    setArmed(null);
    setNote(null);
    // 重來這一關、下一關：翻一頁紙
    playKt('clear');
  };
  const again = () => {
    window.clearTimeout(finaleTimer.current);
    if (tour.path.length || run.level) playKt('clear');
    setRun(startShow());
    setNow(0);
    setNote(null);
    setArmed(null);
    setRecord(null);
    setEndClosed(false);
    setEndReady(false);
    setPlates([]);
  };

  const elapsed = showElapsed(run, now);
  const remaining = showRemaining(run, now);
  const size = sizeLabel(n);
  const attempt = run.attempts[run.level] ?? 1;
  const over = status === 'won' || status === 'timeUp';
  // 走到一半回選單先問（房子鈕、返回鍵）；換到練習不必問，但一樣先退掉守門（hook/useLeaveGuard.ts）
  const leave = useLeaveGuard({ live: !over, inProgress: !over && (tour.path.length > 0 || run.level > 0) });

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
                className={`kt-plate flex flex-1 flex-col items-center justify-center px-1 py-1.5 ${
                  done ? 'is-wash' : active ? 'is-hatched' : 'text-ink-soft'}`}>
                <span className="text-[10px] font-bold leading-none opacity-80">{fill(t.level, { i: i + 1 })}</span>
                <span className="mt-0.5 flex items-center gap-0.5 text-sm font-black tabular-nums leading-tight">
                  {done && <LuCheck aria-hidden="true" className="shrink-0" />}{sizeLabel(s)}
                </span>
              </li>
            );
          })}
        </ol>
        <div className={`flex min-w-[5.5rem] flex-col items-end justify-center px-3.5 py-2 ${remaining < 5 * 60_000 && running ? 'kt-chalk' : 'kt-plate'}`}>
          <span className="flex items-center gap-1 text-[10px] font-bold leading-none opacity-80"><LuTimer aria-hidden="true" />{t.timeLeft}</span>
          <span className="mt-0.5 text-xl font-black tabular-nums leading-tight" role="timer">{formatTime(remaining, true)}</span>
        </div>
      </div>
      <div className={`flex min-h-10 flex-col justify-center ${place === 'bar' ? 'items-center text-center' : ''}`} aria-live="polite">
        {alert
          ? <p className="kt-chalk px-2.5 py-1 text-sm font-black">{alert}</p>
          : <p className={`text-sm font-bold leading-snug ${note ? 'text-[#322e2a]' : 'text-ink-soft'}`}>{message}</p>}
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
  const wonOpen = status === 'won' && endReady && !endClosed;
  const share = useKtShare({
    isOpen: wonOpen,
    plates: plates.map((path, i) => ({ n: SHOW_SIZES[i], path, time: formatTime((run.splits[i] ?? 0) - (run.splits[i - 1] ?? 0)) })),
    time: formatTime(elapsed),
    isNew: !!record?.isNew,
    kicker: `${t.showMode} · ${SHOW_SIZES.map(sizeLabel).join(' → ')}`,
    title: t.wonTitle,
  });

  return (
    <>
      <GameFrame title={t.title} subtitle={`${t.showMode} · ${SHOW_SIZES.map(sizeLabel).join(' → ')}`}
        menuLabel={t.menu} helpLabel={t.rules} onMenu={() => leave.request(onMenu)} onHelp={() => setHelpOpen(true)}
        status={status_} controls={controls}
        board={<TourBoard n={n} path={tour.path} targets={targets} dead={dead} failed={run.failure?.square ?? null}
          idle={playing && tour.path.length > 0}
          label={label} boardLabel={`${t.board} ${size}`} onTap={tap} />} />

      <HowToPlay open={helpOpen} onClose={() => setHelpOpen(false)} />
      <LeaveModal leave={leave} />

      {/* 結算就是分享圖：三關的棋盤畫在一張銅版圖版上（shareCard.ts）。關掉就停在 8×8 走完的棋盤上 */}
      <ShareResultModal isOpen={wonOpen} onClose={() => setEndClosed(true)} title={t.wonTitle} card={share}
        onRestart={again} restartLabel={t.again} classes={KT_SHARE} frameClassName="rounded-[2px]"
        srText={[
          fill(t.wonBody, { time: formatTime(elapsed) }),
          ...SHOW_SIZES.map((s, i) => `${sizeLabel(s)} ${formatTime((run.splits[i] ?? 0) - (run.splits[i - 1] ?? 0))}${
            (run.attempts[i] ?? 1) > 1 ? ` ${fill(t.attempt, { k: run.attempts[i] })}` : ''}`),
          record?.isNew ? t.newBest : bestShow !== undefined ? fill(t.bestWas, { time: formatTime(bestShow) }) : '',
        ].filter(Boolean).join(' ')} />

      <Modal isOpen={status === 'timeUp' && !endClosed} onClose={() => setEndClosed(true)} title={t.timeUpTitle} kicker={t.title}
        icon={GiHourglass} band={BAND_INK} panelClassName={MODAL_PANEL}
        footer={<>
          <button type="button" className="kt-plate flex-1 py-3.5 font-black" onClick={() => leave.skip(() => onPractice(SHOW_SIZES[stoppedAt]))}>{t.toPractice}</button>
          <button type="button" className="kt-chalk flex-1 py-3.5 font-black" onClick={again}>{t.again}</button>
        </>}>
        <p className="text-sm font-bold leading-relaxed">{fill(t.timeUpBody, { i: stoppedAt + 1, size: sizeLabel(SHOW_SIZES[stoppedAt]) })}</p>
      </Modal>
    </>
  );
}
