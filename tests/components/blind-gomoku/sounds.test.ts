import { describe, it, expect } from 'vitest';
import { COLORS } from '@/games/blind-gomoku/engine';
import { colorString, stringOf } from '@/components/blind-gomoku/sounds';

describe('盲五子棋的音效', () => {
  it('盲棋的音高只看顏色：同一個顏色黑白兩方一樣，聲音不透露是誰的子', () => {
    for (const color of COLORS) {
      expect(stringOf({ color, side: 'black' }, true)).toBe(stringOf({ color, side: 'white' }, true));
      expect(stringOf({ color, side: 'black' }, true)).toBe(colorString(color));
    }
  });

  it('七個顏色是七根不同的弦，由低到高', () => {
    const notes = COLORS.map(colorString);
    expect(new Set(notes).size).toBe(COLORS.length);
    expect([...notes].sort((a, b) => a - b)).toEqual(notes);
  });

  it('一般模式（沒有顏色）黑白各一根弦', () => {
    expect(stringOf({ color: 'red', side: 'black' }, false)).not.toBe(stringOf({ color: 'red', side: 'white' }, false));
  });
});
