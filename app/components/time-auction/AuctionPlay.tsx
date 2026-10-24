'use client';
import { useEffect, useEffectEvent, useMemo, useRef, useState } from 'react';
import { GiExitDoor, GiRuleBook } from 'react-icons/gi';
import Modal from '@/components/Modal';
import { useMessages } from '@/i18n/LocaleProvider';
import { fill, useTextTable } from '@/i18n/gameText';
import type { Locale } from '@/i18n/locales';
import {
  MODES, TENTH_MS, bidFromHold, createAuction, formatTenths, isOver, maxRemaining, playRound, publicHistory,
  remaining, standings, viewFor, type Mode,
} from '@/games/time-auction/engine';
import { assignPersonas, decideBid, type Difficulty } from '@/games/time-auction/ai';
import { TEXT } from '@/games/time-auction/text';
import AuctionRules from './AuctionRules';
import { TAU_BAND, TAU_PANEL } from './theme';
import TauFrame from './TauFrame';
import { playTau } from './sounds';
import { buzzShake, idleBidders, reducedMotion, springUp } from './motion';
import { AuctionResult, BidderCards, BigTime, LotHistory, PlayHeader, celebrateRound, pressClass, useHold } from './AuctionParts';

/**
 * ready：等你按下去開始這一回合（第一回合）
 * live：這一回合進行中 —— 倒數（count > 0）然後跑秒，直到最後一個人放手
 * result：這一回合結束，公布得標者與秒數；再按一次就是下一回合
 */
type Phase = 'ready' | 'live' | 'result';
/** 這一回合的起點（performance.now，按下去那一刻）與電腦開局就決定好的出價 */
type Live = { start: number; aiBids: number[] };

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
 *
 * 左上的房子回這款的首頁（選模式那頁），不播轉場、不回平台（Zach 10/24）；進行到一半先問要不要離開。
 * 換設定原本是另一顆鈕，跟房子做的是同一件事，拿掉了。版面零件與結算跟連線版共用（AuctionParts.tsx）。
 *
 * 聲音（sounds.ts）、動作（motion.ts）、結算分享圖（shareCard.ts）都是這款自己的（Zach 10/24：學 Wall Go，但各自設計）：
 * - 倒數每秒懷錶一聲、開始計時叫人鈴一聲、跑秒時座鐘滴答；放手喀一聲、時間用完悶咚一聲加按鈕震動
 * - 成交：木槌落下（大螢幕一沉）→ 金幣從大螢幕拋到得標者名片 → 落下時數字加一、成交章蓋下去；流標大螢幕搖一下
 * - 你放手之後在等別人時，電腦的名片偶爾互相瞄一眼（亂數，跟誰還按著無關）；你按著、還沒開始時畫面不亂動
 * - 聲音只在事件處理的當下響一次（一回合結算一次），重掛元件、再來一局不會補響
 */
export default function AuctionPlay({ locale, mode, opponents, difficulty, seed, onHome, onAgain }: {
  locale: Locale;
  mode: Mode;
  opponents: number;
  difficulty: Difficulty;
  seed: number;
  /** 回這款的首頁（選模式那頁） */
  onHome: () => void;
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
  const [leave, setLeave] = useState(false);
  const [endShown, setEndShown] = useState(false);
  const [endClosed, setEndClosed] = useState(false);
  /** 事件處理器用：還按著沒（擋重複放手）。不參與畫面 */
  const holding = useRef(false);
  /** 動作用的 DOM：大螢幕、名片那一排、大按鈕 */
  const clockRef = useRef<HTMLDivElement>(null);
  const seatsRef = useRef<HTMLUListElement>(null);
  const pressRef = useRef<HTMLButtonElement>(null);
  /** 金幣還在飛向哪一席：那張名片的數字先不加、成交章先不蓋，落下才出現 */
  const [flying, setFlying] = useState<number | null>(null);

  const over = isOver(game);
  const myLeft = remaining(game, 0);
  const last = game.history[game.history.length - 1];
  const pub = useMemo(() => publicHistory(game), [game]);
  const holdingNow = phase === 'live' && myBid === null;
  const endOpen = over && endShown && !endClosed;
  const modalOpen = helpOpen || leave || endOpen;
  const canBegin = !over && phase !== 'live';
  const roundNo = phase === 'live' || (phase === 'ready' && !over) ? game.history.length + 1 : game.history.length;
  const name = (seat: number) => (seat === 0 ? t.you : fill(t.computer, { n: seat }));
  const levelName = [m.solo.level1, m.solo.level2, m.solo.level3][['easy', 'normal', 'hard'].indexOf(difficulty)];

  /** 開始一回合。pass＝直接放棄（等於按下去馬上放手） */
  const begin = (pass: boolean): boolean => {
    if (!canBegin || modalOpen) return false;
    const aiBids = personas.map((p, i) => decideBid(viewFor(game, i + 1), p, difficulty, seed));
    if (pass) playTau('pass');
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
    const bid = bidFromHold(performance.now() - live.start, cfg.countdownMs, myLeft);
    playTau(bid === 0 ? 'pass' : 'release');
    if (pressRef.current && !reducedMotion()) springUp(pressRef.current);
    setMyBid(bid);
  };

  const finish = (bid: number, l: Live) => {
    const next = playRound(game, [bid, ...l.aiBids]);
    const r = next.history[next.history.length - 1];
    setGame(next);
    setClock(r.top);
    setCount(0);
    setLive(null);
    setPhase('result');
    // 一回合只結算一次，所以聲音與動作在這裡做（不放 effect：重掛、再來一局都不會補響）
    celebrateRound(r, 0, clockRef.current, seatsRef.current, setFlying);
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
        setMyBid(myLeft);
        setPopped(true);
        setClock(myLeft);
        playTau('popped');
        if (pressRef.current && !reducedMotion()) buzzShake(pressRef.current);
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

  // 空白鍵＝大按鈕；切到背景、視窗失焦、手指在別處離開＝放手（AuctionParts 的 useHold）
  const hold = useHold({ begin: () => begin(false), release, holding: () => holding.current, blocked: modalOpen });

  // 最後一回合的結果先看一眼，再跳出排名（分享圖），同時拍賣官搖鈴（第一名）或低低敲兩下
  const onEnd = useEffectEvent(() => {
    setEndShown(true);
    playTau(standings(game).find((r) => r.seat === 0)?.rank === 1 ? 'win' : 'lose');
  });
  useEffect(() => {
    if (!over) return;
    const id = window.setTimeout(() => onEnd(), 900);
    return () => window.clearTimeout(id);
  }, [over]);

  // 倒數每一秒懷錶一聲；倒數到 0、開始計時叫人鈴一聲
  const lastCount = useRef(0);
  useEffect(() => {
    const prev = lastCount.current;
    lastCount.current = count;
    if (phase !== 'live') return;
    if (count > 0 && count !== prev) playTau('tick');
    else if (count === 0 && prev > 0) playTau('go');
  }, [phase, count]);

  // 跑秒中每一整秒座鐘滴答一聲（滴、答輪流）；你已經放手、只是在等別人時小聲一半
  const second = phase === 'live' && count === 0 ? Math.floor(clock / 10) : 0;
  useEffect(() => {
    if (second > 0) playTau('second', { soft: !holding.current, odd: second % 2 === 1 });
  }, [second]);

  // 你已經放手（或這回合不參加）、在等最後一個人：電腦的名片偶爾動一下（motion.ts）。你還按著或還沒開始時一律不動
  const waiting = phase === 'live' && myBid !== null;
  useEffect(() => {
    const root = seatsRef.current;
    if (!waiting || !root || reducedMotion()) return;
    const cards = [...root.querySelectorAll<HTMLElement>('[data-seat]')].filter((el) => el.dataset.seat !== '0');
    let id = 0;
    const tick = () => { id = window.setTimeout(() => { idleBidders(cards); tick(); }, 1400 + Math.random() * 1800); };
    tick();
    return () => {
      window.clearTimeout(id);
      // 結果一出來就站好，名片不要還歪著
      cards.forEach((el) => el.getAnimations().forEach((a) => a.cancel()));
    };
  }, [waiting]);

  const inProgress = !over && (game.history.length > 0 || phase === 'live');
  const askLeave = () => {
    if (inProgress) setLeave(true);
    else onHome();
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
  const modeName = mode === 'quick' ? t.modeQuick : t.modeShow;
  const persona = (seat: number) => (seat > 0 ? t.personas[personas[seat - 1]].name : null);

  // ── 版面零件 ─────────────────────────────────────────────────────────
  const note = (seat: number) => (seat === 0
    ? (cfg.showRemaining ? fill(t.left, { t: fmt(myLiveLeft) }) : t.leftHidden)
    : (cfg.showRemaining ? fill(t.maxLeft, { t: fmt(maxRemaining(game.budget, pub, seat)) }) : ''));

  return (
    <TauFrame rootClassName="h-dvh overflow-hidden short:h-auto short:min-h-dvh short:overflow-visible"
      className="px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 lg:px-8 lg:pb-8">
      <PlayHeader onHome={askLeave} onHelp={() => setHelpOpen(true)}
        sub={`${fill(t.roundOf, { n: Math.max(1, roundNo), total: game.rounds })} · ${modeName}`} wide={levelName} />

      {/* 手機：上面是座位與紀錄（紀錄會自己縮），下面是大螢幕與按鈕。桌機：左右兩欄（按鈕在左） */}
      <div className="mt-3 flex min-h-0 flex-1 flex-col gap-3 lg:mx-auto lg:mt-6 lg:w-full lg:max-w-[1040px] lg:flex-row-reverse lg:gap-10">
        <div className="flex min-h-0 flex-1 flex-col gap-3 lg:w-[380px] lg:flex-none">
          <BidderCards ref={seatsRef} tokens={game.tokens} me={0} name={name} note={note} flying={flying}
            wonSeat={phase === 'result' ? last?.winner ?? null : null} />
          <LotHistory pub={pub} me={0} name={name} />
        </div>

        <section className="flex shrink-0 flex-col items-center lg:flex-1 lg:justify-center">
          <div ref={clockRef} className="relative flex h-[clamp(4rem,11svh,6.5rem)] items-center text-[clamp(3.25rem,9.5svh,5.5rem)] lg:h-36 lg:text-[clamp(5rem,13vh,8rem)]">
            {/* 沒有人得標（同秒流標、全員放棄）：大螢幕右上蓋一個墨色的章；有人得標的章蓋在那個人的名片上 */}
            {phase === 'result' && last && last.winner === null && (
              <span aria-hidden="true" className="tau-stamp absolute -right-2 -top-1 z-10 text-sm !text-[#35331c]">
                {last.top > 0 ? t.historyTie : t.historyNone}
              </span>
            )}
            {phase === 'live' && count > 0
              // key：每換一個數字就重掛，倒數的數字「落下」一次（.tau-count）
              ? <span key={count} aria-hidden="true" className="tau-display tau-count font-bold leading-none">{count}</span>
              : <BigTime text={fmt(clock)} dim={phase === 'ready'} />}
          </div>
          <div className="flex min-h-11 flex-col items-center justify-center text-center" aria-live="polite">
            {status && <p className="text-sm font-black">{status}</p>}
            {sub && <p className="mt-0.5 text-xs font-bold text-ink-soft">{sub}</p>}
          </div>

          {over ? (
            <div className="mt-2 flex w-full max-w-[460px] flex-col gap-2">
              <button type="button" onClick={onAgain} className="tau-press h-[clamp(4.5rem,12svh,7rem)] w-full text-xl font-black">
                {t.again}
              </button>
              <button type="button" onClick={() => { setEndShown(true); setEndClosed(false); }} className="tau-hand mx-auto h-11 text-sm">
                {t.standingsTitle}
              </button>
            </div>
          ) : (
            <>
              <button ref={pressRef} type="button" {...hold} className={pressClass(holdingNow ? 'holding' : phase === 'live' ? 'out' : 'idle')}>
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

      <Modal isOpen={leave} onClose={() => setLeave(false)} title={t.leaveTitle} kicker={t.title}
        icon={GiExitDoor} band={TAU_BAND} panelClassName={TAU_PANEL}
        footer={
          <>
            <button type="button" className="tau-lot flex-1 font-black" onClick={() => setLeave(false)}>{t.stay}</button>
            <button type="button" className="tau-press flex-1 font-black" onClick={onHome}>{t.leave}</button>
          </>
        }>
        <p className="text-sm font-bold leading-relaxed">{t.leaveBody}</p>
      </Modal>

      {/* 結算就是分享圖（AuctionParts 的 AuctionResult）。關掉就停在終局的畫面上看，「最終排名」再打開；再來一局是主要鈕 */}
      <AuctionResult locale={locale} game={game} me={0} name={name} persona={persona}
        kicker={`${modeName} · ${levelName}`} isOpen={endOpen} onClose={() => setEndClosed(true)} onAgain={onAgain} />
    </TauFrame>
  );
}
