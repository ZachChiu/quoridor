/**
 * 棋盤鍵盤游標。
 *
 * 抽成純函式是為了能測 —— 這一段沒有 DOM、沒有 React，就只是
 * 「按了這顆鍵，游標從哪走到哪」。放在元件裡的話，唯一的驗證方式是
 * 開瀏覽器一顆一顆按，而 7×7 的邊界情況有二十幾種。
 *
 * 鍵位照 ARIA grid 的慣例：方向鍵一格、Home / End 到行首行尾、
 * 加 Ctrl（Mac 上也收 ⌘）是整盤的頭尾。
 */
export type Cursor = { row: number; col: number };

const STEP: Record<string, [number, number]> = {
  ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1],
};

/** 這顆鍵會不會移動游標。用來決定要不要 preventDefault。 */
export function isCursorKey(key: string): boolean {
  return key in STEP || key === 'Home' || key === 'End';
}

/**
 * 算出按鍵之後的游標位置。不是移動鍵就回傳 `null`。
 *
 * 一律夾在盤內：走到邊界再按同一個方向是**停在原地**，不繞回另一邊 ——
 * 繞回去會讓人以為自己按錯鍵，而且在 7×7 上沒有任何好處。
 */
export function nextCursor(
  cursor: Cursor,
  key: string,
  { size, ctrl = false }: { size: number; ctrl?: boolean }
): Cursor | null {
  const clamp = (n: number) => Math.min(size - 1, Math.max(0, n));

  const d = STEP[key];
  if (d) return { row: clamp(cursor.row + d[0]), col: clamp(cursor.col + d[1]) };

  if (key === 'Home') return ctrl ? { row: 0, col: 0 } : { row: cursor.row, col: 0 };
  if (key === 'End') {
    return ctrl
      ? { row: size - 1, col: size - 1 }
      : { row: cursor.row, col: size - 1 };
  }
  return null;
}

/*
  手機擺棋子時盤面上那顆虛的棋子（Chessboard 的 placeCursor）。

  一開始在正中央；中央被佔了就找最近的空格（距離由近到遠，同距離先上後下、先左後右，結果固定）。
  控制盤的方向鍵一次跳到那個方向上的**下一個空格** —— 中間隔著棋子就跳過去；
  一路到邊上都沒有空格就不動，那顆方向鍵停用。
*/
export type Dir = 'top' | 'bottom' | 'left' | 'right';
const DIR_STEP: Record<Dir, [number, number]> = { top: [-1, 0], bottom: [1, 0], left: [0, -1], right: [0, 1] };

/** 離 from（預設正中央）最近的空格；整盤都滿了回傳 null */
export function nearestEmpty(board: ReadonlyArray<ReadonlyArray<unknown>>, from?: Cursor): Cursor | null {
  const size = board.length;
  const o = from ?? { row: Math.floor(size / 2), col: Math.floor(size / 2) };
  let best: Cursor | null = null;
  let bestD = Infinity;
  for (let row = 0; row < size; row++) {
    for (let col = 0; col < size; col++) {
      if (board[row][col]) continue;
      const d = Math.abs(row - o.row) + Math.abs(col - o.col);
      if (d < bestD) { best = { row, col }; bestD = d; }
    }
  }
  return best;
}

/** 從 from 往 dir 走，遇到的第一個空格；沒有就回傳 null */
export function nextEmptyCell(board: ReadonlyArray<ReadonlyArray<unknown>>, from: Cursor, dir: Dir): Cursor | null {
  const size = board.length;
  const [dr, dc] = DIR_STEP[dir];
  for (let row = from.row + dr, col = from.col + dc; row >= 0 && col >= 0 && row < size && col < size; row += dr, col += dc) {
    if (!board[row][col]) return { row, col };
  }
  return null;
}
