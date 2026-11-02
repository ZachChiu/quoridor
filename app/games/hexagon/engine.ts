/**
 * 六角數字盤（Hexagon）的規則與出題。純函式、零 React、零副作用（同 app/game/ 與其他款的 engine）。
 *
 * 規則照《魔鬼的計謀》第 1 季決賽第 2 戰的 RULE 卡（docs/hexagon.md；原始整理在 docs/games-deep-s1.md §1）：
 * - 19 格六角形排成 3-4-5-4-3，正面是數字、背面是字母 A～S
 * - 每回合先看數字（節目 30 秒），翻面後才公布目標數
 * - 找出「一直線上相鄰的三格」、加起來等於目標數 —— 盤上一共 27 條這樣的線（LINES）
 * - 答對 +1、答錯 −1（不是一直線、加起來不對、答過的組合再答一次，都算錯）
 * - 一回合有幾組答案不公布；全部找到、或 90 秒沒人作答就換下一回合。10 回合
 *
 * 網頁版的決定（節目是多人搶答，這裡是一個人解）：
 * - 點三格送出，順序不拘（同一條線的三格、任何順序都算）
 * - 「這回合找完了」自己結束一回合；90 秒沒送出也自動結束（IDLE_SECONDS）
 * - 出題保證每回合有 2～5 組答案（節目實際是 1～6 組，只有 1 組的回合找到就結束、太快；6 組以上太容易）
 * - 每日一題用日期當種子：同一天、同一個題號，每個人拿到同一盤
 */

/** 19 格的字母，由上往下、由左往右 */
export const LETTERS = 'ABCDEFGHIJKLMNOPQRS';
export const CELLS = 19;
/** 每一排幾格 */
export const ROWS = [3, 4, 5, 4, 3] as const;

/** 一格的位置：第幾排（0–4）、那一排的第幾格；q、r 是六角座標（軸座標，r＝排－2） */
export type Cell = { row: number; col: number; q: number; r: number };

export const CELL_POS: readonly Cell[] = ROWS.flatMap((n, row) => {
  const r = row - 2;
  const q0 = Math.max(-2, -2 - r);
  return Array.from({ length: n }, (_, col) => ({ row, col, q: q0 + col, r }));
});

const indexOf = new Map(CELL_POS.map((c, i) => [`${c.q},${c.r}`, i]));

/** 三個方向：橫、往右下、往左下 */
const DIRS: readonly (readonly [number, number])[] = [[1, 0], [0, 1], [-1, 1]];

/** 盤上所有「一直線相鄰三格」，每條是三格的編號（由上往下、由左往右） */
export const LINES: readonly (readonly [number, number, number])[] = DIRS.flatMap(([dq, dr]) =>
  CELL_POS.flatMap(({ q, r }) => {
    const a = indexOf.get(`${q},${r}`);
    const b = indexOf.get(`${q + dq},${r + dr}`);
    const c = indexOf.get(`${q + 2 * dq},${r + 2 * dr}`);
    return a !== undefined && b !== undefined && c !== undefined ? [[a, b, c] as const] : [];
  }));

/** 一條線的名字，例如 'AEJ' */
export const lineName = (line: number) => LINES[line].map((i) => LETTERS[i]).join('');

/** 三格（任何順序）是哪一條線；不是一直線相鄰的就是 -1 */
export function lineOf(cells: readonly number[]): number {
  if (cells.length !== 3 || new Set(cells).size !== 3) return -1;
  const key = [...cells].sort((a, b) => a - b).join(',');
  return LINES.findIndex((l) => [...l].sort((a, b) => a - b).join(',') === key);
}

export const lineSum = (board: readonly number[], line: number) => LINES[line].reduce((s, i) => s + board[i], 0);

/** 這一盤、這個目標數的所有答案（線的編號，由小到大） */
export function solutions(board: readonly number[], target: number): number[] {
  return LINES.flatMap((_, i) => (lineSum(board, i) === target ? [i] : []));
}

// ─── 難度 ────────────────────────────────────────────────────────────────────

export type Level = 'easy' | 'normal' | 'hard';

export type LevelRule = {
  /** 先看數字幾秒 */
  memorize: number;
  /** 數字的範圍 */
  min: number;
  max: number;
  /** 找到的組合留在盤上（簡單）；節目不留 */
  markFound: boolean;
};

/** 普通＝節目（30 秒、1～7）；簡單多看一倍時間、數字小、找到的留著；困難只看 20 秒、數字到 10 */
export const LEVELS: Record<Level, LevelRule> = {
  easy: { memorize: 60, min: 1, max: 5, markFound: true },
  normal: { memorize: 30, min: 1, max: 7, markFound: false },
  hard: { memorize: 20, min: 1, max: 10, markFound: false },
};

/** 一回合沒送出答案多久就自動結束（節目：90 秒沒人按鈴） */
export const IDLE_SECONDS = 90;
/** 每回合答案數的範圍 */
export const MIN_ANSWERS = 2;
export const MAX_ANSWERS = 5;

// ─── 出題 ────────────────────────────────────────────────────────────────────

/** 字串 → 32 位元種子（FNV-1a） */
export function hashSeed(s: string): number {
  let h = 0x811c9dc5;
  for (let i = 0; i < s.length; i++) {
    h ^= s.charCodeAt(i);
    h = Math.imul(h, 0x01000193);
  }
  return h >>> 0;
}

/** mulberry32：回傳 [0, 1) 的亂數產生器 */
export function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = a;
    t = Math.imul(t ^ (t >>> 15), t | 1);
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61);
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export type Round = { board: number[]; target: number; answers: number[] };

/**
 * 出一回合：先亂數填 19 格，再從「剛好有 2～5 條線加起來是它」的和裡挑一個當目標數。
 * 一盤 27 條線的和分布很集中，幾乎每一盤都挑得到；萬一挑不到就重填（有上限，最後一定回傳一題有解的）。
 */
export function makeRound(seed: string, level: Level): Round {
  const rule = LEVELS[level];
  const next = rng(hashSeed(seed));
  let fallback: Round | null = null;
  for (let tries = 0; tries < 200; tries++) {
    const board = Array.from({ length: CELLS }, () => rule.min + Math.floor(next() * (rule.max - rule.min + 1)));
    const count = new Map<number, number>();
    LINES.forEach((_, i) => { const s = lineSum(board, i); count.set(s, (count.get(s) ?? 0) + 1); });
    const sums = [...count.keys()].sort((a, b) => a - b);
    const good = sums.filter((s) => count.get(s)! >= MIN_ANSWERS && count.get(s)! <= MAX_ANSWERS);
    if (good.length) {
      const target = good[Math.floor(next() * good.length)];
      return { board, target, answers: solutions(board, target) };
    }
    if (!fallback) {
      const target = sums.find((s) => count.get(s)! >= 1)!;
      fallback = { board, target, answers: solutions(board, target) };
    }
  }
  return fallback!;
}

// ─── 模式 ────────────────────────────────────────────────────────────────────

export type ModeId = 'daily' | 'show' | 'practice';

export type Config = {
  mode: ModeId;
  level: Level;
  /** 幾回合；練習是 0（不限，一題接一題） */
  rounds: number;
  /** 出題的種子（每回合再接上題號） */
  seed: string;
};

/** 每日一題：5 回合、普通（節目的 30 秒與 1～7）。日期是當地的 YYYY-MM-DD */
export const DAILY_ROUNDS = 5;
/** 節目規則：10 回合 */
export const SHOW_ROUNDS = 10;

export function dailyConfig(date: string): Config {
  return { mode: 'daily', level: 'normal', rounds: DAILY_ROUNDS, seed: `daily:${date}` };
}
export function showConfig(seed: string): Config {
  return { mode: 'show', level: 'normal', rounds: SHOW_ROUNDS, seed: `show:${seed}` };
}
export function practiceConfig(level: Level, seed: string): Config {
  return { mode: 'practice', level, rounds: 0, seed: `practice:${level}:${seed}` };
}

/** 第 i 回合（0 起算）的題目：只看種子與題號，所以重新整理、換裝置都是同一題 */
export const roundOf = (config: Config, i: number): Round => makeRound(`${config.seed}#${i}`, config.level);

/** 本地日期 YYYY-MM-DD（每日一題的題號） */
export function localDate(d: Date): string {
  const p = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())}`;
}

// ─── 一局的狀態 ───────────────────────────────────────────────────────────────

/** memorize：看數字；answer：翻面、找組合；reveal：這回合結束、翻回數字看答案；over：整局結束 */
export type Phase = 'memorize' | 'answer' | 'reveal' | 'over';

export type Miss = 'notLine' | 'wrongSum' | 'repeat';

export type RoundResult = { target: number; answers: number; found: number; wrong: number };

export type GameState = {
  readonly config: Config;
  /** 第幾回合（0 起算） */
  readonly index: number;
  readonly round: Round;
  readonly phase: Phase;
  /** 這回合找到的線，依找到的順序 */
  readonly found: readonly number[];
  /** 這回合答錯幾次 */
  readonly wrong: number;
  readonly score: number;
  /** 已經結束的回合 */
  readonly history: readonly RoundResult[];
  /** 最後一次送出的結果（畫面上閃一下用） */
  readonly last: { ok: true; line: number } | { ok: false; miss: Miss; cells: readonly number[] } | null;
};

export function startGame(config: Config): GameState {
  return { config, index: 0, round: roundOf(config, 0), phase: 'memorize', found: [], wrong: 0, score: 0, history: [], last: null };
}

/** 看完數字、翻面（時間到或自己按「記好了」） */
export function flip(s: GameState): GameState {
  return s.phase === 'memorize' ? { ...s, phase: 'answer', last: null } : s;
}

/** 判斷三格對不對（不改狀態） */
export function judge(s: GameState, cells: readonly number[]): { ok: true; line: number } | { ok: false; miss: Miss } {
  const line = lineOf(cells);
  if (line < 0) return { ok: false, miss: 'notLine' };
  if (lineSum(s.round.board, line) !== s.round.target) return { ok: false, miss: 'wrongSum' };
  if (s.found.includes(line)) return { ok: false, miss: 'repeat' };
  return { ok: true, line };
}

/** 送出三格。全部找到就直接結束這回合 */
export function submit(s: GameState, cells: readonly number[]): GameState {
  if (s.phase !== 'answer') return s;
  const j = judge(s, cells);
  if (!j.ok) return { ...s, wrong: s.wrong + 1, score: s.score - 1, last: { ok: false, miss: j.miss, cells: [...cells] } };
  const next = { ...s, found: [...s.found, j.line], score: s.score + 1, last: { ok: true as const, line: j.line } };
  return next.found.length === s.round.answers.length ? endRound(next) : next;
}

/** 這回合結束（找完了、自己按結束、90 秒沒作答）：翻回數字、把沒找到的也畫出來 */
export function endRound(s: GameState): GameState {
  if (s.phase !== 'answer') return s;
  const result: RoundResult = { target: s.round.target, answers: s.round.answers.length, found: s.found.length, wrong: s.wrong };
  return { ...s, phase: 'reveal', history: [...s.history, result] };
}

/** 看完答案，下一回合；最後一回合之後是 over */
export function nextRound(s: GameState): GameState {
  if (s.phase !== 'reveal') return s;
  if (s.config.rounds && s.index + 1 >= s.config.rounds) return { ...s, phase: 'over', last: null };
  const index = s.index + 1;
  return { ...s, index, round: roundOf(s.config, index), phase: 'memorize', found: [], wrong: 0, last: null };
}

/** 整局的統計 */
export function totals(history: readonly RoundResult[]) {
  return history.reduce((t, r) => ({ found: t.found + r.found, answers: t.answers + r.answers, wrong: t.wrong + r.wrong }), { found: 0, answers: 0, wrong: 0 });
}
