/**
 * 平台上還沒做的遊戲卡的「想玩」（2026-11-01 Zach：「遊戲上可以點 WANT…存在裝置上避免他一直去點」，人數公開顯示）。
 *
 * RTDB：
 *   wantCounts/{key}         number  每款幾個人想玩，誰都能讀
 *   wantVoters/{key}/{uid}   true    誰按過，不能讀
 * 兩個一定在同一次寫入裡一起改（update 多路徑）：規則要求人數只能 +1 且同時多一個自己的 uid、
 * 或 −1 且同時拿掉自己的 uid —— 不能只改數字，同一個匿名帳號也只算一票（見 database.rules.json）。
 *
 * 讀人數走 REST（`/wantCounts.json`），不載 Firebase SDK：平台首頁本來不下載它（約 75 KB gzip），
 * 只有真的按下去時才載、匿名登入。規則還沒發布時讀不到（401）就只顯示「想玩」不寫數字；寫入被拒就退回沒按過。
 * 裝置上另外記一份按過了沒（localStorage），重新整理照樣亮著，也不會一直送。
 */
import { getFirebaseDb } from '@/utils/firebase';

/** 卡片用英文官方名當鑰匙（還沒做的遊戲沒有網址）：Time Auction → time-auction。規則只收這個格式 */
export function wantKey(name: string): string {
  return name.toLowerCase().normalize('NFKD').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40);
}

const STORE = 'want:';

export function wantedHere(key: string): boolean {
  try { return localStorage.getItem(STORE + key) === '1'; } catch { return false; }
}

function rememberWanted(key: string, on: boolean) {
  try { if (on) localStorage.setItem(STORE + key, '1'); else localStorage.removeItem(STORE + key); } catch { /* 無痕模式：只是不記得 */ }
}

let countsPromise: Promise<Record<string, number> | null> | null = null;

/** 全部的人數，一頁只抓一次（首頁同一款會出現在好幾排） */
export function wantCounts(): Promise<Record<string, number> | null> {
  countsPromise ??= (async () => {
    const base = process.env.NEXT_PUBLIC_FIREBASE_DATABASE_URL;
    if (!base) return null;
    try {
      const res = await fetch(`${base.replace(/\/$/, '')}/wantCounts.json`);
      if (!res.ok) return null;
      return ((await res.json()) as Record<string, number> | null) ?? {};
    } catch {
      return null;
    }
  })();
  return countsPromise;
}

/** 按想玩／收回。成功回傳 true；規則擋下（或沒網路）回傳 false，裝置上的紀錄不動 */
export async function setWant(key: string, uid: string, on: boolean): Promise<boolean> {
  try {
    const [{ ref, update, increment }, db] = await Promise.all([import('firebase/database'), getFirebaseDb()]);
    await update(ref(db), {
      [`wantCounts/${key}`]: increment(on ? 1 : -1),
      [`wantVoters/${key}/${uid}`]: on ? true : null,
    });
    rememberWanted(key, on);
    return true;
  } catch {
    return false;
  }
}
