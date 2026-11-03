import { isRedSuit, rankLabel, type Card, type Suit } from '@/games/question-and-truth/engine';

/**
 * 牌與花色。照〈方塊 A 的老千〉裡的牌：素白小牌、點數平塗（紅花色朱紅、黑花色深墨），沒有描邊。
 * 手機上要認得出來，所以點數字放大、花色畫在下面。牌背是朱紅菱形格（.qt-back）。
 * 不放 'use client'：伺服器元件（說明、首頁）也畫得了。
 */
const SUIT_PATH: Record<Suit, string> = {
  0: 'M12 2.5C9.2 6.3 4 9.2 4 13.4a3.9 3.9 0 0 0 6.6 2.8L9.6 21.5h4.8l-1-5.3A3.9 3.9 0 0 0 20 13.4c0-4.2-5.2-7.1-8-10.9z',
  1: 'M12 21s-8.2-5.2-8.2-11.1A4.4 4.4 0 0 1 12 7.3a4.4 4.4 0 0 1 8.2 2.6C20.2 15.8 12 21 12 21z',
  2: 'M12 2.2l7.2 9.8-7.2 9.8-7.2-9.8z',
  3: 'M12 2.8a3.7 3.7 0 0 0-3.3 5.4 3.7 3.7 0 1 0 1.7 6.4l-1 6.9h5.2l-1-6.9a3.7 3.7 0 1 0 1.7-6.4A3.7 3.7 0 0 0 12 2.8z',
};

export const suitColor = (s: Suit) => (isRedSuit(s) ? 'var(--qt-red)' : 'var(--qt-ink)');

export function SuitIcon({ suit, className = 'size-4', color }: { suit: Suit; className?: string; color?: string }) {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={className}>
      <path d={SUIT_PATH[suit]} fill={color ?? suitColor(suit)} />
    </svg>
  );
}

/** 文字裡的花色：一小片牌紙上畫花色（黑底上的黑桃才看得到） */
export function SuitChip({ suit, className = '' }: { suit: Suit; className?: string }) {
  return (
    <span className={`qt-card inline-grid size-[1.25em] shrink-0 place-items-center rounded-[3px] align-[-0.2em] ${className}`}>
      <SuitIcon suit={suit} className="size-[0.95em]" />
    </span>
  );
}

export const SUIT_NAMES = ['♠', '♥', '♦', '♣'] as const;

export default function PlayingCard({ card, back = false, className = 'w-12', dim = false, ring = false, empty = false, label }: {
  card?: Card | null;
  back?: boolean;
  className?: string;
  dim?: boolean;
  /** 外面一圈朱紅（選中、說對的那張） */
  ring?: boolean;
  /** 空位（排牌時還沒放） */
  empty?: boolean;
  label?: string;
}) {
  const base = `relative aspect-[5/7] shrink-0 ${className} ${ring ? 'outline outline-[2.5px] outline-offset-2 outline-[var(--qt-red)]' : ''} ${dim ? 'opacity-40' : ''}`;
  if (empty || !card) {
    return back
      ? <span className={`qt-back block ${base}`} aria-label={label} />
      : <span className={`block rounded-[4px] border-2 border-dashed border-[color-mix(in_srgb,var(--qt-fg)_35%,transparent)] ${base}`} aria-label={label} />;
  }
  const red = isRedSuit(card.suit);
  return (
    <span className={`qt-card flex flex-col items-center justify-center [container-type:inline-size] ${base}`} aria-label={label}>
      <span className="text-[clamp(0.85rem,44cqw,2.6rem)] font-black tabular-nums leading-none" style={{ color: red ? 'var(--qt-red)' : 'var(--qt-ink)' }}>
        {rankLabel(card.rank)}
      </span>
      <SuitIcon suit={card.suit} className="mt-[6%] size-[38%]" />
    </span>
  );
}
