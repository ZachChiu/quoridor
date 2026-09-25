import type { Difficulty } from '@/game/ai';

/**
 * 本機與單人對局的暫存，讓重新整理不會把棋局丟掉。
 *
 * iPhone 上的 Safari 與 Chrome 不顯示「確定要離開嗎？」（beforeunload），
 * 重整就攔不住 —— 那就讓重整不會丟東西：每一步都把棋譜（WGF）寫進
 * sessionStorage，重整後從棋譜重建盤面（engine 的 replay）。
 *
 * 用 sessionStorage 而不是 localStorage：它只活在這個分頁。另開一個分頁
 * 就是另一局，關掉分頁就結束 —— 符合「這一局」的直覺，也不會有好幾天前的
 * 殘局在某次打開時突然冒出來。
 *
 * 連線局不用這個：棋譜本來就在 Firebase，重整會從房間接回來。
 *
 * 存取一律包 try/catch：無痕模式或封鎖網站資料時 sessionStorage 會丟錯，
 * 那時就是沒有暫存，遊戲照玩。
 */
export function savedGameKey(playersNum: number, difficulty: Difficulty | null | undefined): string {
  return `wallgo:game:${difficulty ?? 'local'}:${playersNum}`;
}

export function loadSavedGame(key: string): string | null {
  try { return sessionStorage.getItem(key); } catch { return null; }
}

export function saveGame(key: string, wgf: string): void {
  try { sessionStorage.setItem(key, wgf); } catch { /* 沒有暫存就算了 */ }
}

export function clearSavedGame(key: string): void {
  try { sessionStorage.removeItem(key); } catch { /* 同上 */ }
}
