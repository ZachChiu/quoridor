'use client';
import { useEffect, useState } from 'react';
import { useUser } from '@/contexts/UserContext';
import { parseRoomHash, type TurnRoomFailure } from '@/hook/useTurnRoom';
import { MAX_SEATS, ONLINE_MIN_SEATS, type Mode } from '@/games/time-auction/engine';
import { auctionSeatKey, type AuctionRoom } from '@/types/auctionRoom';
import { createAuctionRoom, getAuctionRoom, joinAuctionRoom, subscribeAuctionRoom } from '@/utils/auctionRoomService';
import { atStep, describeOnlineError, reportOnlineError } from '@/utils/onlineError';

/**
 * 時間拍賣連線房的流程（房間結構見 types/auctionRoom.ts）。照 hook/useTurnRoom.ts 的做法，只是房間不一樣：
 * 這款是同時出價，不用輪流下的 turnRooms。
 *
 * 網址（放 hash，跟其他款一樣；hash 一變就是新的一場，外面用 useHashSession 的 n 當 key）：
 * - `#new=quick-4`：在這頁開房（模式-人數），開好用 replaceState 換成 `#roomId=…` —— 重整不會再開一間
 * - `#roomId=…`：進房。已經坐著就接回（重整）、有空位就坐、坐滿了就說滿了
 */

export type AuctionTarget = { create: { mode: Mode; seats: number } } | { roomId: string } | { invalid: true };

/** 解析 hash。開房的設定借用 parseRoomHash 的格式：setup 放模式、seats 放人數 */
export function parseAuctionHash(hash: string): AuctionTarget {
  const target = parseRoomHash(hash, (p) => {
    const m = /^(quick|show)-(\d)$/.exec(p.get('new') ?? '');
    const seats = m ? Number(m[2]) : NaN;
    return m && seats >= ONLINE_MIN_SEATS && seats <= MAX_SEATS ? { seats, seat: 0, setup: m[1], turn: 0 } : null;
  });
  if ('create' in target) return { create: { mode: target.create.setup as Mode, seats: target.create.seats } };
  return target;
}

export type AuctionRoomState = {
  failure: TurnRoomFailure | null;
  /** 自己的座位；還沒坐下是 null */
  me: number | null;
  room: AuctionRoom | null;
  /** 還空著的座位（等人畫面用） */
  open: number[];
  inviteUrl: string | null;
};

/** 一場一個。`target` 要是穩定的值（useMemo） */
export function useAuctionRoom(target: AuctionTarget): AuctionRoomState {
  const { ensureUser } = useUser();
  const [roomId, setRoomId] = useState<string | null>(null);
  const [me, setMe] = useState<number | null>(null);
  const [room, setRoom] = useState<AuctionRoom | null>(null);
  const [failed, setFailure] = useState<TurnRoomFailure | null>(null);
  const failure: TurnRoomFailure | null = 'invalid' in target ? 'badLink' : failed;

  useEffect(() => {
    if ('invalid' in target) return;
    let cancelled = false;
    void (async () => {
      try {
        const uid = await atStep('auth', ensureUser());
        if ('create' in target) {
          const id = await atStep('create', createAuctionRoom(target.create, uid));
          if (cancelled) return;
          history.replaceState(null, '', `${location.pathname}#roomId=${id}`);
          setMe(0); setRoomId(id);
          return;
        }
        // 兩個人同時搶同一個空位：後到的那個被規則擋下（座位只能寫一次），重讀一次換下一個空位
        for (let attempt = 0; ; attempt++) {
          const existing = await atStep('getRoom', getAuctionRoom(target.roomId));
          if (cancelled) return;
          if (!existing) { setFailure('noRoom'); return; }
          const seats = Array.from({ length: existing.seats }, (_, i) => i);
          const mine = seats.find((i) => existing.players?.[auctionSeatKey(i)]?.uid === uid);
          const open = seats.find((i) => !existing.players?.[auctionSeatKey(i)]);
          const seat = mine ?? open;
          if (seat === undefined) { setFailure('roomFull'); return; }
          if (mine === undefined) {
            try {
              await atStep('join', joinAuctionRoom(target.roomId, seat, uid));
            } catch (err) {
              if (attempt < existing.seats) continue;
              throw err;
            }
          }
          if (cancelled) return;
          setMe(seat); setRoomId(target.roomId);
          return;
        }
      } catch (err) {
        if (cancelled) return;
        console.error('[time-auction online]', err);
        reportOnlineError('create' in target ? 'createFail' : 'connectFail', describeOnlineError(err));
        setFailure('connectFail');
      }
    })();
    return () => { cancelled = true; };
  }, [target, ensureUser]);

  useEffect(() => {
    if (!roomId) return;
    return subscribeAuctionRoom(roomId, (r) => {
      if (!r) { setFailure('noRoom'); return; }
      setRoom(r);
    });
  }, [roomId]);

  const open = room ? Array.from({ length: room.seats }, (_, i) => i).filter((i) => !room.players?.[auctionSeatKey(i)]) : [];
  return {
    failure,
    me,
    room,
    open,
    inviteUrl: roomId ? `${location.origin}${location.pathname}#roomId=${roomId}` : null,
  };
}
