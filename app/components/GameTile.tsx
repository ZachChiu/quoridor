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

export type TileOrigin = {
  rect: DOMRect;
  color: string;
  icon: IconType;
  /** 圖示在這塊磁磚上的實際像素高度 —— 轉場照這個畫，才不會大小對不上 */
  iconSize?: number;
  label: string;
  kicker?: string;
  row?: boolean;
  iconColor: string;
  fg: string;
};

const TONE: Record<TileTone, string> = {
  amber: 'bg-tile-amber text-tile-ink',
  orange: 'bg-tile-orange text-tile-ink',
  red: 'bg-tile-red text-tile-cream',
  blue: 'bg-tile-blue text-tile-cream',
  purple: 'bg-tile-purple text-tile-cream',
  forest: 'bg-tile-forest text-tile-cream',
};

/**
 * 圖示的填色。每一格都挑一個與底色色相離得遠的 —— 圖示本身也要撞色，
 * 而不只是被動地用底色的對比色。文字仍照 TONE 走，不跟著圖示變。
 */
/** 磁磚底色的實際色值。轉場要用它把畫面染成「你按的那一塊」的顏色。 */
export const TONE_COLOR: Record<TileTone, string> = {
  amber: 'rgb(var(--tile-amber))',
  orange: 'rgb(var(--tile-orange))',
  red: 'rgb(var(--tile-red))',
  blue: 'rgb(var(--tile-blue))',
  purple: 'rgb(var(--tile-purple))',
  forest: 'rgb(var(--tile-forest))',
};

/** 磁磚上文字的色值。TONE 用的是 Tailwind class，轉場層需要實際顏色。 */
const TEXT_COLOR: Record<TileTone, string> = {
  amber: 'rgb(var(--tile-ink))',
  orange: 'rgb(var(--tile-ink))',
  red: 'rgb(var(--tile-cream))',
  blue: 'rgb(var(--tile-cream))',
  purple: 'rgb(var(--tile-cream))',
  forest: 'rgb(var(--tile-cream))',
};

const ICON_FILL: Record<TileTone, string> = {
  amber: 'rgb(var(--tile-blue))',
  orange: 'rgb(var(--tile-blue))',
  red: 'rgb(var(--tile-cream))',
  blue: 'rgb(var(--tile-amber))',
  purple: 'rgb(var(--tile-amber))',
  forest: 'rgb(var(--tile-amber))',
};

interface Props {
  icon: IconType;
  /** 上方的小字，例如「本機」。省略時只顯示主標。 */
  kicker?: string;
  label: string;
  tone: TileTone;
  /**
   * 收到這塊磁磚的位置、底色、圖示與文字 —— 轉場用它當起點。
   *
   * 不只給座標，是因為轉場的第一格要和這塊磁磚長得一模一樣：
   * 同樣的矩形、同樣的圓角、同樣的圖示與字。看起來才是「這塊打開了」，
   * 而不是「有一個圓從這附近冒出來」。
   */
  onClick: (origin: TileOrigin) => void;
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
      onClick={disabled ? undefined : (e) => onClick({
        rect: e.currentTarget.getBoundingClientRect(),
        color: TONE_COLOR[tone],
        icon: Icon, label, kicker, row: wide,
        // 直接量畫面上那顆圖示，而不是把 text-7xl / md:text-8xl 的斷點
        // 邏輯在轉場那邊再推一次 —— 推錯了就是大小對不上。
        iconSize: e.currentTarget.querySelector('svg')?.getBoundingClientRect().height,
        iconColor: ICON_FILL[tone], fg: TEXT_COLOR[tone],
      })}
      onPointerEnter={onPrefetch}
      onFocus={onPrefetch}
      disabled={disabled}
      style={{ '--tile-icon-fill': ICON_FILL[tone] } as React.CSSProperties}
      className={`${TONE[tone]} ${wide ? 'col-span-2 flex-row gap-3 py-4' : 'aspect-square flex-col gap-2'}
        group flex items-center justify-center rounded-2xl p-3
        transition enabled:hover:brightness-95 enabled:active:scale-[0.97]
        disabled:cursor-not-allowed disabled:opacity-45`}
    >
      {/* tile-icon 管填色，tile-icon-anim 管 hover 時那下輕晃。
          晃動只在有 hover 的裝置上啟用（見 globals.css）—— 手機沒有 hover，
          而這個效果不承擔任何說明責任，看不到也不會少懂什麼。 */}
      <Icon
        className={`tile-icon tile-icon-anim ${wide ? 'shrink-0 text-4xl' : 'text-7xl md:text-8xl'}`}
        aria-hidden="true"
      />
      <span className={wide ? 'text-lg font-black' : 'flex flex-col items-center'}>
        {!wide && kicker && (
          <span className="text-xs font-bold opacity-75 md:text-sm">{kicker}</span>
        )}
        <span className={wide ? '' : 'text-lg font-black leading-tight md:text-xl'}>{label}</span>
      </span>
    </button>
  );
}
