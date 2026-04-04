export type RoomStatus = 'waiting' | 'opening' | 'playing' | 'finished';

export type RoomPlayer = {
  uid: string;
  displayName: string;
  joinedAt: number;
};

/**
 * Firebase RTDB 遊戲室資料結構
 *
 * rooms/{roomId}/
 *   id            string
 *   playersNum    2 | 3
 *   status        RoomStatus
 *   createdAt     number (ms timestamp)
 *   currentPlayer 'A' | 'B' | 'C'
 *   players       { A?, B?, C? }
 *   wgf           string  — 最新完整 WGF 棋譜字串
 */
export type Room = {
  id: string;
  playersNum: 2 | 3;
  status: RoomStatus;
  createdAt: number;
  currentPlayer: 'A' | 'B' | 'C';
  players: Partial<Record<'A' | 'B' | 'C', RoomPlayer>>;
  wgf: string;
  winners?: ('A' | 'B' | 'C' | 'draw')[];
};
