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
import type { ContactMessage, Feedback } from '@/types/feedback';

/**
 * 重新導出房間相關型別，方便其他模組直接從 service 取得共用定義。
 */
export type { Room, RoomStatus, RoomPlayer } from '@/types/room';
export type { ContactMessage, Feedback } from '@/types/feedback';

/** 同時取得 RTDB 實例與所需的 database 函式。 */
async function rtdb() {
  const [mod, db] = await Promise.all([import('firebase/database'), getFirebaseDb()]);
  // 可能先前被 releaseConnection 斷開過（例如結算後又送回饋）—— 用之前接回來。
  // goOnline 本來就連著時什麼都不做。
  mod.goOnline(db);
  return { ...mod, db };
}

/**
 * 把資料庫連線還回去。
 *
 * 免費方案（Spark）同時只有 100 條連線，一個分頁佔一條，而且 SDK 預設
 * 會一直連著直到關掉分頁。對局結束停在結算畫面、送完回饋還在看的人，
 * 都在佔名額卻用不到。之後任何 gameService 的操作會自己再接上（見 rtdb）。
 */
export async function releaseConnection(): Promise<void> {
  const [{ goOffline }, db] = await Promise.all([import('firebase/database'), getFirebaseDb()]);
  goOffline(db);
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

// ─── 在線狀態 ─────────────────────────────────────────────────────────────────

/**
 * 回報自己這個座位在不在線：`rooms/{roomId}/presence/{seat}`。
 *
 *   true    連著
 *   number  斷線的時間（伺服器時間）
 *   沒有    不知道 —— 對方還在跑舊版程式、或規則還沒發布。畫面上**不能**當成斷線，
 *           否則上線那一刻所有人都會看到對手「離線」
 *
 * 斷線由伺服器的 onDisconnect 寫：關分頁、手機把瀏覽器收到背景、網路斷掉，
 * 伺服器偵測到連線沒了就把座位改成時間戳記（瀏覽器自己根本來不及說再見）。
 * 網路回來時 SDK 會自己重連，`.info/connected` 變回 true 就再登記一次。
 *
 * 寫入失敗一律吞掉：在線狀態是附加資訊，規則還沒發布時也不該讓對局出錯。
 *
 * @param onConnection - 自己的連線狀態變了（給「連線中斷，重新連線中」用）。
 * @returns 停止回報。會順便把座位標成離開 —— 站內換頁時連線還在，
 *          onDisconnect 不會觸發，不自己標的話對手會一直看到「在線」。
 */
export function trackPresence(
  roomId: string,
  seat: 'A' | 'B' | 'C',
  onConnection: (connected: boolean) => void
): () => void {
  let cancelled = false;
  let stop: (() => void) | null = null;

  void (async () => {
    const { ref, onValue, onDisconnect, set, serverTimestamp, db } = await rtdb();
    if (cancelled) return;

    const mine = ref(db, `rooms/${roomId}/presence/${seat}`);
    let connected = false;

    // 先登記「斷線時要寫什麼」，伺服器收下之後才標成在線。
    // 反過來的話，兩步之間剛好斷掉，座位就會永遠掛著「在線」。
    const markOnline = () => {
      onDisconnect(mine).set(serverTimestamp())
        .then(() => set(mine, true))
        .catch(() => {});
    };

    const offConnected = onValue(ref(db, '.info/connected'), (snap) => {
      connected = snap.val() === true;
      onConnection(connected);
      if (connected) markOnline();
    });

    // 同一個人開了兩個分頁：關掉其中一個，伺服器會把座位標成斷線。
    // 還開著的那個分頁看到了就補回來（對手那邊頂多閃一下，而且有延遲才顯示）。
    const offMine = onValue(mine, (snap) => {
      if (connected && snap.exists() && snap.val() !== true) markOnline();
    });

    stop = () => {
      offConnected();
      offMine();
      onDisconnect(mine).cancel().catch(() => {});
      set(mine, serverTimestamp()).catch(() => {});
    };
  })();

  return () => {
    cancelled = true;
    stop?.();
  };
}

// ─── 意見回饋 ─────────────────────────────────────────────────────────────────


/**
 * 送出回饋。
 *
 * **走 Firebase 而不是 Sentry**：靜態匯出無法使用 Sentry 的 tunnelRoute，
 * 裝了廣告阻擋器的使用者送出後會靜默失敗 —— 他以為送出了、實際上消失。
 * 那對「主動回饋」的傷害比對「錯誤回報」大得多，因為前者是使用者
 * 特地花時間寫的。Firebase 走自己的網域，不受影響。
 *
 * 規則上只能新增、不能讀取（見 database.rules.json）。
 */
export async function sendFeedback(data: Feedback, uid: string): Promise<void> {
  const { ref, push, set, db } = await rtdb();
  /*
    uid 由呼叫端先 ensureUser() 拿到再傳進來。

    先前這裡讀 `auth.currentUser` —— 但本機與單人模式從頭到尾不會登入，
    currentUser 是 null，而規則要求 `auth != null`，寫入被拒。
    換句話說，除了連線模式之外回饋全部送不出去。

    undefined 的欄位要剝掉：RTDB 的 set() 遇到 undefined 會直接丟例外
    （不是略過），而聯絡方式沒填就是 undefined —— 大部分人都不會填。
  */
  const payload = Object.fromEntries(
    Object.entries(data).filter(([, value]) => value !== undefined)
  );
  await set(push(ref(db, 'feedback')), {
    ...payload,
    uid,
    createdAt: Date.now(),
    locale: typeof navigator !== 'undefined' ? navigator.language : 'unknown',
  });
}

/**
 * 首頁「聯絡我們」。跟 sendFeedback 同一條路徑、同一套規則，
 * 只是 mode 是 'contact'、沒有棋譜（不綁某一局）。
 */
export async function sendContact(data: ContactMessage, uid: string): Promise<void> {
  const { ref, push, set, db } = await rtdb();
  const payload = Object.fromEntries(
    Object.entries(data).filter(([, value]) => value !== undefined)
  );
  await set(push(ref(db, 'feedback')), {
    ...payload,
    mode: 'contact',
    uid,
    createdAt: Date.now(),
    locale: typeof navigator !== 'undefined' ? navigator.language : 'unknown',
  });
}
