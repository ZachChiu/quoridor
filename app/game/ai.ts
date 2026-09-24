import { applyTurn, isPlacingPhase, placeOpeningPiece, playableTurns, type Turn } from './engine';
import { computeTerritories, playerKeys, voronoiCount } from './territory';
import type { GameState, PlayerKey } from './types';

export type Difficulty = 'easy' | 'normal' | 'hard';

/**
 * 各難度的搜尋參數。
 *
 * beam 為每層展開的分支上限。深度與 beam 是一組取捨：想搜得更深，
 * 就得把每層看得更窄，否則等待時間會爆炸（開局分支數約 105）。
 *
 * 實測（桌機，含頂層剪枝）：
 *   深度 1 約 25 ms、深度 2 約 374 ms、深度 3 約 4.3 秒（beam 20）
 */
const SETTINGS: Record<
  Difficulty,
  { maxDepth: number; budgetMs: number; noise: number; beam: number }
> = {
  // 只看一步並加入大量擾動，讓新手有贏的空間
  easy: { maxDepth: 1, budgetMs: 500, noise: 8, beam: 20 },
  // 深度 2，反應仍在半秒內
  normal: { maxDepth: 2, budgetMs: 1500, noise: 1, beam: 20 },
  // 深度 3，以較窄的 beam 換取深度，把等待壓在兩秒內
  hard: { maxDepth: 3, budgetMs: 2500, noise: 0, beam: 10 },
};

/** 評估函式的權重。 */
const W = {
  /** 已確定（封閉且獨佔）的領地差距 —— 這是最終真正計分的東西。 */
  owned: 2.0,
  /**
   * Voronoi 估計的差距 —— 主要項目。
   *
   * 開局時全盤連通，已確定領地與可達範圍對雙方完全相同，只有 Voronoi
   * 能從第一手就提供梯度。這也呼應 WallZero 論文的結論：
   * 真正決定勝負的是「可達性控制」，而非立即的領地收益。
   */
  voronoi: 1.0,
  /** 可達範圍差距，作為輔助：避免把自己關進小房間。 */
  reach: 0.3,
};

/** 終局時給予極大分數，確保搜尋優先選擇必勝 / 避開必敗。 */
const WIN_SCORE = 10_000;

/**
 * 深層搜尋時只展開排序後最好的前 N 手。
 *
 * 開局分支數約 105，不剪枝的話深度 2 要 105 × 105 ≈ 1.1 萬次評估
 * （實測約 2 秒），深度 3 更是直接撞上時間上限。每次評估都要跑兩趟
 * 全盤 BFS（領地 + Voronoi），這是成本所在。
 *
 * 排序本身已經用淺層評估挑過一輪，排在後段的手幾乎不可能是最佳解，
 * 因此截斷對棋力的影響很小，換到的深度卻多得多。
 */
const DEFAULT_BEAM = 20;

/**
 * 從 `me` 的角度評估盤面。
 *
 * 三人局採用 paranoid 假設：把「其他所有人」視為一個整體對手，
 * 以最強的那一位作為比較基準。max-n 雖然更精確，但無法有效剪枝，
 * 在瀏覽器的時間預算內深度會淺到失去意義。
 */
export function evaluateFor(state: GameState, me: PlayerKey): number {
  const t = computeTerritories(state);
  const others = playerKeys(state.playersNum).filter((p) => p !== me);

  const myTerritory = t.owned[me]?.length ?? 0;
  const bestOtherTerritory = Math.max(...others.map((p) => t.owned[p]?.length ?? 0));

  if (t.settled) return terminalScore(t, me, others);

  const v = voronoiCount(state);
  const myVoronoi = v[me] ?? 0;
  const bestOtherVoronoi = Math.max(...others.map((p) => v[p] ?? 0));

  const myReach = t.reach[me] ?? 0;
  const bestOtherReach = Math.max(...others.map((p) => t.reach[p] ?? 0));

  // 刻意不含「可選回合數」：該值只對當前玩家有意義，會讓同一盤面
  // 因輪到誰而評分不同，破壞 negamax 所需的對稱性；而且數量級遠大於
  // 領地差（開局約 137 手），會蓋過真正重要的訊號。
  return (
    W.owned * (myTerritory - bestOtherTerritory) +
    W.voronoi * (myVoronoi - bestOtherVoronoi) +
    W.reach * (myReach - bestOtherReach)
  );
}

/**
 * 終局的分數。勝負要跟 score.ts 的 getWinners 同一套規則：
 * 總領地相同時，比最大的那一塊（節目原版的破平），仍相同才是平手。
 *
 * 先前只比總領地 —— 總分打平時一律回 0，AI 分不出「靠最大一塊贏」和
 * 「靠最大一塊輸」，會在兩者之間隨便挑。
 */
function terminalScore(
  t: ReturnType<typeof computeTerritories>, me: PlayerKey, others: PlayerKey[]
): number {
  const total = (p: PlayerKey) => t.owned[p]?.length ?? 0;
  const largest = (p: PlayerKey) => t.regionSizes[p]?.[0] ?? 0;
  const margin = total(me) - Math.max(...others.map(total));
  if (margin !== 0) return Math.sign(margin) * (WIN_SCORE + Math.abs(margin));
  const rivals = others.filter((p) => total(p) === total(me));
  const tiebreak = largest(me) - Math.max(...rivals.map(largest));
  return tiebreak === 0 ? 0 : Math.sign(tiebreak) * WIN_SCORE;
}

/**
 * Negamax + alpha-beta。
 *
 * 三人局同樣沿用此結構（paranoid）：輪到他人時取最小值，
 * 等同假設所有對手都以壓低 `me` 的分數為目標。
 */
function search(
  state: GameState,
  me: PlayerKey,
  depth: number,
  alpha: number,
  beta: number,
  deadline: number,
  beam: number = DEFAULT_BEAM
): number {
  const t = computeTerritories(state);
  if (depth === 0 || t.settled || Date.now() > deadline) {
    return evaluateFor(state, me);
  }

  const turns = playableTurns(state);
  // 輪到的人無事可做。skipUnplayable 已經跳過所有能跳的人，還停在這裡
  // 代表**全員**都動不了 —— isGameOver 認定這是終局，這裡也要照終局計分，
  // 不能拿 Voronoi 之類的中局估計去猜。
  if (turns.length === 0) {
    return terminalScore(t, me, playerKeys(state.playersNum).filter((p) => p !== me));
  }

  const isMyTurn = state.currentPlayer === me;
  let best = isMyTurn ? -Infinity : Infinity;

  // 淺層排序：先看起來好的分支能讓 alpha-beta 剪掉更多
  const ordered = turns
    .map((turn) => ({ turn, next: applyTurn(state, turn) }))
    .map((x) => ({ ...x, score: evaluateFor(x.next, me) }))
    .sort((a, b) => (isMyTurn ? b.score - a.score : a.score - b.score));

  // 只有進入更深層時才剪枝：depth === 1 時展開全部才能確保不漏掉最佳手
  const candidates = depth > 1 ? ordered.slice(0, beam) : ordered;

  for (const { next } of candidates) {
    const score = search(next, me, depth - 1, alpha, beta, deadline, beam);

    if (isMyTurn) {
      best = Math.max(best, score);
      alpha = Math.max(alpha, score);
    } else {
      best = Math.min(best, score);
      beta = Math.min(beta, score);
    }

    if (beta <= alpha) break;
    if (Date.now() > deadline) break;
  }

  return best;
}

export type ChooseResult = {
  turn: Turn | null;
  /** 實際完成的搜尋深度（迭代加深可能因時間預算提前停止）。 */
  depth: number;
  /** 展開的節點數，供除錯與效能觀察。 */
  nodes: number;
  elapsedMs: number;
};

/**
 * 為當前玩家選出一個回合。
 *
 * 採迭代加深：先算完深度 1，再嘗試更深，時間用完就用目前最好的結果。
 * 這確保無論預算多緊都一定有答案，且淺層結果可用於排序加速深層搜尋。
 */
export function chooseTurn(
  state: GameState,
  options: {
    difficulty?: Difficulty;
    /** 覆寫時間預算（毫秒）。測試用，避免跑滿整場對局耗時過久。 */
    budgetMs?: number;
    /**
     * 覆寫最大搜尋深度。
     *
     * 測試專用：時間預算是牆鐘時間，機器忙碌時搜尋會被截短而使結果不穩定。
     * 指定深度並搭配極大的 budgetMs，即可得到完全可重現的行為。
     */
    maxDepth?: number;
    /** 注入亂數來源，讓測試結果可重現。 */
    random?: () => number;
  } = {}
): ChooseResult {
  const { difficulty = 'normal', random = Math.random } = options;
  const started = Date.now();
  const { noise, beam } = SETTINGS[difficulty];
  const maxDepth = options.maxDepth ?? SETTINGS[difficulty].maxDepth;
  const budgetMs = options.budgetMs ?? SETTINGS[difficulty].budgetMs;
  const deadline = started + budgetMs;
  const me = state.currentPlayer;

  const turns = playableTurns(state);
  if (turns.length === 0) {
    return { turn: null, depth: 0, nodes: 0, elapsedMs: Date.now() - started };
  }

  let nodes = 0;
  let bestTurn = turns[0];
  let reachedDepth = 0;

  // 依淺層評估排序；深層搜尋時同樣只保留前段，否則頂層展開全部分支
  // 會讓剪枝失去意義（實測：僅在遞迴內剪枝，深度 2 仍要 1.8 秒）
  const scored = turns
    .map((turn) => {
      const next = applyTurn(state, turn);
      return { turn, next, shallow: evaluateFor(next, me) };
    })
    .sort((a, b) => b.shallow - a.shallow);

  for (let depth = 1; depth <= maxDepth; depth++) {
    const children = depth > 1 ? scored.slice(0, beam) : scored;
    let bestScore = -Infinity;
    let bestAtDepth = children[0].turn;

    for (const { turn, next } of children) {
      nodes++;
      const raw = search(next, me, depth - 1, -Infinity, Infinity, deadline, beam);
      // 擾動只影響選擇，不污染搜尋內部的比較
      const score = noise > 0 ? raw + (random() - 0.5) * noise : raw;

      if (score > bestScore) {
        bestScore = score;
        bestAtDepth = turn;
      }
      if (Date.now() > deadline) break;
    }

    // 只有完整跑完這一層才採用其結果，避免用到被時間截斷的偏頗答案
    if (Date.now() <= deadline) {
      bestTurn = bestAtDepth;
      reachedDepth = depth;
    } else {
      // 第一層即使超時也要有答案
      if (reachedDepth === 0) bestTurn = bestAtDepth;
      break;
    }
  }

  return { turn: bestTurn, depth: reachedDepth, nodes, elapsedMs: Date.now() - started };
}

/**
 * 開局階段選擇落子位置。
 *
 * 開局擺放同樣需要 AI 決策（兩人局的藍方要放兩顆）。
 * 以放置後的 Voronoi 估計為準 —— 擺得好等於一開局就佔住較大的勢力範圍。
 */
export function chooseOpeningPlacement(
  state: GameState,
  options: { difficulty?: Difficulty; random?: () => number } = {}
): { row: number; col: number } | null {
  const { difficulty = 'normal', random = Math.random } = options;
  const { noise } = SETTINGS[difficulty];
  const me = state.currentPlayer;

  let best: { row: number; col: number } | null = null;
  let bestScore = -Infinity;

  for (let row = 0; row < state.board.length; row++) {
    for (let col = 0; col < state.board[row].length; col++) {
      if (state.board[row][col]) continue;

      const next = placeOpeningPiece(state, row, col);
      // 放置失敗（不合法）時 placeOpeningPiece 會原樣回傳
      if (next === state) continue;

      const raw = evaluateFor(next, me);
      const score = noise > 0 ? raw + (random() - 0.5) * noise : raw;

      if (score > bestScore) {
        bestScore = score;
        best = { row, col };
      }
    }
  }

  return best;
}

/**
 * AI 算不出來時的保底一手：第一個空格 / 第一個能下的回合。
 *
 * 不求好，只求對局不會停住 —— Worker 丟例外或根本載不起來時，
 * 原本什麼都不會發生，AI 永遠「輪到它」，玩家只能重新整理。
 * 選法是確定性的，同一個盤面永遠給同一手。
 */
export function fallbackMove(
  state: GameState
): { kind: 'opening'; cell: { row: number; col: number } } | { kind: 'turn'; turn: Turn } | null {
  if (isPlacingPhase(state)) {
    for (let row = 0; row < state.board.length; row++) {
      for (let col = 0; col < state.board[row].length; col++) {
        if (!state.board[row][col]) return { kind: 'opening', cell: { row, col } };
      }
    }
    return null;
  }
  const [turn] = playableTurns(state);
  return turn ? { kind: 'turn', turn } : null;
}
