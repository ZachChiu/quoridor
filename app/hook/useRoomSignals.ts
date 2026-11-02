'use client';
import { useCallback, useEffect, useMemo, useState } from 'react';
import { sendSeatNudge, trackSeatPresence } from '@/utils/roomSignals';
import { buzz } from '@/utils/sound';

/** 斷線要持續這麼久才顯示（有人重新整理時不閃一下「離線」；同 Wall Go 的 useRoomPresence） */
const AWAY_DELAY_MS = 3000;
/** 按了催一下之後，按鈕灰掉多久（跟規則的冷卻一樣） */
const NUDGE_COOLDOWN_MS = 15000;

export type Presence = Partial<Record<string, true | number>> | undefined;
export type Nudge = { by: string; at: number } | undefined;

/**
 * 尼泊爾虎棋、九子棋（之後輪流下的那幾款）的在線狀態與催一下，照 Wall Go 的 useRoomPresence 與 PlayClient 的催一下：
 * - 自己：`active`（對局中、人到齊）時回報在線；斷線滿 3 秒 selfOffline
 * - 對方：從房間的 presence 讀，斷線（時間戳記）滿 3 秒才算 away，回來立刻拿掉
 * - 催一下：沒輪到自己才能按（canNudge），按了 15 秒內灰掉（nudged）；
 *   對方催自己時 shake 加一（棋盤抖一下、各款自己的聲音），震動在這裡，nudgeFrom 是誰催的、3.5 秒後清掉。
 *   第一次看到的 nudge 不算（進房前的舊紀錄）
 */
export function useRoomSignals(opts: {
  roomPath: string | null;
  me: string | null;
  presence: Presence;
  nudge: Nudge;
  /** 現在輪到誰（座位） */
  turn: string | null;
  /** 對局中而且人到齊；結束了就關掉 */
  active: boolean;
}) {
  const { roomPath, me, presence, nudge, turn, active } = opts;

  const [rawSelfOffline, setRawSelfOffline] = useState(false);
  const [settledSelf, setSettledSelf] = useState(false);
  useEffect(() => {
    if (!roomPath || !me || !active) return;
    return trackSeatPresence(roomPath, me, (connected) => setRawSelfOffline(!connected));
  }, [roomPath, me, active]);
  useEffect(() => {
    const t = setTimeout(() => setSettledSelf(rawSelfOffline), rawSelfOffline ? AWAY_DELAY_MS : 0);
    return () => clearTimeout(t);
  }, [rawSelfOffline]);

  // 斷線的對方串成字串當依賴：房間任何變動都是新物件，拿物件當依賴會一直重設計時器
  const rawAway = Object.entries(presence ?? {})
    .filter(([seat, v]) => seat !== me && typeof v === 'number')
    .map(([seat]) => seat).sort().join(',');
  const [settledAway, setSettledAway] = useState('');
  useEffect(() => {
    const t = setTimeout(() => setSettledAway(rawAway), rawAway ? AWAY_DELAY_MS : 0);
    return () => clearTimeout(t);
  }, [rawAway]);
  const away = useMemo(() => {
    if (!active || !settledAway) return NONE;
    const now = rawAway.split(',');
    return settledAway.split(',').filter((s) => now.includes(s));
  }, [active, settledAway, rawAway]);

  // ─── 催一下 ───
  const [nudged, setNudged] = useState(false);
  const canNudge = active && !!roomPath && !!me && !!turn && turn !== me;
  const sendNudge = useCallback((onSent?: () => void) => {
    if (!roomPath || !me) return;
    setNudged(true);
    setTimeout(() => setNudged(false), NUDGE_COOLDOWN_MS);
    void sendSeatNudge(roomPath, me).then((ok) => { if (ok) onSent?.(); });
  }, [roomPath, me]);

  const nudgeAt = nudge?.at ?? 0;
  const [seenNudge, setSeenNudge] = useState<number | null>(null);
  const [shake, setShake] = useState(0);
  const [nudgeFrom, setNudgeFrom] = useState<string | null>(null);
  // 依 props 調整 state（render 時比對）：第一次看到的不算
  if (roomPath && seenNudge !== nudgeAt) {
    setSeenNudge(nudgeAt);
    if (seenNudge !== null && nudge && nudge.by !== me && turn === me && active) {
      setShake((n) => n + 1);
      setNudgeFrom(nudge.by);
    }
  }
  useEffect(() => {
    if (!shake) return;
    buzz([90, 70, 90]);
    const t = setTimeout(() => setNudgeFrom(null), 3500);
    return () => clearTimeout(t);
  }, [shake]);

  return { selfOffline: active && rawSelfOffline && settledSelf, away, canNudge, nudged, sendNudge, shake, nudgeFrom };
}

const NONE: string[] = [];

/** 棋盤抖一下（被催）。只動 transform，不推開旁邊的東西；減少動態效果時不抖。同 Wall Go 的 Chessboard */
export function shakeElement(el: HTMLElement | null) {
  if (!el || window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  el.animate(
    [
      { transform: 'translateX(0) rotate(0)' },
      { transform: 'translateX(-10px) rotate(-1deg)', offset: 0.15 },
      { transform: 'translateX(9px) rotate(0.8deg)', offset: 0.3 },
      { transform: 'translateX(-7px) rotate(-0.6deg)', offset: 0.45 },
      { transform: 'translateX(5px) rotate(0.4deg)', offset: 0.6 },
      { transform: 'translateX(-3px) rotate(-0.2deg)', offset: 0.75 },
      { transform: 'translateX(0) rotate(0)' },
    ],
    { duration: 560, easing: 'ease-out' },
  );
}
