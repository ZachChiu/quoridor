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
 *   presence      { A?, B?, C? } — true 連著、number 斷線的時間（見 gameService 的 trackPresence）
 *   clock         { A?, B?, C? } — 各方累計的思考時間（毫秒）
 *   turnAt        number — 輪到現在這個人的時間（伺服器時間）
 *   nudge         { by, at } — 最近一次催人
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
  /** 沒有這一項（或沒有某個座位）＝不知道，不是斷線 */
  presence?: Partial<Record<'A' | 'B' | 'C', true | number>>;
  clock?: Partial<Record<'A' | 'B' | 'C', number>>;
  turnAt?: number;
  nudge?: { by: 'A' | 'B' | 'C'; at: number };
};
