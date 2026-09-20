import type { Player, Move } from '@/types/chessboard';
import type { GameAction, PieceIndex, PiecePlacement, PlayerKey, WallDir } from '@/types/wgf';

export type { Player, Move, GameAction, PieceIndex, PiecePlacement, PlayerKey, WallDir };

/** 棋盤邊長。節目原版為 7×7。 */
export const BOARD_SIZE = 7;

/**
 * 一局牆壁圍棋的完整狀態。
 *
 * 所有欄位皆視為不可變 —— engine 的每個操作都回傳全新物件，
 * 絕不修改傳入的 state。這是 AI 搜尋（Phase 5）能安全重用的前提。
 *
 * 牆的座標約定（沿用原有實作）：
 *   horizontalWalls[r][c] — 位於格子 (r,c) 與 (r+1,c) 之間
 *   verticalWalls[r][c]   — 位於格子 (r,c) 與 (r,c+1) 之間
 */
export type GameState = {
  playersNum: 2 | 3;
  board: Player[][];
  horizontalWalls: Player[][];
  verticalWalls: Player[][];
  currentPlayer: PlayerKey;
  /** 剩餘的開局擺放順序；為空代表已進入對弈階段。 */
  openingStep: PlayerKey[];
  /** 每位玩家剩餘的破牆次數（僅三人模式 > 0）。 */
  breakWallCount: Record<PlayerKey, number>;
  pieceIndex: PieceIndex;

  // ── 回合進行中的暫時狀態 ──
  /** 本回合已選取的棋子；未選取為 null。 */
  selected: Move | null;
  /** 本回合剩餘可移動步數（0–2）。 */
  remainSteps: number;
  /** 本回合已累積、尚未收束成一個 turn 的動作。 */
  currentTurnActions: GameAction[];

  // ── WGF 棋譜 ──
  initPositions: PiecePlacement[];
  openingPlacements: PiecePlacement[];
  turns: GameAction[][];
};

/** 一面可放置的牆。 */
export type WallSlot = { row: number; col: number; dir: WallDir };

/** 領地計算結果。 */
export type TerritoryResult = {
  /** 每位玩家所佔領的格子（已去重）。 */
  owned: Record<PlayerKey, string[]>;
  /** 格子座標 `"r,c"` → 擁有者。未被任何人獨佔的格子不會出現。 */
  ownerByCell: Record<string, PlayerKey>;
  /**
   * 中立區：已被牆完全封閉、但區域內沒有棋子或同時有多方棋子的格子。
   * 依原版規則不計入任何人的分數。
   */
  neutral: string[];
  /** 是否所有棋子都已被封閉在單一陣營的區域中（＝遊戲結束）。 */
  settled: boolean;
};
