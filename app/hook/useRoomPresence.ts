'use client'
import { useEffect, useMemo, useState } from 'react';
import { trackPresence } from '@/utils/gameService';
import type { PlayerKey } from '@/config/players';
import type { Room } from '@/types/room';

/**
 * 斷線要持續這麼久才顯示。
 *
 * 對手按一下重新整理，伺服器就會先把他標成斷線、一兩秒後又連回來 ——
 * 不等一下的話，每次有人重整，另一邊就閃一下「離線」。
 * 自己這邊也一樣：手機剛切回來時 `.info/connected` 會先是 false 一下。
 */
const AWAY_DELAY_MS = 3000;

/**
 * 連線對戰的在線狀態。
 *
 * - 自己：`active` 時把座位回報成在線（見 gameService 的 trackPresence），
 *   並告訴畫面自己是不是斷線了 —— 斷線時下的那一手會先存在瀏覽器，連回來才送出。
 * - 對手：從房間資料裡讀，不另外訂閱（房間本來就整包在訂閱）。
 *
 * `active` 在對局結束時要關掉：結算後 PlayClient 會把資料庫連線還回去（releaseConnection），
 * 那時對手當然是「斷線」，但已經沒有意義。
 *
 * 延遲顯示的做法：計時器只負責「等滿了」，畫面上顯示的是「等滿了而且現在還斷著」——
 * 回來的那一刻不必等計時器，直接從 render 算掉。
 */
export function useRoomPresence(
  roomId: string | undefined,
  me: PlayerKey | null,
  room: Room | null,
  active: boolean
) {
  const [rawSelfOffline, setRawSelfOffline] = useState(false);
  const [settledSelf, setSettledSelf] = useState(false);

  useEffect(() => {
    if (!roomId || !me || !active) return;
    return trackPresence(roomId, me, (connected) => setRawSelfOffline(!connected));
  }, [roomId, me, active]);

  useEffect(() => {
    const t = setTimeout(() => setSettledSelf(rawSelfOffline), rawSelfOffline ? AWAY_DELAY_MS : 0);
    return () => clearTimeout(t);
  }, [rawSelfOffline]);

  // 斷線的對手（presence 是時間戳記的座位），排序後串成字串 ——
  // 房間有任何變動（對手下了一手）都會是新物件，拿字串當依賴才不會一直重設計時器。
  const rawAway = (Object.entries(room?.presence ?? {}) as [PlayerKey, true | number][])
    .filter(([seat, v]) => seat !== me && typeof v === 'number')
    .map(([seat]) => seat)
    .sort()
    .join('');

  const [settledAway, setSettledAway] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setSettledAway(rawAway), rawAway ? AWAY_DELAY_MS : 0);
    return () => clearTimeout(t);
  }, [rawAway]);

  const away = useMemo(
    () => (active ? ([...settledAway].filter((s) => rawAway.includes(s)) as PlayerKey[]) : NONE),
    [active, settledAway, rawAway]
  );

  return { selfOffline: active && rawSelfOffline && settledSelf, away };
}

const NONE: PlayerKey[] = [];
