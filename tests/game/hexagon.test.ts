import { describe, expect, it } from 'vitest';
import {
  CELLS, DAILY_ROUNDS, LEVELS, LINES, MAX_ANSWERS, MIN_ANSWERS, dailyConfig, endRound, flip, lineName, lineOf, localDate,
  makeRound, nextRound, practiceConfig, roundOf, showConfig, solutions, startGame, submit, totals, type Level,
} from '@/games/hexagon/engine';

/** RULE 卡上的 27 條線（docs/hexagon.md） */
const RULE_LINES = [
  'ABC', 'DEF', 'EFG', 'HIJ', 'IJK', 'JKL', 'MNO', 'NOP', 'QRS',
  'AEJ', 'EJO', 'JOS', 'BFK', 'FKP', 'CGL', 'DIN', 'INR', 'HMQ',
  'CFJ', 'FJN', 'JNQ', 'BEI', 'EIM', 'ADH', 'GKO', 'KOR', 'LPS',
];

/** 節目第 1 季決賽第 2 戰的十盤（namu 7일차，A→S）、目標數與答案 */
const SHOW_BOARDS: [string, number, string[]][] = [
  ['1 6 3 2 4 5 6 2 5 2 1 3 4 5 3 5 1 1 3', 5, ['ADH', 'KOR', 'QRS']],
  ['2 3 2 6 5 4 1 4 3 7 4 4 2 1 1 5 6 2 2', 7, ['ABC', 'CGL', 'KOR', 'NOP']],
  ['4 3 3 1 2 1 4 5 2 3 5 1 3 5 2 2 2 3 3', 6, ['LPS']],
  ['6 1 2 3 5 6 2 3 4 3 1 5 3 2 3 4 6 4 3', 9, ['ABC', 'CGL', 'DIN', 'JKL', 'JOS', 'NOP']],
  ['3 1 2 6 3 7 2 4 2 2 3 6 7 3 4 1 5 6 1', 8, ['AEJ', 'HIJ', 'LPS', 'NOP']],
  ['2 3 5 4 4 5 1 2 8 3 5 4 4 5 7 2 8 1 1', 12, ['FKP', 'JKL']],
  ['6 5 2 4 3 4 2 2 5 5 3 6 7 5 1 4 1 1 2', 10, ['CGL', 'HMQ', 'NOP']],
  ['6 7 5 5 1 10 10 4 4 6 8 6 10 9 1 1 4 2 10', 18, ['ABC', 'DIN', 'HMQ', 'IJK']],
  ['4 7 1 4 3 3 5 6 3 2 5 2 2 6 1 1 1 2 5', 11, ['EFG', 'FJN', 'GKO', 'HIJ', 'INR']],
  ['5 6 5 7 8 1 6 4 4 2 3 3 4 6 6 7 4 1 8', 15, ['AEJ', 'EFG', 'GKO']],
];

const sorted = (s: string) => [...s].sort().join('');
const letters = (name: string) => [...name].map((ch) => 'ABCDEFGHIJKLMNOPQRS'.indexOf(ch));

describe('hexagon 盤面', () => {
  it('19 格、27 條線，跟 RULE 卡一模一樣', () => {
    expect(CELLS).toBe(19);
    expect(LINES).toHaveLength(27);
    expect(LINES.map((_, i) => sorted(lineName(i))).sort()).toEqual(RULE_LINES.map(sorted).sort());
  });

  it('三格不管什麼順序都認得是哪一條線；不是一直線的是 -1', () => {
    expect(lineName(lineOf(letters('JEA')))).toBe('AEJ');
    expect(lineOf(letters('ABD'))).toBe(-1);
    expect(lineOf(letters('AEO'))).toBe(-1); // 同方向但不相鄰
    expect(lineOf(letters('AAB'))).toBe(-1);
  });

  it('節目的十盤：算出來的答案跟節目一樣', () => {
    for (const [nums, target, answers] of SHOW_BOARDS) {
      const board = nums.split(' ').map(Number);
      expect(solutions(board, target).map((l) => sorted(lineName(l))).sort()).toEqual(answers.map(sorted).sort());
    }
  });
});

describe('hexagon 出題', () => {
  it('每一題都有 2～5 組答案，數字在難度的範圍內（各難度各 300 題）', () => {
    for (const level of Object.keys(LEVELS) as Level[]) {
      const { min, max } = LEVELS[level];
      for (let i = 0; i < 300; i++) {
        const r = makeRound(`t${i}`, level);
        expect(r.board).toHaveLength(19);
        expect(r.board.every((n) => n >= min && n <= max)).toBe(true);
        expect(r.answers.length).toBeGreaterThanOrEqual(MIN_ANSWERS);
        expect(r.answers.length).toBeLessThanOrEqual(MAX_ANSWERS);
        expect(r.answers).toEqual(solutions(r.board, r.target));
      }
    }
  });

  it('同一個種子出同一題；每日一題看日期', () => {
    expect(makeRound('x', 'normal')).toEqual(makeRound('x', 'normal'));
    const a = dailyConfig('2026-11-03');
    expect(roundOf(a, 2)).toEqual(roundOf(dailyConfig('2026-11-03'), 2));
    expect(roundOf(a, 0)).not.toEqual(roundOf(dailyConfig('2026-11-04'), 0));
    expect(localDate(new Date(2026, 10, 3, 23, 59))).toBe('2026-11-03');
  });
});

describe('hexagon 一局', () => {
  it('答對 +1、答錯 −1；答過的再答一次算錯；找完就結束這回合', () => {
    let s = flip(startGame(showConfig('t')));
    const [first, ...rest] = s.round.answers;
    const cells = [...LINES[first]];
    s = submit(s, cells);
    expect(s.score).toBe(1);
    s = submit(s, [...cells].reverse());
    expect(s.score).toBe(0);
    expect(s.last).toMatchObject({ ok: false, miss: 'repeat' });
    s = submit(s, letters('ABD'));
    expect(s.last).toMatchObject({ ok: false, miss: 'notLine' });
    const wrongLine = LINES.findIndex((_, i) => !s.round.answers.includes(i));
    s = submit(s, [...LINES[wrongLine]]);
    expect(s.last).toMatchObject({ ok: false, miss: 'wrongSum' });
    expect(s.score).toBe(-2);
    for (const l of rest) s = submit(s, [...LINES[l]]);
    expect(s.phase).toBe('reveal');
    expect(s.history[0]).toEqual({ target: s.round.target, answers: rest.length + 1, found: rest.length + 1, wrong: 3 });
  });

  it('還沒翻面不能作答；每日一題 5 回合後結束，練習不會結束', () => {
    let s = startGame(dailyConfig('2026-11-03'));
    expect(submit(s, [...LINES[0]])).toBe(s);
    for (let i = 0; i < DAILY_ROUNDS; i++) s = nextRound(endRound(flip(s)));
    expect(s.phase).toBe('over');
    expect(totals(s.history)).toMatchObject({ found: 0, wrong: 0 });

    let p = startGame(practiceConfig('easy', 'p'));
    for (let i = 0; i < 20; i++) p = nextRound(endRound(flip(p)));
    expect(p.phase).toBe('memorize');
    expect(p.index).toBe(20);
  });
});
