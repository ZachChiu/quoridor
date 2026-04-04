/**
 * gameService — Firebase RTDB 遊戲室操作
 *
 * RTDB 結構：
 *   rooms/{roomId}/
 *     id            string
 *     playersNum    2 | 3
 *     status        'waiting' | 'opening' | 'playing' | 'finished'
 *     createdAt     number
 *     currentPlayer 'A' | 'B' | 'C'
 *     players/
 *       A?/  { uid, displayName, joinedAt }
 *       B?/  { uid, displayName, joinedAt }
 *       C?/  { uid, displayName, joinedAt }
 *     wgf           string  — 完整 WGF 棋譜字串，每回合結束後更新
 */

import { ref, set, update, get, push, onValue, off } from 'firebase/database';
import { db } from '@/utils/firebase';
import type { Room, RoomStatus, RoomPlayer } from '@/types/room';

export type { Room, RoomStatus, RoomPlayer } from '@/types/room';

// ─── Create / Join ────────────────────────────────────────────────────────────

/** 建立新遊戲室，回傳 roomId */
export async function createRoom(
  playersNum: 2 | 3,
  playerKey: 'A' | 'B' | 'C',
  player: RoomPlayer,
  initialWgf: string = ''
): Promise<string> {
  const roomRef = push(ref(db, 'rooms'));
  const roomId = roomRef.key!;
  const room: Room = {
    id: roomId,
    playersNum,
    status: 'waiting',
    createdAt: Date.now(),
    currentPlayer: 'A',
    players: { [playerKey]: player },
    wgf: initialWgf,
  };
  await set(roomRef, room);
  return roomId;
}

/** 加入現有遊戲室（以指定 playerKey 身分入座） */
export async function joinRoom(
  roomId: string,
  playerKey: 'A' | 'B' | 'C',
  player: RoomPlayer
): Promise<void> {
  await update(ref(db, `rooms/${roomId}/players`), { [playerKey]: player });
}

// ─── Game State ───────────────────────────────────────────────────────────────

/** 每回合結束後同步最新 WGF 與下一位玩家 */
export async function updateGameState(
  roomId: string,
  wgf: string,
  currentPlayer: 'A' | 'B' | 'C'
): Promise<void> {
  await update(ref(db, `rooms/${roomId}`), { wgf, currentPlayer });
}

/** 更新遊戲室生命週期狀態 */
export async function setRoomStatus(
  roomId: string,
  status: RoomStatus
): Promise<void> {
  await update(ref(db, `rooms/${roomId}`), { status });
}

/** 遊戲結束，寫入勝者並將狀態設為 finished */
export async function setRoomWinner(
  roomId: string,
  winners: ('A' | 'B' | 'C' | 'draw')[]
): Promise<void> {
  await update(ref(db, `rooms/${roomId}`), { status: 'finished', winners });
}

// ─── Read / Subscribe ─────────────────────────────────────────────────────────

/** 一次性讀取遊戲室資料 */
export async function getRoom(roomId: string): Promise<Room | null> {
  const snap = await get(ref(db, `rooms/${roomId}`));
  return snap.exists() ? (snap.val() as Room) : null;
}

/** 訂閱遊戲室即時更新，回傳取消訂閱函式 */
export function subscribeRoom(
  roomId: string,
  callback: (room: Room | null) => void
): () => void {
  const roomRef = ref(db, `rooms/${roomId}`);
  onValue(roomRef, (snap) => {
    callback(snap.exists() ? (snap.val() as Room) : null);
  });
  return () => off(roomRef);
}
