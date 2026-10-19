import type { Side } from '@/games/bagh-chal/engine';
import type { RoomPlayer } from './room';

/**
 * Bagh Chal 的連線房間（Firebase RTDB `baghRooms/{roomId}/`）。
 * 跟 Wall Go 的 `rooms/` 分開放：欄位不同，安全規則也各自驗證。
 *
 *   id         string
 *   createdAt  number
 *   players    { tiger?, goat? }  —— 座位就是邊，坐下就決定了
 *   moves      string             —— encodeMoves 的結果；還沒人走時不存在
 *   turn       'tiger' | 'goat'   —— 只有輪到的人能寫 moves 與 turn（規則擋）
 *
 * 沒有 status：兩個座位都有人就是開打，勝負由 moves 推導。
 */
export type BaghRoom = {
  id: string;
  createdAt: number;
  players: Partial<Record<Side, RoomPlayer>>;
  moves?: string;
  turn: Side;
};
