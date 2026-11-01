/**
 * 連線房的「對局以外」那幾件事：在線狀態、催一下、投降（2026-11-01 Zach：Wall Go 有的，尼泊爾虎棋、九子棋也要有）。
 * 房間路徑由呼叫端給（`baghRooms/{id}`、`turnRooms/{id}`），座位是各款自己的字串（tiger／goat、s0／s1）。
 * 做法跟 Wall Go 的 gameService（trackPresence、sendNudge）一樣，Wall Go 本身沒有改用這份。
 *
 *   presence/{座位}  true＝連著、number＝斷線的時間（伺服器時間）；沒有＝不知道（舊程式、規則還沒發布），不能當成斷線
 *   nudge { by, at }  還沒輪到的人催輪到的人；15 秒冷卻由規則擋
 *   resigned          投降的座位。只能寫自己的、只能寫一次；寫了這局就結束
 *
 * 寫入失敗一律吞掉（presence、nudge）：規則還沒發布時也不該讓對局出錯。投降失敗回 false，畫面照舊。
 */
import { getFirebaseDb } from '@/utils/firebase';

async function rtdb() {
  const [mod, db] = await Promise.all([import('firebase/database'), getFirebaseDb()]);
  mod.goOnline(db);
  return { ...mod, db };
}

/** 回報自己的座位在不在線。先登記 onDisconnect、伺服器收下才標 true（見 gameService 的 trackPresence）。回傳停止回報（會把座位標成離開） */
export function trackSeatPresence(roomPath: string, seat: string, onConnection: (connected: boolean) => void): () => void {
  let cancelled = false;
  let stop: (() => void) | null = null;
  void (async () => {
    const { ref, onValue, onDisconnect, set, serverTimestamp, db } = await rtdb();
    if (cancelled) return;
    const mine = ref(db, `${roomPath}/presence/${seat}`);
    let connected = false;
    const markOnline = () => {
      onDisconnect(mine).set(serverTimestamp()).then(() => set(mine, true)).catch(() => {});
    };
    const offConnected = onValue(ref(db, '.info/connected'), (snap) => {
      connected = snap.val() === true;
      onConnection(connected);
      if (connected) markOnline();
    });
    // 同一個人開了兩個分頁、關掉其中一個：還開著的那個看到座位被標成斷線就補回來
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
  return () => { cancelled = true; stop?.(); };
}

/** 催輪到的人。冷卻中（規則擋下）回 false */
export async function sendSeatNudge(roomPath: string, by: string): Promise<boolean> {
  const { ref, set, serverTimestamp, db } = await rtdb();
  try {
    await set(ref(db, `${roomPath}/nudge`), { by, at: serverTimestamp() });
    return true;
  } catch {
    return false;
  }
}

/** 投降：把自己的座位寫進 resigned */
export async function writeResigned(roomPath: string, seat: string): Promise<boolean> {
  const { ref, set, db } = await rtdb();
  try {
    await set(ref(db, `${roomPath}/resigned`), seat);
    return true;
  } catch {
    return false;
  }
}
