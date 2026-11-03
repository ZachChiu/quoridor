import { describe, expect, it } from 'vitest';
import {
  BIG_SPEC, CPU, DAILY_SPEC, ROUND_SECONDS, SHOW_ROUNDS, SHOW_SPEC, bigConfig, cellsOf, cpuAct, cpuPlan, dailyConfig, endRound,
  evaluate, expression, makeRound, needsPrecedence, nextRound, parseBoard, roundOf, showConfig, solutions, startGame, submit, totals,
  type CpuLevel, type GameState,
} from '@/games/equation-pyramid/engine';

/** 節目《魔鬼的計謀》第 2 季第 6 天監獄賽的十回合（namu 6일차；同 docs/research/pyramid_solver.py） */
const SHOW_ROUNDS_DATA: [string, number, string][] = [
  ['×7 ÷5 +9 −5 ×2 +2 ÷8 ÷3 −8 ×3', 10, 'ACH BJD CEI DBC IGC JHC'],
  ['÷4 +8 ×2 −3 +9 +1 ×7 ÷11 −6 ×8', 1, 'FGI GDC'],
  ['+7 ÷9 ×2 −13 +15 ÷5 ×1 ÷3 −11 ×3', 8, 'AJD JEH JHA'],
  ['×3 ×13 −8 −14 ÷2 ÷7 ×9 ÷5 −1 ÷4', 11, 'BCJ BDF DIA JAI'],
  ['÷14 ÷2 −10 ÷7 ×8 ÷5 ÷12 −5 −6 ÷4', 6, 'BEC DHF ECF'],
  ['÷9 −2 −10 ×6 ×3 −8 ×2 ×5 ÷7 ×4', 3, 'ABE IBG'],
  ['−1 +2 +3 −4 ×5 ×6 ×7 −8 ×9 −10', 19, 'ABI ACF CIH DCE DEA EBG GBF IBE'],
  ['−16 −14 ÷2 ÷8 ×12 ×4 ÷7 +10 +3 ÷5', 9, 'ABC ECI FHC GHJ'],
  ['−2 +12 ÷6 ×4 ÷2 +8 ×6 ÷10 −4 ×2', 7, 'FAE'],
  ['−10 ×4 ×9 ×5 ×2 +3 +1 ÷6 ÷8 ÷7', 17, 'DFB EFD FCA IEG IGC JEF'],
];

const value = (board: string, key: string) => {
  const v = evaluate(parseBoard(board), cellsOf(key));
  return v && v.p / v.q;
};

describe('equation-pyramid 計算', () => {
  it('第一格的符號不算、先乘除後加減', () => {
    const b = '×7 ÷5 +9 −5 ×2 +2 ÷8 ÷3 −8 ×3';
    expect(value(b, 'ACH')).toBe(10); // 7 + 9 ÷ 3
    expect(value(b, 'BJD')).toBe(10); // 5 × 3 − 5
    expect(value(b, 'GBC')).toBe(10.6); // ÷8 放第一位就是 8：8 ÷ 5 + 9（用分數算，不會有浮點誤差）
    expect(value(b, 'DEA')).toBe(70); // 5 × 2 × 7
    expect(value(b, 'IGC')).toBe(10); // 8 ÷ 8 + 9
  });

  it('順序不同是不同的組合', () => {
    const b = parseBoard('×7 ÷5 +9 −5 ×2 +2 ÷8 ÷3 −8 ×3');
    expect(evaluate(b, cellsOf('ACH'))).toEqual({ p: 10, q: 1 });
    expect(evaluate(b, cellsOf('AHC'))).toEqual({ p: 34, q: 3 }); // 7 ÷ 3 + 9
  });

  it('算式的樣子：第一格只寫數字', () => {
    expect(expression(parseBoard('×7 ÷5 +9 −5 ×2 +2 ÷8 ÷3 −8 ×3'), cellsOf('ACH'))).toBe('7 + 9 ÷ 3');
  });

  it('節目的十回合：算出來的答案跟節目公布的一模一樣（分數算、整數算都一樣）', () => {
    for (const [board, target, official] of SHOW_ROUNDS_DATA) {
      const want = official.split(' ').sort();
      expect(solutions(parseBoard(board), target)).toEqual(want);
      expect(solutions(parseBoard(board), target, true)).toEqual(want);
    }
  });

  it('節目 39 組裡有 23 組要靠先乘除、10 組把 ÷ 格放第一位', () => {
    let prec = 0, divFirst = 0, all = 0;
    for (const [board, target, official] of SHOW_ROUNDS_DATA) {
      const b = parseBoard(board);
      for (const key of official.split(' ')) {
        all++;
        if (needsPrecedence(b, cellsOf(key), target)) prec++;
        if (b[cellsOf(key)[0]].op === '÷') divFirst++;
      }
    }
    expect([all, prec, divFirst]).toEqual([39, 23, 10]);
  });

  it('節目的題目沒有「第 2、3 格交換也成立」的兩組（出題器照這個排除）', () => {
    for (const [, , official] of SHOW_ROUNDS_DATA) {
      const keys = new Set(official.split(' '));
      for (const k of keys) expect(keys.has(k[0] + k[2] + k[1])).toBe(false);
    }
  });
});

describe('equation-pyramid 出題', () => {
  const check = (spec: typeof SHOW_SPEC, prefix: string, n: number) => {
    for (let i = 0; i < n; i++) {
      const r = makeRound(`${prefix}:${i}`, spec);
      expect(r.blocks).toHaveLength(spec.size);
      expect(r.answers.length).toBeGreaterThanOrEqual(spec.min);
      expect(r.answers.length).toBeLessThanOrEqual(spec.max);
      expect(r.target).toBeGreaterThanOrEqual(1);
      expect(r.target).toBeLessThanOrEqual(20);
      // 答案就是全部的解、整數算也一樣（沒有小數爭議）
      expect(solutions(r.blocks, r.target)).toEqual(r.answers);
      expect(solutions(r.blocks, r.target, true)).toEqual(r.answers);
      // 至少一組要靠先乘除；沒有第 2、3 格交換也成立的
      expect(r.answers.some((k) => needsPrecedence(r.blocks, cellsOf(k), r.target))).toBe(true);
      const keys = new Set(r.answers);
      expect(r.answers.some((k) => keys.has(k[0] + k[2] + k[1]))).toBe(false);
      for (const b of r.blocks) expect(b.n).toBeGreaterThanOrEqual(1);
      for (const b of r.blocks) expect(b.n).toBeLessThanOrEqual(16);
    }
  };
  it('節目規則：每回合 1～8 組', () => check(SHOW_SPEC, 'show', 200));
  it('每日一題：5～8 組', () => check(DAILY_SPEC, 'daily', 100));
  it('大金字塔：15 格、8～14 組', () => check(BIG_SPEC, 'big', 40));

  it('同一個種子、同一個題號就是同一盤（每日一題全世界同一題）', () => {
    expect(roundOf(dailyConfig('2026-11-03'), 0)).toEqual(roundOf(dailyConfig('2026-11-03'), 0));
    expect(roundOf(dailyConfig('2026-11-03'), 0)).not.toEqual(roundOf(dailyConfig('2026-11-04'), 0));
  });
});

describe('equation-pyramid 一局', () => {
  const round1: GameState = (() => {
    const s = startGame(showConfig(null, 'x'));
    return { ...s, round: { blocks: parseBoard('×7 ÷5 +9 −5 ×2 +2 ÷8 ÷3 −8 ×3'), target: 10, answers: 'ACH BJD CEI DBC IGC JHC'.split(' ').sort() } };
  })();

  it('答對 +1、答錯 −1、答過的再答 −1', () => {
    let s = submit(round1, 'me', cellsOf('ACH'));
    expect(s.score.me).toBe(1);
    s = submit(s, 'me', cellsOf('AHC'));
    expect(s.score.me).toBe(0);
    expect(s.last).toMatchObject({ ok: false, miss: 'wrongValue' });
    s = submit(s, 'cpu', cellsOf('ACH'));
    expect(s.score.cpu).toBe(-1);
    expect(s.last).toMatchObject({ ok: false, miss: 'repeat' });
    expect(s.wrong).toEqual({ me: 1, cpu: 1 });
  });

  it('全部被找到就結束這回合；10 回合後是 over', () => {
    let s = round1;
    for (const k of s.round.answers) s = submit(s, 'me', cellsOf(k), 5000);
    expect(s.phase).toBe('reveal');
    expect(s.history[0]).toMatchObject({ answers: 6, me: 6, cpu: 0, ms: 5000 });
    for (let i = 1; i < SHOW_ROUNDS; i++) s = endRound(nextRound(s));
    expect(s.history).toHaveLength(SHOW_ROUNDS);
    expect(nextRound(s).phase).toBe('over');
    expect(totals(s.history).me).toBe(6);
  });

  it('找齊模式：一盤、不限時', () => {
    expect(dailyConfig('2026-11-03')).toMatchObject({ rounds: 1, seconds: 0, cpu: null });
    expect(bigConfig('a').spec.size).toBe(15);
    expect(startGame(bigConfig('a')).round.blocks).toHaveLength(15);
  });
});

describe('equation-pyramid 電腦', () => {
  const levels: CpuLevel[] = ['easy', 'normal', 'hard'];

  it('打算都在 3 分鐘內、照時間排、兩次按鈴隔得夠開', () => {
    for (const level of levels) {
      for (let i = 0; i < 30; i++) {
        const s = startGame(showConfig(level, `p${i}`));
        const plan = cpuPlan(s, level);
        for (let k = 0; k < plan.length; k++) {
          expect(plan[k].at).toBeLessThan(ROUND_SECONDS * 1000);
          if (k) expect(plan[k].at - plan[k - 1].at).toBeGreaterThanOrEqual(CPU[level].gap * 1000 - 1e-6);
          if (plan[k].ok) expect(s.round.answers).toContain(plan[k].key);
          else expect(s.round.answers).not.toContain(plan[k].key);
        }
      }
    }
  });

  it('越難找得越多、越快', () => {
    const stat = (level: CpuLevel) => {
      let found = 0, time = 0;
      for (let i = 0; i < 300; i++) {
        const plan = cpuPlan(startGame(showConfig(level, `q${i}`)), level).filter((m) => m.ok);
        found += plan.length;
        time += plan.reduce((t, m) => t + m.at, 0);
      }
      return { found, avg: time / found };
    };
    const [e, n, h] = levels.map(stat);
    expect(e.found).toBeLessThan(n.found);
    expect(n.found).toBeLessThan(h.found);
    expect(e.avg).toBeGreaterThan(n.avg);
    expect(n.avg).toBeGreaterThan(h.avg);
  });

  it('被答走的那組電腦不會再說', () => {
    const s0 = startGame(showConfig('hard', 'z'));
    const key = s0.round.answers[0];
    const s1 = submit(s0, 'me', cellsOf(key));
    expect(cpuAct(s1, { at: 1, key, ok: true })).toBe(s1);
  });
});
