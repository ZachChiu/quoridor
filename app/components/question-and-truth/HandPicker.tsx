'use client';
import { useState } from 'react';
import { GiCardRandom } from 'react-icons/gi';
import { fill } from '@/i18n/gameText';
import { HAND_SIZE, SUITS, canPlace, isLegalHand, rankLabel, randomHand, type Card, type Hand, type Suit } from '@/games/question-and-truth/engine';
import type { QtText } from '@/games/question-and-truth/text';
import PlayingCard, { SuitIcon } from './PlayingCard';
import { playPlace } from './sounds';

/**
 * 排一手牌：上面 8 個位置，選一格再從牌堆挑一張放進去；放不進去的（同花色會變成不是遞增、或已經用過）反灰。
 * 放好一張自動跳到下一個空位；點已經選中的那張就拿掉。手機一次看一個花色（4 個分頁），桌機 4 排 × 13 張全攤開。
 * 「隨機排一手」一按就排滿（engine.randomHand 一定合法），可以再一張一張改。
 */
export default function HandPicker({ t, onDone, kicker }: { t: QtText; onDone: (h: Hand) => void; kicker?: string }) {
  const [slots, setSlots] = useState<(Card | null)[]>(() => new Array(HAND_SIZE).fill(null));
  const [at, setAt] = useState(0);
  const [suit, setSuit] = useState<Suit>(0);
  const ready = isLegalHand(slots);

  const place = (card: Card) => {
    const next = slots.map((c, i) => (i === at ? card : c));
    setSlots(next);
    playPlace();
    const after = next.findIndex((c, i) => !c && i > at);
    const any = next.findIndex((c) => !c);
    setAt(after >= 0 ? after : any >= 0 ? any : at);
  };
  const tapSlot = (i: number) => {
    if (i === at && slots[i]) setSlots(slots.map((c, k) => (k === i ? null : c)));
    setAt(i);
  };
  const ok = (card: Card) => canPlace(slots, at, card) && !slots.some((c, i) => i !== at && c && c.suit === card.suit && c.rank === card.rank);
  const used = (card: Card) => slots.some((c) => c && c.suit === card.suit && c.rank === card.rank);

  const rankBtn = (s: Suit, r: number) => {
    const card = { suit: s, rank: r };
    const isUsed = used(card);
    return (
      <button key={`${s}-${r}`} type="button" disabled={!ok(card)} onClick={() => place(card)} aria-label={`${['♠', '♥', '♦', '♣'][s]}${rankLabel(r)}`}
        className={`qt-card flex aspect-[5/6] flex-col items-center justify-center rounded-[4px] transition disabled:opacity-25 ${isUsed ? 'outline outline-2 -outline-offset-2 outline-[var(--qt-gold)]' : ''}`}>
        <span className="text-[15px] font-black tabular-nums leading-none" style={{ color: s === 1 || s === 2 ? 'var(--qt-red)' : 'var(--qt-ink)' }}>{rankLabel(r)}</span>
        <SuitIcon suit={s} className="mt-0.5 size-3 lg:size-3.5" />
      </button>
    );
  };

  return (
    <div className="flex w-full flex-col gap-4">
      <div>
        {kicker && <p className="text-xs font-black tracking-wide text-[var(--qt-gold)]">{kicker}</p>}
        <h2 className="text-2xl font-black lg:text-3xl">{t.pickTitle}</h2>
        <p className="mt-1 text-sm font-bold leading-relaxed opacity-80">{t.pickHint}</p>
      </div>

      {/* 自己那排：外面一圈米白框（畫面上不寫「你」） */}
      <div className="rounded-[8px] p-2 outline outline-2 -outline-offset-2 outline-[var(--qt-fg)] lg:p-3">
        <span className="sr-only">{t.mine}</span>
        <div className="grid grid-cols-8 gap-1 lg:gap-2">
          {slots.map((c, i) => (
            <button key={i} type="button" onClick={() => tapSlot(i)} aria-label={fill(t.pickSlot, { n: i + 1 })} aria-pressed={at === i} className="flex flex-col items-center gap-1">
              <PlayingCard card={c} empty={!c} className="w-full" ring={at === i} />
              <span className={`text-[11px] font-black tabular-nums ${at === i ? 'text-[var(--qt-gold)]' : 'opacity-60'}`}>{i + 1}</span>
            </button>
          ))}
        </div>
      </div>

      {/* 手機：一次一個花色 */}
      <div className="lg:hidden">
        <div role="tablist" className="grid grid-cols-4 gap-1.5">
          {SUITS.map((s) => (
            <button key={s} type="button" role="tab" aria-selected={suit === s} onClick={() => setSuit(s)}
              className={`qt-card grid min-h-11 place-items-center transition ${suit === s ? 'outline outline-[2.5px] outline-offset-2 outline-[var(--qt-gold)]' : 'opacity-50'}`}>
              <SuitIcon suit={s} className="size-6" />
            </button>
          ))}
        </div>
        <div className="mt-2 grid grid-cols-7 gap-1.5">{Array.from({ length: 13 }, (_, i) => rankBtn(suit, i + 1))}</div>
      </div>
      {/* 桌機：整副牌攤開 */}
      <div className="hidden gap-1.5 lg:grid">
        {SUITS.map((s) => <div key={s} className="grid-cols-13 grid gap-1.5" style={{ gridTemplateColumns: 'repeat(13, minmax(0, 1fr))' }}>{Array.from({ length: 13 }, (_, i) => rankBtn(s, i + 1))}</div>)}
      </div>

      <div className="flex gap-2">
        <button type="button" onClick={() => { setSlots(randomHand(Math.random)); setAt(0); playPlace(); }} className="qt-btn is-soft flex flex-1 items-center justify-center gap-2 py-3 text-sm">
          <GiCardRandom aria-hidden="true" className="text-xl" />{t.random}
        </button>
        <button type="button" onClick={() => { setSlots(new Array(HAND_SIZE).fill(null)); setAt(0); }} className="qt-btn is-soft px-4 py-3 text-sm">{t.clear}</button>
        <button type="button" disabled={!ready} onClick={() => ready && onDone(slots as Hand)} className="qt-btn is-ink flex-1 py-3 text-base">{t.done}</button>
      </div>
    </div>
  );
}
