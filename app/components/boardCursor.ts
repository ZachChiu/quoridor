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
