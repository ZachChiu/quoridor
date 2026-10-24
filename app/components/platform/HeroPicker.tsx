'use client';
import { useRef } from 'react';
import { useIsoLayoutEffect } from '@/hook/useIsoLayoutEffect';

const KEY = 'platform:last-game';

/** 把大卡片換成使用者上次點的那一款（有那一款的大卡片才換） */
const PICK = `try{var r=document.currentScript.parentElement,k=localStorage.getItem('${KEY}');if(k&&r.querySelector('[data-slide="'+CSS.escape(k)+'"]'))r.setAttribute('data-hero-pick',k)}catch(e){}`;

/**
 * 平台首頁的大卡片放哪一款（10/24 Zach：預設放最新上線的；使用者點過哪一款 —— 要真的點過 —— 就換成那一款）。
 *
 * 每一款能玩的遊戲都有一張大卡片在 HTML 裡，外層的 `data-hero-pick` 決定露出哪一張（CSS 在 PlatformView）。
 * 靜態 HTML 是最新上線的那張；這裡在畫面出來之前換成上次點的：
 * - 整頁載入：內嵌 script 在解析到這裡時就換掉（JS 還沒下載，effect 擋不住閃一下）—— 跟 SoloClient 隱藏難度選單同一招
 * - 站內換頁回到平台（內嵌 script 不會再跑）：layout effect 再換一次
 * 「點過」只算真的按下去的那一下（click，滑鼠或鍵盤都會觸發），滑過、預載不算；記的是那一款的站內路徑（卡片上的 `data-game`）。
 * 存在 localStorage，只是這台裝置的小偏好：讀不到（私密模式、被擋）就照預設。
 */
export default function HeroPicker() {
  const ref = useRef<HTMLScriptElement>(null);
  useIsoLayoutEffect(() => {
    const root = ref.current?.parentElement;
    if (!root) return;
    try {
      const k = localStorage.getItem(KEY);
      if (k && root.querySelector(`[data-slide="${CSS.escape(k)}"]`)) root.setAttribute('data-hero-pick', k);
    } catch { /* 讀不到就照預設 */ }
    const remember = (e: MouseEvent) => {
      const game = (e.target as Element | null)?.closest?.('a[data-game]')?.getAttribute('data-game');
      if (!game) return;
      try { localStorage.setItem(KEY, game); } catch { /* 存不了就算了 */ }
    };
    document.addEventListener('click', remember, true);
    return () => document.removeEventListener('click', remember, true);
  }, []);
  return <script ref={ref} dangerouslySetInnerHTML={{ __html: PICK }} />;
}
