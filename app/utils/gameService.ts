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
 *
 * 注意：`firebase/database` 一律以動態 import 取得，使本機對戰與首頁
 * 不必下載 RTDB SDK（約 75 KB gzip）。詳見 app/utils/firebase.ts。
 */

import { getFirebaseDb } from '@/utils/firebase';
import type { Room, RoomPlayer } from '@/types/room';

/**
 * 重新導出房間相關型別，方便其他模組直接從 service 取得共用定義。
 */
export type { Room, RoomStatus, RoomPlayer } from '@/types/room';

/** 同時取得 RTDB 實例與所需的 database 函式。 */
async function rtdb() {
  const [mod, db] = await Promise.all([import('firebase/database'), getFirebaseDb()]);
  return { ...mod, db };
}

// ─── Create / Join ────────────────────────────────────────────────────────────

/**
 * 建立新遊戲室並回傳 Firebase 產生的 `roomId`。
 *
 * @param playersNum - 這場對局的玩家人數。
 * @param playerKey - 建立者所佔用的玩家座位。
 * @param player - 建立者的房間玩家資料。
 * @param initialWgf - 建房時要寫入的初始棋譜字串。
 * @returns 新遊戲室的 `roomId`。
 */
export async function createRoom(
  playersNum: 2 | 3,
  playerKey: 'A' | 'B' | 'C',
  player: RoomPlayer,
  initialWgf: string = ''
): Promise<string> {
  const { ref, push, set, db } = await rtdb();
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

/**
 * 以指定玩家座位加入現有遊戲室。
 *
 * @param roomId - 目標房間 ID。
 * @param playerKey - 要加入的座位鍵值。
 * @param player - 寫入房間的玩家資料。
 */
export async function joinRoom(
  roomId: string,
  playerKey: 'A' | 'B' | 'C',
  player: RoomPlayer
): Promise<void> {
  const { ref, update, db } = await rtdb();
  await update(ref(db, `rooms/${roomId}/players`), { [playerKey]: player });
}

// ─── Game State ───────────────────────────────────────────────────────────────

/**
 * 在回合結束後同步最新 WGF 與下一位玩家。
 *
 * @param roomId - 目標房間 ID。
 * @param wgf - 最新完整 WGF 棋譜字串。
 * @param currentPlayer - 下一位玩家鍵值。
 */
export async function updateGameState(
  roomId: string,
  wgf: string,
  currentPlayer: 'A' | 'B' | 'C'
): Promise<void> {
  const { ref, update, db } = await rtdb();
  await update(ref(db, `rooms/${roomId}`), { wgf, currentPlayer });
}

/**
 * 在遊戲結束時寫入勝者資訊，並將房間狀態更新為 `finished`。
 *
 * @param roomId - 目標房間 ID。
 * @param winners - 勝者陣列，支援平手標記 `draw`。
 */
export async function setRoomWinner(
  roomId: string,
  winners: ('A' | 'B' | 'C' | 'draw')[]
): Promise<void> {
  const { ref, update, db } = await rtdb();
  await update(ref(db, `rooms/${roomId}`), { status: 'finished', winners });
}

// ─── Read / Subscribe ─────────────────────────────────────────────────────────

/**
 * 一次性讀取遊戲室資料。
 *
 * @param roomId - 目標房間 ID。
 * @returns 若房間存在則回傳 `Room`，否則回傳 `null`。
 */
export async function getRoom(roomId: string): Promise<Room | null> {
  const { ref, get, db } = await rtdb();
  const snap = await get(ref(db, `rooms/${roomId}`));
  return snap.exists() ? (snap.val() as Room) : null;
}

/**
 * 訂閱遊戲室的即時更新。
 *
 * 維持同步回傳取消訂閱函式（呼叫端通常在 useEffect 的 cleanup 使用）。
 * 內部的 SDK 載入是非同步的，若在載入完成前就取消，會標記 `cancelled`
 * 避免掛上一個永遠不會被移除的監聽器。
 *
 * @param roomId - 目標房間 ID。
 * @param callback - 每次資料變更時要呼叫的處理函式。
 * @returns Firebase 監聽器的取消訂閱函式。
 */
export function subscribeRoom(
  roomId: string,
  callback: (room: Room | null) => void
): () => void {
  let cancelled = false;
  let detach: (() => void) | null = null;

  void (async () => {
    const { ref, onValue, off, db } = await rtdb();
    if (cancelled) return;

    const roomRef = ref(db, `rooms/${roomId}`);
    onValue(roomRef, (snap) => {
      callback(snap.exists() ? (snap.val() as Room) : null);
    });
    detach = () => off(roomRef);
  })();

  return () => {
    cancelled = true;
    detach?.();
  };
}
