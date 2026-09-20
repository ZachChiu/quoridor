import { cellKey, DIRECTIONS, inBounds, isBlocked } from './board';
import {
  legalMoves,
  legalWalls,
  movePiece,
  placeOpeningPiece,
  placeWall,
  selectPiece,
} from './engine';
import { playerKeys } from './territory';
import { BOARD_SIZE, type GameState, type Move, type PlayerKey, type WallSlot } from './types';

/**
 * 單人對手。
 *
 * 全部是純函式、吃 GameState 回傳 GameState —— 所以能直接跑在 Web Worker 裡，
 * 也能用 Vitest 驗。這是把規則邏輯抽成 engine 的主要目的之一。
 */
export type Difficulty = 'easy' | 'normal' | 'hard';

/** 一個完整回合：選子 → （可選）移動 → 築牆。三者缺一不可。 */
export type AiTurn = {
  piece: Move;
  /** null 代表原地不動 —— 規則允許零步移動。 */
  dest: Move | null;
  wall: WallSlot;
};

const DIFFICULTY: Record<Difficulty, { depth: number; budgetMs: number; noise: number }> = {
  // 深度 1 ＋ 大幅隨機：會下但常常下錯，適合第一次玩的人
  easy: { depth: 1, budgetMs: 200, noise: 0.45 },
  normal: { depth: 2, budgetMs: 600, noise: 0.08 },
  hard: { depth: 4, budgetMs: 1200, noise: 0 },
};

/** 盤面上屬於當前玩家的棋子。 */
function ownPieces(state: GameState): Move[] {
  const out: Move[] = [];
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      if (state.board[row][col] === state.currentPlayer) out.push({ row, col });
    }
  }
  return out;
}

/**
 * 局面評分（站在 `me` 的角度，越大越好）。
 *
 * 不用 computeTerritories 的原因：它只在「區塊內單一玩家」時才計分，
 * 開局到中盤整盤幾乎是一個大共用區，每個人都是 0 分 —— 對搜尋毫無指向性。
 *
 * 這裡改成：同樣做一次連通區塊掃描，但共用區**依區內棋子數按比例分給各方**。
 * 也就是「可達空間的佔比」，WallZero 論文的結論是這個指標比立即的領地收益
 * 更有預測力。獨佔區維持全額計給。
 */
export function heuristic(state: GameState, me: PlayerKey): number {
  const keys = playerKeys(state.playersNum);
  const share: Record<string, number> = Object.fromEntries(keys.map((k) => [k, 0]));

  const visited = Array.from({ length: BOARD_SIZE }, () => Array<boolean>(BOARD_SIZE).fill(false));

  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      if (visited[row][col]) continue;

      let size = 0;
      const counts: Record<string, number> = {};
      const queue: [number, number][] = [[row, col]];
      visited[row][col] = true;

      while (queue.length > 0) {
        const [r, c] = queue.pop()!;
        size++;
        const occupant = state.board[r][c];
        if (occupant) counts[occupant] = (counts[occupant] ?? 0) + 1;

        for (const { dr, dc } of DIRECTIONS) {
          const nr = r + dr;
          const nc = c + dc;
          if (!inBounds(nr, nc) || visited[nr][nc]) continue;
          if (isBlocked(state, r, c, dr, dc)) continue;
          visited[nr][nc] = true;
          queue.push([nr, nc]);
        }
      }

      const present = Object.keys(counts);
      if (present.length === 1) {
        // 獨佔：整塊都是他的，而且已成定局 —— 給滿分再加一點權重，
        // 讓 AI 願意用一步換一塊確定的地，而不是永遠在爭共用區
        share[present[0]] += size * 1.15;
      } else if (present.length > 1) {
        const total = present.reduce((n, k) => n + counts[k], 0);
        for (const k of present) share[k] += (size * counts[k]) / total;
      }
      // 無人可達的空區不計給任何人
    }
  }

  const mine = share[me];
  const best = Math.max(...keys.filter((k) => k !== me).map((k) => share[k]));
  return mine - best;
}

/** 列出當前玩家所有可下的完整回合。 */
export function enumerateTurns(state: GameState): AiTurn[] {
  const turns: AiTurn[] = [];
  for (const piece of ownPieces(state)) {
    const selected = selectPiece(state, piece.row, piece.col);
    if (!selected.selected) continue;

    // null＝原地不動。規則允許零步移動，而且封閉自己的角落時常常是最強的一手
    const destinations: (Move | null)[] = [null, ...legalMoves(selected)];
    for (const dest of destinations) {
      const moved = dest ? movePiece(selected, dest.row, dest.col) : selected;
      for (const wall of legalWalls(moved)) turns.push({ piece, dest, wall });
    }
  }
  return turns;
}

/** 把一個完整回合套用到盤面上，回傳新的 state（回合會自動推進給下一位）。 */
export function applyTurn(state: GameState, turn: AiTurn): GameState {
  let next = selectPiece(state, turn.piece.row, turn.piece.col);
  if (turn.dest) next = movePiece(next, turn.dest.row, turn.dest.col);
  return placeWall(next, turn.wall.row, turn.wall.col, turn.wall.dir);
}

/**
 * Alpha-beta 搜尋。三人局採 paranoid 假設 —— 兩個對手都被當成一心壓低我方分數。
 * 這比真正的 max-n 保守，但在這個盤面大小下夠用，而且不會有 max-n 的
 * 「對手互相放水」誤判。
 */
class OutOfTime extends Error {}

function search(
  state: GameState,
  me: PlayerKey,
  depth: number,
  alpha: number,
  beta: number,
  deadline: number,
  now: () => number
): number {
  // 逾時直接拋出，讓整層疊代作廢 —— 不能就地回傳 heuristic：
  // 那會把淺層估值混進深層結果裡，算出來的分數彼此不可比。
  if (now() > deadline) throw new OutOfTime();
  if (depth <= 0) return heuristic(state, me);

  const turns = enumerateTurns(state);
  if (turns.length === 0) return heuristic(state, me);

  const maximizing = state.currentPlayer === me;

  // 先照立即評分排序再往下搜 —— alpha-beta 的剪枝效果幾乎全靠這個。
  // 分支因子約 100–200，沒有排序的話深度 3 就跑不動。
  const scored = turns.map((turn) => {
    const next = applyTurn(state, turn);
    return { turn, next, score: heuristic(next, me) };
  });
  scored.sort((a, b) => (maximizing ? b.score - a.score : a.score - b.score));

  let best = maximizing ? -Infinity : Infinity;
  for (const { next } of scored) {
    const value = search(next, me, depth - 1, alpha, beta, deadline, now);
    if (maximizing) {
      best = Math.max(best, value);
      alpha = Math.max(alpha, value);
    } else {
      best = Math.min(best, value);
      beta = Math.min(beta, value);
    }
    if (beta <= alpha) break;
  }
  return best;
}

/**
 * 選出一手。回傳 null 代表無手可下（呼叫端應讓 engine 自動跳過）。
 *
 * 用疊代加深而不是直接搜到底：時間預算到了就用上一層已經算完的結果，
 * 不會因為某個局面分支特別多就卡住畫面。
 */
export function chooseTurn(
  state: GameState,
  me: PlayerKey,
  difficulty: Difficulty = 'normal',
  now: () => number = Date.now
): AiTurn | null {
  const turns = enumerateTurns(state);
  if (turns.length === 0) return null;

  const { depth, budgetMs, noise } = DIFFICULTY[difficulty];
  const deadline = now() + budgetMs;

  let best = turns[0];
  for (let d = 1; d <= depth; d++) {
    let bestScore = -Infinity;
    let bestTurn = best;
    let completed = true;
    for (const turn of turns) {
      try {
        const next = applyTurn(state, turn);
        const score = search(next, me, d - 1, -Infinity, Infinity, deadline, now)
          + (noise ? (Math.random() - 0.5) * noise * 10 : 0);
        if (score > bestScore) {
          bestScore = score;
          bestTurn = turn;
        }
      } catch (e) {
        if (!(e instanceof OutOfTime)) throw e;
        completed = false;
        break;
      }
    }
    // **只採用跑完整層的結果。** 這裡原本會拿沒掃完的那一層去覆蓋上一層 ——
    // 深度 4 在時間預算內根本掃不完，於是「困難」實際上是在用一個殘缺的深搜，
    // 實測對「普通」0 勝 8 敗。不完整的深搜比完整的淺搜差得多。
    if (!completed) break;
    best = bestTurn;
  }
  return best;
}

/** 開局擺放階段選一格。評分方式與對弈階段共用。 */
export function chooseOpeningCell(state: GameState, me: PlayerKey): Move | null {
  const empty: Move[] = [];
  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      if (!state.board[row][col]) empty.push({ row, col });
    }
  }
  if (empty.length === 0) return null;

  let best = empty[0];
  let bestScore = -Infinity;
  for (const cell of empty) {
    const score = heuristic(placeOpeningPiece(state, cell.row, cell.col), me);
    if (score > bestScore) {
      bestScore = score;
      best = cell;
    }
  }
  return best;
}

export { cellKey };
