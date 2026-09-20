'use client'
import React from 'react';
import { ButtonHTMLAttributes } from 'react';

interface IconButtonProps {
  children: React.ReactNode;
  type?: ButtonHTMLAttributes<HTMLButtonElement>['type'];
  /** 覆寫底色與文字色，例如 `bg-tile-amber text-tile-ink`。省略時是深墨色籌碼。 */
  color?: string;
  handleClickEvent?: () => void;
  /** 無障礙名稱。icon 沒有文字，少了它螢幕閱讀器只會念「按鈕」。 */
  label?: string;
}

/**
 * 圓形圖示按鈕。
 *
 * 改版後不再有外框與陰影，底色本身就是唯一的識別 —— 因此預設是深墨色籌碼，
 * 在奶油底上一眼可見。不要再給它 bg-white：那在奶油底上等於隱形。
 */
const IconButton: React.FC<IconButtonProps> = ({
  type = 'button', handleClickEvent, children, color, label,
}) => {
  return (
    <button
      type={type}
      aria-label={label}
      onClick={handleClickEvent}
      className={`${color ?? 'bg-tile-ink text-tile-cream'} relative cursor-pointer rounded-full p-3.5 text-2xl transition hover:brightness-125 active:scale-95`}
    >
      {children}
    </button>
  );
};

export default IconButton;
