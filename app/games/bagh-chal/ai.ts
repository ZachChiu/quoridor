import { play as applyMove, legalMoves, trappedTigers, CAPTURES_TO_WIN, type BaghState, type Move, type Side } from './engine';

/**
 * Bagh Chal 的電腦對手：alpha-beta 搜尋（negamax），純函式。
 *
 * 局面很小（25 點、每手最多二十幾種走法），搜幾層在主執行緒上就只要幾十毫秒，
 * 不像 Wall Go 要放進 Web Worker。呼叫端仍然用 setTimeout 讓出一格畫面再算，避免按下去那一下卡住。
 *
 * 評分從老虎的角度（正＝對老虎有利）：
 * - 吃掉的羊最重要，一隻 100 分
 * - 被困住的老虎扣分（羊的目標就是困死老虎）
 * - 老虎可走的步數、現在就能吃的羊加分
 * 雙方完美對弈是和局（Lim & Nievergelt），所以難度靠搜尋深度與隨機擾動分級。
 */
export type Difficulty = 'easy' | 'normal' | 'hard';

/**
 * blunder：這一手直接亂走的機率。只靠搜尋深度分級的話，連一級的羊都不會把羊送給老虎吃 ——
 * 一層搜尋就看得到「放這裡下一手會被吃」（Zach 回報：當老虎完全吃不到羊）。
 * 低難度要像人一樣會失誤，玩家才有東西可以吃、有破綻可以抓。
 */
const SETTINGS: Record<Difficulty, { depth: number; noise: number; blunder: number }> = {
  easy: { depth: 1, noise: 40, blunder: 0.4 },
  normal: { depth: 3, noise: 6, blunder: 0.1 },
  hard: { depth: 5, noise: 0, blunder: 0 },
};

const WIN = 100_000;

function evaluateForTiger(s: BaghState): number {
  if (s.winner === 'tiger') return WIN;
  if (s.winner === 'goat') return -WIN;
  if (s.winner === 'draw') return 0;
  let mobility = 0;
  let threats = 0;
  if (s.turn === 'tiger') {
    for (const m of legalMoves(s)) { mobility++; if (m.kind === 'jump') threats++; }
  }
  return s.captured * 100 - trappedTigers(s.board) * 45 + mobility * 2 + threats * 25;
}

function score(s: BaghState, side: Side): number {
  const v = evaluateForTiger(s);
  return side === 'tiger' ? v : -v;
}

/** 吃子優先排序，alpha-beta 剪得比較多 */
const order = (moves: Move[]) => moves.slice().sort((a, b) => (b.kind === 'jump' ? 1 : 0) - (a.kind === 'jump' ? 1 : 0));

function negamax(s: BaghState, depth: number, alpha: number, beta: number): number {
  if (depth === 0 || s.winner) {
    // 越早贏越好、越晚輸越好：勝負分數帶上剩餘深度
    const v = score(s, s.turn);
    return Math.abs(v) >= WIN ? v + Math.sign(v) * depth : v;
  }
  let best = -Infinity;
  for (const m of order(legalMoves(s))) {
    const v = -negamax(applyMove(s, m), depth - 1, -beta, -alpha);
    if (v > best) best = v;
    if (v > alpha) alpha = v;
    if (alpha >= beta) break;
  }
  return best;
}

/** 選一手。random 可注入，測試才能重現 */
export function chooseMove(s: BaghState, difficulty: Difficulty = 'normal', random: () => number = Math.random): Move | null {
  const moves = order(legalMoves(s));
  if (moves.length === 0) return null;
  const { depth, noise, blunder } = SETTINGS[difficulty];
  // 能直接贏還是會贏 —— 失誤只發生在「不是決勝手」的時候
  const winning = moves.find((m) => applyMove(s, m).winner === s.turn);
  if (winning) return winning;
  if (blunder && random() < blunder) return moves[Math.floor(random() * moves.length)];
  let best: Move = moves[0];
  let bestScore = -Infinity;
  for (const m of moves) {
    const next = applyMove(s, m);
    // 能直接贏就贏，不必再搜
    if (next.winner === s.turn) return m;
    const v = -negamax(next, depth - 1, -Infinity, Infinity) + (noise ? (random() - 0.5) * noise : 0);
    if (v > bestScore) { bestScore = v; best = m; }
  }
  return best;
}

export { CAPTURES_TO_WIN };
