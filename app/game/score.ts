import { computeTerritories, playerKeys } from './territory';
import type { GameState, PlayerKey, TerritoryResult } from './types';

/** 勝負結果。`['draw']` 代表全體同分。 */
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
 * 目前規則：領地格數最多者勝；同分則並列，全體同分視為平手。
 *
 * TODO(Phase 6)：節目原版在總分相同時會再比「最大單一領地」，
 * 仍相同才平手。此處刻意保留現行行為，讓 engine 抽離這一步
 * 維持行為等價，規則修正另行處理以便單獨驗證。
 */
export function getWinners(scores: Scores, playersNum: number): Outcome {
  const keys = playerKeys(playersNum);
  const values = keys.map((k) => scores[k] ?? 0);
  const max = Math.max(...values);
  const min = Math.min(...values);

  if (max === min) return ['draw'];
  return keys.filter((k) => (scores[k] ?? 0) === max);
}

/** 一次取得領地、分數與勝負。遊戲未結束時 `outcome` 為空陣列。 */
export function evaluate(state: GameState): {
  territories: TerritoryResult;
  scores: Scores;
  outcome: Outcome;
} {
  const territories = computeTerritories(state);
  const scores = getScores(territories, state.playersNum);
  const outcome = territories.settled ? getWinners(scores, state.playersNum) : [];
  return { territories, scores, outcome };
}
