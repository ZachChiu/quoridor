/**
 * 輪流下的遊戲共用的連線房讀寫（`turnRooms/{roomId}/`，結構見 types/turnRoom.ts）。
 * 跟 baghService 同一套做法，`firebase/database` 一律動態載入 —— 只有連線頁會下載 RTDB SDK。
 */
import { getFirebaseDb } from '@/utils/firebase';
import { seatKey, type TurnGame, type TurnRoom } from '@/types/turnRoom';
import type { RoomPlayer } from '@/types/room';

async function rtdb() {
  const [mod, db] = await Promise.all([import('firebase/database'), getFirebaseDb()]);
  mod.goOnline(db);
  return { ...mod, db };
}

export type NewTurnRoom = {
  game: TurnGame;
  seats: number;
  /** 開房的人坐第幾個座位 */
  seat: number;
  setup: string;
  /** 誰先走（座位編號） */
  turn: number;
};

/** 開房，自己坐 `seat` */
export async function createTurnRoom(opts: NewTurnRoom, player: RoomPlayer): Promise<string> {
  const { ref, push, set, db } = await rtdb();
  const roomRef = push(ref(db, 'turnRooms'));
  const host = seatKey(opts.seat);
  const room: TurnRoom = {
    id: roomRef.key!,
    game: opts.game,
    seats: opts.seats,
    setup: opts.setup,
    host,
    createdAt: Date.now(),
    players: { [host]: player },
    turn: seatKey(opts.turn),
  };
  await set(roomRef, room);
  return roomRef.key!;
}

export async function getTurnRoom(roomId: string): Promise<TurnRoom | null> {
  const { ref, get, db } = await rtdb();
  const snap = await get(ref(db, `turnRooms/${roomId}`));
  return snap.exists() ? (snap.val() as TurnRoom) : null;
}

export async function joinTurnRoom(roomId: string, seat: number, player: RoomPlayer): Promise<void> {
  const { ref, set, db } = await rtdb();
  await set(ref(db, `turnRooms/${roomId}/players/${seatKey(seat)}`), player);
}

/** 走完一手：整串走法與下一個輪到誰一起寫（同一次 update，不會只寫到一半） */
export async function writeTurnMoves(roomId: string, moves: string, turn: number): Promise<void> {
  const { ref, update, db } = await rtdb();
  await update(ref(db, `turnRooms/${roomId}`), { moves, turn: seatKey(turn) });
}

export function subscribeTurnRoom(roomId: string, callback: (room: TurnRoom | null) => void): () => void {
  let cancelled = false;
  let detach: (() => void) | null = null;
  void (async () => {
    const { ref, onValue, off, db } = await rtdb();
    if (cancelled) return;
    const roomRef = ref(db, `turnRooms/${roomId}`);
    onValue(roomRef, (snap) => callback(snap.exists() ? (snap.val() as TurnRoom) : null));
    detach = () => off(roomRef);
  })();
  return () => { cancelled = true; detach?.(); };
}
