import { describe, it, expect } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import OrderEditor from '@/components/balance-mancala/OrderEditor';
import { humanSeatsOf, localSeats } from '@/components/balance-mancala/match';
import { STEP_COUNT } from '@/components/balance-mancala/MancalaRulesSteps';
import { TEXT } from '@/games/balance-mancala/text';
import { createGame, sow, seatOfLetter, CELLS, type MancalaState, type Scores } from '@/games/balance-mancala/engine';

const noop = () => {};

function stateOf(cells: Record<number, string>, scores: Scores[]): MancalaState {
  const board = Array.from({ length: CELLS }, (_, i) => [...(cells[i] ?? '')].map(seatOfLetter));
  return { ...createGame(), board, scores, phase: 'play', turn: 0 };
}

function editorHtml(s: MancalaState, from: number, order: number[], colour?: 0 | 1 | 2) {
  return renderToStaticMarkup(createElement(OrderEditor, {
    t: TEXT['zh-TW'], from, pieces: s.board[from], order, sel: null, preview: sow(s, from, order, colour),
    names: ['你', '電腦 B', '電腦 C', '電腦 D'], endsText: null,
    onLast: noop, onSlot: noop, onColour: noop, onSuggest: noop, onCancel: noop, onSow: noop,
  }));
}

describe('排序編輯器', () => {
  it('落在天使格又同分：出現選色，只列出同分的顏色', () => {
    // 從 5 播 2 顆：6（綠）、7（天使，原本是空的 → 1 分）。A 紅藍同為 3 → 紅、藍可選
    const s = stateOf({ 5: 'AA' }, [[3, 3, 5], [0, 0, 0], [0, 0, 0], [0, 0, 0]]);
    const html = editorHtml(s, 5, [0, 0], 1);
    expect(html).toContain(TEXT['zh-TW'].pickColour);
    expect(html).toContain('>紅色</button>');
    expect(html).toContain('>藍色</button>');
    expect(html).not.toContain('>綠色</button>');
    expect(html).toContain('你 +1 藍色');
    expect(html).toContain('藍 3 → 4');
  });

  it('還沒選色時「播下去」不能按', () => {
    const s = stateOf({ 5: 'AA' }, [[3, 3, 5], [0, 0, 0], [0, 0, 0], [0, 0, 0]]);
    const html = editorHtml(s, 5, [0, 0]);
    expect(html).toMatch(/<button type="button" disabled=""[^>]*>播下去<\/button>/);
  });

  it('一般的盤子不問顏色；最後一顆可以給別人', () => {
    const s = stateOf({ 3: 'AC', 5: 'BB' }, [[0, 0, 0], [0, 0, 0], [0, 0, 0], [0, 0, 0]]);
    const html = editorHtml(s, 3, [0, 2]); // A 落在 4、C 落在 5（藍盤，3 顆）
    expect(html).not.toContain(TEXT['zh-TW'].pickColour);
    expect(html).toContain('電腦 C +3 藍色');
  });
});

describe('座位分配', () => {
  it('跟電腦玩：你坐 A', () => {
    expect(humanSeatsOf({ mode: 'solo', seats: 6, humans: 1, difficulty: 'normal' })).toEqual([0]);
  });

  it('多人同一台：真人平均分散、少於 4 人電腦補到 4 席', () => {
    expect(localSeats(2)).toBe(4);
    expect(localSeats(6)).toBe(6);
    expect(humanSeatsOf({ mode: 'local', seats: 4, humans: 2, difficulty: 'normal' })).toEqual([0, 2]);
    expect(humanSeatsOf({ mode: 'local', seats: 4, humans: 3, difficulty: 'normal' })).toEqual([0, 1, 3]);
    expect(humanSeatsOf({ mode: 'local', seats: 7, humans: 7, difficulty: 'normal' })).toEqual([0, 1, 2, 3, 4, 5, 6]);
  });
});

describe('規則的七步', () => {
  // 圖不分語言、文字分（規則頁與說明彈窗共用）：兩邊靠索引對齊，少一條就會有一張圖沒有字
  it('每個語系的規則與小標都剛好一步一條', () => {
    for (const [locale, t] of Object.entries(TEXT)) {
      expect(t.rules, locale).toHaveLength(STEP_COUNT);
      expect(t.ruleTitles, locale).toHaveLength(STEP_COUNT);
    }
  });
});
