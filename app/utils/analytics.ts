import type { Difficulty } from '@/game/ai';

/**
 * Google Analytics（GA4）事件。
 *
 * GA 本身由 `app/shell.tsx` 的 `<GoogleAnalytics>` 載入，這裡只負責送事件。
 *
 * ── 為什麼是一張型別表 ────────────────────────────────────────────
 * 先前是 `trackButtonClick('start_local_game_2p')` 這種把變數塞進事件名稱的寫法：
 * 想知道「總共開了幾局」要把七種事件自己加起來，事件名稱也有 500 種的上限。
 * 而且附帶的 `event_category` / `event_label` 是舊版 UA 的欄位，GA4 不會顯示。
 *
 * 改成「一件事一個事件名稱，差異放參數」，並用這張表鎖住每個事件能帶什麼：
 * 送錯參數名在編譯期就擋下來，不會在 GA 報表裡默默多出一個拼錯的維度。
 *
 * ── 在 GA 後台要做的事 ────────────────────────────────────────────
 * 參數要在「管理 → 自訂定義」註冊成自訂維度（或指標）才能在報表裡篩選。
 * 清單見 CLAUDE.md〈數據分析〉。
 */
export type GameModeParam = 'local' | 'solo' | 'online';

type Events = {
  /** 首頁（或 /solo 頁）選了一個模式。是「想玩」，不是「開始玩」 */
  mode_select: { mode: GameModeParam; players: 2 | 3; difficulty?: Difficulty; source: 'home' | 'solo_page' };
  /** 連線房開好了（還沒有人加入） */
  room_created: { players: 2 | 3 };
  /**
   * 這一局真的開始了：本機／單人是擺下第一顆棋，連線是人到齊、開始擺棋。
   * 分母用這個，完成率＝game_end ÷ game_start。
   */
  game_start: { mode: GameModeParam; players: 2 | 3; difficulty?: Difficulty };
  /**
   * 這一局結束了。
   * result：單人與連線從「這台裝置上的玩家」的角度看（win／lose／tie）；
   * 本機多人沒有「我」，只分有沒有平手（decided／tie），勝方放 winner。
   */
  game_end: {
    mode: GameModeParam; players: 2 | 3; difficulty?: Difficulty;
    result: 'win' | 'lose' | 'tie' | 'decided';
    winner: string;
    ended: 'natural' | 'resign';
    turns: number;
    duration_sec?: number;
  };
  /** 結束畫面按「再來一局」 */
  game_restart: { mode: GameModeParam; players: 2 | 3; difficulty?: Difficulty };
  /** 連線對戰失敗 */
  online_error: { reason: 'noRoom' | 'roomFull' | 'connectFail' | 'createFail' };
  /** 分享房間連結 */
  share_room_link: { method: 'native' | 'copy' };
  /** 關掉遊玩方式。step 從 1 起算；finished＝有沒有看到最後一步 */
  tutorial_close: { step: number; steps: number; finished: boolean };
  /** 切換語系 */
  locale_switch: { from: string; to: string };
  /** 打開首頁的「聯絡我們」 */
  contact_open: Record<string, never>;
  /** 送出回饋。source：對局後的回饋（game）或首頁的聯絡我們（contact） */
  feedback_send: { source: 'game' | 'contact'; rating?: number };
};

export type AnalyticsEvent = keyof Events;

declare global {
  interface Window {
    gtag?: (command: 'event', name: string, params: Record<string, unknown>) => void;
  }
}

/**
 * 送出一筆事件。GA 還沒載入（或被廣告阻擋器擋掉）時安靜地什麼都不做 ——
 * 數據分析壞掉不該讓遊戲跟著壞。
 */
export function track<K extends AnalyticsEvent>(name: K, params: Events[K]): void {
  if (typeof window === 'undefined' || !window.gtag) return;
  // undefined 的參數不送，GA 才不會多出一堆 "(not set)"
  const clean = Object.fromEntries(Object.entries(params).filter(([, v]) => v !== undefined));
  window.gtag('event', name, clean);
}
