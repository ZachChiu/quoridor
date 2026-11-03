'use client';
import { useSyncExternalStore } from 'react';
import type { Question } from '@/games/question-and-truth/engine';

/**
 * 每日一手的進度（存 localStorage，只在這台裝置上）：哪一天、問過哪些題、報過哪些真相。
 * 回答不存 —— 那一天的牌由日期決定，重播一次就得到同樣的回答。重整、關掉再開都接得回來；說中之後選單寫花了幾枚。
 * 讀寫都包 try：無痕視窗、被擋的儲存空間照樣能玩（只是存不了）。
 */
export type DailyProgress = { date: string; asks: Question[]; guesses: { guess: number[]; after: number }[]; spent?: number; solved?: boolean };

const KEY = 'question-and-truth:daily';
const EVENT = 'question-and-truth:daily';

function read(): string | null {
  try { return localStorage.getItem(KEY); } catch { return null; }
}

export function saveDaily(p: DailyProgress) {
  try { localStorage.setItem(KEY, JSON.stringify(p)); } catch { /* 存不了就算了 */ }
  window.dispatchEvent(new Event(EVENT));
}

export function loadDaily(date: string): DailyProgress | null {
  const raw = read();
  if (!raw) return null;
  try {
    const p = JSON.parse(raw) as DailyProgress;
    return p.date === date ? p : null;
  } catch { return null; }
}

function subscribe(fn: () => void) {
  window.addEventListener(EVENT, fn);
  window.addEventListener('storage', fn);
  return () => { window.removeEventListener(EVENT, fn); window.removeEventListener('storage', fn); };
}

/** 選單用：今天說中了沒、花了幾枚 */
export function useDailyDone(date: string): number | null {
  const raw = useSyncExternalStore(subscribe, read, () => null);
  if (!raw) return null;
  try {
    const p = JSON.parse(raw) as DailyProgress;
    return p.date === date && p.solved && typeof p.spent === 'number' ? p.spent : null;
  } catch { return null; }
}
