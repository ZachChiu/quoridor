/**
 * 站內路徑集中在這裡（不含語系前綴，前綴由 localePath 加）。
 *
 * 平台化之後網址是「一款遊戲一個資料夾」：`/` 是平台首頁（節目遊戲總覽），
 * Wall Go 全部在 `/wall-go/` 底下。路徑寫死在各元件裡的話，下次再搬家
 * （或加第二款遊戲）就得全站搜字串 —— 這次就是這樣搬的。
 *
 * 舊網址（/rules、/online…）由 infra/cloudfront-redirects.js 301 到新網址，
 * 舊路徑上另外留一層瀏覽器端轉址當備援（components/LegacyRedirect.tsx）。
 */
export const PLATFORM_HOME = '/';

export const WALL_GO = '/wall-go';

/** 每一季一個目錄頁（2026-10-25 Zach：「點進每一季可以看遊戲的目錄」）：`/season/1`、`/season/2`、`/season/3` */
export type SeasonNumber = '1' | '2' | '3';
export const SEASON_NUMBERS: SeasonNumber[] = ['3', '2', '1'];
export function season(n: SeasonNumber) {
  return `/season/${n}` as const;
}

/** Bagh Chal（虎羊棋）。開局選模式與對局在同一頁 */
export const BAGH_CHAL = '/bagh-chal';
export function baghChal(sub: '' | '/rules' | '/solo' | '/local' | '/online' = '') {
  return BAGH_CHAL + sub;
}

/**
 * 第二批試做的五款（2026-10-20）。每款一頁，開局選模式與對局都在那一頁；
 * 規則頁、連線房之後再補。各自的文案在 app/games/<id>/text.ts。
 */
export const TIME_AUCTION = '/time-auction';
export const NINE_MENS_MORRIS = '/nine-mens-morris';
export const BLIND_GOMOKU = '/blind-gomoku';
export const BALANCE_MANCALA = '/balance-mancala';
export const KNIGHTS_TOUR = '/knights-tour';

/**
 * 第二批的連線房（2026-10-24 Zach：有兩方互動的都補連線版，騎士巡遊是一個人解的、不用）。
 * 房間在 `<遊戲>/online#roomId=…`，開房是 `#new=…`（hook/useTurnRoom.ts；時間拍賣是同時出價，房間另外做）。
 */
export type OnlineTrialGame = typeof TIME_AUCTION | typeof NINE_MENS_MORRIS | typeof BLIND_GOMOKU | typeof BALANCE_MANCALA;
export function trialOnline(game: OnlineTrialGame): string {
  return `${game}/online`;
}

/**
 * 第二批的規則頁（2026-10-25 Zach：「怎麼玩都沒有換新頁，最好是跟 Wall Go 一樣，圖配字」）。
 * 每款在自己的分支加 `<遊戲>/rules` 的頁面；對局中的說明彈窗是同一份步驟、一次一步、可以左右滑（hook/useSwipePager.ts）。
 */
export type TrialGame = typeof TIME_AUCTION | typeof NINE_MENS_MORRIS | typeof BLIND_GOMOKU | typeof BALANCE_MANCALA | typeof KNIGHTS_TOUR;
export function trialRules(game: TrialGame): string {
  return `${game}/rules`;
}

/** Wall Go 底下的路徑，例如 wallGo('/rules') → '/wall-go/rules'；不給參數是 Wall Go 首頁 */
export function wallGo(sub: '' | '/rules' | '/solo' | '/local' | '/local/3' | '/online' | '/replay' = ''): string {
  return WALL_GO + sub;
}

/** 搬家前的舊路徑 → 新路徑。CloudFront 的 301 與瀏覽器端備援都照這張表 */
export const MOVED: Record<string, string> = {
  '/rules': wallGo('/rules'),
  '/solo': wallGo('/solo'),
  '/local': wallGo('/local'),
  '/local/2': wallGo('/local'),
  '/local/3': wallGo('/local/3'),
  '/online': wallGo('/online'),
  '/replay': wallGo('/replay'),
  '/match': wallGo('/online'),
};
