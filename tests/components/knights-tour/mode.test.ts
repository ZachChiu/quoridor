import { describe, it, expect } from 'vitest';
import { modeHash, parseMode } from '@/components/knights-tour/mode';
import { formatTime, sizeLabel, squareName } from '@/components/knights-tour/ui';

describe('網址 hash ↔ 模式', () => {
  it('節目挑戰與練習的大小', () => {
    expect(parseMode('#show')).toEqual({ kind: 'show' });
    expect(parseMode('#practice-8')).toEqual({ kind: 'practice', n: 8 });
    expect(parseMode('practice-5')).toEqual({ kind: 'practice', n: 5 });
    expect(parseMode('#practice-10')).toEqual({ kind: 'practice', n: 10 });
  });

  it('認不得的一律回選單', () => {
    for (const h of ['', '#', '#practice-4', '#practice-11', '#practice-', '#practice-8x', '#solo', '#SHOW']) {
      expect(parseMode(h), h).toEqual({ kind: 'menu' });
    }
  });

  it('來回一致', () => {
    for (const m of [{ kind: 'show' }, { kind: 'practice', n: 7 }, { kind: 'menu' }] as const) {
      expect(parseMode(modeHash(m))).toEqual(m);
    }
  });
});

describe('時間與格子的顯示', () => {
  it('節目的倒數從 60:00 開始，不會變成 1:00:00；時間到剛好 00:00', () => {
    expect(formatTime(60 * 60_000, true)).toBe('60:00');
    expect(formatTime(60 * 60_000 - 1, true)).toBe('60:00');
    expect(formatTime(57 * 60_000 + 57_000, true)).toBe('57:57');
    expect(formatTime(1, true)).toBe('00:01');
    expect(formatTime(0, true)).toBe('00:00');
  });

  it('經過時間無條件捨去，練習超過一小時才顯示小時', () => {
    expect(formatTime(35_999)).toBe('00:35');
    expect(formatTime(61 * 60_000 + 2_000)).toBe('1:01:02');
    expect(formatTime(-5)).toBe('00:00');
  });

  it('格子名稱照西洋棋：左下 a1、右上 h8', () => {
    expect(squareName(8, 56)).toBe('a1');
    expect(squareName(8, 7)).toBe('h8');
    expect(squareName(8, 27)).toBe('d5');
    expect(squareName(10, 99)).toBe('j1');
    expect(sizeLabel(7)).toBe('7×7');
  });
});
