import { describe, it, expect } from 'vitest';
import { applyMove, createGame, encodeMoves, parsePoint, type Move } from '@/games/blind-gomoku/engine';
import {
  ONLINE_SEATS, decodeSetup, encodeSetup, newRoomHash, parseNewRoom, roomGame, seatOf, sideOfSeat,
} from '@/games/blind-gomoku/online';

const mv = (name: string, color: Move['color'] = 'red'): Move => ({ at: parsePoint(name)!, color });
const params = (hash: string) => new URLSearchParams(hash.replace(/^#/, ''));

describe('盲五子棋的連線房', () => {
  it('座位：s0 是黑、s1 是白', () => {
    expect(seatOf('black')).toBe(0);
    expect(seatOf('white')).toBe(1);
    expect(sideOfSeat(0)).toBe('black');
    expect(sideOfSeat(1)).toBe('white');
  });

  it('setup 來回', () => {
    for (const blind of [true, false]) expect(decodeSetup(encodeSetup({ blind }))).toEqual({ blind });
    expect(decodeSetup('')).toBeNull();
    expect(decodeSetup('3-4')).toBeNull();
  });

  it('開房的 hash：自己選的那一方就是座位，永遠黑先', () => {
    expect(newRoomHash(true, 'black')).toBe('#new=blind-black');
    expect(parseNewRoom(params(newRoomHash(true, 'black')))).toEqual({ seats: ONLINE_SEATS, seat: 0, setup: 'blind', turn: 0 });
    expect(parseNewRoom(params(newRoomHash(false, 'white')))).toEqual({ seats: ONLINE_SEATS, seat: 1, setup: 'classic', turn: 0 });
    for (const bad of ['#new=', '#new=blind', '#new=blind-red', '#new=tiger', '#new=classic-white-x']) {
      expect(parseNewRoom(params(bad)), bad).toBeNull();
    }
  });

  it('房間的走法重走成局面，跟一手一手下的一樣', () => {
    const moves = [mv('h8', 'red'), mv('i9', 'blue'), mv('h9', 'yellow')];
    const direct = moves.reduce(applyMove, createGame());
    expect(roomGame(encodeMoves(moves))).toEqual(direct);
    expect(roomGame('')).toEqual(createGame());
    // 兩個人各自選色：顏色跟上一手不同也合法
    expect(roomGame('h8r i9b').board[parsePoint('i9')!]).toEqual({ side: 'white', color: 'blue' });
  });

  it('解不開或不合規則就丟錯', () => {
    expect(() => roomGame('h8r h8b')).toThrow();
    expect(() => roomGame('zz')).toThrow();
    // 分出勝負之後不能再下
    const five = 'a1r o15r b1r o14r c1r o13r d1r o12r e1r';
    expect(roomGame(five).winner).toBe('black');
    expect(() => roomGame(`${five} o11r`)).toThrow();
  });
});
