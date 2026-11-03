import type { Seat } from '@/games/question-and-truth/engine';
import type { QtText } from '@/games/question-and-truth/text';
import { SuitIcon } from './PlayingCard';

/** 一方的記號：一小張牌，紅方畫朱紅的方塊（〈方塊 A 的老千〉的那張 A）、黑方畫深墨的黑桃 */
export function SeatMark({ seat, t, className = 'w-5' }: { seat: Seat; t?: QtText; className?: string }) {
  return (
    <span className={`qt-card inline-grid aspect-[5/7] shrink-0 place-items-center rounded-[3px] ${className}`} title={t?.seats[seat]}>
      <SuitIcon suit={seat === 0 ? 2 : 0} className="size-[70%]" />
    </span>
  );
}
