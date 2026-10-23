'use client';
import { useEffect, useEffectEvent, useMemo, useRef, useState, type PointerEvent as ReactPointerEvent } from 'react';
import { GiExitDoor, GiRuleBook } from 'react-icons/gi';
import { LuCircleHelp, LuHouse, LuSettings2, LuVolume2, LuVolumeX } from 'react-icons/lu';
import Modal from '@/components/Modal';
import { ShareResultModal, useShareCard } from '@/components/ShareResultModal';
import { useSound } from '@/hook/useSound';
import { useGameText, useMessages } from '@/i18n/LocaleProvider';
import { fill, useTextTable } from '@/i18n/gameText';
import { localePath, type Locale } from '@/i18n/locales';
import { TIME_AUCTION } from '@/i18n/routes';
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
import { playTau } from './sounds';
import { buzzShake, flyCoin, idleBidders, pop, reducedMotion, shake, springUp, thud } from './motion';
import { DIDONE, TAU_CARD_IMAGES, drawTauCard, type TauCardData } from './shareCard';

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
 *
 * 聲音（sounds.ts）、動作（motion.ts）、結算分享圖（shareCard.ts）都是這款自己的（Zach 10/24：學 Wall Go，但各自設計）：
 * - 倒數每秒懷錶一聲、開始計時叫人鈴一聲、跑秒時座鐘滴答；放手喀一聲、時間用完悶咚一聲加按鈕震動
 * - 成交：木槌落下（大螢幕一沉）→ 金幣從大螢幕拋到得標者名片 → 落下時數字加一、成交章蓋下去；流標大螢幕搖一下
 * - 你放手之後在等別人時，電腦的名片偶爾互相瞄一眼（亂數，跟誰還按著無關）；你按著、還沒開始時畫面不亂動
 * - 聲音只在事件處理的當下響一次（一回合結算一次），重掛元件、再來一局不會補響
 */
export default function AuctionPlay({ locale, mode, opponents, difficulty, seed, onHome, onSettings, onAgain }: {
  locale: Locale;
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
  const g = useGameText();
  const { prefs: soundPrefs, setPrefs: setSoundPrefs } = useSound();
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
  const modalOpen = helpOpen || leave !== null || endOpen;
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
    pointer.current = null;
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
    playTau(r.winner === null ? 'noSale' : r.winner === 0 ? 'soldYou' : 'sold');
    const clockEl = clockRef.current;
    if (!clockEl || reducedMotion()) return;
    if (r.winner === null) { shake(clockEl); return; }
    thud(clockEl);
    const target = seatsRef.current?.querySelector<HTMLElement>(`[data-seat="${r.winner}"] [data-tokens]`);
    if (!target) return;
    const seat = r.winner;
    setFlying(seat);
    flyCoin(clockEl, target, () => {
      setFlying((f) => (f === seat ? null : f));
      pop(target);
    });
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

  // ── 結算分享圖（shareCard.ts）：一頁拍賣目錄的成交紀錄。結算就是這張圖，關掉就停在終局的畫面上 ──
  const latinTitle = t.nameEn === t.title;
  const modeName = mode === 'quick' ? t.modeQuick : t.modeShow;
  const card: Omit<TauCardData, 'font'> = {
    rows: table.map((r) => ({
      rank: r.rank, no: r.seat + 1, name: name(r.seat), persona: r.seat > 0 ? t.personas[personas[r.seat - 1]].name : null,
      tokens: r.tokens, left: fmt(r.remaining), me: r.seat === 0,
    })),
    lots: game.history.map((h) => h.winner),
    won: me?.rank === 1,
    text: {
      kicker: `${t.standingsTitle} · ${modeName} · ${levelName}`,
      title: endTitle,
      name: latinTitle ? null : t.title,
      you: `${fill(t.tokensAria, { name: t.you, n: me?.tokens ?? 0 })} · ${fill(t.left, { t: fmt(me?.remaining ?? 0) })}`,
      tokensCol: t.tokensCol,
      leftCol: t.leftCol,
      lotsLabel: t.historyTitle,
      stamp: t.stampWon,
      brand: latinTitle ? t.title : `${t.title} ${t.nameEn}`,
      from: fill(g.share.cardFrom, { show: m.meta.showName }),
      host: new URL(process.env.SITE_URL || 'https://quoridorgame.com').host,
    },
  };
  const font = typeof document === 'undefined' ? 'system-ui' : getComputedStyle(document.documentElement).getPropertyValue('--font-app').trim() || 'system-ui';
  const share = useShareCard({
    isOpen: endOpen,
    draw: drawTauCard({ ...card, font }),
    contentKey: JSON.stringify(card),
    fileName: 'time-auction',
    homePath: localePath(locale, TIME_AUCTION),
    campaign: 'time-auction',
    fonts: [
      { font: `900 40px ${font}`, text: card.text.title + (card.text.name ?? '') + card.text.lotsLabel + card.text.brand + card.rows.map((r) => r.name).join('') },
      { font: `700 40px ${font}`, text: card.text.kicker + card.text.you + card.text.from + card.text.tokensCol + card.text.leftCol + card.rows.map((r) => r.persona ?? '').join('') },
      { font: `italic 700 40px ${DIDONE}`, text: '0123456789:.–No' },
    ],
    images: TAU_CARD_IMAGES,
  });
  const srResult = `${t.endBody} ${table.map((r) => `${r.rank}. ${name(r.seat)} ${r.tokens} · ${fmt(r.remaining)}`).join(' / ')}`;

  // ── 版面零件 ─────────────────────────────────────────────────────────
  const seatsGrid = (
    <ul ref={seatsRef} className={`grid shrink-0 gap-2 ${game.seats === 4 ? 'grid-cols-2' : 'grid-cols-3'}`}>
      {game.tokens.map((n, seat) => {
        // 金幣還在飛過來：數字先不加、章先不蓋（落下那一刻才出現）
        const incoming = flying === seat;
        const won = phase === 'result' && last?.winner === seat && !incoming;
        const note = seat === 0
          ? (cfg.showRemaining ? fill(t.left, { t: fmt(myLiveLeft) }) : t.leftHidden)
          : (cfg.showRemaining ? fill(t.maxLeft, { t: fmt(maxRemaining(game.budget, pub, seat)) }) : '');
        // 競買人名片：方角細框、No. 編號；自己那張紅框。這回合得標的人身上蓋一個紅色成交章
        return (
          <li key={seat} data-seat={seat} aria-label={fill(t.tokensAria, { name: name(seat), n })}
            className={`tau-bidder px-3 py-2 text-[#35331c] ${seat === 0 ? 'is-me' : ''}`}>
            <div className="flex items-baseline justify-between gap-2">
              <span className="flex min-w-0 items-baseline gap-1.5">
                <span aria-hidden="true" className="tau-display shrink-0 text-[11px] italic text-ink-soft">No.{seat + 1}</span>
                <span className="truncate text-xs font-black">{name(seat)}</span>
              </span>
              <span data-tokens className="text-2xl font-black leading-none">{incoming ? n - 1 : n}</span>
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
      {/* 左右各兩顆（回首頁、聲音｜說明、換設定），標題才會在正中間。手機上四顆圓鈕擠掉標題的寬度，間距與副標縮一點 */}
      <header className="flex shrink-0 items-center justify-between gap-1.5 sm:gap-2 lg:mx-auto lg:w-full lg:max-w-[1040px]">
        <div className="flex gap-1 sm:gap-1.5">
          <button type="button" onClick={() => askLeave('home')} aria-label={t.home} className={roundBtn}><LuHouse aria-hidden="true" /></button>
          <button type="button" onClick={() => setSoundPrefs({ sfx: !soundPrefs.sfx })} aria-pressed={soundPrefs.sfx} aria-label={g.sound.button} className={roundBtn}>
            {soundPrefs.sfx ? <LuVolume2 aria-hidden="true" /> : <LuVolumeX aria-hidden="true" />}
          </button>
        </div>
        <div className="min-w-0 text-center">
          <h1 className="truncate text-lg font-black leading-tight">{t.title}</h1>
          <p className="truncate text-[11px] font-bold text-ink-soft sm:text-xs">
            {fill(t.roundOf, { n: Math.max(1, roundNo), total: game.rounds })} · {mode === 'quick' ? t.modeQuick : t.modeShow}
            {/* 窄手機上放不下第三段（日文會被截掉），難度在對局中也不是必要資訊 */}
            <span className="hidden sm:inline"> · {levelName}</span>
          </p>
        </div>
        <div className="flex gap-1 sm:gap-1.5">
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
          <div ref={clockRef} className="relative flex h-[clamp(4rem,11dvh,6.5rem)] items-center text-[clamp(3.25rem,9.5dvh,5.5rem)] lg:h-36 lg:text-[clamp(5rem,13vh,8rem)]">
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
                ref={pressRef}
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

      {/* 結算就是分享圖（shareCard.ts）。關掉就停在終局的畫面上看，「最終排名」再打開；再來一局是主要鈕 */}
      <ShareResultModal isOpen={endOpen} onClose={() => setEndClosed(true)} title={endTitle} card={share}
        onRestart={onAgain} restartLabel={t.again} srText={srResult}
        frameClassName="rounded-[3px]"
        classes={{
          primary: 'tau-press',
          secondary: 'tau-lot',
          toggle: '!rounded-[2px] bg-[#ebe1b8]/15',
          toggleOn: '!rounded-[2px] bg-[#ebe1b8] text-[#35331c]',
          toggleOff: '!rounded-[2px] text-[#ebe1b8]/75 hover:text-[#ebe1b8]',
          button: 'font-black',
          placeholder: 'bg-[#ebe1b8]/20',
        }} />
    </TauFrame>
  );
}
