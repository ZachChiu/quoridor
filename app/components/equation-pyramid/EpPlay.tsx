'use client';
import { useCallback, useEffect, useMemo, useReducer, useRef, useState, type ReactNode } from 'react';
import { LuCircleHelp, LuCpu, LuHouse, LuVolume2, LuVolumeX } from 'react-icons/lu';
import { ShareResultModal } from '@/components/ShareResultModal';
import { useLeaveGuard } from '@/hook/useLeaveGuard';
import { useSound } from '@/hook/useSound';
import { useGameText } from '@/i18n/LocaleProvider';
import { fill, useTextTable } from '@/i18n/gameText';
import {
  LETTERS, OP_GLYPH, cellsOf, cpuAct, cpuPlan, endRound, expression, nextRound, startGame, submit, totals,
  type Config, type CpuMove, type GameState,
} from '@/games/equation-pyramid/engine';
import { TEXT, type EpText } from '@/games/equation-pyramid/text';
import EpFrame from './EpFrame';
import HowToPlay from './HowToPlay';
import LeaveModal from './LeaveModal';
import PyramidBoard, { type BoardFx } from './PyramidBoard';
import { clock, saveDaily } from './records';
import { playEp } from './sounds';
import { BTN, BTN_PRIMARY, BTN_ROUND, EP_SHARE } from './styles';
import { useEpShare } from './useEpShare';

type Action =
  | { type: 'submit'; cells: number[]; ms: number }
  | { type: 'cpu'; move: CpuMove; ms: number }
  | { type: 'end'; ms: number }
  | { type: 'next' }
  | { type: 'restart'; config: Config };

function reducer(s: GameState, a: Action): GameState {
  switch (a.type) {
    case 'submit': return submit(s, 'me', a.cells, a.ms);
    case 'cpu': return cpuAct(s, a.move, a.ms);
    case 'end': return endRound(s, a.ms);
    case 'next': return nextRound(s);
    case 'restart': return startGame(a.config);
  }
}

/** 一回合開始後，目標數晚這麼久才出來（節目：「目標數比格子晚一點點出現」）；計時從目標數出來才開始 */
const INTRO_MS = 1300;
const TICK_MS = 100;

/**
 * 一局（節目規則、每日一題、大金字塔共用）。規則全在 games/equation-pyramid/engine.ts，這裡只管計時、點選、電腦按鈴、聲音與畫面。
 *
 * 一回合：盤面出來 → 1.3 秒後目標數跳出來、開始計時 → 依順序點三格送出（電腦版也可以直接打字母、Enter 送出、Backspace 退一格）
 * → 節目規則：3 分鐘到或全部被找到；每日一題、大金字塔：找齊或按「看答案」→ 看答案（一組一組列出來，點一組盤上就標出那三格）→ 下一回合。
 * 計時是累加「真的過了多久」（每 100ms 補上實際經過的時間），說明或離開確認開著時停住。
 *
 * 畫面上不寫「你」「對手」：自己那塊分數外面一圈深釉框（讀屏另外念），電腦那塊是一顆晶片圖示＋「電腦」、褪釉的橄欖色。
 * 版面：手機是上排（回選單、名字、聲音、說明）＋狀態＋盤面＋算式＋按鈕；桌機（lg）與橫放的手機（short）盤面在左、右邊一欄放其他 ——
 * 桌機的金字塔吃滿左半邊的高度（約 760px 寬），右欄字放大，不讓東西縮在大片底色上。
 */
export default function EpPlay({ makeConfig, onMenu }: {
  /** 這一局的設定；再玩一次也照它再做一份（每日一題是同一盤，其他換一個種子） */
  makeConfig: () => Config;
  onMenu: () => void;
}) {
  const t = useTextTable<EpText>(TEXT);
  const g = useGameText();
  const { prefs, setPrefs } = useSound();
  const [s, dispatch] = useReducer(reducer, makeConfig, (make) => startGame(make()));
  const { config } = s;
  const timed = config.seconds > 0;
  const vsCpu = config.cpu !== null;
  const [picks, setPicks] = useState<number[]>([]);
  const [helpOpen, setHelpOpen] = useState(false);
  const [resultClosed, setResultClosed] = useState(false);
  const [peek, setPeek] = useState<string | null>(null);

  // ─── 計時 ───
  const stamp = `${s.index}:${s.config.seed}`;
  const [clockState, setClockState] = useState({ stamp, ms: 0 });
  const elapsed = clockState.stamp === stamp ? clockState.ms : 0;
  const playing = s.phase === 'play';
  // 離開前確認：剛進來就走不用問；答過、過了第一回合、或看了 5 秒以上才算玩到一半
  const started = s.index > 0 || s.claims.length > 0 || s.wrong.me > 0 || elapsed > 5000;
  const leave = useLeaveGuard({ live: s.phase !== 'over', inProgress: started && s.phase !== 'over' });
  const paused = helpOpen || leave.open;
  useEffect(() => {
    if (!playing || paused) return;
    let last = performance.now();
    const id = window.setInterval(() => {
      const now = performance.now();
      const d = now - last;
      last = now;
      setClockState((c) => (c.stamp === stamp ? { stamp, ms: c.ms + d } : { stamp, ms: d }));
    }, TICK_MS);
    return () => window.clearInterval(id);
  }, [playing, paused, stamp]);
  const targetShown = !playing || elapsed >= INTRO_MS;
  /** 這回合從目標數出來到現在 */
  const roundMs = Math.max(0, elapsed - INTRO_MS);
  const limitMs = config.seconds * 1000;
  const leftMs = timed ? Math.max(0, limitMs - roundMs) : 0;

  // 時間到
  useEffect(() => {
    if (playing && timed && roundMs >= limitMs) dispatch({ type: 'end', ms: limitMs });
  }, [playing, timed, roundMs, limitMs]);

  // 目標數出來那一下、最後 10 秒每秒一聲
  const shownRef = useRef('');
  useEffect(() => {
    if (!playing || !targetShown || shownRef.current === stamp) return;
    shownRef.current = stamp;
    playEp('target');
  }, [playing, targetShown, stamp]);
  const lastTick = useRef(-1);
  const leftSec = Math.ceil(leftMs / 1000);
  useEffect(() => {
    if (!playing || !timed || !targetShown || leftSec > 10 || leftSec <= 0 || leftSec === lastTick.current) return;
    lastTick.current = leftSec;
    playEp('tick');
  }, [leftSec, playing, timed, targetShown]);

  // ─── 送出的效果（盤上跳一下／抖一下、提示列寫一句）───
  const [fx, setFx] = useState<(BoardFx & { by: 'me' | 'cpu'; ok: boolean; text: string }) | null>(null);
  const message = (next: GameState, by: 'me' | 'cpu', key: string) => {
    const last = next.last;
    if (!last) return '';
    if (by === 'cpu') return fill(last.ok ? t.cpuGot : t.cpuMiss, { key });
    if (last.ok) return t.correct;
    return last.miss === 'repeat' ? t.repeat : fill(t.wrongValue, { n: s.round.target });
  };

  const send = useCallback((cells: number[]) => {
    if (!playing || !targetShown || cells.length !== 3) return;
    const next = submit(s, 'me', cells, roundMs);
    dispatch({ type: 'submit', cells, ms: roundMs });
    setPicks([]);
    const ok = next.last?.ok === true;
    setFx((f) => ({ key: (f?.key ?? 0) + 1, cells, tone: ok ? 'me' : 'wrong', by: 'me', ok, text: message(next, 'me', next.last?.key ?? '') }));
    playEp(ok ? 'correct' : 'wrong');
    if (ok && next.phase === 'reveal') playEp('allFound');
    // eslint-disable-next-line react-hooks/exhaustive-deps -- message 只讀 t 與目標數
  }, [s, playing, targetShown, roundMs]);

  // ─── 電腦按鈴 ───
  const plan = useMemo(() => (config.cpu ? cpuPlan(s, config.cpu) : []),
    // 一回合算一次（s 每送出一次就換，但打算只看題目）
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [config.cpu, config.seed, s.index]);
  const done = useRef({ stamp: '', n: 0 });
  useEffect(() => {
    if (!playing || !targetShown || !plan.length) return;
    if (done.current.stamp !== stamp) done.current = { stamp, n: 0 };
    const move = plan[done.current.n];
    if (!move || move.at > roundMs) return;
    done.current.n++;
    const next = cpuAct(s, move, roundMs);
    if (next === s) return;
    dispatch({ type: 'cpu', move, ms: roundMs });
    setFx((f) => ({ key: (f?.key ?? 0) + 1, cells: cellsOf(move.key), tone: move.ok ? 'cpu' : 'wrong', by: 'cpu', ok: move.ok, text: message(next, 'cpu', move.key) }));
    playEp(move.ok ? 'cpu' : 'cpuWrong');
    // 電腦答走的那組正好是選到一半的那幾格：不動玩家的選取（它只是說出來，不是搶走格子）
    // eslint-disable-next-line react-hooks/exhaustive-deps -- message 只讀 t 與目標數
  }, [roundMs, playing, targetShown, plan, stamp, s]);

  // ─── 換階段：清掉選取、聲音、存每日紀錄 ───
  const prevPhase = useRef(s.phase);
  useEffect(() => {
    const was = prevPhase.current;
    prevPhase.current = s.phase;
    if (was === s.phase) return;
     
    setPicks([]);
    setPeek(null);
    if (s.phase === 'reveal') playEp('reveal');
    if (s.phase === 'over') {
      playEp('over');
      if (s.config.mode === 'daily') {
        const sum = totals(s.history);
        saveDaily({ date: s.config.seed.replace(/^daily:/, ''), found: sum.me, answers: sum.answers, wrong: sum.wrongMe, ms: sum.ms });
      }
    }
  }, [s.phase, s.config, s.history]);

  // ─── 點選 ───
  const tap = useCallback((i: number) => {
    if (!playing) return;
    setPicks((p) => {
      if (p.includes(i)) { playEp('untap'); return p.filter((x) => x !== i); }
      if (p.length >= 3) return p;
      playEp('tap');
      return [...p, i];
    });
  }, [playing]);

  // 電腦版：打字母選格、Enter 送出、Backspace 退一格、Esc 清掉
  useEffect(() => {
    if (paused) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.metaKey || e.ctrlKey || e.altKey || (e.target as HTMLElement)?.closest?.('input,textarea')) return;
      if (!playing) {
        if (e.key === 'Enter' && s.phase === 'reveal') { setFx(null); dispatch({ type: 'next' }); }
        return;
      }
      const i = LETTERS.indexOf(e.key.toUpperCase());
      if (e.key.length === 1 && i >= 0 && i < s.round.blocks.length) { tap(i); return; }
      if (e.key === 'Enter') { e.preventDefault(); send(picks); }
      if (e.key === 'Backspace') setPicks((p) => p.slice(0, -1));
      if (e.key === 'Escape') setPicks([]);
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [playing, s.phase, s.round.blocks.length, picks, tap, send, paused]);

  // ─── 畫面 ───
  const over = s.phase === 'over';
  const reveal = s.phase === 'reveal' || over;
  const sum = totals(s.history);
  const modeName = config.mode === 'daily' ? t.daily : config.mode === 'big' ? t.big
    : `${t.show}・${t.cpuLevels[config.cpu ?? 'solo'].name}`;
  const share = useEpShare({ isOpen: over && !resultClosed, state: s, modeName });
  const again = () => { setResultClosed(false); setFx(null); dispatch({ type: 'restart', config: makeConfig() }); };
  const home = () => leave.request(onMenu);

  const foundMe = s.claims.filter((c) => c.by === 'me').length;
  const answers = s.round.answers.length;
  const roundLabel = config.rounds > 1 ? fill(t.roundOf, { i: s.index + 1, n: config.rounds }) : null;
  const shownTime = timed ? clock(reveal ? 0 : leftMs + 999) : clock(reveal ? (s.history.at(-1)?.ms ?? 0) : roundMs);
  const barPct = timed && playing ? (leftMs / limitMs) * 100 : 0;

  const target = (
    <div className="flex min-w-0 flex-col items-center justify-center rounded-[12px_12px_6px_6px] bg-[#195153] px-2 py-1.5 text-[#e8ebe2] lg:py-3" aria-live="polite">
      <span className="text-[0.7rem] font-bold opacity-80 lg:text-sm">{t.target}</span>
      <span key={targetShown ? stamp : 'wait'} className={`text-3xl font-black tabular-nums leading-none lg:text-6xl ${targetShown ? 'ep-target' : 'opacity-40'}`}>
        {targetShown ? s.round.target : '?'}
      </span>
    </div>
  );

  const status = (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-[1fr_1fr_1.2fr] gap-2 lg:gap-3">
        {config.mode === 'show' ? (
          <>
            <Plaque me label={<>{t.score}<span className="sr-only">（{t.me}）</span></>} value={<>{s.score.me}<span className="sr-only"> {t.score}</span></>} />
            {vsCpu
              ? <Plaque cpu label={<><LuCpu aria-hidden="true" />{t.cpu}</>} value={s.score.cpu} />
              : <Plaque label={t.round} value={roundLabel} />}
          </>
        ) : (
          <>
            <Plaque me label={t.found} value={<>{foundMe}<span className="text-base opacity-60 lg:text-2xl">/{answers}</span></>} />
            <Plaque label={t.wrong} value={s.wrong.me} />
          </>
        )}
        {target}
      </div>
      <div className="flex items-center justify-between gap-2 text-xs font-black tabular-nums opacity-80 lg:text-base">
        {/* 桌機右欄的名字底下已經寫了模式，這裡只在手機寫（對電腦的節目規則寫回合，兩邊都要） */}
        <span className={config.mode === 'show' && vsCpu ? '' : 'lg:invisible short:invisible'}>{config.mode === 'show' && vsCpu ? `${t.round} ${roundLabel}` : modeName}</span>
        <span>{t.time} {shownTime}</span>
      </div>
      {timed && (
        <div className="h-1.5 overflow-hidden rounded-full bg-[#071a19]/10 lg:h-2" aria-hidden="true">
          <div className="h-full rounded-full bg-[#195153] transition-[width] duration-100 ease-linear" style={{ width: `${Math.max(0, Math.min(100, playing ? barPct : 0))}%` }} />
        </div>
      )}
    </div>
  );

  // 算式：三個空格，第一格的符號劃掉（「第一格的符號不算」直接看得到），最後寫「= 目標數」
  const blocks = s.round.blocks;
  const equation = (
    <div className="flex flex-col items-center gap-1">
      <div className="flex items-center justify-center gap-1.5 text-xl font-black tabular-nums lg:gap-2.5 lg:text-3xl" aria-live="polite">
        {[0, 1, 2].map((k) => {
          const i = picks[k];
          const b = i === undefined ? null : blocks[i];
          return (
            <span key={k} className={`grid h-11 min-w-[3.4rem] place-items-center rounded-[10px_10px_5px_5px] px-1.5 lg:h-16 lg:min-w-[5.2rem] ${b ? 'bg-[#195153] text-[#e8ebe2]' : 'bg-[#071a19]/[0.07] text-[#071a19]/35'}`}>
              {b ? (
                <span className="flex items-baseline gap-0.5">
                  <span className={k === 0 ? 'text-[0.7em] line-through decoration-2 opacity-45' : 'text-[#a3d0c7]'}>{OP_GLYPH[b.op]}</span>{b.n}
                  <span className="sr-only">{LETTERS[i]}</span>
                </span>
              ) : (k + 1)}
            </span>
          );
        })}
        <span className="px-1">=</span>
        <span className="text-[#195153]">{targetShown ? s.round.target : '?'}</span>
      </div>
      <p className="text-[0.7rem] font-bold opacity-65 lg:text-sm">{t.firstSign}</p>
    </div>
  );

  const note = (
    <p className="min-h-6 text-center text-sm font-black leading-snug lg:min-h-8 lg:text-lg" role="status">
      {playing && fx ? (
        <span key={fx.key} className={`ep-in inline-block ${fx.by === 'cpu' ? 'text-[#676549]' : fx.ok ? 'text-[#195153]' : ''}`}>{fx.text}</span>
      ) : playing ? (
        <span className="opacity-70">{t.pickHint}</span>
      ) : (
        <span>{s.history.at(-1) && (timed && roundMs >= limitMs && s.claims.length < answers ? `${t.timeUp}・` : s.claims.length === answers ? `${t.allFound}・` : '')}{fill(t.revealTitle, { n: answers })}</span>
      )}
    </p>
  );

  // 這回合答對的組合（作答中），或全部答案（看答案）：自己答的深釉、電腦答的橄欖、沒人找到的虛線框
  const list = reveal ? s.round.answers : s.claims.map((c) => c.key);
  const claims = (
    <div className="flex flex-col gap-1.5">
      {!reveal && config.mode !== 'show' && <p className="text-center text-xs font-bold opacity-70 lg:text-left lg:text-sm">{fill(t.left, { n: answers - s.claims.length })}</p>}
      {reveal && <p className="text-center text-xs font-bold opacity-70 lg:text-left lg:text-sm">{t.revealHint}</p>}
      <div className="flex flex-wrap justify-center gap-1.5 lg:justify-start">
        {list.map((key) => {
          const by = s.claims.find((c) => c.key === key)?.by;
          const on = peek === key;
          const tone = by === 'me' ? 'bg-[#195153] text-[#e8ebe2]' : by === 'cpu' ? 'bg-[#676549] text-[#e8ebe2]' : 'border-2 border-dashed border-[#071a19]/40 bg-transparent text-[#071a19]';
          const body = (
            <>
              <span className="tracking-[0.12em]">{key}</span>
              {by === 'cpu' && <LuCpu aria-label={t.cpu} className="text-[0.9em]" />}
              {reveal && <span className="font-bold opacity-80">{expression(blocks, cellsOf(key))}</span>}
              {reveal && !by && <span className="sr-only">{t.missed}</span>}
            </>
          );
          return reveal ? (
            <button key={key} type="button" onClick={() => setPeek(on ? null : key)} aria-pressed={on}
              className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-sm font-black tabular-nums lg:text-base ${tone} ${on ? 'ring-2 ring-[#071a19] ring-offset-2 ring-offset-[#e8ebe2]' : ''}`}>
              {body}
            </button>
          ) : (
            <span key={key} className={`ep-in flex items-center gap-1 rounded-full px-3 py-1 text-sm font-black lg:text-base ${tone}`}>{body}</span>
          );
        })}
      </div>
    </div>
  );

  const controls = (
    <div className="flex flex-col gap-2.5">
      {playing && (
        <>
          <div className="grid grid-cols-[1fr_2fr] gap-2.5">
            <button type="button" className={BTN} disabled={!picks.length} onClick={() => { setPicks([]); playEp('clear'); }}>{t.clear}</button>
            <button type="button" className={BTN_PRIMARY} disabled={picks.length !== 3 || !targetShown} onClick={() => send(picks)}>{t.submit}</button>
          </div>
          {!timed && <button type="button" className={BTN} onClick={() => dispatch({ type: 'end', ms: roundMs })}>{t.giveUp}</button>}
          {timed && !vsCpu && <button type="button" className={BTN} onClick={() => dispatch({ type: 'end', ms: roundMs })}>{t.endRound}</button>}
        </>
      )}
      {s.phase === 'reveal' && (
        <button type="button" className={BTN_PRIMARY} onClick={() => { setFx(null); dispatch({ type: 'next' }); }}>
          {s.index + 1 >= config.rounds ? t.finish : t.next}
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

  const shown = reveal && peek ? cellsOf(peek) : picks;
  const resultTitle = config.mode === 'show'
    ? (vsCpu ? `${s.score.me} : ${s.score.cpu}` : `${s.score.me}`)
    : fill(t.resultFound, { k: sum.me, n: sum.answers });

  return (
    <EpFrame className="items-center px-3 pb-4 pt-3 lg:flex-row lg:items-center lg:justify-center lg:gap-[clamp(2.5rem,4vw,4.5rem)] lg:p-8 short:flex-row short:items-center short:justify-center short:gap-5 short:py-3">
      <div className="grid w-full max-w-[560px] grid-cols-[1fr_auto_1fr] items-center gap-2 lg:hidden short:hidden">
        <button type="button" onClick={home} aria-label={t.menu} className={`${BTN_ROUND} justify-self-start`}><LuHouse aria-hidden="true" /></button>
        <h1 className="truncate text-lg font-black">{t.title}</h1>
        <div className="flex gap-1.5 justify-self-end">
          {sound}
          <button type="button" onClick={() => setHelpOpen(true)} aria-label={t.howTo} className={BTN_ROUND}><LuCircleHelp aria-hidden="true" /></button>
        </div>
      </div>
      <div className="mt-3 w-full max-w-[560px] lg:hidden short:hidden">{status}</div>

      {/* 盤面：直的手機磚高寬一樣（--ep-ratio 1，整盤差不多是正方形），照剩下的高度算寬；
          桌機與橫放的手機磚是 0.8（整盤寬高比約 1.23，10 格、15 格都是），桌機吃滿左半邊 */}
      <div className="flex w-full max-w-[min(560px,calc(100svh-25rem))] flex-1 items-center py-2 [--ep-ratio:1] lg:w-[min(800px,calc((100svh-6rem)*1.22),calc(100vw-32rem))] lg:max-w-none lg:flex-none lg:py-0 lg:[--ep-ratio:0.8] short:w-[calc((100svh-1.5rem)*1.22)] short:max-w-none short:flex-none short:py-0 short:[--ep-ratio:0.8]">
        <PyramidBoard blocks={blocks} selected={shown} fx={playing ? fx ?? undefined : undefined}
          onTap={playing ? tap : undefined} label={`${t.title} ${roundLabel ?? ''}`} />
      </div>

      <div className="flex w-full max-w-[560px] flex-col gap-3 lg:hidden short:hidden">
        {playing ? equation : null}
        {note}
        {claims}
        {controls}
      </div>

      <aside className="hidden w-[min(440px,34vw)] shrink-0 flex-col gap-4 lg:flex short:flex short:w-[300px] short:gap-2.5">
        <div className="flex items-start justify-between gap-3">
          <div>
            <h1 className="text-4xl font-black leading-none text-[#195153] short:text-2xl">{t.title}</h1>
            <p className="mt-2 text-base font-bold opacity-75 short:text-xs">{modeName}</p>
          </div>
          {sound}
        </div>
        {status}
        {playing ? equation : null}
        {note}
        {controls}
        {claims}
        <div className="mt-1 grid grid-cols-2 gap-2.5">
          <button type="button" onClick={() => setHelpOpen(true)} className={BTN}><LuCircleHelp aria-hidden="true" className="shrink-0" />{t.howTo}</button>
          <button type="button" onClick={home} className={BTN}><LuHouse aria-hidden="true" className="shrink-0" />{t.menu}</button>
        </div>
      </aside>

      <HowToPlay open={helpOpen} onClose={() => setHelpOpen(false)} />
      <LeaveModal leave={leave} />
      <ShareResultModal isOpen={over && !resultClosed} onClose={() => setResultClosed(true)} title={resultTitle}
        card={share} onRestart={again} restartLabel={t.again} classes={EP_SHARE} frameClassName="rounded-[14px]"
        srText={`${modeName} ${resultTitle} ${t.wrong} ${sum.wrongMe}`} />
    </EpFrame>
  );
}

/** 一塊分數牌。自己那塊外面一圈深釉框（不寫「你」，讀屏另外念）；電腦那塊是褪釉的橄欖色 */
function Plaque({ label, value, me, cpu }: { label: ReactNode; value: ReactNode; me?: boolean; cpu?: boolean }) {
  return (
    <div className={`flex min-w-0 flex-col items-center justify-center rounded-[12px_12px_6px_6px] px-2 py-1.5 lg:py-3 ${cpu ? 'bg-[#676549] text-[#e8ebe2]' : 'bg-[#071a19]/[0.07]'} ${me ? 'shadow-[0_0_0_2px_#e8ebe2,0_0_0_4px_#195153]' : ''}`}>
      <span className="flex min-h-4 items-center gap-1 text-[0.7rem] font-bold opacity-80 lg:min-h-5 lg:text-sm">{label}</span>
      <span className="text-2xl font-black tabular-nums leading-tight lg:text-4xl">{value}</span>
    </div>
  );
}
