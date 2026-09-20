'use client'
import React from 'react';
import type { IconType } from 'react-icons';

/**
 * 首頁的撞色選擇磁磚。
 *
 * 刻意是純平面：厚描邊 + 實色，不打陰影也不做漸層 —— 立體感由描邊與
 * 色塊之間的衝突承擔，而不是靠模擬光源。
 *
 * 文字色由呼叫端指定而非自動推導：暖色磁磚配黑墨、冷色配米白，
 * 是逐一量過對比度的結果（見 globals.css 的註記），交給程式猜會出錯。
 */
export type TileTone = 'amber' | 'orange' | 'red' | 'blue' | 'purple' | 'forest';

const TONE: Record<TileTone, string> = {
  amber: 'bg-tile-amber text-tile-ink',
  orange: 'bg-tile-orange text-tile-ink',
  red: 'bg-tile-red text-tile-cream',
  blue: 'bg-tile-blue text-tile-cream',
  purple: 'bg-tile-purple text-tile-cream',
  forest: 'bg-tile-forest text-tile-cream',
};

interface Props {
  icon: IconType;
  /** 上方的小字，例如「本機」。省略時只顯示主標。 */
  kicker?: string;
  label: string;
  tone: TileTone;
  onClick: () => void;
  disabled?: boolean;
  /** 橫跨整列的寬磁磚（不強制正方形）。 */
  wide?: boolean;
  /**
   * 滑鼠移入或取得焦點時觸發，用來預熱。
   * 連線那兩塊會在這裡先把 Firebase SDK 載起來並匿名登入 ——
   * 等按下去才開始載，使用者會乾等一到兩秒。
   */
  onPrefetch?: () => void;
}

export default function GameTile({
  icon: Icon, kicker, label, tone, onClick, disabled, wide, onPrefetch,
}: Props) {
  return (
    <button
      type="button"
      onClick={disabled ? undefined : onClick}
      onPointerEnter={onPrefetch}
      onFocus={onPrefetch}
      disabled={disabled}
      className={`${TONE[tone]} ${wide ? 'col-span-2 flex-row gap-3 py-4' : 'aspect-square flex-col gap-2'}
        flex items-center justify-center rounded-2xl p-3
        transition enabled:hover:brightness-95 enabled:active:scale-[0.97]
        disabled:cursor-not-allowed disabled:opacity-45`}
    >
      <Icon className={wide ? 'shrink-0 text-4xl' : 'text-7xl md:text-8xl'} aria-hidden="true" />
      <span className={wide ? 'text-lg font-black' : 'flex flex-col items-center'}>
        {!wide && kicker && (
          <span className="text-xs font-bold opacity-75 md:text-sm">{kicker}</span>
        )}
        <span className={wide ? '' : 'text-lg font-black leading-tight md:text-xl'}>{label}</span>
      </span>
    </button>
  );
}
