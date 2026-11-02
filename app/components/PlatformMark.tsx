'use client';

import { useEffect, useRef } from 'react';

/**
 * 平台的標誌：長角的藍色骰子（「骰子惡魔 1」，2026-10-20 試套；品牌名還沒定）。
 *
 * 原圖是 AI 畫的點陣圖，描成向量放在 public/brand/die-mark.svg：點數是一層奶油色、
 * 墊在藍色骰子底下（藍色那層的點數是鏤空的），深底、奶油底上點數都是奶油色，
 * 小尺寸也不會在兩層之間露縫。
 *
 * 每一頁都在同一個位置（左上）、同一個樣子（Zach：平台名都同一邊一個 ICON）：
 * 遊戲首頁只放圖示（40px，跟右上角的圓鈕一樣大），平台首頁在圖示右邊多帶名字。
 * 骰子本身的剪影就夠辨認，所以不再墊圓底。
 *
 * `mono`：各遊戲頁用的單色版（2026-10-25 Zach 從「縮小／縮小＋單色／斜放」裡要「現在的大小＋單色」）——
 * 大小位置不變，換成灰階、半透明，不跟那款自己的配色搶。平台自己的頁面（首頁、季目錄、404）照舊是藍色。
 * 灰色是另一張圖 die-mark-gray.svg（顏色照比較圖上的 grayscale＋brightness＋contrast 算好寫死），
 * 不在 <img> 上加 filter —— iPhone 會漏畫（虎棋圓牌踩過）。
 * 滑過、按下去、鍵盤 focus 時變回藍色（同一天 Zach：「HOVER 或點下去要變回正常顏色」）：
 * 藍色那張疊在灰色上面、平常透明，外面那顆連結要帶 `group`。滑過只給滑鼠（fine:），手指點過會一直停在 :hover；
 * 按下去那一下不淡入、直接換，手指按著的時間很短。
 *
 * 閃電（11/1 Zach 挑的「打雷」）：平常不亮，「啪啪」亮兩下（偶爾三下）就暗回去，隔 4–11 秒（隨機）再閃
 *（同一天 Zach：「閃兩下再久一點再閃、頻率隨機一點」—— CSS 動畫只能固定節奏，所以由 useBolt 排時間）。
 * 只有骰子本身變亮，不往外暈開（Zach：「不要有暈開的外面效果」）；遊戲頁的灰骰子閃的那一下換成藍色那張（另一層，不動滑過時變藍的那層）。
 * 用 element.animate() 只動 filter／opacity；減少動態效果時不閃。
 */
const BOLT_GAP = [4000, 11000];

/** 一次閃電：亮、暗、再亮（偶爾多一下），約 0.6 秒 */
function flashFrames(mono: boolean, times: number): Keyframe[] {
  const on = (b: number): Keyframe => (mono ? { opacity: 1, filter: `brightness(${b})` } : { filter: `brightness(${b})` });
  const off: Keyframe = mono ? { opacity: 0, filter: 'none' } : { filter: 'none' };
  const frames: Keyframe[] = [off];
  for (let i = 0; i < times; i++) frames.push(on(i === 0 ? 1.6 : 1.5), mono ? { opacity: 0.1, filter: 'none' } : off);
  frames[frames.length - 1] = mono ? { opacity: 0.6, filter: 'brightness(1.2)' } : { filter: 'brightness(1.2)' };
  frames.push(off);
  return frames;
}

function useBolt(mono: boolean) {
  const ref = useRef<HTMLImageElement>(null);
  useEffect(() => {
    const el = ref.current;
    if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
    let timer = 0;
    const next = (min: number, max: number) => {
      timer = window.setTimeout(() => {
        const times = Math.random() < 0.25 ? 3 : 2;
        el.animate(flashFrames(mono, times), { duration: 260 + times * 170, easing: 'linear' });
        next(BOLT_GAP[0], BOLT_GAP[1]);
      }, min + Math.random() * (max - min));
    };
    next(1500, 5000);
    return () => window.clearTimeout(timer);
  }, [mono]);
  return ref;
}

export default function PlatformMark({ className = '', mono = false }: { className?: string; mono?: boolean }) {
  const bolt = useBolt(mono);
  if (!mono) {
    return (
      <span aria-hidden="true" className={`relative block size-10 shrink-0 ${className}`}>
        {/* eslint-disable-next-line @next/next/no-img-element -- 靜態匯出、SVG，不需要 next/image */}
        <img src="/brand/die-mark.svg" alt="" width={40} height={40} ref={bolt} className="relative size-10" />
      </span>
    );
  }
  return (
    <span aria-hidden="true" className={`relative block size-10 shrink-0 ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element -- 同上 */}
      <img src="/brand/die-mark-gray.svg" alt="" width={40} height={40} className="absolute inset-0 size-10 opacity-50" />
      {/* 閃電那一下換成藍的（useBolt），跟下面滑過變藍那層分開 */}
      {/* eslint-disable-next-line @next/next/no-img-element -- 同上 */}
      <img src="/brand/die-mark.svg" alt="" width={40} height={40} ref={bolt} className="absolute inset-0 size-10 opacity-0" />
      {/* eslint-disable-next-line @next/next/no-img-element -- 同上 */}
      <img src="/brand/die-mark.svg" alt="" width={40} height={40}
        className="absolute inset-0 size-10 opacity-0 transition-opacity duration-150 group-focus-visible:opacity-100 group-active:opacity-100 group-active:duration-0 fine:group-hover:opacity-100" />
    </span>
  );
}
