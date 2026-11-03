import { describe, expect, it } from 'vitest';
import { LOCALES } from '@/i18n/locales';
import { LEVELS } from '@/games/question-and-truth/ai';
import { QUESTION_IDS } from '@/games/question-and-truth/engine';
import { TEXT } from '@/games/question-and-truth/text';
import { BLURB } from '@/games/question-and-truth/blurb';
import { modeHash, readModeHash, type QtMode } from '@/components/question-and-truth/modeHash';

function shape(v: unknown, path = ''): string[] {
  if (Array.isArray(v)) return [`${path}[${v.length}]`];
  if (v && typeof v === 'object') return Object.entries(v).flatMap(([k, x]) => shape(x, `${path}.${k}`));
  return [path];
}
function strings(v: unknown): string[] {
  if (typeof v === 'string') return [v];
  if (Array.isArray(v)) return v.flatMap(strings);
  if (v && typeof v === 'object') return Object.values(v).flatMap(strings);
  return [];
}

describe('提問與真相的文案', () => {
  it('六個語系的 key 與陣列長度都一樣', () => {
    const base = shape(TEXT['zh-TW']).sort();
    for (const l of LOCALES) expect(shape(TEXT[l]).sort(), l).toEqual(base);
    expect(Object.keys(TEXT['zh-TW'].levels).sort()).toEqual([...LEVELS].sort());
    expect(Object.keys(TEXT['zh-TW'].q).map(Number).sort((a, b) => a - b)).toEqual([...QUESTION_IDS]);
    for (const l of LOCALES) expect(BLURB[l].body.length, l).toBeGreaterThan(10);
  });

  it('模板的參數每個語系都有', () => {
    for (const l of LOCALES) {
      const t = TEXT[l];
      for (const k of ['bidWon', 'bidTie', 'waitBid', 'actTitle', 'thinking', 'passTitle', 'peek', 'winTitle', 'handOf'] as const) {
        expect(t[k], `${l}.${k}`).toContain('{side}');
      }
      for (const k of ['round', 'tokens', 'submitBid', 'spent', 'price', 'penalty', 'sixLeft', 'sixScore', 'demo', 'dailyResult'] as const) {
        expect(t[k], `${l}.${k}`).toContain('{n}');
      }
      expect(t.q[1].ask, l).toMatch(/\{a\}.*\{b\}.*\{c\}|\{c\}/);
      for (const id of [2, 8] as const) expect(t.q[id].ask, `${l}.q${id}`).toContain('{suit}');
      expect(t.q[7].ask, l).toContain('{rank}');
      expect(t.q[11].ask, l).toContain('{which}');
      expect(t.dailyTitle, l).toContain('{date}');
      expect(t.dailyStats, l).toContain('{asks}');
      expect(t.dailyStats, l).toContain('{wrong}');
    }
  });

  it('不用市售推理遊戲的名字（Break the Code）', () => {
    const all = LOCALES.flatMap((l) => strings(TEXT[l]).concat(strings(BLURB[l]))).join('\n');
    expect(all).not.toMatch(/Break the Code|IELLO|解碼/i);
  });

  it('畫面上不寫「你」「對手」（mine 只給讀屏）', () => {
    const zh = (['zh-TW', 'zh-Hans'] as const).flatMap((l) => strings({ ...TEXT[l], mine: '' })).join('\n');
    expect(zh).not.toMatch(/你|對手|对手/);
  });
});

describe('提問與真相的模式網址', () => {
  it('寫出去讀得回來', () => {
    const modes: QtMode[] = [{ kind: 'ai', level: 'hard' }, { kind: 'local' }, { kind: 'daily' }, { kind: 'six' }];
    for (const m of modes) expect(readModeHash(modeHash(m))).toEqual(m);
    expect(modeHash(modes[0])).toBe('#ai-hard');
  });
  it('看不懂的 hash 回到選單', () => {
    for (const h of ['', '#ai-pro', '#ai-', '#daily-2026', '#tiger-normal']) expect(readModeHash(h), h).toBeNull();
  });
});
