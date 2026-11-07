import type { Difficulty } from '@/game/ai';
import type { OnlineFailReason, OnlineStep } from '@/types/online';

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
 * 清單見 CLAUDE.md〈數據分析〉。參數名稱不能用 GA 保留給流量來源的 source／medium／campaign／term／content：
 * GA4 會拿它們蓋掉這個工作階段的來源（mode_select 帶過 source=home，Google 搜尋進來的被記成「home」）。
 */
/** local／solo／online 是對戰類；show（節目挑戰）、practice（練習）、closed（回到原點）是騎士巡遊這種一個人解題的 */
export type GameModeParam = 'local' | 'solo' | 'online' | 'show' | 'practice' | 'closed';
/** 一個人解題的遊戲是 1。平衡播棋是一桌的席數（4–7，AI 也算），2026-11 加 */
type Players = 1 | 2 | 3 | 4 | 5 | 6 | 7;
/** 連線房的人數（全部是真人） */
type RoomPlayers = Exclude<Players, 1>;

/**
 * 哪一款遊戲：網址的 slug（/wall-go/ → wall-go）。平台上線後同一個 GA 資源有好幾款，
 * 跟對局有關的事件都一定要帶（docs/platform-tracking.md）。新遊戲上線時加在這裡，漏帶就編譯不過。
 */
export type GameSlug = 'wall-go' | 'bagh-chal' | 'knights-tour' | 'nine-mens-morris' | 'blind-gomoku' | 'balance-mancala';
type G = { game: GameSlug };
/** 難度。盲五子棋另有一級 show：照節目裡 AI 的規矩（跟你上一手同色），2026-11 上線時加 */
type Level = Difficulty | 'show';

/** 平台首頁、季目錄頁點了哪裡的遊戲卡 */
export type SelectLocation = 'home_hero' | 'home_grid' | 'season' | 'related';

/**
 * 棋盤大小 n（n×n 送 n）。只有騎士巡遊帶（2026-11-01 大腦筋派工，docs/knights-tour-board-size-ga.md）：
 * 節目挑戰 game_start 是 6、game_end 贏是 8、輸是時間到那一關、game_restart 是重來時那一關；練習是選的那個大小
 */
type BoardSize = number;

type Events = {
  /** 首頁（或 /solo 頁）選了一個模式。是「想玩」，不是「開始玩」 */
  mode_select: G & { mode: GameModeParam; players: Players; difficulty?: Level; entry: 'home' | 'solo_page'; board_size?: BoardSize };
  /** 連線房開好了（還沒有人加入） */
  room_created: G & { players: RoomPlayers };
  /**
   * 這一局真的開始了：本機／單人是擺下第一顆棋，連線是人到齊、開始擺棋。
   * 分母用這個，完成率＝game_end ÷ game_start。
   */
  game_start: G & { mode: GameModeParam; players: Players; difficulty?: Level; board_size?: BoardSize };
  /**
   * 這一局結束了。
   * result：單人與連線從「這台裝置上的玩家」的角度看（win／lose／tie）；
   * 本機多人沒有「我」，只分有沒有平手（decided／tie），勝方放 winner：
   * Wall Go 是 A／B／C（多人同勝用 / 接起來），尼泊爾虎棋是 tiger／goat／draw。
   */
  game_end: G & {
    mode: GameModeParam; players: Players; difficulty?: Level; board_size?: BoardSize;
    result: 'win' | 'lose' | 'tie' | 'decided';
    /** 一個人解題的遊戲沒有勝方，不帶 */
    winner?: string;
    ended: 'natural' | 'resign';
    turns: number;
    duration_sec?: number;
  };
  /** 結束畫面按「再來一局」 */
  game_restart: G & { mode: GameModeParam; players: Players; difficulty?: Level; board_size?: BoardSize };
  /** 連線對戰失敗 */
  /**
   * fail_step 不叫 step：step 已經是 tutorial_close 的「看到第幾步」，在 GA 註冊成指標，
   * 同一個參數名稱不能再註冊成維度
   */
  online_error: G & { reason: 'noRoom' | 'roomFull' | OnlineFailReason; fail_step?: OnlineStep };
  /** 分享房間連結 */
  share_room_link: G & { method: 'native' | 'copy' };
  /**
   * 結算的分享圖。用 GA4 建議的 share 事件（大腦 10/23 建議）：
   * method＝叫出系統分享（native）或存成檔案（download）；item_id＝哪一種比例。
   */
  share: G & { method: 'native' | 'download'; content_type: 'result_card'; item_id: 'poster' | 'square' | 'story' };
  /** 連線時催輪到的人 */
  nudge_send: G & { players: RoomPlayers };
  /** 關掉遊玩方式。step 從 1 起算；finished＝有沒有看到最後一步 */
  tutorial_close: G & { step: number; steps: number; finished: boolean };
  /** 切換語系 */
  locale_switch: { from: string; to: string };
  /** 打開首頁的「聯絡我們」 */
  contact_open: Record<string, never>;
  /** 送出回饋。entry：對局後的回饋（game）、Wall Go 首頁的聯絡我們（contact）、平台頁尾的聯絡我們（platform）。平台頁尾送的不帶 game */
  feedback_send: { entry: 'game' | 'contact' | 'platform'; rating?: number; game?: GameSlug };
  /**
   * 平台首頁、季目錄點了能玩的遊戲卡（大卡的「開始玩」也算）。season 是那款遊戲在第幾季。
   * 想知道大家從首頁點哪一款，才能決定首頁大卡放什麼
   */
  select_game: G & { location: SelectLocation; season: 1 | 2 | 3 };
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
