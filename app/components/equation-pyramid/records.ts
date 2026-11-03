'use client';
import { useSyncExternalStore } from 'react';

/**
 * 每日一題的紀錄：哪一天、找到幾組、共幾組、答錯幾次、用了多久（存 localStorage，只在這台裝置上）。
 * 只留最近一次 —— 選單只看「今天做過了沒」。讀寫都包 try：無痕視窗、被擋的儲存空間照樣能玩。
 */
export type DailyRecord = { date: string; found: number; answers: number; wrong: number; ms: number };

const KEY = 'equation-pyramid:daily';
const EVENT = 'equation-pyramid:daily';

function read(): string | null {
  try { return localStorage.getItem(KEY); } catch { return null; }
}

export function saveDaily(r: DailyRecord) {
  try { localStorage.setItem(KEY, JSON.stringify(r)); } catch { /* 存不了就算了 */ }
  window.dispatchEvent(new Event(EVENT));
}

function subscribe(fn: () => void) {
  window.addEventListener(EVENT, fn);
  window.addEventListener('storage', fn);
  return () => { window.removeEventListener(EVENT, fn); window.removeEventListener('storage', fn); };
}

/** 今天的紀錄；沒有（或是別天的）就是 null */
export function useDaily(date: string): DailyRecord | null {
  const raw = useSyncExternalStore(subscribe, read, () => null);
  if (!raw) return null;
  try {
    const r = JSON.parse(raw) as DailyRecord;
    return r.date === date ? r : null;
  } catch { return null; }
}

/** 毫秒 → 「2:31」 */
export function clock(ms: number): string {
  const s = Math.max(0, Math.floor(ms / 1000));
  return `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`;
}
