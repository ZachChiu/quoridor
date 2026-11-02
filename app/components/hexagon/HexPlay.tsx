'use client';
import { useCallback, useEffect, useMemo, useReducer, useRef, useState } from 'react';
import { LuCircleHelp, LuHouse, LuVolume2, LuVolumeX } from 'react-icons/lu';
import { ShareResultModal } from '@/components/ShareResultModal';
import { useLeaveGuard } from '@/hook/useLeaveGuard';
import { useSound } from '@/hook/useSound';
import { useGameText } from '@/i18n/LocaleProvider';
import { fill, useTextTable } from '@/i18n/gameText';
import {
  IDLE_SECONDS, LEVELS, LETTERS, endRound, flip, lineOf, nextRound, startGame, submit, totals,
  type Config, type GameState,
} from '@/games/hexagon/engine';
import { TEXT, type HexText } from '@/games/hexagon/text';
import HexBoard, { FLIP_DELAYS, type BoardLine } from './HexBoard';
import HowToPlay from './HowToPlay';
import HxFrame from './HxFrame';
import LeaveModal from './LeaveModal';
import { saveDaily } from './records';
import { playAllFound, playHx } from './sounds';
import { BTN, BTN_PRIMARY, BTN_ROUND, HX_SHARE } from './styles';
import { useHxShare } from './useHxShare';

type Action = { type: 'flip' } | { type: 'submit'; cells: number[] } | { type: 'end' } | { type: 'next' } | { type: 'restart'; config: Config };

function reducer(s: GameState, a: Action): GameState {
  switch (a.type) {
    case 'flip': return flip(s);
    case 'submit': return submit(s, a.cells);
    case 'end': return endRound(s);
    case 'next': return nextRound(s);
    case 'restart': return startGame(a.config);
  }
}

/**
 * 一局（每日一題、節目規則、練習共用）。規則全在 games/hexagon/engine.ts，這裡只管計時、點選、聲音與畫面。
 *
 * 一回合：看數字（倒數；可以先按「記好了」）→ 翻面、公布目標數 → 點三格送出（電腦版也可以直接打字母、Enter 送出、Backspace 清掉）
 * → 找完、按「這回合找完了」、或 90 秒沒送出 → 翻回數字，找到的畫實線、沒找到的畫虛線 → 下一回合。
 * 計時用「截止時間」而不是每秒減一：分頁收到背景再回來，時間照樣是對的。
 *
 * 版面照騎士巡遊的 GameFrame：手機是上方一排（回選單、標題、聲音、說明）＋狀態＋盤面＋按鈕；
 * 桌機（lg）與橫放的手機（short）盤面在左、右邊一欄放標題、狀態與按鈕。
 */
export default function HexPlay({ makeConfig, onMenu }: {
  /** 這一局的設定；再玩一次也照它再做一份（每日一題是同一題，其他換一個種子） */
  makeConfig: () => Config;
  onMenu: () => void;
}) {
  const t = useTextTable<HexText>(TEXT);
  const g = useGameText();
  const { prefs, setPrefs } = useSound();
  const [s, dispatch] = useReducer(reducer, makeConfig, (make) => startGame(make()));
  const rule = LEVELS[s.config.level];
  const [picks, setPicks] = useState<number[]>([]);
  const [helpOpen, setHelpOpen] = useState(false);
  const [resultClosed, setResultClosed] = useState(false);

  // ─── 計時 ───
  // 換階段（或送出一次答案）就重設截止時間：看數字是 memorize 秒、作答是 90 秒沒送出。
  // 截止時間記著是哪個階段的（stamp）：換階段的那一輪還拿著上一段的時間，不能拿來判斷「時間到」
  const stamp = `${s.index}:${s.phase}:${s.found.length + s.wrong}`;
  const [now, setNow] = useState(0);
  const [deadline, setDeadline] = useState({ stamp: '', at: 0 });
  useEffect(() => {
    const at = Date.now();
    const secs = s.phase === 'memorize' ? rule.memorize : s.phase === 'answer' ? IDLE_SECONDS : 0;
    // eslint-disable-next-line react-hooks/set-state-in-effect -- 每換一段重新起算，要讀當下的時間
    setNow(at);
    setDeadline({ stamp, at: secs ? at + secs * 1000 : 0 });
  }, [stamp, s.phase, rule.memorize]);
  const running = s.phase === 'memorize' || s.phase === 'answer';
  useEffect(() => {
    if (!running || helpOpen) return;
    const id = window.setInterval(() => setNow(Date.now()), 200);
    return () => window.clearInterval(id);
  }, [running, helpOpen]);
  // 說明開著的時候時間停住：關掉時把截止時間往後推
  const pausedAt = useRef<number | null>(null);
  useEffect(() => {
    if (helpOpen) { pausedAt.current = Date.now(); return; }
    if (pausedAt.current === null) return;
    const paused = Date.now() - pausedAt.current;
    pausedAt.current = null;
     
    setDeadline((d) => ({ ...d, at: d.at ? d.at + paused : 0 }));
    setNow(Date.now());
  }, [helpOpen]);
  const current = deadline.stamp === stamp && deadline.at > 0;
  const left = current ? Math.max(0, Math.ceil((deadline.at - now) / 1000)) : (s.phase === 'memorize' ? rule.memorize : IDLE_SECONDS);

  useEffect(() => {
    if (!running || helpOpen || !current || now < deadline.at) return;
    dispatch({ type: s.phase === 'memorize' ? 'flip' : 'end' });
  }, [now, running, helpOpen, current, deadline.at, s.phase]);

  // 最後 5 秒，每秒一聲輕的碰撞
  const lastTick = useRef(-1);
  useEffect(() => {
    if (s.phase !== 'memorize' || left > 5 || left === 0 || left === lastTick.current) return;
    lastTick.current = left;
    playHx('tick');
  }, [left, s.phase]);

  // ─── 階段轉換的聲音、清掉選取 ───
  const prevPhase = useRef(s.phase);
  useEffect(() => {
    const was = prevPhase.current;
    prevPhase.current = s.phase;
    if (was === s.phase) return;
     
    setPicks([]);
    if (s.phase === 'answer') playHx('flip', FLIP_DELAYS);
    if (s.phase === 'reveal') playHx('reveal');
    if (s.phase === 'memorize' && was === 'reveal') playHx('flip', FLIP_DELAYS);
    if (s.phase === 'over') {
      playHx('over');
      if (s.config.mode === 'daily') {
        const sum = totals(s.history);
        saveDaily({ date: s.config.seed.replace(/^daily:/, ''), score: s.score, found: sum.found, answers: sum.answers });
      }
    }
  }, [s.phase, s.config, s.history, s.score]);

  // ─── 送出 ───
  const [fx, setFx] = useState<{ key: number; ok: boolean; cells: number[]; line?: number } | null>(null);
  const send = useCallback((cells: number[]) => {
    if (s.phase !== 'answer' || cells.length !== 3) return;
    const next = submit(s, cells);
    dispatch({ type: 'submit', cells });
    setPicks([]);
    const ok = next.last?.ok === true;
    setFx((f) => ({ key: (f?.key ?? 0) + 1, ok, cells, line: ok ? lineOf(cells) : undefined }));
    playHx(ok ? 'correct' : 'wrong');
    if (ok && next.phase === 'reveal') playAllFound();
  }, [s]);

  const tap = useCallback((i: number) => {
    if (s.phase !== 'answer') return;
    playHx('tap');
    setPicks((p) => (p.includes(i) ? p.filter((x) => x !== i) : p.length >= 3 ? p : [...p, i]));
  }, [s.phase]);

  // 電腦版：打字母選格、Enter 送出、Backspace／Esc 清掉
  useEffect(() => {
    if (helpOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || (e.target as HTMLElement)?.closest?.('input,textarea')) return;
      if (s.phase === 'memorize' && e.key === 'Enter') { dispatch({ type: 'flip' }); return; }
      if (s.phase !== 'answer') return;
      const i = LETTERS.indexOf(e.key.toUpperCase());
      if (e.key.length === 1 && i >= 0) { tap(i); return; }
      if (e.key === 'Enter') send(picks);
      if (e.key === 'Backspace' || e.key === 'Escape') setPicks([]);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [s.phase, picks, tap, send, helpOpen]);

  // ─── 離開前確認（玩到一半）───
  const started = s.index > 0 || s.phase !== 'memorize';
  const leave = useLeaveGuard({ live: s.phase !== 'over', inProgress: started && s.phase !== 'over' });

  // ─── 畫面 ───
  const flipped = s.phase === 'answer';
  const lines: BoardLine[] = useMemo(() => {
    if (s.phase === 'reveal' || s.phase === 'over') {
      return s.round.answers.map((l) => ({ line: l, kind: s.found.includes(l) ? 'found' : 'missed' }));
    }
    if (s.phase !== 'answer') return [];
    if (rule.markFound) return s.found.map((l) => ({ line: l, kind: 'found' }));
    return fx?.ok && fx.line !== undefined ? [{ line: fx.line, kind: 'flash', id: `flash:${fx.key}` }] : [];
  }, [s.phase, s.round.answers, s.found, rule.markFound, fx]);

  const message = s.phase !== 'answer' || !fx || !s.last ? null
    : s.last.ok ? t.correct
      : s.last.miss === 'notLine' ? t.notLine : s.last.miss === 'wrongSum' ? fill(t.wrongSum, { n: s.round.target }) : t.repeat;

  const total = s.config.rounds;
  const roundLabel = total ? fill(t.roundOf, { i: s.index + 1, n: total }) : String(s.index + 1);
  const modeName = s.config.mode === 'daily' ? t.daily : s.config.mode === 'show' ? t.show : `${t.practice}・${t.levels[s.config.level].name}`;
  const sum = totals(s.history);
  const over = s.phase === 'over';

  const share = useHxShare({ isOpen: over && !resultClosed, state: s, modeName });
  const again = () => { setResultClosed(false); setFx(null); dispatch({ type: 'restart', config: makeConfig() }); };

  const barPct = !current ? 100 : s.phase === 'memorize' ? (deadline.at - now) / (rule.memorize * 10)
    : s.phase === 'answer' ? (deadline.at - now) / (IDLE_SECONDS * 10) : 0;

  const status = (
    <div className="flex flex-col gap-2.5">
      <div className="grid grid-cols-[1fr_1fr_1.25fr] gap-2">
        <Chip label={t.round} value={roundLabel} />
        <Chip label={t.score} value={String(s.score)} />
        <div className="hx-tile flex flex-col items-center justify-center px-2 py-1.5" aria-live="polite">
          <span className="text-[0.7rem] font-bold opacity-75">{s.phase === 'memorize' ? t.memorize : t.target}</span>
          <span className="text-3xl font-black tabular-nums leading-none text-[#2a5b8a] lg:text-4xl">
            {s.phase === 'memorize' ? `0:${String(left).padStart(2, '0')}` : s.round.target}
          </span>
        </div>
      </div>
      {running && (
        <div className="h-1.5 overflow-hidden rounded-full bg-[#22283b]/10" aria-hidden="true">
          <div className="h-full rounded-full bg-[#2a5b8a] transition-[width] duration-200 ease-linear" style={{ width: `${Math.max(0, Math.min(100, barPct))}%` }} />
        </div>
      )}
      <p className="min-h-10 text-center text-sm font-bold leading-snug" role="status">
        {s.phase === 'memorize' && t.memorizeHint}
        {s.phase === 'answer' && (message
          ? <span key={fx?.key} className={fx?.ok ? 'text-[#2a5b8a]' : ''}>{message}</span>
          : <>{t.pickHint}{left <= 30 && <span className="block text-xs opacity-70">{fill(t.idle, { s: left })}</span>}</>)}
        {(s.phase === 'reveal' || over) && <>{fill(t.revealTitle, { n: s.round.answers.length })}・{fill(t.foundOf, { k: s.found.length, n: s.round.answers.length })}</>}
      </p>
    </div>
  );

  const controls = (
    <div className="flex flex-col gap-2.5">
      {s.phase === 'memorize' && <button type="button" className={BTN_PRIMARY} onClick={() => dispatch({ type: 'flip' })}>{t.ready}</button>}
      {s.phase === 'answer' && (
        <>
          <div className="grid grid-cols-2 gap-2.5">
            <button type="button" className={BTN} disabled={!picks.length} onClick={() => { setPicks([]); playHx('clear'); }}>{t.clear}</button>
            <button type="button" className={BTN_PRIMARY} disabled={picks.length !== 3} onClick={() => send(picks)}>{t.submit}</button>
          </div>
          <button type="button" className={BTN} onClick={() => dispatch({ type: 'end' })}>{t.done}</button>
        </>
      )}
      {s.phase === 'reveal' && (
        <button type="button" className={BTN_PRIMARY} onClick={() => { setFx(null); dispatch({ type: 'next' }); }}>
          {total && s.index + 1 >= total ? t.finish : t.next}
        </button>
      )}
      {over && (
        <div className="grid grid-cols-2 gap-2.5">
          <button type="button" className={BTN} onClick={() => setResultClosed(false)}>{t.viewResult}</button>
          <button type="button" className={BTN_PRIMARY} onClick={again}>{t.again}</button>
        </div>
      )}
    </div>
  );

  const sound = (
    <button type="button" onClick={() => setPrefs({ sfx: !prefs.sfx })} aria-pressed={prefs.sfx} aria-label={g.sound.button} className={BTN_ROUND}>
      {prefs.sfx ? <LuVolume2 aria-hidden="true" /> : <LuVolumeX aria-hidden="true" />}
    </button>
  );
  const home = () => leave.request(onMenu);

  return (
    <HxFrame className="items-center px-4 pb-4 pt-3 lg:flex-row lg:items-center lg:justify-center lg:gap-12 lg:py-10 short:flex-row short:items-center short:justify-center short:gap-6 short:py-3">
      <div className="grid w-full max-w-[520px] grid-cols-[1fr_auto_1fr] items-center gap-2 lg:hidden short:hidden">
        <button type="button" onClick={home} aria-label={t.menu} className={`${BTN_ROUND} justify-self-start`}><LuHouse aria-hidden="true" /></button>
        <h1 className="truncate text-xl font-black">{t.title}</h1>
        <div className="flex gap-1.5 justify-self-end">
          {sound}
          <button type="button" onClick={() => setHelpOpen(true)} aria-label={t.howTo} className={BTN_ROUND}><LuCircleHelp aria-hidden="true" /></button>
        </div>
      </div>
      <div className="mt-3 w-full max-w-[520px] lg:hidden short:hidden">{status}</div>

      <div className="flex w-full max-w-[min(520px,calc((100svh-20rem)*1.08))] flex-1 items-center py-2 lg:w-[min(600px,calc((100svh-5rem)*1.08))] lg:max-w-none lg:flex-none lg:py-0 short:w-[calc((100svh-1.5rem)*1.08)] short:max-w-none short:flex-none short:py-0">
        <HexBoard board={s.round.board} face={flipped ? 'letters' : 'numbers'} selected={picks} lines={lines}
          shake={fx && !fx.ok ? { key: fx.key, cells: fx.cells } : undefined}
          pop={fx?.ok ? { key: fx.key, cells: fx.cells } : undefined}
          onTap={tap} label={`${t.title} ${roundLabel}`} />
      </div>

      <div className="w-full max-w-[520px] lg:hidden short:hidden">{controls}</div>

      <aside className="hidden w-[320px] shrink-0 flex-col gap-4 lg:flex short:flex short:w-[290px] short:gap-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-4xl font-black leading-none short:text-2xl">{t.title}</h1>
            <p className="mt-1.5 text-sm font-bold opacity-75">{modeName}</p>
          </div>
          {sound}
        </div>
        {status}
        {controls}
        <div className="grid grid-cols-2 gap-2.5">
          <button type="button" onClick={() => setHelpOpen(true)} className={BTN}><LuCircleHelp aria-hidden="true" className="shrink-0" />{t.howTo}</button>
          <button type="button" onClick={home} className={BTN}><LuHouse aria-hidden="true" className="shrink-0" />{t.menu}</button>
        </div>
      </aside>

      <HowToPlay open={helpOpen} onClose={() => setHelpOpen(false)} />
      <LeaveModal leave={leave} />
      <ShareResultModal isOpen={over && !resultClosed} onClose={() => setResultClosed(true)} title={fill(t.resultTitle, { score: s.score })}
        card={share} onRestart={again} restartLabel={t.again} classes={HX_SHARE} frameClassName="rounded-[14px]"
        srText={`${modeName} ${fill(t.resultTitle, { score: s.score })} ${t.found} ${sum.found} / ${sum.answers} ${t.wrong} ${sum.wrong}`} />
    </HxFrame>
  );
}

function Chip({ label, value }: { label: string; value: string }) {
  return (
    <div className="hx-tile flex flex-col items-center justify-center px-2 py-1.5">
      <span className="text-[0.7rem] font-bold opacity-75">{label}</span>
      <span className="text-xl font-black tabular-nums leading-tight">{value}</span>
    </div>
  );
}
