import {
  CENTER, DIRECTIONS, POINTS, colOf, inside, lastColor, pointAt, rowOf,
  type GomokuState, type Move, type Point,
} from './engine';

/**
 * 盲眼五子棋的電腦對手。對外是純函式：內部為了速度用可變的盤面，但不碰傳入的 state。
 *
 * 電腦本來就不是盲的（節目裡的 NPC 也看得到黑白），所以分級的重點是「往下調弱」：
 * - show（節目級）：照節目 AI 的弱點做 —— 重攻輕守。下一手就會連五的一定擋，
 *   其餘只看得到對手「連在一起」的子，看不出隔一格的跳三（河錫辰就是斜著隔一格下贏的）
 * - normal：每個空點用型態評分（活四、衝四、活三、眠三、活二…，攻守分開加權）挑最好的一點，
 *   外加必勝、必擋的檢查。只看一層
 * - hard：先找連續衝四的必勝（VCF），再看對手有沒有 VCF 要先防，最後用 alpha-beta 搜到 6 層
 *   （疊代加深，**只採用完整跑完的那一層** —— 跟 Wall Go 的教訓一樣，殘缺的深搜比完整的淺搜還弱）
 *
 * 候選點只看已有子周圍 2 格內。電腦的顏色一律跟玩家上一手同色（engine 的 lastColor）。
 */
export type Level = 'show' | 'normal' | 'hard';
export const LEVELS: readonly Level[] = ['show', 'normal', 'hard'];

type Color = 1 | 2;
const BLACK: Color = 1;
const WHITE: Color = 2;
const opp = (c: Color): Color => (c === BLACK ? WHITE : BLACK);

// ─── 幾何 ───────────────────────────────────────────────────────────────

/** NB[(p * 4 + d) * 9 + k]：從 p 沿第 d 個方向位移 k − 4 格的點，出界是 −1 */
const NB = new Int16Array(POINTS * 4 * 9);
for (let p = 0; p < POINTS; p++) {
  for (let d = 0; d < 4; d++) {
    const [dr, dc] = DIRECTIONS[d];
    for (let k = 0; k < 9; k++) {
      const r = rowOf(p) + dr * (k - 4);
      const c = colOf(p) + dc * (k - 4);
      NB[(p * 4 + d) * 9 + k] = inside(r, c) ? pointAt(r, c) : -1;
    }
  }
}

/** 距離 2 格內（含斜向）的點 —— 候選點的範圍 */
const AROUND: Int16Array[] = Array.from({ length: POINTS }, (_, p) => {
  const out: number[] = [];
  for (let dr = -2; dr <= 2; dr++) {
    for (let dc = -2; dc <= 2; dc++) {
      const r = rowOf(p) + dr;
      const c = colOf(p) + dc;
      if ((dr || dc) && inside(r, c)) out.push(pointAt(r, c));
    }
  }
  return Int16Array.from(out);
});

/** 所有連續 5 格的窗（四個方向），WIN[w * 5 + i]。困難級的盤面評分與 VCF 用 */
const WINDOWS: number[] = [];
for (let p = 0; p < POINTS; p++) {
  for (const [dr, dc] of DIRECTIONS) {
    const r4 = rowOf(p) + dr * 4;
    const c4 = colOf(p) + dc * 4;
    if (!inside(r4, c4)) continue;
    for (let i = 0; i < 5; i++) WINDOWS.push(pointAt(rowOf(p) + dr * i, colOf(p) + dc * i));
  }
}
const WIN = Int16Array.from(WINDOWS);
const NW = WIN.length / 5;
/** 每個點落在哪些窗裡（最多 20 個） */
const WINS_OF: Int16Array[] = (() => {
  const lists: number[][] = Array.from({ length: POINTS }, () => []);
  for (let w = 0; w < NW; w++) for (let i = 0; i < 5; i++) lists[WIN[w * 5 + i]].push(w);
  return lists.map((l) => Int16Array.from(l));
})();

// ─── 型態表 ─────────────────────────────────────────────────────────────
/*
  一個點在一個方向上的型態，只由它左右各 4 格決定（自由五子棋：連五一定落在這 9 格裡）。
  每格三種狀態（空、自己、擋住＝對手或出界），8 格共 3^8 = 6561 種，開機時全部算好查表。

  定義是遞迴的，不靠一張手寫的型態清單（手寫清單最容易漏掉跳活三這類變形）：
  - 五：已經有連續 5 顆（含中心）
  - 活四／四：再下一顆就連五的空點有 2 個以上／1 個
  - 活三／三：再下一顆就能變成活四／四
  - 活二／二：再下一顆就能變成活三／三
  「連五」一律要含中心那顆 —— 跟這一點無關的威脅不算在這一點上。
*/
const NONE = 0;
const ONE = 1;
const TWO = 2;
const OPEN_TWO = 3;
const THREE = 4;
const OPEN_THREE = 5;
const FOUR = 6;
const OPEN_FOUR = 7;
const FIVE = 8;

const POW3 = [1, 3, 9, 27, 81, 243, 729, 2187];
/** 窗裡第 k 格（0..8，4 是中心）對應索引的第幾位 */
const slot = (k: number) => (k < 4 ? k : k - 1);

const PATTERN: Uint8Array = (() => {
  const memo = new Int8Array(6561).fill(-1);
  const hasFive = (w: Int8Array) => {
    for (let s = 0; s <= 4; s++) {
      let ok = true;
      for (let i = s; i < s + 5; i++) if (w[i] !== 1) { ok = false; break; }
      if (ok) return true;
    }
    return false;
  };
  const classify = (idx: number): number => {
    if (memo[idx] >= 0) return memo[idx];
    const w = new Int8Array(9);
    w[4] = 1;
    for (let k = 0; k < 9; k++) if (k !== 4) w[k] = Math.floor(idx / POW3[slot(k)]) % 3;
    let result = NONE;
    if (hasFive(w)) result = FIVE;
    else {
      let completions = 0;
      for (let k = 0; k < 9; k++) {
        if (w[k] !== 0) continue;
        w[k] = 1;
        if (hasFive(w)) completions++;
        w[k] = 0;
      }
      if (completions >= 2) result = OPEN_FOUR;
      else if (completions === 1) result = FOUR;
      else {
        let best = NONE;
        for (let k = 0; k < 9; k++) {
          if (w[k] !== 0) continue;
          const c = classify(idx + POW3[slot(k)]);
          if (c > best) best = c;
        }
        result = best === OPEN_FOUR ? OPEN_THREE : best === FOUR ? THREE
          : best === OPEN_THREE ? OPEN_TWO : best === THREE ? TWO : best >= TWO ? ONE : NONE;
      }
    }
    memo[idx] = result;
    return result;
  };
  const table = new Uint8Array(6561);
  for (let i = 0; i < 6561; i++) table[i] = classify(i);
  return table;
})();

/** 單一方向的型態分數。衝四刻意低於活三：單獨一個衝四只是逼對手擋一下，活三才是長期威脅 */
const CLASS_VALUE = [0, 20, 150, 1_000, 1_500, 10_000, 6_000, 1_000_000, 10_000_000];
const V_FIVE = 10_000_000;
/** 活四、雙四：下一手必連五 */
const V_WIN4 = 1_000_000;
/** 四三：對手擋了四之後，三就變活四。排在「擋對手的活四點」（0.9 × V_WIN4）之上 */
const V_FOUR_THREE = 950_000;
/** 雙活三 */
const V_DOUBLE_THREE = 100_000;

/** 把 p 在第 d 個方向上的 8 格換成兩方各自的型態索引，寫進 out[1]（黑）、out[2]（白） */
function lineIndexes(cells: Int8Array, p: Point, d: number, out: Int32Array) {
  let ib = 0;
  let iw = 0;
  const base = (p * 4 + d) * 9;
  for (let j = 0; j < 8; j++) {
    const q = NB[base + (j < 4 ? j : j + 1)];
    const v = q < 0 ? 3 : cells[q];
    if (v === 0) continue;
    if (v === 1) { ib += POW3[j]; iw += 2 * POW3[j]; }
    else if (v === 2) { ib += 2 * POW3[j]; iw += POW3[j]; }
    else { ib += 2 * POW3[j]; iw += 2 * POW3[j]; }
  }
  out[1] = ib;
  out[2] = iw;
}

const idxBuf = new Int32Array(3);
const clsBuf: [Uint8Array, Uint8Array, Uint8Array] = [new Uint8Array(4), new Uint8Array(4), new Uint8Array(4)];

function combine(cls: Uint8Array): number {
  let fives = 0;
  let openFours = 0;
  let fours = 0;
  let openThrees = 0;
  let sum = 0;
  for (let d = 0; d < 4; d++) {
    const c = cls[d];
    if (c === FIVE) fives++;
    else if (c === OPEN_FOUR) openFours++;
    else if (c === FOUR) fours++;
    else if (c === OPEN_THREE) openThrees++;
    sum += CLASS_VALUE[c];
  }
  if (fives) return V_FIVE;
  if (openFours || fours >= 2) return V_WIN4;
  if (fours && openThrees) return V_FOUR_THREE;
  if (openThrees >= 2) return V_DOUBLE_THREE + sum;
  return sum;
}

/** 在空點 p 下子，黑、白各自能得到的型態分數，寫進 out[1]、out[2] */
function shapeScores(cells: Int8Array, p: Point, out: Float64Array) {
  for (let d = 0; d < 4; d++) {
    lineIndexes(cells, p, d, idxBuf);
    clsBuf[1][d] = PATTERN[idxBuf[1]];
    clsBuf[2][d] = PATTERN[idxBuf[2]];
  }
  out[1] = combine(clsBuf[1]);
  out[2] = combine(clsBuf[2]);
}

/** 對手下在 p 會不會直接連五 */
function makesFive(cells: Int8Array, p: Point, c: Color): boolean {
  for (let d = 0; d < 4; d++) {
    lineIndexes(cells, p, d, idxBuf);
    if (PATTERN[idxBuf[c]] === FIVE) return true;
  }
  return false;
}

/**
 * 節目級的「守」：只看緊鄰 p 的一側連續有幾顆對手的子（不會把 p 兩邊的子接起來看）。
 * 所以 `X_XX` 的空格在它眼裡只是兩側各一、二顆 —— 跳三完全看不出來。
 */
function naiveThreat(cells: Int8Array, p: Point, o: Color): number {
  let v = 0;
  for (let d = 0; d < 4; d++) {
    const base = (p * 4 + d) * 9 + 4;
    for (const sign of [-1, 1]) {
      let k = 0;
      while (k < 4) {
        const q = NB[base + sign * (k + 1)];
        if (q < 0 || cells[q] !== o) break;
        k++;
      }
      if (!k) continue;
      const beyond = k < 4 ? NB[base + sign * (k + 1)] : -1;
      const open = beyond >= 0 && cells[beyond] === 0;
      v += k >= 4 ? 1_000_000 : k === 3 ? (open ? 20_000 : 2_000) : k === 2 ? (open ? 800 : 80) : 10;
    }
  }
  return v;
}

// ─── 共用 ───────────────────────────────────────────────────────────────

function toCells(s: GomokuState): Int8Array {
  const cells = new Int8Array(POINTS);
  s.board.forEach((st, p) => { if (st) cells[p] = st.side === 'black' ? BLACK : WHITE; });
  return cells;
}

/** 已有子周圍 2 格內的空點 */
function candidates(cells: Int8Array): Point[] {
  const mark = new Uint8Array(POINTS);
  for (let p = 0; p < POINTS; p++) {
    if (!cells[p]) continue;
    for (const q of AROUND[p]) if (!cells[q]) mark[q] = 1;
  }
  const out: Point[] = [];
  for (let p = 0; p < POINTS; p++) if (mark[p]) out.push(p);
  return out;
}

const scoreBuf = new Float64Array(3);

export type AiOptions = {
  /** 可注入，測試才能重現 */
  random?: () => number;
  /** 困難級的思考時間上限（毫秒）。到了就用最後一層完整搜完的結果 */
  budgetMs?: number;
  /** 困難級的最大搜尋深度（預設 6；時間不夠就停在最後一層完整搜完的深度） */
  maxDepth?: number;
};

/**
 * 選一手。顏色一律跟玩家上一手同色。局面已經結束、或盤面下滿就回傳 null。
 */
export function chooseMove(s: GomokuState, level: Level = 'normal', options: AiOptions = {}): Move | null {
  if (s.winner) return null;
  const at = choosePoint(s, level, options);
  return at === null ? null : { at, color: lastColor(s) };
}

function choosePoint(s: GomokuState, level: Level, options: AiOptions): Point | null {
  const random = options.random ?? Math.random;
  const cells = toCells(s);
  const me: Color = s.turn === 'black' ? BLACK : WHITE;
  const o = opp(me);
  if (s.moves.length === 0) return CENTER;
  const cands = candidates(cells);
  if (!cands.length) {
    const free = s.board.findIndex((x) => x === null);
    return free < 0 ? null : free;
  }

  // 能直接連五就連（每一級都會）
  for (const p of cands) if (makesFive(cells, p, me)) return p;
  // 對手下一手就連五：一定擋（每一級都會；兩個以上的點擋不完，挑一個擋）
  const mustBlock = cands.filter((p) => makesFive(cells, p, o));
  if (mustBlock.length) return bestBy(mustBlock, (p) => { shapeScores(cells, p, scoreBuf); return scoreBuf[me]; });

  if (level === 'hard') return chooseHard(cells, me, cands, random, options, s.moves.length);

  const noise = level === 'show' ? 0.3 : 0.04;
  return bestBy(cands, (p) => {
    shapeScores(cells, p, scoreBuf);
    const base = level === 'show'
      ? scoreBuf[me] + 0.35 * naiveThreat(cells, p, o)
      : scoreBuf[me] + 0.9 * scoreBuf[o];
    return base * (1 + noise * (random() - 0.5));
  });
}

function bestBy(points: Point[], score: (p: Point) => number): Point {
  let best = points[0];
  let bestScore = -Infinity;
  for (const p of points) {
    const v = score(p);
    if (v > bestScore) { bestScore = v; best = p; }
  }
  return best;
}

// ─── 困難級 ─────────────────────────────────────────────────────────────

/** 五格窗的分數（依窗裡自己有幾顆、且沒有對手的子）。盤面評分＝所有窗加總 */
const TUPLE = [0, 1, 12, 120, 1_200, 100_000];
const WIN_SCORE = 10_000_000;

/** 困難級搜尋用的可變盤面：增量維護每個五格窗的子數、評分與「衝四窗」數 */
class Board {
  cells: Int8Array;
  cnt: [Int8Array, Int8Array, Int8Array] = [new Int8Array(0), new Int8Array(NW), new Int8Array(NW)];
  /** 各方所有窗的分數加總 */
  sum = [0, 0, 0];
  /** 各方「4 顆自己的子、沒有對手的子」的窗數 —— 大於 0 就是下一手能連五 */
  fours = [0, 0, 0];
  /** 每個點周圍 2 格內有幾顆子；大於 0 的空點才是候選 */
  near = new Uint8Array(POINTS);

  constructor(cells: Int8Array) {
    this.cells = new Int8Array(POINTS);
    for (let p = 0; p < POINTS; p++) if (cells[p]) this.place(p, cells[p] as Color);
  }

  /** 下子，回傳這一手有沒有連五 */
  place(p: Point, c: Color): boolean {
    const o = opp(c);
    const mineCnt = this.cnt[c];
    const theirCnt = this.cnt[o];
    let five = false;
    this.cells[p] = c;
    for (const w of WINS_OF[p]) {
      const mine = mineCnt[w];
      const theirs = theirCnt[w];
      mineCnt[w] = mine + 1;
      if (theirs === 0) {
        this.sum[c] += TUPLE[mine + 1] - TUPLE[mine];
        if (mine === 4) this.fours[c]--;
        if (mine + 1 === 4) this.fours[c]++;
        if (mine + 1 >= 5) five = true;
      } else if (mine === 0) {
        this.sum[o] -= TUPLE[theirs];
        if (theirs === 4) this.fours[o]--;
      }
    }
    for (const q of AROUND[p]) this.near[q]++;
    return five;
  }

  unplace(p: Point) {
    const c = this.cells[p] as Color;
    const o = opp(c);
    const mineCnt = this.cnt[c];
    const theirCnt = this.cnt[o];
    for (const w of WINS_OF[p]) {
      const mine = mineCnt[w];
      const theirs = theirCnt[w];
      mineCnt[w] = mine - 1;
      if (theirs === 0) {
        this.sum[c] += TUPLE[mine - 1] - TUPLE[mine];
        if (mine === 4) this.fours[c]--;
        if (mine - 1 === 4) this.fours[c]++;
      } else if (mine === 1) {
        this.sum[o] += TUPLE[theirs];
        if (theirs === 4) this.fours[o]++;
      }
    }
    this.cells[p] = 0;
    for (const q of AROUND[p]) this.near[q]--;
  }

  /** c 下一手能連五的點（去重） */
  threats(c: Color): Point[] {
    const out: Point[] = [];
    if (!this.fours[c]) return out;
    const mine = this.cnt[c];
    const theirs = this.cnt[opp(c)];
    for (let w = 0; w < NW; w++) {
      if (mine[w] !== 4 || theirs[w] !== 0) continue;
      for (let i = 0; i < 5; i++) {
        const q = WIN[w * 5 + i];
        if (!this.cells[q] && !out.includes(q)) out.push(q);
      }
    }
    return out;
  }

  /** c 下了會形成「衝四」（下一手能連五）的點 */
  fourMakers(c: Color): Point[] {
    const out: Point[] = [];
    const mine = this.cnt[c];
    const theirs = this.cnt[opp(c)];
    for (let w = 0; w < NW; w++) {
      if (mine[w] !== 3 || theirs[w] !== 0) continue;
      for (let i = 0; i < 5; i++) {
        const q = WIN[w * 5 + i];
        if (!this.cells[q] && !out.includes(q)) out.push(q);
      }
    }
    return out;
  }

  /** 輪到 stm 時的靜態評分（stm 的角度）。輪到的一方的形勢多算兩成：同樣的活三，先手才轉得成活四 */
  evaluate(stm: Color): number {
    return this.sum[stm] * 1.2 - this.sum[opp(stm)];
  }
}

/** 一次掃過所有候選點的結果：排序後的前幾名，加上搜尋要用的威脅資訊 */
type Scan = {
  /** 排序分數（攻＋0.9 守）的前 k 名，由高到低 */
  top: Point[];
  /** 輪到的一方下一手就能成活四或雙四 —— 對手又沒有衝四可以反擊，等於已經贏了 */
  winNow: boolean;
  /** 輪到的一方下一手能成四三（幾乎是贏，但對手擋四時可能順手反衝） */
  fourThree: boolean;
  /** 對手下了會成活四、雙四或四三的點：不處理就輸，只能擋或用衝四搶先 */
  threats: Point[];
  /** 輪到的一方下了會成衝四以上的點（被威脅時的反擊手段） */
  fours: Point[];
  /** threats ∪ fours 依排序分數由高到低 */
  forcing: Point[];
};

function scan(b: Board, stm: Color, k: number, jitter?: () => number): Scan {
  const o = opp(stm);
  const top: Point[] = [];
  const topScores: number[] = [];
  const threats: Point[] = [];
  const fours: Point[] = [];
  const forcing: [Point, number][] = [];
  let winNow = false;
  let fourThree = false;
  for (let p = 0; p < POINTS; p++) {
    if (b.cells[p] || !b.near[p]) continue;
    let myMax = 0;
    for (let d = 0; d < 4; d++) {
      lineIndexes(b.cells, p, d, idxBuf);
      clsBuf[1][d] = PATTERN[idxBuf[1]];
      clsBuf[2][d] = PATTERN[idxBuf[2]];
      if (clsBuf[stm][d] > myMax) myMax = clsBuf[stm][d];
    }
    const mine = combine(clsBuf[stm]);
    const theirs = combine(clsBuf[o]);
    if (mine >= V_WIN4) winNow = true;
    else if (mine >= V_FOUR_THREE) fourThree = true;
    const v = (mine + 0.9 * theirs) * (jitter ? 1 + 0.1 * (jitter() - 0.5) : 1);
    const isThreat = theirs >= V_FOUR_THREE;
    const isFour = myMax >= FOUR;
    if (isThreat) threats.push(p);
    if (isFour) fours.push(p);
    if (isThreat || isFour) forcing.push([p, v]);
    // 插入排序，只留前 k 名
    let i = top.length;
    if (i === k && v <= topScores[k - 1]) continue;
    if (i === k) { top.pop(); topScores.pop(); i--; }
    while (i > 0 && topScores[i - 1] < v) i--;
    top.splice(i, 0, p);
    topScores.splice(i, 0, v);
  }
  forcing.sort((x, y) => y[1] - x[1]);
  return { top, winNow, fourThree, threats, fours, forcing: forcing.map(([p]) => p) };
}

/**
 * 連續衝四的必勝（VCF）：每一手都是衝四，對手只能擋在唯一的那一點，
 * 直到形成雙四／活四或直接連五。找到就回傳第一手，找不到是 −1。
 *
 * 對手被迫擋的那一手如果反過來形成衝四（反擊），下一手就必須擋在那裡，
 * 而且那一手也得是衝四才算延續（`only`）。
 * 前提：呼叫時對手沒有衝四（有的話要先擋，不是 VCF 的局面）。
 */
function vcf(b: Board, me: Color, depth: number, budget: { nodes: number }, only = -1): Point {
  if (depth <= 0 || --budget.nodes < 0) return -1;
  const o = opp(me);
  const cands = only >= 0 ? [only] : b.fourMakers(me);
  for (const p of cands) {
    if (b.cells[p]) continue;
    if (b.place(p, me)) { b.unplace(p); return p; }
    let win = false;
    const t = b.threats(me);
    if (t.length >= 2) win = true;
    else if (t.length === 1) {
      const q = t[0];
      const oFive = b.place(q, o);
      if (!oFive) {
        if (!b.fours[o]) win = vcf(b, me, depth - 1, budget) >= 0;
        else {
          const r = b.threats(o);
          if (r.length === 1) win = vcf(b, me, depth - 1, budget, r[0]) >= 0;
        }
      }
      b.unplace(q);
    }
    b.unplace(p);
    if (win) return p;
  }
  return -1;
}

/** 輪到 o 時，o 有沒有 VCF。me 剛下的子若形成衝四，o 得先擋在那裡、而且那一手也要是衝四 */
function hasVcf(b: Board, o: Color, budget: { nodes: number }): boolean {
  const me = opp(o);
  if (b.fours[me]) {
    const t = b.threats(me);
    if (t.length >= 2) return false; // o 擋不完，輪不到它
    return vcf(b, o, VCF_DEPTH, budget, t[0]) >= 0;
  }
  return vcf(b, o, VCF_DEPTH, budget) >= 0;
}

const VCF_DEPTH = 10;
const ROOT_MOVES = 12;
const INNER_MOVES = 8;
const MAX_PLY = 16;
/** 四三：幾乎是贏，但不像活四那樣保證（對手擋四時可能順手反衝） */
const NEAR_WIN = WIN_SCORE / 2;
const now = () => (typeof performance !== 'undefined' ? performance.now() : Date.now());

type SearchCtx = { deadline: number; nodes: number; aborted: boolean };

/**
 * negamax＋alpha-beta。除了深度之外，靠三條「威脅」規則讓搜尋又窄又準：
 * - 被衝四：只能擋，而且擋的那一手不扣深度（延伸到威脅結束）
 * - 輪到的一方下一手能成活四／雙四：對手沒有衝四可以反擊，直接算贏，不必再搜
 * - 對手有活三（下一手能成活四、四三）：只看擋的點與自己的衝四，其他手都是輸
 */
function negamax(b: Board, stm: Color, depth: number, alpha: number, beta: number, ply: number, ctx: SearchCtx): number {
  if ((++ctx.nodes & 255) === 0 && now() > ctx.deadline) ctx.aborted = true;
  if (ctx.aborted) return 0;
  const o = opp(stm);
  // 輪到的一方有衝四：直接連五。越早贏越好、越晚輸越好，分數帶上手數
  if (b.fours[stm]) return WIN_SCORE - ply;
  if (b.fours[o]) {
    const t = b.threats(o);
    if (t.length >= 2) return -(WIN_SCORE - ply - 1);
    if (ply >= MAX_PLY) return b.evaluate(stm);
    b.place(t[0], stm);
    const v = -negamax(b, o, depth - 1, -beta, -alpha, ply + 1, ctx);
    b.unplace(t[0]);
    return v;
  }
  if (ply >= MAX_PLY) return b.evaluate(stm);
  const sc = scan(b, stm, INNER_MOVES);
  if (sc.winNow) return WIN_SCORE - ply - 2;
  if (depth <= 0) return sc.fourThree ? NEAR_WIN - ply : b.evaluate(stm);
  const moves = sc.threats.length ? sc.forcing : sc.top;
  if (!moves.length) return 0;
  let best = -Infinity;
  for (const m of moves) {
    b.place(m, stm);
    const v = -negamax(b, o, depth - 1, -beta, -alpha, ply + 1, ctx);
    b.unplace(m);
    if (ctx.aborted) return 0;
    if (v > best) best = v;
    if (v > alpha) alpha = v;
    if (alpha >= beta) break;
  }
  return best;
}

function chooseHard(cells: Int8Array, me: Color, cands: Point[], random: () => number, options: AiOptions, plies: number): Point {
  const started = now();
  const budgetMs = options.budgetMs ?? 320;
  const maxDepth = options.maxDepth ?? 6;
  const b = new Board(cells);
  const o = opp(me);

  // 自己有 VCF：照著衝
  const mine = vcf(b, me, VCF_DEPTH, { nodes: 6_000 });
  if (mine >= 0) return mine;

  // 開局幾手加一點擾動，不要每一局都下一模一樣的棋
  const sc = scan(b, me, ROOT_MOVES, plies <= 6 ? random : undefined);
  // 對手有活三：只看擋的點與自己的衝四（其餘的手都是讓對手成活四）
  let roots = sc.threats.length ? sc.forcing : sc.top;
  if (!roots.length) return cands[0];

  // 對手有 VCF：只留下下完之後能解掉它的手（都解不掉就照常搜，至少拖久一點）。
  // 對手 VCF 的第一手也列進候選 —— 先佔掉那一點是最直接的防法，但它不一定在前幾名裡
  const theirs = vcf(b, o, VCF_DEPTH, { nodes: 3_000 });
  if (theirs >= 0) {
    if (!roots.includes(theirs)) roots = [...roots, theirs];
    const safe = roots.filter((m) => {
      b.place(m, me);
      const ok = !hasVcf(b, o, { nodes: 1_500 });
      b.unplace(m);
      return ok;
    });
    if (safe.length) roots = safe;
  }
  if (roots.length === 1) return roots[0];

  // 疊代加深：只採用完整跑完的那一層
  const ctx: SearchCtx = { deadline: started + budgetMs, nodes: 0, aborted: false };
  let best = roots[0];
  for (let depth = 1; depth <= maxDepth; depth++) {
    let iterBest = -1;
    let iterScore = -Infinity;
    let alpha = -Infinity;
    for (const m of roots) {
      b.place(m, me);
      const v = -negamax(b, o, depth - 1, -Infinity, -alpha, 1, ctx);
      b.unplace(m);
      if (ctx.aborted) break;
      if (v > iterScore) { iterScore = v; iterBest = m; }
      if (v > alpha) alpha = v;
    }
    if (ctx.aborted) break;
    best = iterBest;
    // 上一層最好的那手排第一，下一層剪得比較多
    roots = [best, ...roots.filter((m) => m !== best)];
    if (Math.abs(iterScore) >= WIN_SCORE - 100) break;
  }
  return best;
}

/** 輪到的一方有沒有連續衝四的必勝。有就回傳第一手（測試與之後的提示功能用） */
export function findVcf(s: GomokuState, nodes = 6_000): Point | null {
  if (s.winner) return null;
  const b = new Board(toCells(s));
  const me: Color = s.turn === 'black' ? BLACK : WHITE;
  if (b.fours[opp(me)]) return null;
  const p = vcf(b, me, VCF_DEPTH, { nodes });
  return p >= 0 ? p : null;
}
