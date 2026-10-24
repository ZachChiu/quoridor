'use client';
import { useEffect, useEffectEvent, useRef, type MouseEvent as ReactMouseEvent, type PointerEvent as ReactPointerEvent, type Ref } from 'react';
import { LuCircleHelp, LuHouse, LuVolume2, LuVolumeX } from 'react-icons/lu';
import { ShareResultModal, useShareCard } from '@/components/ShareResultModal';
import { useSound } from '@/hook/useSound';
import { useGameText, useMessages } from '@/i18n/LocaleProvider';
import { fill, useTextTable } from '@/i18n/gameText';
import { localePath, type Locale } from '@/i18n/locales';
import { TIME_AUCTION } from '@/i18n/routes';
import { formatTenths, standings, type AuctionState, type PublicRound, type RoundRecord } from '@/games/time-auction/engine';
import { TEXT } from '@/games/time-auction/text';
import { KEY_BG, roundBtn } from './theme';
import { playTau } from './sounds';
import { flyCoin, pop, reducedMotion, shake, thud } from './motion';
import { DIDONE, TAU_CARD_IMAGES, drawTauCard, type TauCardData } from './shareCard';

/**
 * 對局畫面的零件：跟電腦拍賣（AuctionPlay）與連線拍賣（AuctionOnlinePlay）共用，
 * 兩邊只差「出價從哪來」（電腦當場決定／房間裡的按鍵時間），長相、聲音、動作都是同一套。
 */

/**
 * 大螢幕的數字。每個字固定寬度，跑秒時才不會左右抖 ——
 * 字型子集不保證留著等寬數字（tnum）的 OpenType 功能，tabular-nums 不一定有效。
 * 字是 Didone 襯線（.tau-display），維多利亞時代拍賣傳單上的數字就是這個樣子。
 */
export function BigTime({ text, dim = false }: { text: string; dim?: boolean }) {
  return (
    <span aria-hidden="true" className={`tau-display inline-flex font-bold leading-none ${dim ? 'text-[#35331c]/25' : ''}`}>
      {[...text].map((ch, i) => (
        <span key={i} className={`inline-block text-center ${/\d/.test(ch) ? 'w-[0.6em]' : 'w-[0.3em]'}`}>{ch}</span>
      ))}
    </span>
  );
}

/**
 * 最上面一列：左邊回這款的首頁（選模式那頁），中間標題與回合，右邊聲音與說明。
 * 三欄各佔 1fr：左右圓鈕數量不同（1 顆對 2 顆），用 justify-between 標題會被擠歪（虎羊棋的教訓）。
 */
export function PlayHeader({ onHome, sub, wide, onHelp }: { onHome: () => void; sub: string; wide?: string; onHelp: () => void }) {
  const t = useTextTable(TEXT);
  const g = useGameText();
  const { prefs, setPrefs } = useSound();
  return (
    <header className="grid shrink-0 grid-cols-[1fr_auto_1fr] items-center gap-2 lg:mx-auto lg:w-full lg:max-w-[1040px]">
      <button type="button" onClick={onHome} aria-label={t.home} className={`${roundBtn} justify-self-start`}><LuHouse aria-hidden="true" /></button>
      <div className="min-w-0 text-center">
        <h1 className="truncate text-lg font-black leading-tight">{t.title}</h1>
        <p className="truncate text-[11px] font-bold text-ink-soft sm:text-xs">
          {sub}
          {/* 窄手機上放不下第三段（日文會被截掉），難度、連線在對局中也不是必要資訊 */}
          {wide && <span className="hidden sm:inline"> · {wide}</span>}
        </p>
      </div>
      <div className="flex gap-1 justify-self-end sm:gap-1.5">
        <button type="button" onClick={() => setPrefs({ sfx: !prefs.sfx })} aria-pressed={prefs.sfx} aria-label={g.sound.button} className={roundBtn}>
          {prefs.sfx ? <LuVolume2 aria-hidden="true" /> : <LuVolumeX aria-hidden="true" />}
        </button>
        <button type="button" onClick={onHelp} aria-label={t.howTo} className={roundBtn}><LuCircleHelp aria-hidden="true" /></button>
      </div>
    </header>
  );
}

/**
 * 競買人名片：方角細框、No. 編號；自己那張紅框。這回合得標的人身上蓋一個紅色成交章。
 * 金幣還在飛過來（flying）：那張的數字先不加、章先不蓋，落下那一刻才出現。
 * marks：倒數開始前誰已經按住了（只有連線在等人時給；開始之後誰還按著是秘密，不給）。
 * label：名片上寫的字（連線是「競買人」，號碼看 No.、自己看紅框），沒給就寫名字。報讀一律用 name。
 */
export function BidderCards({ ref, tokens, me, name, label = name, note, flying, wonSeat, marks, markLabel }: {
  ref?: Ref<HTMLUListElement>;
  tokens: number[];
  me: number;
  name: (seat: number) => string;
  label?: (seat: number) => string;
  note: (seat: number) => string;
  flying: number | null;
  wonSeat: number | null;
  marks?: boolean[];
  markLabel?: string;
}) {
  const t = useTextTable(TEXT);
  const cols = tokens.length <= 2 ? 'grid-cols-2' : tokens.length === 4 ? 'grid-cols-2' : 'grid-cols-3';
  return (
    <ul ref={ref} className={`grid shrink-0 gap-2 ${cols}`}>
      {tokens.map((n, seat) => {
        const incoming = flying === seat;
        const won = wonSeat === seat && !incoming;
        const text = note(seat);
        const marked = !!marks?.[seat];
        return (
          <li key={seat} data-seat={seat} aria-label={`${fill(t.tokensAria, { name: name(seat), n })}${marked && markLabel ? ` · ${markLabel}` : ''}`}
            className={`tau-bidder px-3 py-2 text-[#35331c] ${seat === me ? 'is-me' : ''}`}>
            <div className="flex items-baseline justify-between gap-2">
              <span className="flex min-w-0 items-baseline gap-1.5">
                <span aria-hidden="true" className="tau-display shrink-0 text-[11px] italic text-ink-soft">No.{seat + 1}</span>
                <span className="truncate text-xs font-black">{label(seat)}</span>
              </span>
              <span data-tokens className="text-2xl font-black leading-none">{incoming ? n - 1 : n}</span>
            </div>
            {text && <p className="mt-0.5 truncate text-[11px] font-bold text-ink-soft">{text}</p>}
            {/* 按住了：名片左上角一顆墨點（像拍賣官點到的競買人），倒數一開始全部拿掉 */}
            {marked && <span aria-hidden="true" className="absolute -left-1 -top-1 size-3 rounded-full bg-[#35331c] shadow-[0_0_0_2px_#ebe1b8]" />}
            {won && <span aria-hidden="true" className="tau-stamp absolute -bottom-2.5 -right-1 z-10 text-xs">{t.stampWon}</span>}
          </li>
        );
      })}
    </ul>
  );
}

/** 得標紀錄：拍賣目錄的一行一件 —— 號碼、得標者、點線、秒數。自己得標的那幾行前面一顆紅點 */
export function LotHistory({ pub, me, name }: { pub: PublicRound[]; me: number; name: (seat: number) => string }) {
  const t = useTextTable(TEXT);
  return (
    <div className="flex min-h-[4.5rem] flex-1 flex-col border-y-[3px] border-double border-[#35331c]/60 px-1 pb-1 pt-2">
      <p className="tau-head text-ink-soft">{t.historyTitle}</p>
      {pub.length === 0 ? (
        <p className="mt-1 text-xs font-bold text-ink-soft">{t.historyEmpty}</p>
      ) : (
        <ol className="mt-1 min-h-0 flex-1 overflow-y-auto overscroll-contain">
          {[...pub].reverse().map((r, idx) => {
            const n = pub.length - idx;
            return (
              <li key={n} data-lot={n} className="flex items-baseline gap-2 py-1.5 text-sm font-bold">
                <span className="tau-display w-6 shrink-0 text-xs italic text-ink-soft">{n}</span>
                <span className={`flex min-w-0 shrink items-center gap-1.5 truncate ${r.winner === null ? 'text-ink-soft' : ''}`}>
                  {r.winner === me && <span aria-hidden="true" className={`size-2 shrink-0 rounded-full ${KEY_BG}`} />}
                  {r.winner === null ? (r.top > 0 ? t.historyTie : t.historyNone) : name(r.winner)}
                </span>
                <span aria-hidden="true" className="min-w-4 flex-1 border-b-2 border-dotted border-[#35331c]/25" />
                <span className="tau-display shrink-0 font-bold">{r.top > 0 ? formatTenths(r.top) : '–'}</span>
              </li>
            );
          })}
        </ol>
      )}
    </div>
  );
}

/**
 * 一回合結算的聲音與動作：木槌落下（大螢幕一沉）→ 金幣從大螢幕拋到得標者名片 → 落下時數字加一、成交章蓋下去；
 * 流標大螢幕搖一下。一回合只呼叫一次（不放 effect：重掛、再來一局、重新整理都不會補響）。
 */
export function celebrateRound(r: RoundRecord, me: number, clockEl: HTMLElement | null, seatsEl: HTMLElement | null, setFlying: (f: (x: number | null) => number | null) => void) {
  playTau(r.winner === null ? 'noSale' : r.winner === me ? 'soldYou' : 'sold');
  if (!clockEl || reducedMotion()) return;
  if (r.winner === null) { shake(clockEl); return; }
  thud(clockEl);
  const target = seatsEl?.querySelector<HTMLElement>(`[data-seat="${r.winner}"] [data-tokens]`);
  if (!target) return;
  const seat = r.winner;
  setFlying(() => seat);
  flyCoin(clockEl, target, () => {
    setFlying((f) => (f === seat ? null : f));
    pop(target);
  });
}

/**
 * 按住的操作：手機按住大按鈕、電腦按住空白鍵。切到背景、視窗失焦、手指在別處離開都當作放手（放手永遠算數）。
 * begin 回傳有沒有真的開始（不能開始時 false，按鈕就不抓住這根手指）。
 * 回傳大按鈕要掛的事件；長按不能跳出系統選單、不能選字（按鈕本身另外有 touch-none select-none、-webkit-touch-callout:none）。
 */
export function useHold({ begin, release, holding, blocked }: {
  begin: () => boolean;
  release: () => void;
  /** 還按著沒（事件處理器用，讀 ref） */
  holding: () => boolean;
  /** 有彈窗開著：不能開始（放手照樣算數） */
  blocked: boolean;
}) {
  const pointer = useRef<number | null>(null);
  const letGo = () => { pointer.current = null; if (holding()) release(); };

  const onKey = useEffectEvent((e: KeyboardEvent) => {
    if (e.code !== 'Space' && e.key !== ' ') return;
    // 放手永遠算數 —— 按著空白鍵時跳出彈窗（例如滑鼠點了回首頁），放開也不能被擋下來
    if (e.type === 'keyup') {
      if (holding()) { e.preventDefault(); letGo(); }
      return;
    }
    if (blocked) return;
    const el = e.target instanceof HTMLElement ? e.target : null;
    if (el?.closest('input, textarea, select, [contenteditable="true"]')) return;
    // 不讓空白鍵捲動頁面，也不讓它「按下」目前有焦點的按鈕
    e.preventDefault();
    if (!e.repeat) begin();
  });
  const onAway = useEffectEvent(() => letGo());
  const onPointerEnd = useEffectEvent((e: PointerEvent) => {
    if (pointer.current === e.pointerId) letGo();
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
    window.addEventListener('pagehide', away);
    window.addEventListener('pointerup', up);
    window.addEventListener('pointercancel', up);
    document.addEventListener('visibilitychange', hidden);
    return () => {
      window.removeEventListener('keydown', key);
      window.removeEventListener('keyup', key);
      window.removeEventListener('blur', away);
      window.removeEventListener('pagehide', away);
      window.removeEventListener('pointerup', up);
      window.removeEventListener('pointercancel', up);
      document.removeEventListener('visibilitychange', hidden);
    };
  }, []);

  const onDown = (e: ReactPointerEvent<HTMLButtonElement>) => {
    if (e.pointerType === 'mouse' && e.button !== 0) return;
    if (blocked || !begin()) return;
    pointer.current = e.pointerId;
    try {
      // 手指滑出按鈕不算放手
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // 不支援就靠 window 的 pointerup 補
    }
  };
  const onUp = (e: ReactPointerEvent<HTMLButtonElement>) => {
    if (pointer.current === e.pointerId) letGo();
  };
  return {
    onPointerDown: onDown,
    onPointerUp: onUp,
    onPointerCancel: onUp,
    onLostPointerCapture: onUp,
    onContextMenu: (e: ReactMouseEvent) => e.preventDefault(),
    // 只認按住（pointer）與空白鍵；Enter 觸發的 click 不算
    onClick: (e: ReactMouseEvent) => e.preventDefault(),
  };
}

/** 大按鈕的樣子：紅色鉛字版塊；按住中換墨色加金線、放手之後是作廢的虛線票 */
export const pressClass = (state: 'idle' | 'holding' | 'out') =>
  `tau-press mt-2 flex h-[clamp(6.5rem,17svh,10rem)] w-full max-w-[460px] touch-none select-none flex-col items-center justify-center px-4 text-center [-webkit-touch-callout:none] [-webkit-user-select:none] lg:h-48 ${
    state === 'holding' ? 'is-holding' : state === 'out' ? 'is-out' : ''
  }`;

/**
 * 結算就是分享圖（shareCard.ts）：一頁拍賣目錄的成交紀錄。只留 9:16（Zach 10/24，跟虎羊棋一樣），比例切換就不會出現。
 * 關掉就停在終局的畫面上，「最終排名」再打開；再來一局是主要鈕（連線是再開一間房）。
 * 連線（online）不寫「你」：標題是「競買人 2・第 2 名」、排名表上每個人都寫「競買人」，自己那行看紅點（shareCard 的 me）。
 */
export function AuctionResult({ locale, game, me, name, persona, online = false, kicker, isOpen, onClose, onAgain }: {
  locale: Locale;
  game: AuctionState;
  me: number;
  name: (seat: number) => string;
  /** 電腦的個性（結算才揭曉）；連線沒有 */
  persona?: (seat: number) => string | null;
  online?: boolean;
  /** 最上面一行小字的後兩段（模式・難度、模式・連線） */
  kicker: string;
  isOpen: boolean;
  onClose: () => void;
  onAgain: () => void;
}) {
  const t = useTextTable(TEXT);
  const m = useMessages();
  const g = useGameText();
  const table = standings(game);
  const mine = table.find((r) => r.seat === me);
  const firstCount = table.filter((r) => r.rank === 1).length;
  const title = online ? fill(t.endSeat, { name: name(me), n: mine?.rank ?? 0 })
    : mine?.rank === 1 ? (firstCount > 1 ? t.endTieFirst : t.endWin) : fill(t.endRank, { n: mine?.rank ?? 0 });
  const fmt = formatTenths;
  const latinTitle = t.nameEn === t.title;
  const card: Omit<TauCardData, 'font'> = {
    rows: table.map((r) => ({
      rank: r.rank, no: r.seat + 1, name: online ? t.bidder : name(r.seat), persona: persona?.(r.seat) ?? null,
      tokens: r.tokens, left: fmt(r.remaining), me: r.seat === me,
    })),
    lots: game.history.map((h) => h.winner),
    me,
    won: mine?.rank === 1,
    text: {
      kicker: `${t.standingsTitle} · ${kicker}`,
      title,
      name: latinTitle ? null : t.title,
      you: `${fill(t.tokensAria, { name: online ? name(me) : t.you, n: mine?.tokens ?? 0 })} · ${fill(t.left, { t: fmt(mine?.remaining ?? 0) })}`,
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
    isOpen,
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
    layouts: ['story'],
  });
  const srText = `${t.endBody} ${table.map((r) => `${r.rank}. No.${r.seat + 1} ${name(r.seat)} ${r.tokens} · ${fmt(r.remaining)}`).join(' / ')}`;
  return (
    <ShareResultModal isOpen={isOpen} onClose={onClose} title={title} card={share}
      onRestart={onAgain} restartLabel={t.again} srText={srText}
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
  );
}

