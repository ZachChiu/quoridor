import type { CSSProperties } from 'react';
import type { Seat } from '@/games/balance-mancala/engine';
import { BRASS_DEEP, CLOTH_LIGHT, INK, letterOf, seatLook } from './palette';

/**
 * 一顆子：座位色＋座位字母（不只靠顏色），外圈一道亮布色的縫，疊在哪個盤子上都分得開。
 * `size` 是 CSS 長度（盤面上用 cqw，跟著盤面縮放；面板上用 px／rem）。
 * `count` > 1 時右上角標數字（同一格裡同一個人的子合成一顆顯示時用）。
 */
export default function PieceDisc({ seat, size, count = 1, ring, onBoard = false, className = '', style }: {
  seat: Seat;
  size: string;
  count?: number;
  /** 額外的外框：incoming＝預覽中剛放進來的子、selected＝排序時選中、last＝最後一顆 */
  ring?: 'incoming' | 'selected' | 'last';
  /** 盤面上的子：帶 data-seat，閒置動作（idleMotion.ts）靠它找子、分辨是誰的 */
  onBoard?: boolean;
  className?: string;
  style?: CSSProperties;
}) {
  const look = seatLook(seat);
  const gap = `calc(${size} * 0.09)`;
  const outer = ring === 'incoming' ? `, 0 0 0 calc(${size} * 0.2) ${INK}`
    : ring === 'selected' ? `, 0 0 0 calc(${size} * 0.2) ${INK}`
    : ring === 'last' ? `, 0 0 0 calc(${size} * 0.2) ${BRASS_DEEP}` : '';
  return (
    <span
      aria-hidden="true"
      data-seat={onBoard ? seat : undefined}
      className={`relative grid shrink-0 place-items-center rounded-full font-black leading-none ${className}`}
      style={{
        width: size, height: size, background: look.bg, color: look.fg,
        boxShadow: `0 0 0 ${gap} ${CLOTH_LIGHT}${outer}`,
        fontSize: `calc(${size} * 0.56)`,
        ...style,
      }}
    >
      {letterOf(seat)}
      {count > 1 && (
        <span
          className="absolute grid place-items-center rounded-full font-black leading-none"
          style={{
            right: `calc(${size} * -0.28)`, top: `calc(${size} * -0.28)`,
            width: `calc(${size} * 0.58)`, height: `calc(${size} * 0.58)`,
            fontSize: `calc(${size} * 0.4)`, background: CLOTH_LIGHT, color: INK,
          }}
        >
          {count}
        </span>
      )}
    </span>
  );
}
