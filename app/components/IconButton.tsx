'use client'
import React from 'react';
import { ButtonHTMLAttributes } from 'react';

interface IconButtonProps {
  children: React.ReactNode;
  type?: ButtonHTMLAttributes<HTMLButtonElement>['type'];
  /** 覆寫底色與文字色，例如 `bg-primary-50 text-tile-ink`。省略時是深墨色籌碼。 */
  color?: string;
  handleClickEvent?: () => void;
  /** 無障礙名稱。icon 沒有文字，少了它螢幕閱讀器只會念「按鈕」。 */
  label?: string;
  /** 電腦版滑鼠移上去（或用鍵盤移到）時，按鈕下方浮出這段字。通常就是 label */
  tip?: string;
}

/**
 * 圖示按鈕下方的小字提示（Zach 10/22：左上角的首頁、遊玩方式在電腦版 hover 要看得出是什麼）。
 * 只給滑鼠（fine:group-hover）—— 觸控沒有真的 hover，點過會一直停在 :hover。鍵盤移到時也出現。
 * 父元素要有 `group relative`。字已經在 aria-label 裡，這裡 aria-hidden 免得念兩次。
 */
export const HOVER_TIP =
  'pointer-events-none absolute left-1/2 top-full z-50 mt-2 -translate-x-1/2 whitespace-nowrap rounded-lg bg-tile-ink px-2.5 py-1 text-xs font-bold text-tile-cream opacity-0 transition-opacity fine:group-hover:opacity-100 group-focus-visible:opacity-100';

/**
 * 圓形圖示按鈕。
 *
 * 改版後不再有外框與陰影，底色本身就是唯一的識別 —— 因此預設是深墨色籌碼，
 * 在奶油底上一眼可見。不要再給它 bg-white：那在奶油底上等於隱形。
 */
const IconButton: React.FC<IconButtonProps> = ({
  type = 'button', handleClickEvent, children, color, label, tip,
}) => {
  return (
    <button
      type={type}
      aria-label={label}
      onClick={handleClickEvent}
      className={`${color ?? 'bg-tile-ink text-tile-cream'} group relative cursor-pointer rounded-full p-3.5 text-2xl transition hover:brightness-125 active:scale-95`}
    >
      {children}
      {tip && <span aria-hidden="true" className={HOVER_TIP}>{tip}</span>}
    </button>
  );
};

export default IconButton;
