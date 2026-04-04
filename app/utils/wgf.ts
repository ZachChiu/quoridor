/**
 * WGF — Wall Go Format
 *
 * 棋譜記錄格式，靈感來自圍棋 SGF (Smart Game Format)。
 *
 * ════════════════════════════════════════════════════
 * 完整格式（四個區塊，以 | 分隔）：
 *
 *   {players}|{init}|{opening}|{turns}
 *
 * 範例（2 人）：
 *   2|A1:11,A2:55,B1:15,B2:51|A323,B345,B412,A434|A131,A1H14;B121,B1V53;...
 *
 * 範例（3 人）：
 *   3||A112,B134,C156,C223,B245,A267|A123,A1H14;...
 *   ↑ init 區塊空白，3 人模式無預置棋子
 *
 * ════════════════════════════════════════════════════
 * 區塊說明：
 *
 *   [players]  玩家人數，2 或 3
 *
 *   [init]     Template 預置棋子（僅 2 人模式有值）
 *              格式：[P][#]:[row][col]  e.g. A1:11
 *              有冒號，代表這是棋盤初始配置，非遊戲動作
 *
 *   [opening]  開局階段玩家手動放置的棋子（依放置順序）
 *              格式：[P][#][row][col]  e.g. A323
 *              2 人放置順序：A B B A（第 3~4 顆棋）
 *              3 人放置順序：A B C C B A（第 1~2 顆棋）
 *
 *   [turns]    正式遊戲回合（分號分隔，同一回合內逗號分隔）
 *
 * ════════════════════════════════════════════════════
 * Action Token 格式：
 *
 *   移動棋子       [P][#][row][col]        e.g. A131
 *   放置橫牆       [P][#]H[row][col]       e.g. A1H14
 *   放置直牆       [P][#]V[row][col]       e.g. A1V53
 *   破壞橫牆       [P][#]XH[row][col]      e.g. A1XH14
 *   破壞直牆       [P][#]XV[row][col]      e.g. A1XV53
 *
 *   [P] = 玩家 A / B / C
 *   [#] = 棋子編號（1-based）
 *   判斷規則：第 3 個字元為數字 → 移動；H/V → 放牆；X → 破牆
 */

import type { Player } from '@/types/chessboard';
import type { GameAction, PlayerKey, WallDir, PieceIndex, PiecePlacement, WGFRecord } from '@/types/wgf';

export type { PlayerKey, WallDir, MoveAction, PlaceWallAction, BreakWallAction, GameAction, PieceIndex, PiecePlacement, WGFRecord } from '@/types/wgf';

// ─── Action Serialize / Parse ─────────────────────────────────────────────────

/**
 * 獨立 action token（含 player 前綴），用於 opening 以外的單筆記錄。
 * 格式同 WGF 規格說明中的 Action Token。
 */
export function serializeAction(action: GameAction): string {
  const base = `${action.player}${action.piece}`;
  switch (action.type) {
    case 'move':
      return `${base}${action.row}${action.col}`;
    case 'placeWall':
      return `${base}${action.dir}${action.row}${action.col}`;
    case 'breakWall':
      return `${base}X${action.dir}${action.row}${action.col}`;
  }
}

export function parseAction(token: string): GameAction {
  const player = token[0] as PlayerKey;
  const piece = parseInt(token[1]);
  const rest = token.slice(2);

  if (rest[0] === 'X') {
    return { type: 'breakWall', player, piece, dir: rest[1] as WallDir, row: parseInt(rest[2]), col: parseInt(rest[3]) };
  }
  if (rest[0] === 'H' || rest[0] === 'V') {
    return { type: 'placeWall', player, piece, dir: rest[0] as WallDir, row: parseInt(rest[1]), col: parseInt(rest[2]) };
  }
  return { type: 'move', player, piece, row: parseInt(rest[0]), col: parseInt(rest[1]) };
}

// ─── Compact Action（回合內使用，省略 player 前綴，牆壁不含 piece） ───────────

/**
 * 回合內的單一 action token（不含 player，牆壁省略 piece number）。
 *   移動：[#][row][col]          e.g. 433
 *   放牆：[dir][row][col]        e.g. V33
 *   破牆：X[dir][row][col]       e.g. XH14
 */
function serializeActionCompact(action: GameAction): string {
  switch (action.type) {
    case 'move':      return `${action.piece}${action.row}${action.col}`;
    case 'placeWall': return `${action.dir}${action.row}${action.col}`;
    case 'breakWall': return `X${action.dir}${action.row}${action.col}`;
  }
}

function parseActionCompact(token: string, player: PlayerKey): GameAction {
  if (token[0] === 'X') {
    return { type: 'breakWall', player, piece: 0, dir: token[1] as WallDir, row: parseInt(token[2]), col: parseInt(token[3]) };
  }
  if (token[0] === 'H' || token[0] === 'V') {
    return { type: 'placeWall', player, piece: 0, dir: token[0] as WallDir, row: parseInt(token[1]), col: parseInt(token[2]) };
  }
  return { type: 'move', player, piece: parseInt(token[0]), row: parseInt(token[1]), col: parseInt(token[2]) };
}

/**
 * 一個回合內的所有動作：[P] 前綴一次 + 逗號分隔的 compact tokens。
 * e.g. A433,V33  /  AV22  /  AXHRC
 */
export function serializeTurn(actions: GameAction[]): string {
  if (actions.length === 0) return '';
  const player = actions[0].player;
  return player + actions.map(serializeActionCompact).join(',');
}

export function parseTurn(turnStr: string): GameAction[] {
  if (!turnStr) return [];
  const player = turnStr[0] as PlayerKey;
  const rest = turnStr.slice(1);
  return rest.split(',').map(token => parseActionCompact(token, player));
}

/** 僅 turns 區塊，回合間用分號分隔 */
export function serializeGame(turns: GameAction[][]): string {
  return turns.map(serializeTurn).join(';');
}

export function parseGame(gameStr: string): GameAction[][] {
  if (!gameStr) return [];
  return gameStr.split(';').map(parseTurn);
}

// ─── Placement Serialize / Parse ──────────────────────────────────────────────

/** Init 預置格式：A1:11（有冒號） */
function serializeInitPosition(pos: PiecePlacement): string {
  return `${pos.player}${pos.piece}:${pos.row}${pos.col}`;
}

function parseInitPosition(str: string): PiecePlacement {
  return {
    player: str[0] as PlayerKey,
    piece: parseInt(str[1]),
    row: parseInt(str[3]), // 跳過冒號
    col: parseInt(str[4]),
  };
}

/** Opening 放棋格式：A323（無冒號，與 move token 同） */
function serializePlacement(pos: PiecePlacement): string {
  return `${pos.player}${pos.piece}${pos.row}${pos.col}`;
}

function parsePlacement(str: string): PiecePlacement {
  return {
    player: str[0] as PlayerKey,
    piece: parseInt(str[1]),
    row: parseInt(str[2]),
    col: parseInt(str[3]),
  };
}

// ─── WGF Record Serialize / Parse ─────────────────────────────────────────────

/** 序列化完整棋譜為字串 */
export function serializeWGF(record: WGFRecord): string {
  const init = record.initPositions.map(serializeInitPosition).join(',');
  const opening = record.openingPlacements.map(serializePlacement).join(',');
  const turns = serializeGame(record.turns);
  return `${record.playersNum}|${init}|${opening}|${turns}`;
}

/** 解析完整棋譜字串 */
export function parseWGF(str: string): WGFRecord {
  const [playersNumStr, initStr, openingStr, turnsStr] = str.split('|');
  return {
    playersNum: parseInt(playersNumStr) as 2 | 3,
    initPositions: initStr ? initStr.split(',').map(parseInitPosition) : [],
    openingPlacements: openingStr ? openingStr.split(',').map(parsePlacement) : [],
    turns: turnsStr ? parseGame(turnsStr) : [],
  };
}

// ─── Piece Index Helpers ──────────────────────────────────────────────────────

/**
 * 從棋盤掃描出每位玩家的棋子位置（由上至下、由左至右）。
 * 索引 0 = 棋子 1，索引 1 = 棋子 2。
 */
export function buildPieceIndex(board: Player[][]): PieceIndex {
  const index: PieceIndex = { A: [], B: [], C: [] };
  for (let row = 0; row < board.length; row++) {
    for (let col = 0; col < board[row].length; col++) {
      const p = board[row][col];
      if (p) index[p].push({ row, col });
    }
  }
  return index;
}

/**
 * 從 initPositions 建立 PieceIndex（不掃描棋盤，直接用記錄資料）。
 */
export function buildPieceIndexFromPlacements(
  placements: PiecePlacement[]
): PieceIndex {
  const index: PieceIndex = { A: [], B: [], C: [] };
  for (const p of placements) {
    index[p.player][p.piece - 1] = { row: p.row, col: p.col };
  }
  return index;
}

/** 查找某位置屬於玩家的第幾顆棋子（1-based）。若找不到回傳 -1。 */
export function getPieceNumber(
  pieceIndex: PieceIndex,
  player: PlayerKey,
  row: number,
  col: number
): number {
  const idx = pieceIndex[player].findIndex((p) => p.row === row && p.col === col);
  return idx === -1 ? -1 : idx + 1;
}

/** 棋子移動後同步更新 pieceIndex（不修改原物件）。 */
export function updatePieceIndex(
  pieceIndex: PieceIndex,
  player: PlayerKey,
  fromRow: number,
  fromCol: number,
  toRow: number,
  toCol: number
): PieceIndex {
  const next: PieceIndex = { A: [...pieceIndex.A], B: [...pieceIndex.B], C: [...pieceIndex.C] };
  const idx = next[player].findIndex((p) => p.row === fromRow && p.col === fromCol);
  if (idx !== -1) next[player][idx] = { row: toRow, col: toCol };
  return next;
}
