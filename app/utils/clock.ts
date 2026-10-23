import type { PlayerKey } from '@/config/players';

/** 累計思考時間的寫法：3:07、1:02:45 */
export function fmtClock(ms: number): string {
  const sec = Math.round(ms / 1000);
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const ss = String(sec % 60).padStart(2, '0');
  return h ? `${h}:${String(m).padStart(2, '0')}:${ss}` : `${m}:${ss}`;
}

/**
 * 對局中的時鐘（Zach 10/23：「桌機版沒看到下棋時間的計時」、「整體時長也可以計時嗎」）。
 * acc 是已經記下來的各方時間；running 是現在輪到、正在走秒的那一方，從 since 開始算，
 * 現在幾點用 now() 問（連線是伺服器時間 serverNow，本機是 Date.now）。
 * 整局時長＝各方加起來：輪到誰誰就在走秒，一局裡沒有「沒人在想」的空檔。
 */
export type LiveClock = {
  acc: Partial<Record<PlayerKey, number>>;
  running: PlayerKey | null;
  since: number;
  now: () => number;
};

/** 某一方此刻的時間。單一回合最多算一小時（跟連線的寫路徑一樣，掛機一整晚不會變成十幾小時） */
export function clockOf(c: LiveClock, p: PlayerKey, now: number): number {
  const run = c.running === p && now ? Math.min(Math.max(now - c.since, 0), 3600_000) : 0;
  return (c.acc[p] ?? 0) + run;
}
