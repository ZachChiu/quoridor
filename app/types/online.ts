/**
 * 連線對戰失敗時卡在哪一步。給 Sentry 的 tag 與 GA `online_error` 的 step 參數共用。
 *
 * - auth：Firebase 載入與匿名登入（ensureUser）
 * - getRoom：讀房間
 * - join：坐進空位
 * - create：開新房
 */
export type OnlineStep = 'auth' | 'getRoom' | 'join' | 'create';

/** 會送 Sentry 的失敗。noRoom、roomFull 是正常流程（連結過期、人滿），不算錯誤。 */
export type OnlineFailReason = 'connectFail' | 'createFail';
