'use client';
import { useEffect, useEffectEvent, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import { GiExitDoor, GiRuleBook } from 'react-icons/gi';
import Modal from '@/components/Modal';
import { fill, useTextTable } from '@/i18n/gameText';
import type { Locale } from '@/i18n/locales';
import { MODES, TENTH_MS, bidFromHold, formatTenths, maxRemaining, publicHistory, remaining, standings } from '@/games/time-auction/engine';
import { GRACE_MS, deriveAuction } from '@/games/time-auction/online';
import { TEXT } from '@/games/time-auction/text';
import { auctionRoundKey, auctionSeatKey, type AuctionRoom } from '@/types/auctionRoom';
import { auctionServerNow, passRound, pressDown, pressUp } from '@/utils/auctionRoomService';
import { RulesStepsPaged } from './AuctionRulesSteps';
import { AuctionResult, BidderCards, BigTime, LotHistory, PlayHeader, celebrateRound, pressClass, useHold } from './AuctionParts';
import { buzzShake, idleBidders, reducedMotion, springUp } from './motion';
import { playTau } from './sounds';
import { TAU_BAND, TAU_PANEL } from './theme';
import TauFrame from './TauFrame';

/**
 * 時間拍賣的連線對局（房間坐滿之後）。長相、聲音、動作跟電腦拍賣同一套（AuctionParts.tsx），差別是出價從哪來：
 * 這裡每個人只寫自己按下、放開的伺服器時間（auctionRoomService），整場由 games/time-auction/online.ts 從房間資料推出來 ——
 * 每台裝置各算各的、結果一樣。
 *
 * 一回合：按住大按鈕（電腦是空白鍵）→ 等大家都按住（名片左上角一顆墨點的是按住了；第一個人按下去 20 秒後不等沒按的人）
 * → 倒數，倒數內放手＝不參加 → 跑秒，放手的那一刻就是出價 → 最後一個人放手才結算、公布得標者與秒數。
 * 倒數、跑秒都用伺服器時間畫（auctionServerNow），每台看到同一個數字；分頁切到背景、視窗失焦就算放手（同本機版）。
 *
 * **看不出誰還按著**：倒數開始之後，畫面上、聲音上都不會因為別人放手而有任何變化 —— 墨點一開始倒數就全部拿掉，
 * 別人放手不出聲、不動，大螢幕一直跑到最後一個人放手。你放手之後名片偶爾互相瞄一眼，跟本機版一樣是亂數，跟誰還按著無關。
 * （房間資料本身讀得到每個人放手的時間，那是跟朋友玩的信任程度，見 types/auctionRoom.ts。）
 *
 * 寫入失敗（例如重新整理時伺服器已經替你寫了 up、規則擋下第二次）不當成連線壞了：每個值只能寫一次，被擋就是已經有了。
 */
export default function AuctionOnlinePlay({ locale, room, me, home, onAgain }: {
  locale: Locale;
  room: AuctionRoom;
  me: number;
  /** 這款的首頁（選模式那頁） */
  home: string;
  /** 再來一局＝再開一間房 */
  onAgain: () => void;
}) {
  const t = useTextTable(TEXT);
  const router = useRouter();
  const cfg = MODES[room.mode];
  /** 上一次看時間的伺服器時間：倒數、跑秒時每一格更新；其他時候在「時間到了、結果可能會變」的那一刻更新（wakeAt） */
  const [stamp, setStamp] = useState(0);
  const view = useMemo(() => deriveAuction(room, Math.max(stamp, auctionServerNow())), [room, stamp]);
  const { game, phase, round } = view;
  const n = round?.n ?? game.history.length;
  const press = room.rounds?.[auctionRoundKey(n)]?.[auctionSeatKey(me)];
  const myUp = typeof press?.up === 'number' ? press.up : null;
  const iPressed = !!round?.pressed[me];
  const inRound = !!round?.inRound[me];
  const start = round?.start ?? null;
  const myLeft = remaining(game, me);
  const over = phase === 'over';
  const last = game.history[game.history.length - 1];
  const pub = useMemo(() => publicHistory(game), [game]);

  /** 事件處理器用：還按著沒、按的是第幾回合。不參與畫面 */
  const holding = useRef<number | null>(null);
  /** 畫面用：按住中的回合；放手、換回合就不算 */
  const [holdingN, setHoldingN] = useState<number | null>(null);
  /** 自己這回合放手的時間（伺服器時間，資料庫的值回來之前先用它）、是不是時間用完自己彈起 */
  const [mine, setMine] = useState<{ n: number; at: number; popped: boolean } | null>(null);
  const releasedAt = mine?.n === n ? mine.at : null;
  const popped = mine?.n === n && mine.popped;
  const holdingNow = holdingN === n && myUp === null && (phase === 'gathering' || phase === 'live');

  const [helpOpen, setHelpOpen] = useState(false);
  const [leave, setLeave] = useState(false);
  const [endShown, setEndShown] = useState(over);
  const [endClosed, setEndClosed] = useState(false);
  const endOpen = over && endShown && !endClosed;
  const modalOpen = helpOpen || leave || endOpen;
  const canBegin = (phase === 'open' || phase === 'gathering') && !iPressed && myLeft > 0;

  const clockRef = useRef<HTMLDivElement>(null);
  const seatsRef = useRef<HTMLUListElement>(null);
  const pressRef = useRef<HTMLButtonElement>(null);
  const [flying, setFlying] = useState<number | null>(null);

  // 每個人都用座位稱呼，自己也是（不寫「你」；自己那張名片紅框、得標紀錄前一顆紅點）
  const name = (seat: number) => fill(t.player, { n: seat + 1 });
  const label = () => t.bidder;
  const modeName = room.mode === 'quick' ? t.modeQuick : t.modeShow;
  const warn = (what: string) => (err: unknown) => console.warn(`[time-auction online] ${what}`, err);

  // ── 按下、放開 ───────────────────────────────────────────────────────
  const begin = (): boolean => {
    if (!canBegin || modalOpen || !round) return false;
    holding.current = round.n;
    setHoldingN(round.n);
    setMine(null);
    pressDown(room.id, round.n, me).catch(warn('pressDown'));
    return true;
  };

  /** 放手：寫 up（伺服器時間）。倒數結束前放手＝不參加；時間用完由每一格的檢查呼叫（popped） */
  const release = (opts: { popped?: boolean; quiet?: boolean } = {}) => {
    const r = holding.current;
    if (r === null) return;
    holding.current = null;
    setHoldingN(null);
    const at = auctionServerNow();
    setMine({ n: r, at, popped: !!opts.popped });
    pressUp(room.id, r, me).catch(warn('pressUp'));
    if (opts.quiet) return;
    if (opts.popped) {
      playTau('popped');
      if (pressRef.current && !reducedMotion()) buzzShake(pressRef.current);
      if (typeof navigator.vibrate === 'function') navigator.vibrate(200);
      return;
    }
    playTau(start === null || at < start + cfg.countdownMs ? 'pass' : 'release');
    if (pressRef.current && !reducedMotion()) springUp(pressRef.current);
  };

  /** 這回合不參加：按下、放開一起寫 */
  const pass = () => {
    if (!canBegin || !round) return;
    playTau('pass');
    setMine({ n: round.n, at: auctionServerNow(), popped: false });
    passRound(room.id, round.n, me).catch(warn('pass'));
  };

  const hold = useHold({ begin, release: () => release(), holding: () => holding.current !== null, blocked: modalOpen });

  // 離開這一頁（回首頁、再來一局換房間）時還按著：放手
  const onUnmount = useEffectEvent(() => release({ quiet: true }));
  useEffect(() => () => onUnmount(), []);

  // ── 時間 ─────────────────────────────────────────────────────────────
  // 等人、倒數、跑秒時每一格更新一次（畫倒數、跑秒、等人的秒數；時間用完就彈起）。其他時候只在 wakeAt 那一刻重算
  const ticking = phase === 'gathering' || phase === 'live';
  const onFrame = useEffectEvent(() => {
    const now = auctionServerNow();
    setStamp(now);
    // 時間用完，按鈕自動彈起（節目裡按鈕會震動）
    if (holding.current !== null && phase === 'live' && start !== null && inRound
      && now >= start + cfg.countdownMs + myLeft * TENTH_MS) release({ popped: true });
  });
  useEffect(() => {
    if (!ticking) return;
    let id = requestAnimationFrame(function loop() {
      onFrame();
      id = requestAnimationFrame(loop);
    });
    return () => cancelAnimationFrame(id);
  }, [ticking]);
  useEffect(() => {
    if (ticking || view.wakeAt === null) return;
    const id = window.setTimeout(() => setStamp(auctionServerNow()), Math.max(0, view.wakeAt - auctionServerNow()) + 30);
    return () => window.clearTimeout(id);
  }, [ticking, view.wakeAt]);

  const ms = start !== null ? stamp - start : 0;
  const count = phase === 'live' && ms < cfg.countdownMs ? Math.min(Math.ceil(cfg.countdownMs / 1000), Math.max(1, Math.ceil((cfg.countdownMs - ms) / 1000))) : 0;
  const elapsed = phase === 'live' && ms >= cfg.countdownMs ? Math.floor((ms - cfg.countdownMs) / TENTH_MS) : 0;
  const waitS = phase === 'gathering' && round?.cutoff ? Math.max(0, Math.ceil((round.cutoff + GRACE_MS - stamp) / 1000)) : null;

  // ── 跟資料對齊 ───────────────────────────────────────────────────────
  const fix = useEffectEvent(() => {
    if (!round) return;
    // 回合在你按下去之前就開始了（你沒趕上）：手還按著也不算，先放掉
    if (holding.current !== null && phase === 'live' && !inRound) release({ quiet: true });
    // 重新整理、斷線回來：資料上你按著、這台卻沒有人在按 —— 就是放手了（通常伺服器已經替你寫好 up）
    if (holding.current === null && iPressed && myUp === null && releasedAt === null && (phase === 'gathering' || phase === 'live')) {
      setMine({ n: round.n, at: auctionServerNow(), popped: false });
      pressUp(room.id, round.n, me).catch(warn('pressUp (reattach)'));
    }
  });
  useEffect(() => { fix(); }, [phase, n, iPressed, inRound, myUp]);

  // 時間用完的人：每回合在別人開始按之後，自動「不參加」（隔一下下、像有人按了一樣，不要一開放就搶第一個）
  const autoPass = useEffectEvent(() => {
    if (phase === 'gathering' && myLeft <= 0 && !iPressed && round) passRound(room.id, round.n, me).catch(warn('autoPass'));
  });
  useEffect(() => {
    if (phase !== 'gathering' || myLeft > 0 || iPressed) return;
    const id = window.setTimeout(() => autoPass(), 600 + Math.random() * 1200);
    return () => window.clearTimeout(id);
  }, [phase, n, myLeft, iPressed]);

  // ── 聲音與動作 ───────────────────────────────────────────────────────
  // 一回合結算：木槌、金幣（celebrateRound）。只在這台看著它結算時響 —— 重新整理、一次補好幾回合都不響
  const heard = useRef(game.history.length);
  const onResolved = useEffectEvent((len: number) => {
    const prev = heard.current;
    heard.current = len;
    if (len === prev + 1 && last) celebrateRound(last, me, clockRef.current, seatsRef.current, setFlying);
  });
  useEffect(() => { onResolved(game.history.length); }, [game.history.length]);

  // 拍賣結束：最後一回合先看一眼再跳出排名（分享圖），第一名搖鈴、其他人低低敲兩下。進來時已經結束就直接給排名、不出聲
  const onEnd = useEffectEvent(() => {
    setEndShown(true);
    playTau(standings(game).find((r) => r.seat === me)?.rank === 1 ? 'win' : 'lose');
  });
  useEffect(() => {
    if (!over || endShown) return;
    const id = window.setTimeout(() => onEnd(), 900);
    return () => window.clearTimeout(id);
  }, [over, endShown]);

  // 倒數每一秒懷錶一聲；倒數到 0、開始計時叫人鈴一聲（每個人都聽得到，跟節目的大螢幕一樣，跟誰還按著無關）
  const lastCount = useRef(0);
  useEffect(() => {
    const prev = lastCount.current;
    lastCount.current = count;
    if (phase !== 'live') return;
    if (count > 0 && count !== prev) playTau('tick');
    else if (count === 0 && prev > 0) playTau('go');
  }, [phase, count]);

  // 跑秒中每一整秒座鐘滴答一聲；你已經放手（或沒參加）時小聲一半
  const second = phase === 'live' && count === 0 ? Math.floor(elapsed / 10) : 0;
  const soft = useEffectEvent(() => holding.current === null);
  useEffect(() => {
    if (second > 0) playTau('second', { soft: soft(), odd: second % 2 === 1 });
  }, [second]);

  // 你已經放手（或這回合沒參加）、在等最後一個人：其他人的名片偶爾動一下（亂數，跟誰還按著無關）
  const waiting = phase === 'live' && !holdingNow;
  useEffect(() => {
    const el = seatsRef.current;
    if (!waiting || !el || reducedMotion()) return;
    const cards = [...el.querySelectorAll<HTMLElement>('[data-seat]')].filter((c) => c.dataset.seat !== String(me));
    let id = 0;
    const tick = () => { id = window.setTimeout(() => { idleBidders(cards); tick(); }, 1400 + Math.random() * 1800); };
    tick();
    return () => {
      window.clearTimeout(id);
      cards.forEach((c) => c.getAnimations().forEach((a) => a.cancel()));
    };
  }, [waiting, me]);

  // ── 文字 ─────────────────────────────────────────────────────────────
  const fmt = formatTenths;
  const upAt = myUp ?? releasedAt;
  const myBid = upAt === null ? null : start !== null && inRound ? bidFromHold(upAt - start, cfg.countdownMs, myLeft) : 0;
  const myBidText = (bid: number) => (bid === 0 ? t.satOut : cfg.showRemaining ? fill(t.bidLocked, { t: fmt(bid) }) : t.letGo);
  const resultText = last
    ? last.winner === null ? (last.top > 0 ? t.tie : t.allPassed) : fill(t.winOther, { name: name(last.winner) })
    : null;
  // 等人：要等的人＋已經按的人，按了幾個
  const relevant = round ? round.required.map((r, i) => r || round.pressed[i]) : [];
  const gathering = fill(t.gathering, { n: relevant.filter((r, i) => r && round?.pressed[i]).length, total: relevant.filter(Boolean).length });
  const showResult = !!last && (phase === 'open' || phase === 'gathering' || over) && !holdingNow;

  let status = '';
  let sub = '';
  if (over) {
    status = resultText ?? '';
    sub = last ? myBidText(last.bids[me]) : '';
  } else if (phase === 'live') {
    if (!inRound) status = iPressed && upAt !== null && start !== null && upAt <= start ? t.satOut : t.missed;
    else if (holdingNow) status = count > 0 ? t.countdown : t.holdingOnline;
    else { status = popped ? t.popped : myBidText(myBid ?? 0); sub = t.waiting; }
  } else if (phase === 'gathering') {
    if (holdingNow) { status = gathering; sub = waitS !== null ? fill(t.gatherWait, { s: waitS }) : t.gatherHint; }
    else if (iPressed) { status = t.satOut; sub = gathering; }
    else { status = resultText ?? t.gatherHint; sub = gathering; }
  } else if (phase === 'open') {
    status = resultText ?? t.gatherHint;
    sub = last ? myBidText(last.bids[me]) : '';
  }
  if (!over && myLeft <= 0) sub = t.autoPass;

  /** 你的剩餘時間：按住跑秒時即時往下扣（快速局才顯示） */
  const myLiveLeft = holdingNow && phase === 'live' && count === 0 ? Math.max(0, myLeft - elapsed) : myBid !== null && phase === 'live' ? myLeft - myBid : myLeft;
  const note = (seat: number) => (seat === me
    ? (cfg.showRemaining ? fill(t.left, { t: fmt(myLiveLeft) }) : t.leftHidden)
    : (cfg.showRemaining ? fill(t.maxLeft, { t: fmt(maxRemaining(game.budget, pub, seat)) }) : ''));

  const holdLabel = holdingNow ? t.holdingBtn
    : phase === 'live' ? (inRound ? t.letGo : t.missedBtn)
    : iPressed ? t.satOut
    : myLeft <= 0 ? t.timeUp
    : fill(t.pressJoin, { n });
  const roundNo = over ? game.history.length : n;

  const askLeave = () => (over ? router.push(home) : setLeave(true));

  return (
    <TauFrame rootClassName="h-dvh overflow-hidden short:h-auto short:min-h-dvh short:overflow-visible"
      className="px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] pt-3 lg:px-8 lg:pb-8">
      <PlayHeader onHome={askLeave} onHelp={() => setHelpOpen(true)}
        sub={`${fill(t.roundOf, { n: Math.max(1, roundNo), total: game.rounds })} · ${modeName}`} wide={t.online} />

      <div className="mt-3 flex min-h-0 flex-1 flex-col gap-3 lg:mx-auto lg:mt-6 lg:w-full lg:max-w-[1040px] lg:flex-row-reverse lg:gap-10">
        <div className="flex min-h-0 flex-1 flex-col gap-3 lg:w-[380px] lg:flex-none">
          <BidderCards ref={seatsRef} tokens={game.tokens} me={me} name={name} label={label} note={note} flying={flying}
            wonSeat={showResult ? last?.winner ?? null : null}
            marks={phase === 'gathering' ? round?.pressed : undefined} markLabel={t.pressedMark} />
          <LotHistory pub={pub} me={me} name={name} />
        </div>

        <section className="flex shrink-0 flex-col items-center lg:flex-1 lg:justify-center">
          <div ref={clockRef} className="relative flex h-[clamp(4rem,11svh,6.5rem)] items-center text-[clamp(3.25rem,9.5svh,5.5rem)] lg:h-36 lg:text-[clamp(5rem,13vh,8rem)]">
            {showResult && last && last.winner === null && (
              <span aria-hidden="true" className="tau-stamp absolute -right-2 -top-1 z-10 text-sm !text-[#35331c]">
                {last.top > 0 ? t.historyTie : t.historyNone}
              </span>
            )}
            {count > 0
              ? <span key={count} aria-hidden="true" className="tau-display tau-count font-bold leading-none">{count}</span>
              : <BigTime text={fmt(phase === 'live' ? elapsed : showResult && last ? last.top : 0)} dim={!(phase === 'live' || (showResult && last))} />}
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
              <button ref={pressRef} type="button" {...hold} aria-disabled={!canBegin && !holdingNow}
                className={pressClass(holdingNow ? 'holding' : canBegin ? 'idle' : 'out')}>
                <span className="text-xl font-black leading-tight">{holdLabel}</span>
                {canBegin && <span className="mt-1 hidden text-xs font-bold tracking-normal text-[#ebe1b8]/70 fine:block">{t.pressHint}</span>}
              </button>
              <div className="mt-2 flex h-11 w-full max-w-[460px] items-center justify-center">
                {canBegin && (
                  <button type="button" onClick={pass} className="tau-hand h-11 text-sm">{t.pass}</button>
                )}
              </div>
            </>
          )}
        </section>
      </div>

      <Modal isOpen={helpOpen} onClose={() => setHelpOpen(false)} title={t.howTo} kicker={t.title}
        icon={GiRuleBook} band={TAU_BAND} panelClassName={TAU_PANEL}>
        {/* 跟規則頁同一份步驟，一次一步、可以左右滑；時間照這一局的模式。不放會離開對局的連結 */}
        <RulesStepsPaged open={helpOpen} mode={room.mode} online onDone={() => setHelpOpen(false)} />
      </Modal>

      <Modal isOpen={leave} onClose={() => setLeave(false)} title={t.leaveTitle} kicker={t.title}
        icon={GiExitDoor} band={TAU_BAND} panelClassName={TAU_PANEL}
        footer={
          <>
            <button type="button" className="tau-lot flex-1 font-black" onClick={() => setLeave(false)}>{t.stay}</button>
            <button type="button" className="tau-press flex-1 font-black" onClick={() => router.push(home)}>{t.leave}</button>
          </>
        }>
        <p className="text-sm font-bold leading-relaxed">{t.leaveOnlineBody}</p>
      </Modal>

      <AuctionResult locale={locale} game={game} me={me} name={name} online
        kicker={`${modeName} · ${t.online}`} isOpen={endOpen} onClose={() => setEndClosed(true)} onAgain={onAgain} />
    </TauFrame>
  );
}
