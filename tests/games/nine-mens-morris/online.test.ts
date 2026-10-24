import { describe, it, expect } from 'vitest';
import { decodeMoves, replay, POINT_NAMES } from '@/games/nine-mens-morris/engine';
import { SEAT, decodeSetup, encodeSetup, newRoomHash, parseNewRoom, playOnline, roomGame } from '@/games/nine-mens-morris/online';
import { parseRoomHash } from '@/hook/useTurnRoom';

const P = (name: string) => POINT_NAMES.indexOf(name as (typeof POINT_NAMES)[number]);
const params = (hash: string) => new URLSearchParams(hash.replace(/^#/, ''));

describe('九子棋的連線房', () => {
  it('開房網址：選哪一邊就坐哪個座位，黑方永遠先走；節目規則寫進 setup', () => {
    expect(parseNewRoom(params(newRoomHash('black', false)))).toEqual({ seats: 2, seat: 0, setup: 'classic', turn: 0 });
    expect(parseNewRoom(params(newRoomHash('white', true)))).toEqual({ seats: 2, seat: 1, setup: 'show', turn: 0 });
  });

  it('看不懂的開房網址當作連結壞了', () => {
    expect(parseNewRoom(params('#new=red'))).toBeNull();
    expect(parseNewRoom(params('#new=black&rules=chess'))).toBeNull();
    expect(parseRoomHash('#new=tiger', parseNewRoom)).toEqual({ invalid: true });
    expect(parseRoomHash('#new=white', parseNewRoom)).toEqual({ create: { seats: 2, seat: 1, setup: 'classic', turn: 0 } });
  });

  it('setup 字串來回', () => {
    expect(decodeSetup(encodeSetup({ showRules: true }))).toEqual({ showRules: true });
    expect(decodeSetup(encodeSetup({ showRules: false }))).toEqual({ showRules: false });
    expect(decodeSetup('')).toBeNull();
    expect(decodeSetup('5x6')).toBeNull();
  });

  it('房間的走法重走成局面；不合規則、解不開、設定看不懂都回 null', () => {
    const g = roomGame('classic', 'a7 b6 d7');
    expect(g?.history).toHaveLength(3);
    expect(g?.turn).toBe('white');
    expect(roomGame('classic', '')?.history).toEqual([]);
    expect(roomGame('show', 'a7')?.rules.showRules).toBe(true);
    expect(roomGame('classic', 'a7 a7')).toBeNull(); // 放在有子的點
    expect(roomGame('classic', 'a7 zz')).toBeNull();
    expect(roomGame('nope', 'a7')).toBeNull();
  });

  it('成三之後還要拿子：turn 寫自己，拿完才換人', () => {
    // 黑 a7、d7 已經在盤上，白隨便放兩顆；黑放 g7 連成一線
    let g = replay(decodeMoves('a7 b6 d7 f6'));
    const mill = playOnline(g, { kind: 'place', to: P('g7') });
    expect(mill.state.removing).toBe(true);
    expect(mill.turn).toBe(SEAT.black);
    expect(mill.moves).toBe('a7 b6 d7 f6 g7');
    g = mill.state;
    const take = playOnline(g, { kind: 'remove', at: P('b6') });
    expect(take.turn).toBe(SEAT.white);
    expect(take.moves).toBe('a7 b6 d7 f6 g7 xb6');
    // 另一台裝置從房間重走出同一個局面
    expect(roomGame('classic', take.moves)?.board).toEqual(take.state.board);
  });

  it('不合法的一手直接丟錯，不會寫進房間', () => {
    const g = replay(decodeMoves('a7'));
    expect(() => playOnline(g, { kind: 'place', to: P('a7') })).toThrow();
  });
});
