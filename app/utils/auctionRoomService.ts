/**
 * 時間拍賣連線房的讀寫（`auctionRooms/{roomId}/`，結構見 types/auctionRoom.ts）。
 * 跟 turnRoomService、baghService 同一套做法，`firebase/database` 一律動態載入 —— 只有連線頁會下載 RTDB SDK。
 *
 * 所有時間（入座、按下、放開）都寫 ServerValue.TIMESTAMP，由伺服器填；安全規則要求 `=== now`，自己填的數字一律被拒。
 */
import { getFirebaseDb } from '@/utils/firebase';
import { auctionRoundKey, auctionSeatKey, type AuctionRoom } from '@/types/auctionRoom';
import type { Mode } from '@/games/time-auction/engine';

async function rtdb() {
  const [mod, db] = await Promise.all([import('firebase/database'), getFirebaseDb()]);
  mod.goOnline(db);
  return { ...mod, db };
}

/*
  伺服器時間。倒數、跑秒、「等到期限還沒人按」都要拿伺服器時間跟房間裡的時間比 ——
  每台裝置的時鐘可能差好幾秒，用本機時間比，各台看到的倒數就不一樣，也會算出不一樣的結果。
  SDK 會告訴我們本機跟伺服器差多少（.info/serverTimeOffset），加回去就好（同 gameService 的 serverNow，
  那一份只在 Wall Go 的房間裡才開始聽，這裡自己聽一份）。
*/
let serverOffset = 0;
let offsetWatched = false;
export const auctionServerNow = () => Date.now() + serverOffset;

const player = (uid: string, serverTimestamp: () => object) => ({ uid, displayName: 'player', joinedAt: serverTimestamp() });

/** 開房，自己坐 s0。回傳房號 */
export async function createAuctionRoom(opts: { mode: Mode; seats: number }, uid: string): Promise<string> {
  const { ref, push, set, serverTimestamp, db } = await rtdb();
  const roomRef = push(ref(db, 'auctionRooms'));
  await set(roomRef, {
    id: roomRef.key!,
    mode: opts.mode,
    seats: opts.seats,
    createdAt: serverTimestamp(),
    players: { s0: player(uid, serverTimestamp) },
  });
  return roomRef.key!;
}

export async function getAuctionRoom(roomId: string): Promise<AuctionRoom | null> {
  const { ref, get, db } = await rtdb();
  const snap = await get(ref(db, `auctionRooms/${roomId}`));
  return snap.exists() ? (snap.val() as AuctionRoom) : null;
}

export async function joinAuctionRoom(roomId: string, seat: number, uid: string): Promise<void> {
  const { ref, set, serverTimestamp, db } = await rtdb();
  await set(ref(db, `auctionRooms/${roomId}/players/${auctionSeatKey(seat)}`), player(uid, serverTimestamp));
}

const pressPath = (roomId: string, round: number, seat: number) =>
  `auctionRooms/${roomId}/rounds/${auctionRoundKey(round)}/${auctionSeatKey(seat)}`;

/**
 * 按下去。同時跟伺服器登記「斷線就替我放手」：關分頁、網路斷掉時由伺服器在那一刻寫 up ——
 * 不然斷線的人會一直「按著」，直到時間用完（online.ts 的保底）才算放手，平白付掉全部的時間。
 * 寫入的順序 SDK 會照呼叫的順序送，所以不必等 down 寫好才登記（登記時規則要求 down 已經在了）。
 */
export async function pressDown(roomId: string, round: number, seat: number): Promise<void> {
  const { ref, set, onDisconnect, serverTimestamp, db } = await rtdb();
  const base = pressPath(roomId, round, seat);
  const down = set(ref(db, `${base}/down`), serverTimestamp());
  const guard = onDisconnect(ref(db, `${base}/up`)).set(serverTimestamp());
  await Promise.all([down, guard]);
}

/** 放手（也用在時間用完、按鈕自己彈起）。放好就取消斷線的登記 */
export async function pressUp(roomId: string, round: number, seat: number): Promise<void> {
  const { ref, set, onDisconnect, serverTimestamp, db } = await rtdb();
  const upRef = ref(db, `${pressPath(roomId, round, seat)}/up`);
  const up = set(upRef, serverTimestamp());
  const cancel = onDisconnect(upRef).cancel();
  await Promise.all([up, cancel]);
}

/** 這回合不參加：按下、放開一起寫（同一個時間，出價 0） */
export async function passRound(roomId: string, round: number, seat: number): Promise<void> {
  const { ref, update, serverTimestamp, db } = await rtdb();
  await update(ref(db, pressPath(roomId, round, seat)), { down: serverTimestamp(), up: serverTimestamp() });
}

export function subscribeAuctionRoom(roomId: string, callback: (room: AuctionRoom | null) => void): () => void {
  let cancelled = false;
  let detach: (() => void) | null = null;
  void (async () => {
    const { ref, onValue, off, db } = await rtdb();
    if (cancelled) return;
    if (!offsetWatched) {
      offsetWatched = true;
      onValue(ref(db, '.info/serverTimeOffset'), (snap) => { serverOffset = Number(snap.val()) || 0; });
    }
    const roomRef = ref(db, `auctionRooms/${roomId}`);
    onValue(roomRef, (snap) => callback(snap.exists() ? (snap.val() as AuctionRoom) : null));
    detach = () => off(roomRef);
  })();
  return () => { cancelled = true; detach?.(); };
}
