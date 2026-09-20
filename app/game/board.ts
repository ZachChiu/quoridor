import { BOARD_SIZE, type GameState, type Player, type WallDir } from './types';

/** 格子座標的字串鍵，格式 `"row,col"`。 */
export const cellKey = (row: number, col: number) => `${row},${col}`;

/** 四個正交方向。牆壁圍棋不允許斜走。 */
export const DIRECTIONS = [
  { dr: -1, dc: 0 },
  { dr: 0, dc: 1 },
  { dr: 1, dc: 0 },
  { dr: 0, dc: -1 },
] as const;

export const inBounds = (row: number, col: number) =>
  row >= 0 && row < BOARD_SIZE && col >= 0 && col < BOARD_SIZE;

type WallGrids = Pick<GameState, 'horizontalWalls' | 'verticalWalls'>;

/**
 * 判斷從 (row,col) 往 (dr,dc) 方向是否被牆擋住。
 *
 * 牆的座標約定：
 *   horizontalWalls[r][c] 擋住 (r,c) ↔ (r+1,c)
 *   verticalWalls[r][c]   擋住 (r,c) ↔ (r,c+1)
 */
export function isBlocked(
  { horizontalWalls, verticalWalls }: WallGrids,
  row: number,
  col: number,
  dr: number,
  dc: number
): boolean {
  if (dr === 1) return !!horizontalWalls[row][col];
  if (dr === -1) return row > 0 && !!horizontalWalls[row - 1][col];
  if (dc === 1) return !!verticalWalls[row][col];
  if (dc === -1) return col > 0 && !!verticalWalls[row][col - 1];
  return false;
}

/** 該位置的指定方向是否還能蓋牆（棋盤邊界不算、已有牆不算）。 */
export function canBuildWall(
  walls: WallGrids,
  row: number,
  col: number,
  dir: WallDir
): boolean {
  if (dir === 'H') return row < BOARD_SIZE - 1 && !walls.horizontalWalls[row][col];
  return col < BOARD_SIZE - 1 && !walls.verticalWalls[row][col];
}

/** 產生一個全為 null 的 BOARD_SIZE × BOARD_SIZE 格線。 */
export const emptyGrid = (): Player[][] =>
  Array.from({ length: BOARD_SIZE }, () => Array<Player>(BOARD_SIZE).fill(null));

/** 深拷貝格線。engine 一律回傳新物件，不修改傳入的 state。 */
export const cloneGrid = (grid: Player[][]): Player[][] => grid.map((row) => [...row]);
