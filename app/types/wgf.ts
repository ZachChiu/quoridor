import type { Player } from '@/types/chessboard';

export type PlayerKey = Exclude<Player, null>;
export type WallDir = 'H' | 'V';

export type MoveAction = {
  type: 'move';
  player: PlayerKey;
  piece: number;
  row: number;
  col: number;
};

export type PlaceWallAction = {
  type: 'placeWall';
  player: PlayerKey;
  piece: number;
  dir: WallDir;
  row: number;
  col: number;
};

export type BreakWallAction = {
  type: 'breakWall';
  player: PlayerKey;
  piece: number;
  dir: WallDir;
  row: number;
  col: number;
};

export type GameAction = MoveAction | PlaceWallAction | BreakWallAction;

export type PieceIndex = Record<PlayerKey, { row: number; col: number }[]>;

/** 棋子位置（用於 init 與 opening 紀錄） */
export type PiecePlacement = {
  player: PlayerKey;
  piece: number;
  row: number;
  col: number;
};

/** 完整棋譜記錄 */
export type WGFRecord = {
  /** 玩家人數 */
  playersNum: 2 | 3;
  /** template 預置棋子（2 人模式有值，3 人為空） */
  initPositions: PiecePlacement[];
  /** 開局階段手動放置的棋子（依放置順序） */
  openingPlacements: PiecePlacement[];
  /** 正式遊戲回合 */
  turns: GameAction[][];
};
