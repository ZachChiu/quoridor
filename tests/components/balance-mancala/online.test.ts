import { describe, it, expect } from 'vitest';
import { ONLINE_MAX, ONLINE_MIN, beforeLast, catchUp, movesOf, parseNew, setupOf, stateOf } from '@/components/balance-mancala/online';
import { parseRoomHash } from '@/hook/useTurnRoom';
import { applyMove, createGame, legalPlacements, place, sourcesOf, type MancalaState } from '@/games/balance-mancala/engine';
import { chooseMove } from '@/games/balance-mancala/ai';

/** 照規則玩到第 n 手（開局放子全放、再走 n 手播種）；固定亂數，結果可以重現 */
function playTo(seats: number, n: number): MancalaState {
  let seed = 7;
  const random = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
  let s = createGame({ seats, pieces: 4 });
  while (s.phase === 'setup') { const cells = legalPlacements(s); s = place(s, cells[Math.floor(random() * cells.length)]); }
  for (let i = 0; i < n && s.phase === 'play'; i++) s = applyMove(s, chooseMove(s, 'easy', { random })!);
  return s;
}

describe('開房的網址', () => {
  it('#new=N 開 N 人房，開房的人坐 A、A 先放子；setup 跟棋譜開頭同一個寫法', () => {
    expect(parseRoomHash('#new=5', parseNew)).toEqual({ create: { seats: 5, seat: 0, setup: '5x4', turn: 0 } });
    expect(setupOf({ seats: 7, pieces: 4, snake: true })).toBe('7x4s');
  });
  it('人數照 engine（4–7）與房間（8）取小的；看不懂的都是壞掉的連結', () => {
    expect(ONLINE_MIN).toBe(4);
    expect(ONLINE_MAX).toBe(7);
    for (const bad of ['#new=3', '#new=8', '#new=', '#new=5x4', '#new=05', '#new=tiger']) {
      expect(parseRoomHash(bad, parseNew)).toEqual({ invalid: true });
    }
  });
});

describe('房間的字串 ↔ 局面', () => {
  it('還沒人動：moves 是空的，輪到 A 放子', () => {
    const s = stateOf('4x4', '', 4);
    expect(s.phase).toBe('setup');
    expect(s.turn).toBe(0);
    expect(movesOf(s)).toBe('|');
  });
  it('放子、播種都寫進 moves，重走回來是同一個局面（含輪到誰）', () => {
    for (const n of [0, 1, 12]) {
      const s = playTo(5, n);
      const back = stateOf('5x4', movesOf(s), 5);
      expect(back.board).toEqual(s.board);
      expect(back.scores).toEqual(s.scores);
      expect(back.turn).toBe(s.turn);
    }
    const half = createGame({ seats: 4, pieces: 4 });
    const placed = place(place(half, 3), 3);
    expect(movesOf(placed)).toBe('3,3|');
    expect(stateOf('4x4', '3,3|', 4).turn).toBe(2);
  });
  it('一整局的字串遠低於房間的 20000 字上限', () => {
    let s = playTo(7, 1000);
    expect(s.phase).toBe('over');
    expect(movesOf(s).length).toBeLessThan(20000);
    s = stateOf('7x4', movesOf(s), 7);
    expect(s.phase).toBe('over');
  });
  it('解不開、不合規則、人數跟房間對不上都丟錯', () => {
    expect(() => stateOf('4x4', 'garbage', 4)).toThrow();
    expect(() => stateOf('4x4', '3,3,3|', 4)).toThrow(); // 一格放了 3 顆
    expect(() => stateOf('4x4', '0|1:A', 4)).toThrow(); // 開局還沒放完就播種
    expect(() => stateOf('4x4', '', 5)).toThrow();
    expect(() => stateOf('9x4', '', 9)).toThrow();
  });
});

describe('畫面追房間', () => {
  it('一樣就不動；房間多一顆放子、多一手播種就追一步', () => {
    const a = createGame({ seats: 4, pieces: 4 });
    expect(catchUp(a, a)).toEqual({ kind: 'same' });
    expect(catchUp(a, place(a, 5))).toEqual({ kind: 'place', cell: 5 });
    const s = playTo(4, 3);
    const next = applyMove(s, chooseMove(s, 'easy')!);
    const step = catchUp(s, next);
    expect(step.kind).toBe('move');
    if (step.kind === 'move') {
      expect(step.behind).toBe(1);
      expect(applyMove(s, step.move).board).toEqual(next.board);
    }
  });
  it('開局放完、播種還沒開始時，先追放子', () => {
    const s = playTo(4, 0);
    const before = createGame({ seats: 4, pieces: 4 });
    expect(catchUp(before, s)).toEqual({ kind: 'place', cell: s.placements[0] });
  });
  it('畫面比房間多、或走的不一樣：整個換成房間的局面', () => {
    const s = playTo(4, 5);
    expect(catchUp(s, playTo(4, 3)).kind).toBe('reset');
    const other = createGame({ seats: 4, pieces: 4 });
    expect(catchUp(place(other, 1), place(other, 2)).kind).toBe('reset');
    expect(catchUp(createGame({ seats: 5, pieces: 4 }), other).kind).toBe('reset');
  });
  it('落後很多手：倒退到最後一手之前，只差一手', () => {
    const s = playTo(6, 4);
    const far = playTo(6, 9);
    const step = catchUp(s, far);
    expect(step.kind === 'move' && step.behind).toBe(5);
    const prev = beforeLast(far);
    expect(prev.moves.length).toBe(far.moves.length - 1);
    expect(catchUp(prev, far)).toMatchObject({ kind: 'move', behind: 1 });
    expect(sourcesOf(prev).length).toBeGreaterThan(0);
  });
});
