'use client';
import { useCallback, useEffect, useState } from 'react';
import { useUser } from '@/contexts/UserContext';
import { useIsoLayoutEffect } from '@/hook/useIsoLayoutEffect';
import { seatIndex, seatKey, type TurnGame, type TurnRoom } from '@/types/turnRoom';
import { createTurnRoom, getTurnRoom, joinTurnRoom, subscribeTurnRoom, writeTurnMoves, type NewTurnRoom } from '@/utils/turnRoomService';
import { atStep, describeOnlineError, reportOnlineError } from '@/utils/onlineError';

/**
 * 輪流下的遊戲的連線房流程（九子棋、盲眼五子棋、均衡曼卡拉共用；房間結構見 types/turnRoom.ts）。
 * 照尼泊爾虎棋的 BaghOnline 抽出來：畫面（連線中、等人、對局、失敗）各款自己畫，這裡只管房間。
 *
 * 網址（放 hash，跟 Wall Go、虎棋一樣）：
 * - `#new=…`：在這頁開房（`new` 之後怎麼寫由各款的 parseNew 決定），開好用 replaceState 換成 `#roomId=…`
 *   —— 重整不會再開一間
 * - `#roomId=…`：進房。已經坐著就接回（重整）、有空位就坐、坐滿了就說滿了
 */

export type NewSeat = Omit<NewTurnRoom, 'game'>;
export type TurnRoomTarget = { create: NewSeat } | { roomId: string } | { invalid: true };
export type TurnRoomFailure = 'noRoom' | 'roomFull' | 'connectFail' | 'badLink';

/** 解析網址的 hash。`parseNew` 拿到整串參數，回傳開房設定；看不懂就回 null（當作連結壞了） */
export function parseRoomHash(hash: string, parseNew: (params: URLSearchParams) => NewSeat | null): TurnRoomTarget {
  const p = new URLSearchParams(hash.replace(/^#/, ''));
  if (p.has('new')) {
    const create = parseNew(p);
    return create ? { create } : { invalid: true };
  }
  const roomId = p.get('roomId');
  return roomId && /^[-\w]{10,40}$/.test(roomId) ? { roomId } : { invalid: true };
}

/**
 * 每次 hash 變了就是新的一場（結算的「再來一局」是把 hash 換成 `#new=…`）。
 * 用遞增的編號當 key，而不是 hash 本身：開房後網址被 replaceState 成 `#roomId=`，
 * 再來一局又設回同一個 `#new=…` 時 hash 字串跟上一場一樣，key 就不會變。
 * 用法：`const s = useHashSession(); if (!s) return null; return <Session key={s.n} hash={s.hash} />`
 */
export function useHashSession(): { hash: string; n: number } | null {
  const [session, setSession] = useState<{ hash: string; n: number } | null>(null);
  useIsoLayoutEffect(() => {
    const read = () => setSession((s) => ({ hash: location.hash, n: (s?.n ?? 0) + 1 }));
    read();
    window.addEventListener('hashchange', read);
    return () => window.removeEventListener('hashchange', read);
  }, []);
  return session;
}

export type TurnRoomState = {
  failure: TurnRoomFailure | null;
  /** 自己的座位；還沒坐下是 null */
  me: number | null;
  room: TurnRoom | null;
  /** 目前的整串走法：自己剛走的那一手先算進來（不等資料庫回音），之後跟著房間 */
  moves: string;
  /** 還空著的座位（等人畫面用）；房間還沒讀到是空陣列 */
  open: number[];
  /** 邀請連結 */
  inviteUrl: string | null;
  /** 輪到誰（座位編號） */
  turn: number | null;
  /** 走完一手：整串走法＋下一個輪到誰。只有輪到自己時才該呼叫（不是的話規則會擋，畫面會變成連線失敗） */
  send: (moves: string, turn: number) => void;
  /** 走法解不開、不合規則時由各款呼叫：當作連線壞了，不畫出一盤錯的棋 */
  fail: () => void;
};

/** 一場一個（外面用 useHashSession 的 n 當 key）。`target` 要是穩定的值（useMemo） */
export function useTurnRoom(game: TurnGame, target: TurnRoomTarget): TurnRoomState {
  const { ensureUser } = useUser();
  const [roomId, setRoomId] = useState<string | null>(null);
  const [me, setMe] = useState<number | null>(null);
  const [room, setRoom] = useState<TurnRoom | null>(null);
  const [moves, setMoves] = useState('');
  const [failed, setFailure] = useState<TurnRoomFailure | null>(null);
  const failure: TurnRoomFailure | null = 'invalid' in target ? 'badLink' : failed;

  // 開房或進房
  useEffect(() => {
    if ('invalid' in target) return;
    let cancelled = false;
    void (async () => {
      try {
        const uid = await atStep('auth', ensureUser());
        const player = { uid, displayName: 'player', joinedAt: Date.now() };
        if ('create' in target) {
          const id = await atStep('create', createTurnRoom({ game, ...target.create }, player));
          if (cancelled) return;
          history.replaceState(null, '', `${location.pathname}#roomId=${id}`);
          setMe(target.create.seat); setRoomId(id);
          return;
        }
        const existing = await atStep('getRoom', getTurnRoom(target.roomId));
        if (cancelled) return;
        if (!existing || existing.game !== game) { setFailure('noRoom'); return; }
        const seats = Array.from({ length: existing.seats }, (_, i) => i);
        const mine = seats.find((i) => existing.players?.[seatKey(i)]?.uid === uid);
        const open = seats.find((i) => !existing.players?.[seatKey(i)]);
        const seat = mine ?? open;
        if (seat === undefined) { setFailure('roomFull'); return; }
        if (mine === undefined) await atStep('join', joinTurnRoom(target.roomId, seat, player));
        if (cancelled) return;
        setMe(seat); setRoomId(target.roomId);
      } catch (err) {
        if (cancelled) return;
        console.error(`[${game} online]`, err);
        reportOnlineError('create' in target ? 'createFail' : 'connectFail', describeOnlineError(err));
        setFailure('connectFail');
      }
    })();
    return () => { cancelled = true; };
  }, [game, target, ensureUser]);

  useEffect(() => {
    if (!roomId) return;
    return subscribeTurnRoom(roomId, (r) => {
      if (!r) { setFailure('noRoom'); return; }
      setRoom(r);
      setMoves(r.moves ?? '');
    });
  }, [roomId]);

  const send = useCallback((next: string, turn: number) => {
    if (!roomId) return;
    setMoves(next);
    writeTurnMoves(roomId, next, turn).catch((err) => {
      console.error(`[${game} online] 寫入失敗`, err);
      reportOnlineError('connectFail', describeOnlineError(err));
      setFailure('connectFail');
    });
  }, [roomId, game]);

  const fail = useCallback(() => setFailure('connectFail'), []);

  const open = room ? Array.from({ length: room.seats }, (_, i) => i).filter((i) => !room.players?.[seatKey(i)]) : [];
  return {
    failure,
    me,
    room,
    moves,
    open,
    inviteUrl: roomId ? `${location.origin}${location.pathname}#roomId=${roomId}` : null,
    turn: room ? seatIndex(room.turn) : null,
    send,
    fail,
  };
}
