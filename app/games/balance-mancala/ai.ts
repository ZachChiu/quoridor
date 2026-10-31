import {
  CELLS, ANGEL, DEVIL, END_SCORE, CELL_COLOUR,
  applyMove, legalPlacements, sourcesOf, sow, standings, reachedEnd,
  type Colour, type MancalaState, type Move, type Scores, type Seat,
} from './engine';

/**
 * Balance Mancala 的電腦對手。純函式，random 可注入（測試才能重現）。
 *
 * 完全資訊，但多人、又能自由排序，不適合 alpha-beta 深搜（docs/games-deep-s2.md §2〈電腦對手〉）。作法：
 * 1. 候選步：起點格（有自己子的格，≤ 每人子數）× 最後一顆給誰（那格裡的每一種主人）
 *    × 其餘子的幾種排法（自己的子分散、對手的子集中、少送好位置給對手，加幾個隨機排法）；
 *    落在天使／惡魔格又同分時，每個可選的顏色各算一步。
 * 2. 每一步看一層：局面評分（見 evaluate）。
 * 3. 前幾名再往下抽樣：接下來的人各用簡單的貪婪策略回一手（普通看下一位、困難看到又輪到自己），
 *    再評一次分。一手只要幾毫秒，放主執行緒就好（呼叫端仍用 setTimeout 讓出一格畫面）。
 *
 * 難度＝看幾層＋候選多寡＋隨機性；個性（結盟／打王／自私）只是評分權重不同。
 */
export type Difficulty = 'easy' | 'normal' | 'hard';
export type Personality = 'balanced' | 'hunter' | 'selfish';

type Weights = { leader: number; field: number; mobility: number };
/** leader：壓領先者的力道；field：壓其他人平均的力道；mobility：自己可選的格數 */
const PERSONALITY: Record<Personality, Weights> = {
  balanced: { leader: 0.5, field: 0.2, mobility: 0.6 },
  hunter: { leader: 0.85, field: 0.1, mobility: 0.5 },
  selfish: { leader: 0.25, field: 0.1, mobility: 0.7 },
};

type Level = {
  /** 啟發式排法有幾種（1 或 2） */
  styles: number;
  /** 再加幾個隨機排法 */
  shuffles: number;
  /** 前幾名往下抽樣回應；0＝只看一層 */
  top: number;
  /** 往下模擬幾個人的回應：0 不看、1 只看下一位、'round' 看到又輪到自己（6 席以上退回 1） */
  replies: 0 | 1 | 'round';
  /** 評分加上的隨機擾動（±） */
  noise: number;
  /** 直接隨便走一步的機率 */
  blunder: number;
};

const LEVELS: Record<Difficulty, Level> = {
  easy: { styles: 1, shuffles: 1, top: 0, replies: 0, noise: 6, blunder: 0.3 },
  normal: { styles: 2, shuffles: 2, top: 6, replies: 1, noise: 1.5, blunder: 0.05 },
  hard: { styles: 2, shuffles: 3, top: 10, replies: 'round', noise: 0, blunder: 0 },
};

/**
 * 實際往下模擬幾個人。對戰模擬（困難對普通、各數百局）：4 席看完一整輪勝率 42%、只看下一位 37%；
 * 5 席兩者差不多（36%、33%）；7 席反過來（看完一整輪 13–21%、只看下一位 29%）——
 * 六個對手都用貪婪策略猜，誤差一路累積，看越遠反而越不準。
 */
function replyDepth(level: Level, seats: number): number {
  if (level.replies === 'round') return seats <= 5 ? seats - 1 : 1;
  return level.replies;
}

/** 三色各到 16，最終分數才可能超過 15（2×16−16＝16） */
const TARGET = 16;

/** 電腦座位的個性：輪流分配，讓同一桌的電腦打法不一樣 */
export function personalityOf(seat: Seat): Personality {
  return (['balanced', 'hunter', 'selfish'] as const)[seat % 3];
}

type Position = Pick<MancalaState, 'board' | 'scores'>;

/**
 * 一個座位分數的價值。最終分數（2×最低−最高）只在結束那一刻才算數，
 * 前期就照它評，電腦會連得分都不敢 —— 所以加上「三色各自離 16 還差多少」的進度分，
 * 越接近終局（有人快到 30）進度分的比重越低，越接近真正的最終分數。
 */
function seatValue(sc: Scores, progress: number): number {
  const lo = Math.min(...sc);
  const hi = Math.max(...sc);
  const potential = Math.min(sc[0], TARGET) + Math.min(sc[1], TARGET) + Math.min(sc[2], TARGET);
  const alpha = 0.3 + 1.7 * (1 - progress);
  // 最高色太靠近 30：別人隨時可以把你推過 30、在你分數難看的時候結束
  const danger = hi >= 25 ? (hi - 24) * 1.5 : 0;
  return 2 * lo - hi + alpha * potential - danger;
}

/** 遊戲結束時的評分：只有自己是第一名才是好結果 */
function terminalValue(scores: Scores[], me: Seat): number {
  const st = standings({ scores });
  const mine = st.find((r) => r.seat === me)!;
  const bestOther = st.find((r) => r.seat !== me)!;
  const firsts = st.filter((r) => r.rank === 1).length;
  if (mine.rank === 1) return 1000 + 10 * (mine.final - bestOther.final) - 400 * (firsts - 1);
  return -1000 - 60 * (mine.rank - 1) + mine.final;
}

/** 從 me 的角度評一個局面 */
export function evaluate(p: Position, me: Seat, personality: Personality = 'balanced'): number {
  if (reachedEnd(p.scores)) return terminalValue(p.scores, me);
  const w = PERSONALITY[personality];
  let top = 0;
  for (const sc of p.scores) for (const v of sc) if (v > top) top = v;
  const progress = Math.min(1, top / END_SCORE);
  const mine = seatValue(p.scores[me], progress);
  let leader = -Infinity;
  let sum = 0;
  p.scores.forEach((sc, seat) => {
    if (seat === me) return;
    const v = seatValue(sc, progress);
    if (v > leader) leader = v;
    sum += v;
  });
  const field = sum / (p.scores.length - 1);
  let mobility = 0;
  for (const cell of p.board) if (cell.includes(me)) mobility++;
  return mine - w.leader * leader - w.field * field + w.mobility * mobility;
}

/** 目前分數最領先的對手（給排法啟發式用） */
function leaderOf(p: Position, me: Seat): Seat {
  let best = -1;
  let bestV = -Infinity;
  p.scores.forEach((sc, seat) => {
    if (seat === me) return;
    const v = 2 * Math.min(...sc) - Math.max(...sc) + (sc[0] + sc[1] + sc[2]) / 3;
    if (v > bestV) { bestV = v; best = seat; }
  });
  return best;
}

/**
 * 某人的子落在 cell 之後，他下一手從那格播、讓自己的子最後落下，大概能拿多少好處。
 * 子數由盤面決定、跟排法無關，所以先用「播完之後的盤面」估：落點的子數就是分數，
 * 再看那個顏色他缺不缺（缺就是好機會，最高色就是爛機會）。
 */
function threat(after: Seat[][], cell: number, sc: Scores): number {
  const n = after[cell].length;
  if (n === 0 || n >= CELLS) return 0;
  const land = (cell + n) % CELLS;
  const points = after[land].length + 1;
  const lo = Math.min(...sc);
  const hi = Math.max(...sc);
  if (land === ANGEL) return points;
  if (land === DEVIL) return -points * 0.6;
  const v = sc[CELL_COLOUR[land] as Colour];
  if (v >= TARGET) return -points * 0.6;
  return v === lo ? points : v === hi ? points * 0.2 : points * 0.6;
}

/**
 * 其餘的子怎麼排（最後一顆另外決定）。全域貪婪：每次挑「哪顆子放哪一格」最划算的一對。
 * - style 0：自己的子放進還沒有自己子的格（多一個可選的起點），對手的子跟他自己的子擠在一起（少一個選擇）
 * - style 1：再考慮落點 —— 自己的子放在下一手打得出好分數的格，對手的子避開
 */
function arrangeRest(p: Position, from: number, rest: Seat[], me: Seat, style: number): Seat[] {
  const k = rest.length;
  if (k <= 1) return rest.slice();
  const slots = Array.from({ length: k }, (_, j) => (from + 1 + j) % CELLS);
  const base = p.board.map((c, i) => (i === from ? [] : c));
  // 播完之後每一格的子數（排法不影響子數），style 1 估落點用
  const after = base.map((c) => c.slice());
  for (const c of slots) after[c].push(-1);
  after[(from + k + 1) % CELLS].push(-1);
  const leader = leaderOf(p, me);
  const pref = (o: Seat, cell: number) => {
    const has = base[cell].includes(o);
    if (o === me) return (has ? 0 : 3) + (style === 1 ? 0.35 * threat(after, cell, p.scores[me]) : 0);
    let v = has ? 2 + (o === leader ? 1 : 0) : 0;
    if (style === 1) v -= 0.35 * threat(after, cell, p.scores[o]) * (o === leader ? 1.5 : 1);
    return v;
  };
  const remaining = new Map<Seat, number>();
  for (const o of rest) remaining.set(o, (remaining.get(o) ?? 0) + 1);
  const out: Seat[] = Array(k).fill(-1);
  for (let filled = 0; filled < k; filled++) {
    let bestJ = -1;
    let bestO = -1;
    let bestV = -Infinity;
    for (let j = 0; j < k; j++) {
      if (out[j] !== -1) continue;
      for (const [o, left] of remaining) {
        if (!left) continue;
        const v = pref(o, slots[j]);
        if (v > bestV) { bestV = v; bestJ = j; bestO = o; }
      }
    }
    out[bestJ] = bestO;
    remaining.set(bestO, remaining.get(bestO)! - 1);
  }
  return out;
}

function shuffled<T>(xs: T[], random: () => number): T[] {
  const a = xs.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

type Candidate = { move: Move; after: MancalaState; v1: number; v: number };

/**
 * 列出候選步（並算好走完的局面）。`only` 可以限定起點格與最後一顆的主人（給玩家的建議排法用）。
 */
function candidates(
  s: MancalaState, seat: Seat, level: Pick<Level, 'styles' | 'shuffles'>, random: () => number,
  only: { from?: number; last?: Seat } = {},
): Candidate[] {
  const out: Candidate[] = [];
  const seen = new Set<string>();
  const froms = only.from !== undefined ? [only.from] : sourcesOf(s, seat);
  for (const from of froms) {
    const pieces = s.board[from];
    const owners = [...new Set(pieces)];
    for (const last of owners) {
      if (only.last !== undefined && last !== only.last) continue;
      const rest = pieces.slice();
      rest.splice(rest.indexOf(last), 1);
      const orders: Seat[][] = [];
      for (let style = 0; style < level.styles; style++) orders.push(arrangeRest(s, from, rest, seat, style));
      for (let i = 0; i < level.shuffles; i++) orders.push(shuffled(rest, random));
      for (const r of orders) {
        const order = [...r, last];
        const key = `${from}:${order.join('')}`;
        if (seen.has(key)) continue;
        seen.add(key);
        // 落在天使／惡魔格又同分：每個可選的顏色各算一步
        const options = sow(s, from, order).options;
        for (const colour of options) {
          const move: Move = options.length > 1 ? { from, order, colour } : { from, order };
          out.push({ move, after: applyMove(s, move), v1: 0, v: 0 });
        }
      }
    }
  }
  return out;
}

/** 對手的簡單策略：一層、少量候選，用平衡型的評分 */
function greedyReply(s: MancalaState, random: () => number): MancalaState {
  const seat = s.turn;
  let best: Candidate | null = null;
  for (const c of candidates(s, seat, { styles: 1, shuffles: 0 }, random)) {
    c.v1 = evaluate(c.after, seat);
    if (!best || c.v1 > best.v1) best = c;
  }
  return best ? best.after : s;
}

/** 接下來幾個人各回一手之後，從 me 的角度評分 */
function lookahead(s: MancalaState, me: Seat, replies: number, personality: Personality, random: () => number): number {
  let cur = s;
  for (let i = 0; i < replies && cur.phase === 'play' && cur.turn !== me; i++) cur = greedyReply(cur, random);
  return evaluate(cur, me, personality);
}

function rank(list: Candidate[], s: MancalaState, seat: Seat, level: Level, personality: Personality, random: () => number): Candidate[] {
  const depth = replyDepth(level, s.config.seats);
  for (const c of list) c.v1 = evaluate(c.after, seat, personality);
  list.sort((a, b) => b.v1 - a.v1);
  list.forEach((c, i) => {
    c.v = c.v1;
    // 已經結束的局面不必往下看；前幾名才抽樣對手的回應
    if (i < level.top && c.after.phase === 'play' && depth > 0) {
      c.v = 0.3 * c.v1 + 0.7 * lookahead(c.after, seat, depth, personality, random);
    }
    if (level.noise) c.v += (random() - 0.5) * 2 * level.noise;
  });
  return list.sort((a, b) => b.v - a.v);
}

export type ChooseOptions = { personality?: Personality; random?: () => number };

/** 電腦選一手（輪到的人）。遊戲不在播種階段就回 null */
export function chooseMove(s: MancalaState, difficulty: Difficulty = 'normal', opts: ChooseOptions = {}): Move | null {
  if (s.phase !== 'play') return null;
  const random = opts.random ?? Math.random;
  const personality = opts.personality ?? 'balanced';
  const level = LEVELS[difficulty];
  const list = candidates(s, s.turn, level, random);
  if (!list.length) return null;
  // 失誤：隨便走一步。但能直接贏的手還是會走 —— 那不是失誤的時機
  if (level.blunder && random() < level.blunder) {
    const win = list.find((c) => c.after.phase === 'over' && terminalValue(c.after.scores, s.turn) > 0);
    return (win ?? list[Math.floor(random() * list.length)]).move;
  }
  return rank(list, s, s.turn, level, personality, random)[0].move;
}

/**
 * 給玩家的建議排法：起點格已選好（可再限定最後一顆給誰），用困難的評分、不加隨機。
 * 排序編輯器一打開就套用這個，玩家再自己改。
 */
export function suggestMove(s: MancalaState, from: number, last?: Seat, random: () => number = Math.random): Move | null {
  if (s.phase !== 'play' || !s.board[from]?.includes(s.turn)) return null;
  const level = { ...LEVELS.hard, noise: 0, blunder: 0 };
  const list = candidates(s, s.turn, level, random, { from, last });
  if (!list.length) return null;
  return rank(list, s, s.turn, level, 'balanced', random)[0].move;
}

/** 天使／惡魔格同分時，替動子的人挑一個最好的顏色（玩家的預設選項） */
export function suggestColour(s: MancalaState, from: number, order: Seat[]): Colour | null {
  const r = sow(s, from, order);
  if (r.options.length <= 1) return r.options[0] ?? null;
  let best: Colour = r.options[0];
  let bestV = -Infinity;
  for (const colour of r.options) {
    const v = evaluate(sow(s, from, order, colour), s.turn);
    if (v > bestV) { bestV = v; best = colour; }
  }
  return best;
}

/**
 * 開局放子：分散在自己還沒有子的格（之後可選的起點多），
 * 並偏好「從這格播出去會落在子多的格」的位置（之後打得出分數）。
 */
export function choosePlacement(s: MancalaState, difficulty: Difficulty = 'normal', random: () => number = Math.random): number | null {
  const legal = legalPlacements(s);
  if (!legal.length) return null;
  if (difficulty === 'easy' && random() < 0.5) return legal[Math.floor(random() * legal.length)];
  const me = s.turn;
  let best = legal[0];
  let bestV = -Infinity;
  for (const cell of legal) {
    let v = s.board[cell].includes(me) ? -3 : 0;
    const n = s.board[cell].length + 1;
    const land = (cell + n) % CELLS;
    v += 0.4 * (s.board[land].length + 1);
    v += (random() - 0.5) * (difficulty === 'hard' ? 0.3 : 1.2);
    if (v > bestV) { bestV = v; best = cell; }
  }
  return best;
}
