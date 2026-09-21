import { isGameOver, isPlacingPhase } from './engine';
import { computeTerritories, playerKeys } from './territory';
import type { GameState, PlayerKey, TerritoryResult } from './types';

/** 勝負結果。`['draw']` 代表無法分出高下。 */
export type Outcome = (PlayerKey | 'draw')[];

/** 每位玩家的領地格數。 */
export type Scores = Record<PlayerKey, number>;

export function getScores(territories: TerritoryResult, playersNum: number): Scores {
  const keys = playerKeys(playersNum);
  return Object.fromEntries(
    keys.map((k) => [k, territories.owned[k]?.length ?? 0])
  ) as Scores;
}

/**
 * 判定勝負。
 *
 * 依節目原版規則分兩層：
 * 1. 領地總格數最多者勝
 * 2. 總數相同時，比「最大的單一塊領地」—— 把地圍成一整片比零散好
 * 3. 仍然相同才是平手
 *
 * 第 2 層是這次補上的。先前總分相同一律判並列，等於忽略了原版的決勝規則：
 * 同樣 10 格，圍成一整塊的一方應該勝過切成兩塊 5 格的一方。
 */
export function getWinners(
  scores: Scores,
  playersNum: number,
  regionSizes?: Record<PlayerKey, number[]>
): Outcome {
  const keys = playerKeys(playersNum);

  const topScore = Math.max(...keys.map((k) => scores[k] ?? 0));
  const candidates = keys.filter((k) => (scores[k] ?? 0) === topScore);

  if (candidates.length === 1) return candidates;

  // 沒有領地資料時退回並列（呼叫端理應都會提供）
  if (!regionSizes) return candidates.length === keys.length ? ['draw'] : candidates;

  const largest = (k: PlayerKey) => regionSizes[k]?.[0] ?? 0;
  const topRegion = Math.max(...candidates.map(largest));
  const finalists = candidates.filter((k) => largest(k) === topRegion);

  if (finalists.length === 1) return finalists;
  return finalists.length === keys.length ? ['draw'] : finalists;
}

/**
 * 一次取得領地、分數與勝負。遊戲未結束時 `outcome` 為空陣列。
 *
 * **開局擺子階段一律 0 分、沒有領地。**
 *
 * 規則上「封閉區塊裡只有某人的棋子就算他的地」，而整個棋盤本來就被
 * 外緣的牆封起來 —— 所以第一顆紅棋放下去的那一刻，整盤 49 格都符合
 * 「只有紅方的棋子」，計分板就寫紅方 49。規則沒錯，是它在棋子還沒
 * 擺完的時候套用得太早：那時盤面根本還不是一個局面。
 *
 * 擋在這裡而不是 computeTerritories：那支是純棋盤函式，不知道也不該
 * 知道現在是第幾階段；而 AI 走的是 evaluateFor，直接吃 computeTerritories，
 * 不受影響。
 */
export function evaluate(state: GameState): {
  territories: TerritoryResult;
  scores: Scores;
  outcome: Outcome;
} {
  if (isPlacingPhase(state)) {
    const keys = playerKeys(state.playersNum);
    const blank: TerritoryResult = {
      ...computeTerritories(state),
      owned: Object.fromEntries(keys.map((k) => [k, [] as string[]])) as Record<PlayerKey, string[]>,
      ownerByCell: {},
      regionSizes: Object.fromEntries(keys.map((k) => [k, [] as number[]])) as Record<PlayerKey, number[]>,
    };
    return { territories: blank, scores: getScores(blank, state.playersNum), outcome: [] };
  }

  const territories = computeTerritories(state);
  const scores = getScores(territories, state.playersNum);
  const outcome = isGameOver(state)
    ? getWinners(scores, state.playersNum, territories.regionSizes)
    : [];
  return { territories, scores, outcome };
}
