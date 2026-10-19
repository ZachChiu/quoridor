import { useMemo, useSyncExternalStore } from 'react';
import { isSize } from '@/games/knights-tour/engine';

/**
 * 最佳紀錄，存在這台裝置的 localStorage（不上傳、沒有排行榜）。
 *
 * - show：節目挑戰三關的總時間
 * - practice-N：練習模式 N×N 從放下騎士到走完的時間（用過提示的那一局不算）
 *
 * 存取一律包 try/catch：無痕模式或封鎖網站資料時 localStorage 會丟錯，那時就是沒有紀錄，遊戲照玩。
 * 讀取用 useSyncExternalStore 而不是 useEffect + setState（跟 hook/useCoarsePointer 同一個理由）：
 * 靜態 HTML 裡沒有紀錄，瀏覽器接手時同一輪就拿到正確值。
 */
const KEY = 'knights-tour:best';

export type RecordKey = 'show' | `practice-${number}`;
export type BestTimes = Partial<Record<RecordKey, number>>;

export const practiceKey = (n: number): RecordKey => `practice-${n}`;

const listeners = new Set<() => void>();

function readRaw(): string | null {
  try { return localStorage.getItem(KEY); } catch { return null; }
}

function parse(raw: string | null): BestTimes {
  if (!raw) return {};
  try {
    const value: unknown = JSON.parse(raw);
    if (!value || typeof value !== 'object') return {};
    const out: BestTimes = {};
    for (const [k, ms] of Object.entries(value)) {
      const ok = k === 'show' || (/^practice-\d+$/.test(k) && isSize(Number(k.slice(9))));
      if (ok && typeof ms === 'number' && Number.isFinite(ms) && ms > 0) out[k as RecordKey] = ms;
    }
    return out;
  } catch {
    return {};
  }
}

function subscribe(onChange: () => void) {
  listeners.add(onChange);
  // 另一個分頁破了紀錄也跟著更新
  const onStorage = (e: StorageEvent) => { if (e.key === KEY) onChange(); };
  window.addEventListener('storage', onStorage);
  return () => {
    listeners.delete(onChange);
    window.removeEventListener('storage', onStorage);
  };
}

export function useBestTimes(): BestTimes {
  const raw = useSyncExternalStore(subscribe, readRaw, () => null);
  return useMemo(() => parse(raw), [raw]);
}

/**
 * 記一次完成時間。比原本的快（或原本沒有）就寫入：isNew 是「真的寫進去了」，
 * 存不進去（無痕模式）就不說是新紀錄。previous 是這次之前的紀錄。
 */
export function saveBest(key: RecordKey, ms: number): { isNew: boolean; previous?: number } {
  const best = parse(readRaw());
  const previous = best[key];
  if (previous !== undefined && previous <= ms) return { isNew: false, previous };
  try {
    localStorage.setItem(KEY, JSON.stringify({ ...best, [key]: ms }));
  } catch {
    return { isNew: false, previous };
  }
  listeners.forEach((fn) => fn());
  return { isNew: true, previous };
}
