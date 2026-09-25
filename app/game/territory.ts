import { cellKey, DIRECTIONS, inBounds, isBlocked } from './board';
import {
  BOARD_SIZE,
  type GameState,
  type Player,
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
/**
 * 任意尺寸的連通區塊掃描。
 *
 * 尺寸從 board 推導而不是用 BOARD_SIZE 常數 —— 教學插圖用的是 4×4 小盤面，
 * 但它示範的必須是**同一套規則**。手寫領地座標的結果是圖跟規則對不上：
 * 曾經有一張「結束與勝負」畫成 5:3，實際依規則算是 8:8 的平局。
 */
export function scanRegions(
  board: Player[][],
  walls: Pick<GameState, 'horizontalWalls' | 'verticalWalls'>
): { cells: string[]; occupants: Set<PlayerKey> }[] {
  const size = board.length;
  const visited = Array.from({ length: size }, () => Array<boolean>(size).fill(false));
  const regions: { cells: string[]; occupants: Set<PlayerKey> }[] = [];

  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      if (visited[row][col]) continue;

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
          if (nr < 0 || nr >= size || nc < 0 || nc >= size) continue;
          if (visited[nr][nc]) continue;
          if (isBlocked(walls, r, c, dr, dc)) continue;
          visited[nr][nc] = true;
          queue.push([nr, nc]);
        }
      }
      regions.push({ cells, occupants });
    }
  }
  return regions;
}

/** 任意尺寸的領地歸屬：格子座標 → 擁有者。只有區塊內單一玩家時才算。 */
export function ownerByCellFor(
  board: Player[][],
  walls: Pick<GameState, 'horizontalWalls' | 'verticalWalls'>
): Record<string, PlayerKey> {
  const out: Record<string, PlayerKey> = {};
  for (const { cells, occupants } of scanRegions(board, walls)) {
    if (occupants.size !== 1) continue;
    const [owner] = [...occupants];
    for (const cell of cells) out[cell] = owner;
  }
  return out;
}

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
  const contested: string[] = [];
  const reach = Object.fromEntries(keys.map((k) => [k, 0])) as Record<PlayerKey, number>;
  const regionSizes = Object.fromEntries(keys.map((k) => [k, [] as number[]])) as Record<
    PlayerKey,
    number[]
  >;

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

      // 區塊內有誰的棋子，該區塊的大小就計入誰的可達範圍
      for (const occupant of occupants) {
        if (occupant in reach) reach[occupant] += cells.length;
      }

      // 爭奪中的區域若無人能動，它就永遠不會再改變 —— 視為已定局。
      //
      // 這在導入「零步移動需能離開再回來」之後成為必要：兩顆敵方棋子被封在
      // 同一個小區域且都無路可走時，舊規則還能靠原地蓋牆把區域切開，新規則不行。
      // 若不把這種區域視為定局，settled 永遠不成立，對局會一路拖到整個盤面
      // 被牆切成一格一格（實測半數對局會退化成 80 回合的小比分消耗戰）。
      //
      // 「能動」包含破牆脫困：三人局裡還有破牆次數的棋子，只要旁邊隔著一道牆
      // 就是空格，它就能破牆走出去，這塊區域並沒有凍結。
      // （與 engine 的 canAct 同一個判斷，否則會提早宣告終局。）
      const canBreak = (p: PlayerKey) => playersNum > 2 && state.breakWallCount[p] > 0;
      const anyPieceCanMove =
        occupants.size > 1 &&
        cells.some((cell) => {
          const [r, c] = cell.split(',').map(Number);
          const piece = board[r][c];
          if (!piece) return false;
          return DIRECTIONS.some(({ dr, dc }) => {
            const nr = r + dr;
            const nc = c + dc;
            if (!inBounds(nr, nc) || board[nr][nc]) return false;
            return !isBlocked(state, r, c, dr, dc) || canBreak(piece);
          });
        });

      if (occupants.size === 1) {
        const [ownerKey] = [...occupants];
        owned[ownerKey].push(...cells);
        regionSizes[ownerKey].push(cells.length);
        for (const cell of cells) ownerByCell[cell] = ownerKey;
      } else if (occupants.size > 1) {
        // 多方共存。只有「還有人能動」的區域才算未定，否則已凍結。
        if (anyPieceCanMove) hasContestedRegion = true;
        contested.push(...cells);
      } else {
        // 完全沒有棋子：已永久不屬於任何人
        neutral.push(...cells);
      }
    }
  }

  // 已定局 ＝ 沒有任何區域還可能易主。
  //
  // 不能用「每位玩家都持有領地」來判斷 —— 當所有棋子都困在凍結的爭奪區時，
  // 雙方的 owned 都是空的，卻確實已經定局了。
  //
  // 開局擺放階段一律不算定局：三人局起手是空盤，若不排除會被誤判為已結束。
  const settled = state.openingStep.length === 0 && !hasContestedRegion;

  for (const key of keys) regionSizes[key].sort((a, b) => b - a);

  return { owned, ownerByCell, neutral, contested, settled, reach, regionSizes };
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

/**
 * Voronoi 領地估計：從雙方棋子同時做多源 BFS，每格歸給最先抵達的一方。
 *
 * 為什麼需要它：開局時全盤連通，`computeTerritories` 算出的已確定領地
 * 與 `reach` 對雙方完全相同，評估函式給所有走法幾乎一樣的分數，
 * AI 形同亂走，直到區域開始分裂才有方向。
 *
 * Voronoi 估計從第一手就有梯度 —— 「我比對手更快到得了的格子」是
 * territory 類遊戲公認最有效的中局指標（與 Tron 光影機車 AI 同一套思路）。
 *
 * 距離相同的格子視為平手，不計入任何人。
 */
export function voronoiCount(state: GameState): Record<PlayerKey, number> {
  const keys = playerKeys(state.playersNum);
  const counts = Object.fromEntries(keys.map((k) => [k, 0])) as Record<PlayerKey, number>;

  const dist = new Map<string, number>();
  const owner = new Map<string, PlayerKey | 'tie'>();
  let frontier: { row: number; col: number; player: PlayerKey }[] = [];

  // 以所有棋子為起點，距離 0
  for (const player of keys) {
    for (const { row, col } of state.pieceIndex[player] ?? []) {
      const key = cellKey(row, col);
      if (owner.has(key) && owner.get(key) !== player) {
        owner.set(key, 'tie');
      } else {
        owner.set(key, player);
      }
      dist.set(key, 0);
      frontier.push({ row, col, player });
    }
  }

  let step = 0;
  while (frontier.length > 0) {
    step++;
    const next: typeof frontier = [];
    // 同一層內先收集各格的候選擁有者，再統一裁決，
    // 否則同距離的不同玩家會因處理順序而產生偏差
    const pending = new Map<string, { row: number; col: number; players: Set<PlayerKey> }>();

    for (const { row, col, player } of frontier) {
      for (const { dr, dc } of DIRECTIONS) {
        const r = row + dr;
        const c = col + dc;
        if (!inBounds(r, c)) continue;
        if (isBlocked(state, row, col, dr, dc)) continue;

        const key = cellKey(r, c);
        if (dist.has(key)) continue;

        const entry = pending.get(key) ?? { row: r, col: c, players: new Set<PlayerKey>() };
        entry.players.add(player);
        pending.set(key, entry);
      }
    }

    for (const [key, { row, col, players }] of pending) {
      dist.set(key, step);
      if (players.size === 1) {
        const [p] = [...players];
        owner.set(key, p);
        next.push({ row, col, player: p });
      } else {
        // 多方同時抵達 → 平手，仍需繼續擴散（以任一方為代表即可，
        // 因為後續格子若被多方同距抵達也會被判為平手）
        owner.set(key, 'tie');
        for (const p of players) next.push({ row, col, player: p });
      }
    }

    frontier = next;
  }

  for (const value of owner.values()) {
    if (value !== 'tie') counts[value] += 1;
  }

  return counts;
}
