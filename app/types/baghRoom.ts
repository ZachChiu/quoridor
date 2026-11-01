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
 *   presence   { tiger?, goat? }  —— true＝連著、number＝斷線的時間（2026-11-01 加，utils/roomSignals.ts）
 *   nudge      { by, at }         —— 催輪到的人，15 秒冷卻
 *   resigned   'tiger' | 'goat'   —— 投降的那一邊，寫了這局就結束（只能寫自己的、一次）
 *
 * 沒有 status：兩個座位都有人就是開打，勝負由 moves 推導；唯一的例外是投降（resigned）。
 */
export type BaghRoom = {
  id: string;
  createdAt: number;
  players: Partial<Record<Side, RoomPlayer>>;
  moves?: string;
  turn: Side;
  presence?: Partial<Record<Side, true | number>>;
  nudge?: { by: Side; at: number };
  resigned?: Side;
};
