/**
 * Time Auction（時間拍賣）的規則。純函式、零 React、零副作用 —— 跟 Wall Go（app/game/）、
 * Bagh Chal 同一個原則：畫面、電腦對手、之後的連線都共用這一份。
 *
 * 規則照《魔鬼的計謀：死亡密室》第 2 天監獄賽的 RULE 卡（docs/games-deep-s2.md §1）：
 * - 每人一筆時間（節目 10 分鐘），算到 0.1 秒；共拍賣 19 回合
 * - 每回合大家先按住按鈕。倒數（節目 5 秒）內放手＝放棄，不扣時間
 * - 倒數結束開始計時，放手的那一刻就是你的出價；剩餘時間用完，按鈕自動彈起
 * - 最後放手（出價最高）的人得 1 枚勝利標記；不管有沒有得標，每個人都付掉自己按住的時間
 * - 只公開得標者與得標秒數（大螢幕停在最後一人放手的那一刻）
 * - 19 回合後依標記數排名，同數比剩餘時間
 *
 * 按住期間看不到別人放手沒，所以每人每回合其實只做一個決定：「第幾秒放手」。
 * 數學上就是密封出價的全付拍賣（all-pay auction）—— engine 因此只收「每人一個出價」，
 * 按鈕怎麼按是畫面的事（bidFromHold 負責換算）。
 *
 * RULE 卡沒寫死、這裡做的決定（研究文件〈規則缺口與建議〉）：
 * - 時間一律存成整數的 0.1 秒（tenths），不用浮點秒數；出價無條件捨去到 0.1 秒
 * - 出價 0＝放棄。所有人都放棄：流標
 * - 只有「最高出價同秒」才流標，較低的出價同秒不影響
 * - 只有一人參加：照規則得標，付他自己按的秒數（他不知道只有自己）
 * - 網頁版不淘汰人，只排名；標記與剩餘時間都相同就並列
 * - 網頁另有「快速局」：每人 2 分鐘、倒數 3 秒，比例跟節目一樣，一局約 10 分鐘
 * - 連線版（online.ts）用同一套：按鍵時間換成出價之後一樣交給 playRound
 */

export type Mode = 'quick' | 'show';

export type ModeConfig = {
  /** 每人的時間，單位 0.1 秒 */
  budget: number;
  /** 倒數，毫秒。倒數內放手＝放棄 */
  countdownMs: number;
  rounds: number;
  /** 畫面上給不給看自己的剩餘時間。節目局連自己都不給看，要自己記 */
  showRemaining: boolean;
};

export const MODES: Record<Mode, ModeConfig> = {
  quick: { budget: 1200, countdownMs: 3000, rounds: 19, showRemaining: true },
  show: { budget: 6000, countdownMs: 5000, rounds: 19, showRemaining: false },
};

/** 跟電腦拍賣 4–6 席（研究建議：2 人太單純），你以外由電腦補 */
export const MIN_SEATS = 4;
export const MAX_SEATS = 6;
/** 連線（全是真人）2–6 席：湊齊四個朋友不容易，兩個人也能比（online.ts） */
export const ONLINE_MIN_SEATS = 2;

/** 0.1 秒有幾毫秒 */
export const TENTH_MS = 100;

export type RoundRecord = {
  /**
   * 每一席的出價（0.1 秒），0＝放棄。
   * **這是秘密**：電腦對手只拿得到 winner 與 top（見 publicHistory、viewFor）；
   * 畫面也只顯示這兩項，外加玩家自己的出價（他本來就知道）。
   * 留在紀錄裡是為了結算、測試與之後的回放。
   */
  bids: number[];
  /** 得標者的座位；流標（同秒或全員放棄）是 null */
  winner: number | null;
  /** 大螢幕停下的秒數＝最高出價；全員放棄是 0 */
  top: number;
};

export type AuctionState = {
  mode: Mode;
  seats: number;
  budget: number;
  rounds: number;
  /** 每一席已經付掉的時間（秘密） */
  spent: number[];
  /** 每一席的勝利標記（公開） */
  tokens: number[];
  history: RoundRecord[];
};

/** 開一場拍賣。座位數 2–6：跟電腦是 4–6（設定頁只給這幾個），連線最少 2 個人 */
export function createAuction(mode: Mode = 'quick', seats = MAX_SEATS): AuctionState {
  if (!Number.isInteger(seats) || seats < ONLINE_MIN_SEATS || seats > MAX_SEATS) {
    throw new Error(`座位數要在 ${ONLINE_MIN_SEATS}–${MAX_SEATS} 之間：${seats}`);
  }
  const { budget, rounds } = MODES[mode];
  return { mode, seats, budget, rounds, spent: Array(seats).fill(0), tokens: Array(seats).fill(0), history: [] };
}

/** 現在是第幾回合（1 起算）。結束後停在最後一回合 */
export const currentRound = (s: AuctionState): number => Math.min(s.history.length + 1, s.rounds);

export const isOver = (s: AuctionState): boolean => s.history.length >= s.rounds;

/** 某一席還剩多少時間（0.1 秒） */
export const remaining = (s: AuctionState, seat: number): number => s.budget - s.spent[seat];

/**
 * 把一個出價收成合法值：無條件捨去到 0.1 秒、不能超過剩餘時間（按鈕會自動彈起）。
 * 0、負數、NaN 都算放棄。Infinity（一直按著不放）就是剩下的全部。
 */
export function capBid(bid: number, left: number): number {
  if (!(bid > 0)) return 0;
  return Math.min(Math.floor(bid), Math.max(0, left));
}

/**
 * 按住多久 → 出價。heldMs 從按下去（倒數開始）算起。
 * 倒數內放手＝0（放棄、不扣時間）；之後每滿 0.1 秒算 0.1 秒（無條件捨去），最多到剩餘時間。
 */
export function bidFromHold(heldMs: number, countdownMs: number, left: number): number {
  if (!(heldMs >= countdownMs)) return 0;
  return capBid(Math.floor((heldMs - countdownMs) / TENTH_MS), left);
}

/**
 * 一回合的出價 → 得標者。最高出價只有一人才得標；最高同秒（到 0.1 秒）或全員放棄就流標。
 * 較低的出價同秒不影響。
 */
export function resolveBids(bids: readonly number[]): { winner: number | null; top: number } {
  const top = bids.reduce((m, b) => Math.max(m, b), 0);
  if (top <= 0) return { winner: null, top: 0 };
  const atTop = bids.flatMap((b, i) => (b === top ? [i] : []));
  return { winner: atTop.length === 1 ? atTop[0] : null, top };
}

/**
 * 結算一回合，回傳全新的局面（不改傳入的物件）。
 * 超過剩餘時間的出價收成剩餘時間（照規則，按鈕會自動彈起）；負數或 NaN 是呼叫端的錯，直接丟錯。
 */
export function playRound(s: AuctionState, bids: readonly number[]): AuctionState {
  if (isOver(s)) throw new Error('拍賣已經結束');
  if (bids.length !== s.seats) throw new Error(`要有 ${s.seats} 個出價，收到 ${bids.length} 個`);
  const capped = bids.map((b, i) => {
    if (typeof b !== 'number' || Number.isNaN(b) || b < 0) throw new Error(`第 ${i} 席的出價不合法：${b}`);
    return capBid(b, remaining(s, i));
  });
  const { winner, top } = resolveBids(capped);
  return {
    ...s,
    spent: s.spent.map((x, i) => x + capped[i]),
    tokens: s.tokens.map((x, i) => x + (i === winner ? 1 : 0)),
    history: [...s.history, { bids: capped, winner, top }],
  };
}

/** 一回合裡大家看得到的部分：得標者與大螢幕停下的秒數 */
export type PublicRound = { winner: number | null; top: number };

export function publicHistory(s: AuctionState): PublicRound[] {
  return s.history.map(({ winner, top }) => ({ winner, top }));
}

/**
 * 從公開資訊推得的「某一席最多還剩多少」：預算 − 他公開得標過的秒數。
 * 輸掉的出價看不到，所以這只是上限 —— 真正剩的只會更少。
 */
export function maxRemaining(budget: number, history: readonly PublicRound[], seat: number): number {
  return budget - history.reduce((sum, r) => sum + (r.winner === seat ? r.top : 0), 0);
}

/**
 * 某一席出價時看得到的東西：自己的剩餘時間＋所有公開資訊。
 * 電腦對手只拿得到這個 —— 結構上就看不到別人的出價與剩餘時間，跟玩家一樣。
 */
export type BidderView = {
  seat: number;
  seats: number;
  budget: number;
  rounds: number;
  /** 這回合是第幾回合（1 起算） */
  round: number;
  /** 自己的剩餘時間 */
  remaining: number;
  /** 每一席的勝利標記 */
  tokens: number[];
  history: PublicRound[];
};

export function viewFor(s: AuctionState, seat: number): BidderView {
  return {
    seat,
    seats: s.seats,
    budget: s.budget,
    rounds: s.rounds,
    round: currentRound(s),
    remaining: remaining(s, seat),
    tokens: s.tokens.slice(),
    history: publicHistory(s),
  };
}

export type Standing = { seat: number; tokens: number; remaining: number; rank: number };

/**
 * 最終排名：標記多的在前，同數比剩餘時間（多的在前）。兩者都同就並列（1、1、3 這種排法）。
 * 節目裡標記最少的人淘汰；網頁版不淘汰，只排名。
 */
export function standings(s: AuctionState): Standing[] {
  const rows = s.tokens
    .map((tokens, seat) => ({ seat, tokens, remaining: remaining(s, seat) }))
    .sort((a, b) => b.tokens - a.tokens || b.remaining - a.remaining || a.seat - b.seat);
  const tied = (i: number) => i > 0 && rows[i - 1].tokens === rows[i].tokens && rows[i - 1].remaining === rows[i].remaining;
  const ranks: number[] = [];
  rows.forEach((_, i) => ranks.push(tied(i) ? ranks[i - 1] : i + 1));
  return rows.map((r, i) => ({ ...r, rank: ranks[i] }));
}

/** 0.1 秒 → 大螢幕的寫法「1:49.8」 */
export function formatTenths(t: number): string {
  const tenths = Math.max(0, Math.floor(t));
  const m = Math.floor(tenths / 600);
  const s = Math.floor((tenths % 600) / 10);
  return `${m}:${String(s).padStart(2, '0')}.${tenths % 10}`;
}
