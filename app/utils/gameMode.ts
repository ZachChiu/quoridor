import type { Difficulty } from '@/game/ai';
import type { GameMode } from '@/types/gameMode';

export type { GameMode };
import { localePath, type Locale } from '@/i18n/locales';

/**
 * 對局模式放在網址的 hash 裡。
 *
 * 先前它只活在 GameContext 的 React state（預設兩人）—— 於是三人局
 * 重整一次就變成兩人，單人局重整一次就退回選難度。網址上完全沒有
 * 「這是哪一種對局」的資訊，重新整理等於把選擇丟掉。
 *
 * 用 hash 而不是 query：這站是靜態匯出，query 要 `useSearchParams()`
 * 就得再包一層 Suspense（否則整棵子樹在建置時退回 client 渲染，
 * 靜態 HTML 只剩空殼）。`/match#roomId=…` 早就是這個做法，跟著走。
 *
 * 兩人也明寫成 `#2p` 而不是留空：網址自己說得出是什麼對局，
 * 分享出去、貼進 issue 裡都看得懂，也不必記「沒有 hash 代表兩人」。
 */
/**
 * 網址片段 → 人數。看不懂一律當兩人 —— 網址被亂改不該讓整頁爆掉。
 * （人數已經改走真的路由 `/local/3`，只有單人難度還留在 hash。）
 */
export function toPlayersNum(raw: string | undefined): 2 | 3 {
  return raw === '3' ? 3 : 2;
}


const DIFFICULTIES: Difficulty[] = ['easy', 'normal', 'hard'];

/** `{ playersNum: 3 }` → `'#3p'`。沒有任何模式就回空字串（網址不會多一個裸的 `#`）。 */
export function gameHash(mode: GameMode): string {
  const parts: string[] = [];
  if (mode.playersNum) parts.push(`${mode.playersNum}p`);
  if (mode.aiDifficulty) parts.push(mode.aiDifficulty);
  return parts.length ? `#${parts.join('-')}` : '';
}

/** `'#3p'` → `{ playersNum: 3 }`。看不懂的一律忽略，不要因為網址被改壞就整頁爆掉。 */
export function parseGameHash(hash: string): GameMode {
  const mode: GameMode = {};
  for (const part of hash.replace(/^#/, '').split('-')) {
    if (part === '2p') mode.playersNum = 2;
    else if (part === '3p') mode.playersNum = 3;
    else if ((DIFFICULTIES as string[]).includes(part)) mode.aiDifficulty = part as Difficulty;
  }
  return mode;
}

/** 瀏覽器端讀目前網址的模式。SSR 時回空物件。 */
export function readGameHash(): GameMode {
  if (typeof window === 'undefined') return {};
  return parseGameHash(window.location.hash);
}

/**
 * 房間邀請連結。
 *
 * 兩件先前都錯的事：
 *
 * 1. **指向 `/online`，不是 `/match`。** `/match` 是路由改名前的相容層，
 *    靠一段 client-side `location.replace` 轉過去。發出去的邀請連結
 *    指著它，等於每個被邀請的人都白繞一跳 —— 而且它只有 zh-TW 有。
 * 2. **留在邀請者自己的語系。** 原本寫死無前綴，於是 /ja 的人分享出去、
 *    朋友落在中文站 —— 那是不會有人回報的那種壞掉：連結能用、遊戲也能玩，
 *    只是全是看不懂的字。朋友多半跟邀請者說同一種語言，這是手上最好的
 *    猜測；猜錯了頁面上還有語言切換器。
 *
 * 抽成函式而不是寫在元件裡，是為了能測 —— 這條字串壞掉的唯一症狀
 * 是「朋友點進來看到別的東西」，在元件裡沒有任何辦法自動驗證。
 */
export function roomShareUrl(origin: string, locale: Locale, roomId: string): string {
  return `${origin}${localePath(locale, '/online')}#roomId=${roomId}`;
}
