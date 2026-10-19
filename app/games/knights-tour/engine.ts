/**
 * 騎士巡邏（Knight's Tour）的規則。純函式、零 React、零副作用 —— 跟 Wall Go 的 app/game/、
 * Bagh Chal 的 app/games/bagh-chal/ 同一個原則（唯一的「狀態」是依棋盤大小快取的騎士步表）。
 *
 * 規則照《魔鬼的計謀：死亡密室》第 2 天生活區隱藏關的 RULE 卡（docs/games-deep-s2.md §4）：
 * - 西洋棋的騎士走「日」字（L 形）：一個方向走 2 格，再橫走 1 格
 * - 走遍棋盤每一格、每格只能經過一次；不必回到起點（開放巡邏）
 * - 走到走過的格，或還沒走完就沒路可走 → 這一關整盤清空重來（節目模式的規則在 show.ts）
 *
 * 卡上沒寫、這裡做的決定（同一份調查的〈規則缺口與建議〉）：
 * - 起點自選（第一下點哪一格，騎士就放在哪一格）
 * - 奇數盤只有「跟角落同色」的格子出發走得完（canStartFrom）：騎士每一步都換顏色，
 *   n² 是奇數時路線頭尾同色，而角落那種顏色多一格 —— 7×7 是 25 格可以、24 格必定失敗
 *
 * 另外有一個「從這裡還走得完嗎」的解題器（solve）：練習模式的提示與即時判定用。
 * 它有節點上限，跑不完就回 'unknown'，不會把畫面卡住。
 */

/** 格子編號：r * n + c（r 由上往下、c 由左往右，0 起算） */
export type Square = number;

export type Tour = {
  /** 棋盤邊長 */
  readonly n: number;
  /** 走過的格子，依序；path[0] 是起點，path[i] 是第 i + 1 步 */
  readonly path: readonly Square[];
};

export const MIN_SIZE = 5;
export const MAX_SIZE = 10;
/** 練習模式可選的大小 */
export const SIZES = [5, 6, 7, 8, 9, 10] as const;

/** 騎士的八個跳法 */
const JUMPS: readonly (readonly [number, number])[] = [
  [-2, -1], [-2, 1], [-1, 2], [1, 2], [2, 1], [2, -1], [1, -2], [-1, -2],
];

export const rowOf = (n: number, sq: Square) => Math.floor(sq / n);
export const colOf = (n: number, sq: Square) => sq % n;

export function isSize(n: number): boolean {
  return Number.isInteger(n) && n >= MIN_SIZE && n <= MAX_SIZE;
}

const graphs = new Map<number, readonly (readonly Square[])[]>();

/** 每一格跳得到的格子（只含盤內）。依大小快取 —— 解題器每個節點都要查 */
export function knightGraph(n: number): readonly (readonly Square[])[] {
  let g = graphs.get(n);
  if (!g) {
    g = Array.from({ length: n * n }, (_, sq) => {
      const r = rowOf(n, sq);
      const c = colOf(n, sq);
      return JUMPS.flatMap(([dr, dc]) => {
        const rr = r + dr;
        const cc = c + dc;
        return rr >= 0 && rr < n && cc >= 0 && cc < n ? [rr * n + cc] : [];
      });
    });
    graphs.set(n, g);
  }
  return g;
}

export function knightMoves(n: number, from: Square): readonly Square[] {
  return knightGraph(n)[from];
}

export function isKnightMove(n: number, a: Square, b: Square): boolean {
  const dr = Math.abs(rowOf(n, a) - rowOf(n, b));
  const dc = Math.abs(colOf(n, a) - colOf(n, b));
  return (dr === 1 && dc === 2) || (dr === 2 && dc === 1);
}

/** 格子的顏色：0 = 跟左上角同色 */
export const colorOf = (n: number, sq: Square) => (rowOf(n, sq) + colOf(n, sq)) % 2;

/**
 * 從這格出發走不走得完。
 *
 * 騎士每一步都換顏色，所以走完 n² 格的路線顏色是交錯的。n 是奇數時 n² 也是奇數，
 * 路線頭尾同色、而且那種顏色要比另一種多一格 —— 只有角落那種顏色多一格，
 * 另一種顏色出發必定失敗。角落那種顏色在 5×5、7×7、9×9 每一格都走得完，
 * 偶數盤（6、8、10）有封閉巡邏，任何一格都可以出發（tests 逐格用 solve 驗過）。
 */
export function canStartFrom(n: number, sq: Square): boolean {
  return n % 2 === 0 || colorOf(n, sq) === 0;
}

export function createTour(n: number): Tour {
  if (!isSize(n)) throw new Error(`board size must be ${MIN_SIZE}–${MAX_SIZE}, got ${n}`);
  return { n, path: [] };
}

/** 騎士現在在哪一格（還沒放就是 null） */
export function current(t: Tour): Square | null {
  return t.path.length ? t.path[t.path.length - 1] : null;
}

/** 每一格是第幾步（1 起算；0 = 還沒走過） */
export function visitOrder(t: Tour): number[] {
  const order: number[] = new Array(t.n * t.n).fill(0);
  t.path.forEach((sq, i) => { order[sq] = i + 1; });
  return order;
}

/** 下一步可以點哪些格子。還沒放騎士時每一格都可以當起點 */
export function legalMoves(t: Tour): Square[] {
  const cur = current(t);
  if (cur === null) return Array.from({ length: t.n * t.n }, (_, i) => i);
  const seen = new Set(t.path);
  return knightMoves(t.n, cur).filter((sq) => !seen.has(sq));
}

/** 走一步（第一步就是放下騎士）。不合法丟錯：呼叫端應該先用 tapKind 分好 */
export function move(t: Tour, sq: Square): Tour {
  if (!legalMoves(t).includes(sq)) throw new Error(`illegal move to ${sq}`);
  return { n: t.n, path: [...t.path, sq] };
}

/** 從空棋盤依序走完 squares（棋譜回放、測試用） */
export function replay(n: number, squares: readonly Square[]): Tour {
  return squares.reduce(move, createTour(n));
}

/** 退回 steps 步（退到底就是空棋盤、重選起點） */
export function undo(t: Tour, steps = 1): Tour {
  return truncate(t, t.path.length - steps);
}

/** 只留前 length 步 */
export function truncate(t: Tour, length: number): Tour {
  return { n: t.n, path: t.path.slice(0, Math.max(0, Math.min(t.path.length, length))) };
}

export function isComplete(t: Tour): boolean {
  return t.path.length === t.n * t.n;
}

/** 騎士已經放下、還沒走完，卻沒有任何一格可以走 */
export function isStuck(t: Tour): boolean {
  return t.path.length > 0 && !isComplete(t) && legalMoves(t).length === 0;
}

/**
 * 點一格是什麼意思（畫面依這個決定要走、要提示，還是節目模式的「犯規」）：
 * - start：還沒放騎士，放在這裡
 * - move：合法的下一步
 * - current：騎士所在的那一格
 * - revisit：騎士跳得到、但已經走過 —— 節目規則的「走到走過的格」
 * - notKnight：不是騎士的步（不是「日」字）
 * - over：已經走完了
 */
export type TapKind = 'start' | 'move' | 'current' | 'revisit' | 'notKnight' | 'over';

export function tapKind(t: Tour, sq: Square): TapKind {
  if (isComplete(t)) return 'over';
  const cur = current(t);
  if (cur === null) return 'start';
  if (sq === cur) return 'current';
  if (!isKnightMove(t.n, cur, sq)) return 'notKnight';
  return t.path.includes(sq) ? 'revisit' : 'move';
}

// ─── 解題器 ────────────────────────────────────────────────────────────────

export type Verdict = 'yes' | 'no' | 'unknown';

export type Solution =
  /** 找到一條走完的路：path 是完整的 n² 格（包含已經走的那一段） */
  | { verdict: 'yes'; path: Square[] }
  /** 證明了從這裡走不完 */
  | { verdict: 'no' }
  /** 節點上限用完了還沒有結論 */
  | { verdict: 'unknown' };

/**
 * 預設的節點上限。實測（Node / M 系列）跑滿 2 萬個節點約 5–10ms，手機慢幾倍也還在可以接受的範圍。
 * 從任何起點出發的空棋盤都在 200 個節點內有結論；隨機亂走出來的局面（各 1500 個），
 * 8×8 幾乎全部有結論（0–1 個用到上限）、10×10 前 20 步約 1%，最慢約 4ms。用到上限就回 'unknown'。
 */
export const DEFAULT_BUDGET = 20_000;

const centerDist = new Map<number, Float64Array>();
/** 到棋盤中心的距離平方（Warnsdorff 平手時，先走離中心遠的 —— Arnd Roth 的平手規則） */
function farness(n: number): Float64Array {
  let d = centerDist.get(n);
  if (!d) {
    const mid = (n - 1) / 2;
    d = Float64Array.from({ length: n * n }, (_, sq) => (rowOf(n, sq) - mid) ** 2 + (colOf(n, sq) - mid) ** 2);
    centerDist.set(n, d);
  }
  return d;
}

/**
 * 從目前的局面找一條走完的路。
 *
 * Warnsdorff 法則排序的回溯：先試「下一步出路最少」的格子（平手時先走離中心遠的），
 * 再加上剪枝 —— 少了它們，7×7 有幾個起點要幾十萬個節點才找得到（docs/research/knight.py
 * 只用 Warnsdorff 時有 3 個起點超過 20 萬），走不完的局面更是要窮舉到天荒地老：
 * 1. 顏色（每個節點）：剩下的格子必須黑白交錯、下一格跟騎士腳下不同色，兩色的數量要剛好對上
 * 2. 死巷（每個節點）：還沒走的格子，每一格（除了路線的頭尾）都需要兩個還沒走的鄰居；
 *    只剩一個鄰居的格子最多兩個（下一步與終點），有兩個時下一步必須是其中之一。
 *    終點的顏色也是定的，死巷的顏色對不上就不可能、或者只能是下一步
 * 3. 連通（只在開頭）：還沒走的格子必須從騎士這裡全部走得到
 *
 * 還沒放騎士時從左上角出發（每一種大小的角落都走得完）。
 */
export function solve(t: Tour, budget = DEFAULT_BUDGET): Solution {
  if (t.path.length === 0) return solve(move(t, 0), budget);
  if (isComplete(t)) return { verdict: 'yes', path: [...t.path] };

  const { n } = t;
  const N = n * n;
  const g = knightGraph(n);
  const far = farness(n);
  const color = (sq: Square) => colorOf(n, sq);

  const visited = new Uint8Array(N);
  for (const sq of t.path) visited[sq] = 1;
  /** 每一格還沒走過的鄰居數 */
  const deg = new Int8Array(N);
  /** 還沒走過的格子，依顏色分 */
  const left = [0, 0];
  /** 還沒走過的格子裡，鄰居數是 0、1 的各有幾格（死巷剪枝用，隨走隨更新） */
  const thin = [0, 0];
  /** 鄰居數 1 的那些格子：編號加總（只有一格時就是它的編號）與依顏色的格數 */
  let oneSum = 0;
  const oneColor = [0, 0];
  const enter = (x: Square, d: number) => {
    if (d < 2) thin[d]++;
    if (d === 1) { oneSum += x; oneColor[color(x)]++; }
  };
  const leave = (x: Square, d: number) => {
    if (d < 2) thin[d]--;
    if (d === 1) { oneSum -= x; oneColor[color(x)]--; }
  };
  for (let s = 0; s < N; s++) {
    let d = 0;
    for (const x of g[s]) if (!visited[x]) d++;
    deg[s] = d;
    if (!visited[s]) {
      left[color(s)]++;
      enter(s, d);
    }
  }

  const path = [...t.path];
  let nodes = 0;
  let exhausted = false;

  // 3. 連通（只在一開始查一次）：還沒走的格子要全部從騎士這裡走得到。
  // 每個節點都查的話慢五倍，而實測「算不出來」的局面一個也沒變少 —— 死巷剪枝已經擋掉大部分
  const start = path[path.length - 1];
  const seen = new Uint8Array(N);
  const queue: Square[] = [start];
  let reached = 0;
  seen[start] = 1;
  while (queue.length) {
    for (const x of g[queue.pop()!]) {
      if (!visited[x] && !seen[x]) { seen[x] = 1; reached++; queue.push(x); }
    }
  }
  if (reached !== N - path.length) return { verdict: 'no' };

  const visit = (s: Square) => {
    visited[s] = 1;
    leave(s, deg[s]);
    left[color(s)]--;
    for (const x of g[s]) {
      const d = deg[x]--;
      if (visited[x]) continue;
      leave(x, d);
      enter(x, d - 1);
    }
    path.push(s);
  };
  const unvisit = (s: Square) => {
    path.pop();
    for (const x of g[s]) {
      const d = deg[x]++;
      if (visited[x]) continue;
      leave(x, d);
      enter(x, d + 1);
    }
    left[color(s)]++;
    enter(s, deg[s]);
    visited[s] = 0;
  };

  const dfs = (cur: Square): boolean => {
    const remaining = N - path.length;
    if (remaining === 0) return true;
    if (++nodes > budget) { exhausted = true; return false; }

    // 1. 顏色：接下來的格子從「跟 cur 不同色」開始交錯
    const other = 1 - color(cur);
    const needOther = Math.ceil(remaining / 2);
    if (left[other] !== needOther || left[1 - other] !== remaining - needOther) return false;

    // 2. 死巷：鄰居數 0 的格子進不去也出不來；鄰居數 1 的只能當下一步或終點。
    //    終點的顏色是定的（從 cur 數過去第 remaining 格），所以死巷的顏色也要對得上 ——
    //    少了這一條，「走掉角落的一個出口、角落只好當終點、偏偏終點顏色不對」這種開局
    //    第三步就注定失敗的局面，要窮舉上千萬個節點才證明得了
    let candidates: Square[] = [];
    for (const x of g[cur]) if (!visited[x]) candidates.push(x);
    if (candidates.length === 0) return false;
    if (remaining >= 2) {
      if (thin[0] > 0 || thin[1] > 2) return false;
      const endColor = remaining % 2 ? other : 1 - other;
      if (thin[1] === 2) {
        // 一個是下一步（顏色一定是 other）、另一個是終點
        if (oneColor[other] !== (endColor === other ? 2 : 1)) return false;
        candidates = candidates.filter((x) => deg[x] === 1);
        if (candidates.length === 0) return false;
      } else if (thin[1] === 1 && color(oneSum) !== endColor) {
        // 唯一的死巷當不了終點，只能是下一步
        if (!candidates.includes(oneSum)) return false;
        candidates = [oneSum];
      }
    }

    // Warnsdorff：出路最少的先試；平手時離中心遠的先、再依編號（結果固定，測試才穩）
    candidates.sort((a, b) => deg[a] - deg[b] || far[b] - far[a] || a - b);
    for (const x of candidates) {
      visit(x);
      if (dfs(x)) return true;
      unvisit(x);
      if (exhausted) return false;
    }
    return false;
  };

  const found = dfs(path[path.length - 1]);
  if (found) return { verdict: 'yes', path };
  return exhausted ? { verdict: 'unknown' } : { verdict: 'no' };
}

/** 從這裡還走不走得完 */
export function verdict(t: Tour, budget = DEFAULT_BUDGET): Verdict {
  return solve(t, budget).verdict;
}

/**
 * 純 Warnsdorff 法則的下一步（不回溯、不保證走得完）：出路最少的格子，
 * 平手時離中心遠的優先、再依編號。解題器用完節點上限時，提示退回用這個。
 */
export function warnsdorff(t: Tour): Square | null {
  const moves = legalMoves(t);
  if (!moves.length) return null;
  const seen = new Set(t.path);
  const far = farness(t.n);
  const onward = (sq: Square) => knightMoves(t.n, sq).filter((x) => !seen.has(x) && x !== sq).length;
  return moves
    .map((sq) => ({ sq, d: onward(sq) }))
    .sort((a, b) => a.d - b.d || far[b.sq] - far[a.sq] || a.sq - b.sq)[0].sq;
}

/**
 * 還走得完的最長前段：退回到第幾步就還有救（0 = 連起點都不行，要換一格出發）。
 *
 * 「走得完」對前段長度是單調的 —— 第 k 步之後走得完，第 k − 1 步之後當然也走得完 ——
 * 所以用二分搜尋，最多約 7 次 solve。只採用真的找到路（'yes'）的長度，
 * 節點上限用完的當成走不完，寧可多退幾步也不給一個不保證的答案。
 */
export function lastSolvableLength(t: Tour, budget = DEFAULT_BUDGET): number {
  let lo = 0;
  let hi = t.path.length;
  if (verdict(t, budget) === 'yes') return hi;
  while (hi - lo > 1) {
    const mid = (lo + hi) >> 1;
    if (verdict(truncate(t, mid), budget) === 'yes') lo = mid; else hi = mid;
  }
  return lo;
}

export type Hint =
  /** 下一步走這格。sure：解題器找到了走完的路；false 是 Warnsdorff 的猜測 */
  | { kind: 'move'; square: Square; sure: boolean }
  /** 已經走不完了：退回到只剩 keep 步（0 = 換一格當起點） */
  | { kind: 'undo'; keep: number }
  | { kind: 'done' };

/** 練習模式的提示 */
export function hint(t: Tour, budget = DEFAULT_BUDGET): Hint {
  if (isComplete(t)) return { kind: 'done' };
  const s = solve(t, budget);
  if (s.verdict === 'yes') return { kind: 'move', square: s.path[t.path.length], sure: true };
  if (s.verdict === 'unknown') {
    const w = warnsdorff(t);
    if (w !== null) return { kind: 'move', square: w, sure: false };
  }
  return { kind: 'undo', keep: lastSolvableLength(t, budget) };
}
