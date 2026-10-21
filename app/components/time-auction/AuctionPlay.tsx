'use client';
import { useEffect, useEffectEvent, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { GiExitDoor, GiPodium, GiRuleBook, GiTrophyCup } from 'react-icons/gi';
import { LuCircleHelp, LuHouse, LuSettings2 } from 'react-icons/lu';
import Modal from '@/components/Modal';
import { useMessages } from '@/i18n/LocaleProvider';
import { fill, useTextTable } from '@/i18n/gameText';
import {
  MODES, TENTH_MS, bidFromHold, createAuction, formatTenths, isOver, maxRemaining, playRound, publicHistory,
  remaining, standings, viewFor, type Mode,
} from '@/games/time-auction/engine';
import { assignPersonas, decideBid, type Difficulty } from '@/games/time-auction/ai';
import { TEXT } from '@/games/time-auction/text';
import AuctionRules from './AuctionRules';
import { roundBtn } from './AuctionSetup';
import { KEY_BG, TAU_BAND, TAU_PANEL } from './theme';
import TauFrame from './TauFrame';

/**
 * ready：等你按下去開始這一回合（第一回合）
 * live：這一回合進行中 —— 倒數（count > 0）然後跑秒，直到最後一個人放手
 * result：這一回合結束，公布得標者與秒數；再按一次就是下一回合
 */
type Phase = 'ready' | 'live' | 'result';
/** 這一回合的起點（performance.now，按下去那一刻）與電腦開局就決定好的出價 */
type Live = { start: number; aiBids: number[] };

/**
 * 大螢幕的數字。每個字固定寬度，跑秒時才不會左右抖 ——
 * 字型子集不保證留著等寬數字（tnum）的 OpenType 功能，tabular-nums 不一定有效。
 * 字是 Didone 襯線（.tau-display），維多利亞時代拍賣傳單上的數字就是這個樣子。
 */
function BigTime({ text, dim = false }: { text: string; dim?: boolean }) {
  return (
    <span aria-hidden="true" className={`tau-display inline-flex font-bold leading-none ${dim ? 'text-[#35331c]/25' : ''}`}>
      {[...text].map((ch, i) => (
        <span key={i} className={`inline-block text-center ${/\d/.test(ch) ? 'w-[0.6em]' : 'w-[0.3em]'}`}>{ch}</span>
      ))}
    </span>
  );
}

/**
 * 時間拍賣的對局畫面（你＋3–5 個電腦）。
 *
 * 一回合的流程跟節目一樣：按住大按鈕（手機）或空白鍵（電腦）→ 倒數，倒數內放手＝放棄 →
 * 大螢幕跑秒，你放手的那一刻就是出價 → 大螢幕繼續跑，直到最後一個人放手才停 → 公布得標者與秒數。
 *
 * 電腦的出價在回合開始時就決定好（純函式、只看公開資訊），所以「最後一個人放手」的時間是已知的；
 * 你放手之後可以按「快轉」直接看結果（節目局一回合常常兩分鐘以上）。
 *
 * 計時一律用 performance.now 的絕對時間，畫面每一格只是把經過的時間畫出來：
 * 分頁切到背景時 requestAnimationFrame 會停，回來時直接跳到正確的位置。
 * 按住中切到背景（visibilitychange）、視窗失焦、pointercancel 都當作放手。
 */
export default function AuctionPlay({ mode, opponents, difficulty, seed, onHome, onSettings, onAgain }: {
  mode: Mode;
  opponents: number;
  difficulty: Difficulty;
  seed: number;
  onHome: () => void;
  onSettings: () => void;
  onAgain: () => void;
}) {
  const t = useTextTable(TEXT);
  const m = useMessages();
  const cfg = MODES[mode];
  const personas = useMemo(() => assignPersonas(opponents, seed), [opponents, seed]);
  const [game, setGame] = useState(() => createAuction(mode, opponents + 1));
  const [phase, setPhase] = useState<Phase>('ready');
  const [live, setLive] = useState<Live | null>(null);
  /** 你這回合的出價。還按著是 null —— 所以「按住中」＝ live 且 myBid 是 null */
  const [myBid, setMyBid] = useState<number | null>(null);
  /** 倒數還剩幾秒；0＝開始跑秒 */
  const [count, setCount] = useState(0);
  /** 大螢幕的秒數（0.1 秒） */
  const [clock, setClock] = useState(0);
  /** 這回合是時間用完、按鈕自己彈起來的 */
  const [popped, setPopped] = useState(false);
  const [helpOpen, setHelpOpen] = useState(false);
  const [leave, setLeave] = useState<null | 'home' | 'settings'>(null);
  const [endShown, setEndShown] = useState(false);
  const [endClosed, setEndClosed] = useState(false);
  /** 事件處理器用：還按著沒（擋重複放手）、按著的是哪一根手指。不參與畫面 */
  const holding = useRef(false);
  const pointer = useRef<number | null>(null);

  const over = isOver(game);
  const myLeft = remaining(game, 0);
  const last = game.history[game.history.length - 1];
  const pub = useMemo(() => publicHistory(game), [game]);
  const holdingNow = phase === 'live' && myBid === null;
  const endOpen = over && endShown && !endClosed;
  const modalOpen = helpOpen || leave !== null || endOpen;
  const canBegin = !over && phase !== 'live';
  const roundNo = phase === 'live' || (phase === 'ready' && !over) ? game.history.length + 1 : game.history.length;
  const name = (seat: number) => (seat === 0 ? t.you : fill(t.computer, { n: seat }));
  const levelName = [m.solo.level1, m.solo.level2, m.solo.level3][['easy', 'normal', 'hard'].indexOf(difficulty)];

  /** 開始一回合。pass＝直接放棄（等於按下去馬上放手） */
  const begin = (pass: boolean): boolean => {
    if (!canBegin || modalOpen) return false;
    const aiBids = personas.map((p, i) => decideBid(viewFor(game, i + 1), p, difficulty, seed));
    holding.current = !pass;
    setLive({ start: performance.now(), aiBids });
    setMyBid(pass ? 0 : null);
    setCount(Math.ceil(cfg.countdownMs / 1000));
    setClock(0);
    setPopped(false);
    setPhase('live');
    return true;
  };

  /** 放手：倒數內＝0，之後＝按住的秒數（無條件捨去到 0.1 秒、不超過剩餘時間） */
  const release = () => {
    if (!holding.current || !live) return;
    holding.current = false;
    pointer.current = null;
    setMyBid(bidFromHold(performance.now() - live.start, cfg.countdownMs, myLeft));
  };

  const finish = (bid: number, l: Live) => {
    const next = playRound(game, [bid, ...l.aiBids]);
    setGame(next);
    setClock(next.history[next.history.length - 1].top);
    setCount(0);
    setLive(null);
    setPhase('result');
  };

  // 每一格：畫倒數或跑秒；時間用完就彈起；你放手後跑到最後一個人放手就結算
  const onFrame = useEffectEvent((now: number): boolean => {
    if (phase !== 'live' || !live) return false;
    const ms = Math.max(0, now - live.start);
    if (ms < cfg.countdownMs) {
      setCount(Math.min(Math.ceil(cfg.countdownMs / 1000), Math.ceil((cfg.countdownMs - ms) / 1000)));
      return true;
    }
    setCount(0);
    const elapsed = Math.floor((ms - cfg.countdownMs) / TENTH_MS);
    if (holding.current) {
      if (elapsed >= myLeft) {
        // 剩餘時間用完，按鈕自動彈起（節目裡按鈕會震動）
        holding.current = false;
        pointer.current = null;
        setMyBid(myLeft);
        setPopped(true);
        setClock(myLeft);
        if (typeof navigator.vibrate === 'function') navigator.vibrate(200);
      } else {
        setClock(elapsed);
      }
      return true;
    }
    // 剛放手、狀態還沒更新：等下一格
    if (myBid === null) return true;
    const stopAt = Math.max(myBid, ...live.aiBids);
    if (elapsed >= stopAt) {
      finish(myBid, live);
      return false;
    }
    setClock(elapsed);
    return true;
  });

  useEffect(() => {
    if (phase !== 'live') return;
    let id = requestAnimationFrame(function loop(now) {
      if (onFrame(now)) id = requestAnimationFrame(loop);
    });
    return () => cancelAnimationFrame(id);
  }, [phase]);

  // 空白鍵＝大按鈕；切到背景、視窗失焦、手指在別處離開＝放手
  const onKey = useEffectEvent((e: KeyboardEvent) => {
    if (e.code !== 'Space' && e.key !== ' ') return;
    // 放手永遠算數 —— 按著空白鍵時跳出彈窗（例如滑鼠點了回首頁），放開也不能被擋下來
    if (e.type === 'keyup') {
      if (holding.current) { e.preventDefault(); release(); }
      return;
    }
    if (modalOpen) return;
    const el = e.target instanceof HTMLElement ? e.target : null;
    if (el?.closest('input, textarea, select, [contenteditable="true"]')) return;
    // 不讓空白鍵捲動頁面，也不讓它「按下」目前有焦點的按鈕
    e.preventDefault();
    if (!e.repeat) begin(false);
  });
  const onAway = useEffectEvent(() => release());
  const onPointerEnd = useEffectEvent((e: PointerEvent) => {
    if (pointer.current === e.pointerId) release();
  });
  useEffect(() => {
    const key = (e: KeyboardEvent) => onKey(e);
    const away = () => onAway();
    const hidden = () => { if (document.hidden) onAway(); };
    // 正常情況由按鈕的 pointer capture 收到放手；這裡是保險（capture 失敗的舊瀏覽器）
    const up = (e: PointerEvent) => onPointerEnd(e);
    window.addEventListener('keydown', key);
    window.addEventListener('keyup', key);
    window.addEventListener('blur', away);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
    document.addEventListener('visibilitychange', hidden);
    return () => {
      window.removeEventListener('keydown', key);
      window.removeEventListener('keyup', key);
      window.removeEventListener('blur', away);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
      document.removeEventListener('visibilitychange', hidden);
    };
  }, []);

  // 最後一回合的結果先看一眼，再跳出排名
  useEffect(() => {
    if (!over) return;
    const id = window.setTimeout(() => setEndShown(true), 900);
    return () => window.clearTimeout(id);
  }, [over]);

  const onDown = (e: ReactPointerEvent<HTMLButtonElement>) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    if (!begin(false)) return;
    pointer.current = e.pointerId;
    try {
      // 手指滑出按鈕不算放手
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // 不支援就靠 window 的 pointerup 補
    }
  };
  const onUp = (e: ReactPointerEvent<HTMLButtonElement>) => {
    if (pointer.current === e.pointerId) release();
  };

  const inProgress = !over && (game.history.length > 0 || phase === 'live');
  const askLeave = (to: 'home' | 'settings') => {
    if (inProgress) setLeave(to);
    else if (to === 'home') onHome();
    else onSettings();
  };

  // ── 文字 ──────────────────────────────────────────────────────────────
  const fmt = formatTenths;
  const myBidText = (bid: number) => (bid === 0 ? t.passed : cfg.showRemaining ? fill(t.youBid, { t: fmt(bid) }) : t.released);
  let status = '';
  let sub = '';
  if (phase === 'live') {
    if (holdingNow) status = count > 0 ? t.countdown : t.holding;
    else if (myBid !== null) {
      status = popped ? t.popped : myBidText(myBid);
      sub = t.waiting;
    }
  } else if (phase === 'result' && last) {
    status = last.winner === null ? (last.top > 0 ? t.tie : t.allPassed) : last.winner === 0 ? t.winYou : fill(t.winOther, { name: name(last.winner) });
    sub = popped ? t.popped : myBidText(last.bids[0]);
    if (!over && myLeft === 0) sub = t.outOfTime;
  } else if (phase === 'ready') {
    status = myLeft === 0 ? t.outOfTime : fill(t.rules[1], { countdown: cfg.countdownMs / 1000 });
  }
  /** 你的剩餘時間：按住跑秒時即時往下扣（快速局才顯示） */
  const myLiveLeft = phase === 'live' && myBid === null && count === 0 ? Math.max(0, myLeft - clock)
    : phase === 'live' && myBid !== null ? myLeft - myBid : myLeft;

  const holdLabel = holdingNow ? t.holdingBtn : phase === 'live' ? t.released : fill(t.pressStart, { n: game.history.length + 1 });
  const table = useMemo(() => standings(game), [game]);
  const me = table.find((r) => r.seat === 0);
  const firstCount = table.filter((r) => r.rank === 1).length;
  const endTitle = me?.rank === 1 ? (firstCount > 1 ? t.endTieFirst : t.endWin) : fill(t.endRank, { n: me?.rank ?? 0 });

  // ── 版面零件 ─────────────────────────────────────────────────────────
  const seatsGrid = (
    <ul className={`grid shrink-0 gap-2 ${game.seats === 4 ? 'grid-cols-2' : 'grid-cols-3'}`}>
      {game.tokens.map((n, seat) => {
        const won = phase === 'result' && last?.winner === seat;
        const note = seat === 0
          ? (cfg.showRemaining ? fill(t.left, { t: fmt(myLiveLeft) }) : t.leftHidden)
          : (cfg.showRemaining ? fill(t.maxLeft, { t: fmt(maxRemaining(game.budget, pub, seat)) }) : '');
        // 競買人名片：方角細框、No. 編號；自己那張紅框。這回合得標的人身上蓋一個紅色成交章
        return (
          <li key={seat} aria-label={fill(t.tokensAria, { name: name(seat), n })}
            className={`tau-bidder px-3 py-2 text-[#35331c] ${seat === 0 ? 'is-me' : ''}`}>
            <div className="flex items-baseline justify-between gap-2">
              <span className="flex min-w-0 items-baseline gap-1.5">
                <span aria-hidden="true" className="tau-display shrink-0 text-[11px] italic text-ink-soft">No.{seat + 1}</span>
                <span className="truncate text-xs font-black">{name(seat)}</span>
              </span>
              <span className="text-2xl font-black leading-none">{n}</span>
            </div>
            {note && <p className="mt-0.5 truncate text-[11px] font-bold text-ink-soft">{note}</p>}
            {won && <span aria-hidden="true" className="tau-stamp absolute -bottom-2.5 -right-1 z-10 text-xs">{t.stampWon}</span>}
          </li>
        );
      })}
    </ul>
  );

  const historyBox = (
    <div className="flex min-h-[4.5rem] flex-1 flex-col border-y-[3px] border-double border-[#35331c]/60 px-1 pb-1 pt-2">
      <p className="tau-head text-ink-soft">{t.historyTitle}</p>
      {game.history.length === 0 ? (
        <p className="mt-1 text-xs font-bold text-ink-soft">{t.historyEmpty}</p>
      ) : (
        <ol className="mt-1 min-h-0 flex-1 overflow-y-auto overscroll-contain">
          {[...pub].reverse().map((r, idx) => {
            const n = pub.length - idx;
            return (
              // 拍賣目錄的一行：號碼、得標者、點線、秒數
              <li key={n} className="flex items-baseline gap-2 py-1.5 text-sm font-bold">
                <span className="tau-display w-6 shrink-0 text-xs italic text-ink-soft">{n}</span>
                <span className={`flex min-w-0 shrink items-center gap-1.5 truncate ${r.winner === null ? 'text-ink-soft' : ''}`}>
                  {r.winner === 0 && <span aria-hidden="true" className={`size-2 shrink-0 rounded-full ${KEY_BG}`} />}
                  {r.winner === null ? (r.top > 0 ? t.historyTie : t.historyNone) : name(r.winner)}
                </span>
                <span aria-hidden="true" className="min-w-4 flex-1 border-b-2 border-dotted border-[#35331c]/25" />
                <span className="tau-display shrink-0 font-bold">{r.top > 0 ? fmt(r.top) : '–'}</span>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );

  return (
    <TauFrame rootClassName="h-dvh overflow-hidden short:h-auto short:min-h-dvh short:overflow-visible"
      className="px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 lg:px-8 lg:pb-8">
      <header className="flex shrink-0 items-center justify-between gap-2 lg:mx-auto lg:w-full lg:max-w-[1040px]">
        <button type="button" onClick={() => askLeave('home')} aria-label={t.home} className={roundBtn}><LuHouse aria-hidden="true" /></button>
        <div className="min-w-0 text-center">
          <h1 className="truncate text-lg font-black leading-tight">{t.title}</h1>
          <p className="truncate text-xs font-bold text-ink-soft">
            {fill(t.roundOf, { n: Math.max(1, roundNo), total: game.rounds })} · {mode === 'quick' ? t.modeQuick : t.modeShow}
            {/* 窄手機上放不下第三段（日文會被截掉），難度在對局中也不是必要資訊 */}
            <span className="hidden sm:inline"> · {levelName}</span>
          </p>
        </div>
        <div className="flex gap-1.5">
          <button type="button" onClick={() => setHelpOpen(true)} aria-label={t.howTo} className={roundBtn}><LuCircleHelp aria-hidden="true" /></button>
          <button type="button" onClick={() => askLeave('settings')} aria-label={t.settings} className={roundBtn}><LuSettings2 aria-hidden="true" /></button>
        </div>
      </header>

      {/* 手機：上面是座位與紀錄（紀錄會自己縮），下面是大螢幕與按鈕。桌機：左右兩欄（按鈕在左） */}
      <div className="mt-3 flex min-h-0 flex-1 flex-col gap-3 lg:mx-auto lg:mt-6 lg:w-full lg:max-w-[1040px] lg:flex-row-reverse lg:gap-10">
        <div className="flex min-h-0 flex-1 flex-col gap-3 lg:w-[380px] lg:flex-none">
          {seatsGrid}
          {historyBox}
        </div>

        <section className="flex shrink-0 flex-col items-center lg:flex-1 lg:justify-center">
          <div className="relative flex h-[clamp(4rem,11dvh,6.5rem)] items-center text-[clamp(3.25rem,9.5dvh,5.5rem)] lg:h-36 lg:text-[clamp(5rem,13vh,8rem)]">
            {/* 沒有人得標（同秒流標、全員放棄）：大螢幕右上蓋一個墨色的章；有人得標的章蓋在那個人的名片上 */}
            {phase === 'result' && last && last.winner === null && (
              <span aria-hidden="true" className="tau-stamp absolute -right-2 -top-1 z-10 text-sm !text-[#35331c]">
                {last.top > 0 ? t.historyTie : t.historyNone}
              </span>
            )}
            {phase === 'live' && count > 0
              ? <span aria-hidden="true" className="tau-display font-bold leading-none">{count}</span>
              : <BigTime text={fmt(clock)} dim={phase === 'ready'} />}
          </div>
          <div className="flex min-h-11 flex-col items-center justify-center text-center" aria-live="polite">
            {status && <p className="text-sm font-black">{status}</p>}
            {sub && <p className="mt-0.5 text-xs font-bold text-ink-soft">{sub}</p>}
          </div>

          {over ? (
            <div className="mt-2 flex w-full max-w-[460px] flex-col gap-2">
              <button type="button" onClick={onAgain} className="tau-press h-[clamp(4.5rem,12dvh,7rem)] w-full text-xl font-black">
                {t.again}
              </button>
              <button type="button" onClick={() => { setEndShown(true); setEndClosed(false); }} className="tau-hand mx-auto h-11 text-sm">
                {t.standingsTitle}
              </button>
            </div>
          ) : (
            <>
              <button
                type="button"
                onPointerDown={onDown}
                onPointerUp={onUp}
                onPointerCancel={onUp}
                onLostPointerCapture={onUp}
                onContextMenu={(e) => e.preventDefault()}
                // 只認按住（pointer）與空白鍵；Enter 觸發的 click 不算
                onClick={(e) => e.preventDefault()}
                className={`tau-press mt-2 flex h-[clamp(6.5rem,17dvh,10rem)] w-full max-w-[460px] touch-none select-none flex-col items-center justify-center px-4 text-center [-webkit-touch-callout:none] lg:h-48 ${
                  holdingNow ? 'is-holding' : phase === 'live' ? 'is-out' : ''
                }`}
              >
                <span className="text-xl font-black leading-tight">{holdLabel}</span>
                {canBegin && <span className="mt-1 hidden text-xs font-bold tracking-normal text-[#ebe1b8]/70 fine:block">{t.pressHint}</span>}
              </button>
              <div className="mt-2 flex h-11 w-full max-w-[460px] items-center justify-center">
                {phase === 'live' && !holdingNow && myBid !== null && live ? (
                  <button type="button" onClick={() => finish(myBid, live)} className="tau-hand h-11 text-sm">
                    {t.skip}
                  </button>
                ) : canBegin ? (
                  <button type="button" onClick={() => begin(true)} className="tau-hand h-11 text-sm">
                    {t.pass}
                  </button>
                ) : null}
              </div>
            </>
          )}
        </section>
      </div>

      <Modal isOpen={helpOpen} onClose={() => setHelpOpen(false)} title={t.howTo} kicker={t.title}
        icon={GiRuleBook} band={TAU_BAND} panelClassName={TAU_PANEL}>
        <AuctionRules mode={mode} />
      </Modal>

      <Modal isOpen={leave !== null} onClose={() => setLeave(null)} title={t.leaveTitle} kicker={t.title}
        icon={GiExitDoor} band={TAU_BAND} panelClassName={TAU_PANEL}
        footer={
          <>
            <button type="button" className="tau-lot flex-1 font-black" onClick={() => setLeave(null)}>{t.stay}</button>
            <button type="button" className="tau-press flex-1 font-black" onClick={() => (leave === 'home' ? onHome() : onSettings())}>{t.leave}</button>
          </>
        }>
        <p className="text-sm font-bold leading-relaxed">{t.leaveBody}</p>
      </Modal>

      {/* 結算：勝方（第一名）排最上面、滿色放大；其他人淡灰（CLAUDE.md〈視覺〉）。電腦的個性在這時才揭曉 */}
      <Modal isOpen={endOpen} onClose={() => setEndClosed(true)} title={endTitle} kicker={t.standingsTitle}
        icon={me?.rank === 1 ? GiTrophyCup : GiPodium}
        band={TAU_BAND} panelClassName={TAU_PANEL}
        footer={
          <>
            <button type="button" className="tau-lot flex-1 font-black" onClick={onSettings}>{t.settings}</button>
            <button type="button" className="tau-press flex-1 font-black" onClick={onAgain}>{t.again}</button>
          </>
        }>
        <p className="text-xs font-bold leading-relaxed text-ink-soft">{t.endBody}</p>
        <p className="mt-3 text-right text-[11px] font-bold text-ink-soft">{t.tokensCol} · {t.leftCol}</p>
        <ol className="mt-1 flex flex-col gap-1.5">
          {table.map((r) => {
            const first = r.rank === 1;
            const persona = r.seat > 0 ? t.personas[personas[r.seat - 1]] : null;
            return (
              <li key={r.seat} className={`flex items-center gap-3 px-3 ${first ? `tau-press py-3 tracking-normal` : 'border-b-2 border-dotted border-[#35331c]/25 py-2 text-ink-soft'}`}>
                <span className="tau-display w-6 shrink-0 text-center text-base font-bold italic">{r.rank}</span>
                <span className="min-w-0 flex-1">
                  <span className={`block truncate font-black ${first ? 'text-lg' : 'text-sm'} ${r.seat === 0 && !first ? 'text-[#35331c]' : ''}`}>{name(r.seat)}</span>
                  {persona && <span className="block truncate text-[11px] font-bold opacity-80">{persona.name} · {persona.hint}</span>}
                </span>
                <span className="shrink-0 text-right">
                  <span className={`block font-black leading-tight ${first ? 'text-xl' : 'text-base'}`}>{r.tokens}</span>
                  <span className="block text-[11px] font-bold opacity-80">{fmt(r.remaining)}</span>
                </span>
              </li>
            );
          })}
        </ol>
      </Modal>
    </TauFrame>
  );
}
