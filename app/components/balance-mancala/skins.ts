'use client';
import { useSyncExternalStore } from 'react';

/**
 * 試做（explore/mancala-skins，11/2 Zach：「設計總表上那幾個方向有可能做出來嗎」）：同一套程式換三種皮，
 * localStorage 'mcl-style' 選（adinkra＝現況／wood＝木雕版／hours＝祈禱書版），畫面最下方也有一排切換。
 *
 * 顏色全部從原件取樣（k-means，scratchpad/mcl/src/km.cjs），不自己調：
 * - 木雕版：Wikimedia Commons〈Bao players in stone town zanzibar.jpg〉（公有領域）—— 石灰牆 #c7d2d5、亮處 #ebeef1、
 *   木頭棋盤 #26252f、烏木 #13151c、牆腳的靛藍 #222c3c／藍灰 #697f90、種子 #a6a9aa、紅帽 #4d3137；
 *   外框的格紋照〈A carved door in Zanzibar〉（1920 照片，公有領域）門框那圈菱格，與棋盤邊上刻的三角帶
 * - 祈禱書版：克里夫蘭美術館〈Leaf from a Book of Hours: The Last Judgment〉1430s（1999.130，CC0）——
 *   羊皮紙 #eedec1／#f5ecd9、墨 #3f3833、褐 #68593f、金 #d2ae67／#9c7436、金底格紋的暗部 #433828、
 *   朱紅 #ac6744、綠 #628a54、群青 #3f5063
 *
 * 盤子的紅藍綠、座位色是規則，三種皮都不換。
 */
export type MclSkin = 'adinkra' | 'wood' | 'hours';
export const SKIN_IDS: MclSkin[] = ['adinkra', 'wood', 'hours'];

type Hex = {
  cloth: string; clothLight: string; ink: string; inkSoft: string;
  brass: string; brassDeep: string; wood: string;
  /** 主要鈕（黃銅牌的位置）的底與字 */
  plaque: string; plaqueFg: string;
  /** 惡魔格的底 */
  devil: string;
};

export const SKINS: Record<MclSkin, Hex & { frame: string; keyArt: string; keyRatio: number; card: string; label: string }> = {
  adinkra: {
    cloth: '#ebd2cb', clothLight: '#fef2ec', ink: '#201211', inkSoft: '#5e4b3f', brass: '#af9b71', brassDeep: '#856f4c', wood: '#362522',
    plaque: '#af9b71', plaqueFg: '#201211', devil: '#201211',
    frame: "url('/games/balance-mancala/frame.png') 84 / var(--mcl-frame, 28px) round",
    keyArt: '/games/balance-mancala/weights.webp', keyRatio: 1000 / 264, card: '/games/balance-mancala/card.webp', label: '現況',
  },
  wood: {
    cloth: '#c7d2d5', clothLight: '#ebeef1', ink: '#13151c', inkSoft: '#3e383f', brass: '#a6a9aa', brassDeep: '#475d73', wood: '#26252f',
    plaque: '#222c3c', plaqueFg: '#ebeef1', devil: '#4d3137',
    frame: "url('/games/balance-mancala/skins/wood-frame.svg') 28 / var(--mcl-frame, 28px) round",
    keyArt: '/games/balance-mancala/skins/wood-key.webp', keyRatio: 1000 / 500, card: '/games/balance-mancala/skins/wood-card.webp', label: '木雕版',
  },
  hours: {
    cloth: '#eedec1', clothLight: '#f5ecd9', ink: '#3f3833', inkSoft: '#68593f', brass: '#d2ae67', brassDeep: '#9c7436', wood: '#433828',
    plaque: '#d2ae67', plaqueFg: '#3f3833', devil: '#ac6744',
    frame: "url('/games/balance-mancala/skins/hours-frame.svg') 28 / var(--mcl-frame, 28px) round",
    keyArt: '/games/balance-mancala/skins/hours-key.webp', keyRatio: 1000 / 560, card: '/games/balance-mancala/skins/hours-card.webp', label: '祈禱書版',
  },
};

const rgb = (hex: string) => [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)).join(' ');
const KEBAB: Record<keyof Hex, string> = {
  cloth: 'cloth', clothLight: 'cloth-light', ink: 'ink', inkSoft: 'ink-soft', brass: 'brass', brassDeep: 'brass-deep', wood: 'wood',
  plaque: 'plaque', plaqueFg: 'plaque-fg', devil: 'devil',
};

const read = (): MclSkin => {
  try {
    const v = localStorage.getItem('mcl-style');
    return v === 'wood' || v === 'hours' ? v : 'adinkra';
  } catch { return 'adinkra'; }
};

/** 把那一套顏色寫到 <html> 上（彈窗是 portal 到 body，所以不寫在 .mcl-root） */
export function applySkin(skin: MclSkin) {
  const s = SKINS[skin];
  const st = document.documentElement.style;
  for (const k of Object.keys(KEBAB) as (keyof Hex)[]) {
    st.setProperty(`--mcl-${KEBAB[k]}`, s[k]);
    st.setProperty(`--mcl-${KEBAB[k]}-rgb`, rgb(s[k]));
  }
  st.setProperty('--mcl-border-image', s.frame);
  st.setProperty('--ink-soft', s.inkSoft);
  document.documentElement.dataset.mclSkin = skin;
}

export function clearSkin() {
  const st = document.documentElement.style;
  for (const k of Object.values(KEBAB)) { st.removeProperty(`--mcl-${k}`); st.removeProperty(`--mcl-${k}-rgb`); }
  st.removeProperty('--mcl-border-image');
  st.removeProperty('--ink-soft');
  delete document.documentElement.dataset.mclSkin;
}

const listeners = new Set<() => void>();
export function setSkin(skin: MclSkin) {
  try { localStorage.setItem('mcl-style', skin); } catch { /* 無痕模式：只換這一頁 */ }
  applySkin(skin);
  listeners.forEach((l) => l());
}

export function useMclSkin(): MclSkin {
  return useSyncExternalStore(
    (l) => { listeners.add(l); return () => listeners.delete(l); },
    read,
    () => 'adinkra',
  );
}
