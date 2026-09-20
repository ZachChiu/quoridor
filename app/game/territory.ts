import { cellKey, DIRECTIONS, inBounds, isBlocked } from './board';
import {
  BOARD_SIZE,
  type GameState,
  type PlayerKey,
  type TerritoryResult,
} from './types';

/** 依人數取得參賽玩家鍵值。 */
export const playerKeys = (playersNum: number): PlayerKey[] =>
  playersNum === 3 ? ['A', 'B', 'C'] : ['A', 'B'];

/**
 * 計算全盤領地歸屬。
 *
 * 演算法：對整個棋盤做一次連通區塊掃描（以牆為邊界），再依區塊內的棋子
 * 判定歸屬。原本的實作是「對每顆棋子各跑一次 BFS」，同一區塊會被重複走訪
 * 多次；改為單次掃描後複雜度從 O(棋子數 × 格數) 降為 O(格數)。
 *
 * 判定規則（依節目原版）：
 * - 區塊內只有單一玩家的棋子 → 該玩家佔領，每格計 1 分
 * - 區塊內沒有棋子，或同時有多方棋子 → 中立區，不計入任何人
 */
export function computeTerritories(state: GameState): TerritoryResult {
  const { board, playersNum } = state;
  const keys = playerKeys(playersNum);

  const visited = Array.from({ length: BOARD_SIZE }, () =>
    Array<boolean>(BOARD_SIZE).fill(false)
  );

  const owned = Object.fromEntries(keys.map((k) => [k, [] as string[]])) as Record<
    PlayerKey,
    string[]
  >;
  const ownerByCell: Record<string, PlayerKey> = {};
  const neutral: string[] = [];

  let hasContestedRegion = false;

  for (let row = 0; row < BOARD_SIZE; row++) {
    for (let col = 0; col < BOARD_SIZE; col++) {
      if (visited[row][col]) continue;

      // 泛洪填滿一個連通區塊，同時記錄區塊內出現過哪些玩家
      const cells: string[] = [];
      const occupants = new Set<PlayerKey>();
      const queue: [number, number][] = [[row, col]];
      visited[row][col] = true;

      while (queue.length > 0) {
        const [r, c] = queue.shift()!;
        cells.push(cellKey(r, c));

        const occupant = board[r][c];
        if (occupant) occupants.add(occupant);

        for (const { dr, dc } of DIRECTIONS) {
          const nr = r + dr;
          const nc = c + dc;
          if (!inBounds(nr, nc)) continue;
          if (visited[nr][nc]) continue;
          if (isBlocked(state, r, c, dr, dc)) continue;

          visited[nr][nc] = true;
          queue.push([nr, nc]);
        }
      }

      if (occupants.size === 1) {
        const [ownerKey] = [...occupants];
        owned[ownerKey].push(...cells);
        for (const cell of cells) ownerByCell[cell] = ownerKey;
      } else {
        // 無棋子（空區）或多方共存（尚未分出勝負）皆不計分
        if (occupants.size > 1) hasContestedRegion = true;
        neutral.push(...cells);
      }
    }
  }

  // 遊戲結束條件：不存在多方共存的區塊，且每位玩家都還有棋子在盤上
  const everyPlayerHasPieces = keys.every((k) => owned[k].length > 0);
  const settled = !hasContestedRegion && everyPlayerHasPieces;

  return { owned, ownerByCell, neutral, settled };
}

/**
 * 從指定位置出發、在牆的限制下可到達的格子數。
 *
 * 供 AI 的「可達性控制」啟發式使用（WallZero 論文指出此指標比
 * 立即的領地收益更有預測力）。不考慮棋子阻擋，只看牆。
 */
export function reachableCount(state: GameState, row: number, col: number): number {
  const visited = new Set<string>([cellKey(row, col)]);
  const queue: [number, number][] = [[row, col]];

  while (queue.length > 0) {
    const [r, c] = queue.shift()!;
    for (const { dr, dc } of DIRECTIONS) {
      const nr = r + dr;
      const nc = c + dc;
      if (!inBounds(nr, nc)) continue;
      const key = cellKey(nr, nc);
      if (visited.has(key)) continue;
      if (isBlocked(state, r, c, dr, dc)) continue;
      visited.add(key);
      queue.push([nr, nc]);
    }
  }

  return visited.size;
}
