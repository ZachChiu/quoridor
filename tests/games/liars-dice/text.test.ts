import { describe, expect, it } from 'vitest';
import { LOCALES } from '@/i18n/locales';
import { LEVELS } from '@/games/liars-dice/ai';
import { MAX_PLAYERS } from '@/games/liars-dice/engine';
import { TEXT } from '@/games/liars-dice/text';
import { BLURB } from '@/games/liars-dice/blurb';
import { modeHash, readModeHash, type DiceMode } from '@/components/liars-dice/modeHash';

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

describe('大話骰的文案', () => {
  it('六個語系的 key 與陣列長度都一樣', () => {
    const base = shape(TEXT['zh-TW']).sort();
    for (const l of LOCALES) expect(shape(TEXT[l]).sort(), l).toEqual(base);
    expect(TEXT['zh-TW'].seats).toHaveLength(MAX_PLAYERS);
    expect(Object.keys(TEXT['zh-TW'].levels).sort()).toEqual([...LEVELS].sort());
    for (const l of LOCALES) expect(BLURB[l].body.length, l).toBeGreaterThan(10);
  });

  it('模板的 {n}、{f}、{side} 每個語系都有', () => {
    for (const l of LOCALES) {
      const t = TEXT[l];
      expect(t.bidText, l).toContain('{n}');
      expect(t.bidText, l).toContain('{f}');
      for (const k of ['bidBy', 'opens', 'thinking', 'turnOf', 'loses', 'gains', 'knockedOut', 'winTitle', 'passTitle', 'revealChallenge', 'revealExact'] as const) {
        expect(t[k], `${l}.${k}`).toContain('{side}');
      }
      expect(t.revealBody, l).toContain('{bid}');
    }
  });

  it('不用 Perudo／Bluff 的名字，也沒有喝酒的字眼', () => {
    const all = LOCALES.flatMap((l) => strings(TEXT[l]).concat(strings(BLURB[l]))).join('\n');
    // 名字是大寫的那個字（Perudo、Bluff 是商品名）；英文一般用語的 call the bluff 不算
    expect(all).not.toMatch(/Perudo|Bluff/);
    expect(all).not.toMatch(/酒|喝|drink|飲み|음주|술을|เหล้า|ดื่ม/i);
  });
});

describe('大話骰的模式網址', () => {
  it('寫出去讀得回來', () => {
    const modes: DiceMode[] = [
      { opponent: 'ai', players: 5, level: 'normal', wild: true, exact: false },
      { opponent: 'ai', players: 2, level: 'hard', wild: false, exact: true },
      { opponent: 'local', players: 6, wild: true, exact: true },
    ];
    for (const m of modes) expect(readModeHash(modeHash(m))).toEqual(m);
    expect(modeHash(modes[0])).toBe('#ai-5-normal');
  });
  it('看不懂的 hash 回到選單', () => {
    for (const h of ['', '#ai-7-normal', '#ai-1-easy', '#ai-3-pro', '#local-3-x', '#tiger-normal']) expect(readModeHash(h), h).toBeNull();
  });
});
