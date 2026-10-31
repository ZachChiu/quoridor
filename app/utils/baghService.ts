/**
 * Bagh Chal 連線房間的讀寫（`baghRooms/{roomId}/`，結構見 types/baghRoom.ts）。
 * 跟 gameService 一樣，`firebase/database` 一律動態載入 —— 只有連線頁會下載 RTDB SDK。
 */
import { getFirebaseDb } from '@/utils/firebase';
import type { BaghRoom } from '@/types/baghRoom';
import type { RoomPlayer } from '@/types/room';
import type { Side } from '@/games/bagh-chal/engine';

async function rtdb() {
  const [mod, db] = await Promise.all([import('firebase/database'), getFirebaseDb()]);
  mod.goOnline(db);
  return { ...mod, db };
}

/** 開房，自己坐 `side`。羊先走，所以 turn 一開始是羊 */
export async function createBaghRoom(side: Side, player: RoomPlayer): Promise<string> {
  const { ref, push, set, db } = await rtdb();
  const roomRef = push(ref(db, 'baghRooms'));
  const room: BaghRoom = { id: roomRef.key!, createdAt: Date.now(), players: { [side]: player }, turn: 'goat' };
  await set(roomRef, room);
  return roomRef.key!;
}

export async function getBaghRoom(roomId: string): Promise<BaghRoom | null> {
  const { ref, get, db } = await rtdb();
  const snap = await get(ref(db, `baghRooms/${roomId}`));
  return snap.exists() ? (snap.val() as BaghRoom) : null;
}

export async function joinBaghRoom(roomId: string, side: Side, player: RoomPlayer): Promise<void> {
  const { ref, set, db } = await rtdb();
  await set(ref(db, `baghRooms/${roomId}/players/${side}`), player);
}

/** 走完一手：整串走法與下一個輪到誰一起寫（同一次 update，不會只寫到一半） */
export async function writeBaghMoves(roomId: string, moves: string, turn: Side): Promise<void> {
  const { ref, update, db } = await rtdb();
  await update(ref(db, `baghRooms/${roomId}`), { moves, turn });
}

export function subscribeBaghRoom(roomId: string, callback: (room: BaghRoom | null) => void): () => void {
  let cancelled = false;
  let detach: (() => void) | null = null;
  void (async () => {
    const { ref, onValue, off, db } = await rtdb();
    if (cancelled) return;
    const roomRef = ref(db, `baghRooms/${roomId}`);
    onValue(roomRef, (snap) => callback(snap.exists() ? (snap.val() as BaghRoom) : null));
    detach = () => off(roomRef);
  })();
  return () => { cancelled = true; detach?.(); };
}
