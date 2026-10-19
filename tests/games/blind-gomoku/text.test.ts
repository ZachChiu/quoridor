import { describe, it, expect } from 'vitest';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';
import { LOCALES } from '@/i18n/locales';
import { TEXT } from '@/games/blind-gomoku/text';
import { COLORS } from '@/games/blind-gomoku/engine';
import { LEVELS } from '@/games/blind-gomoku/ai';

/** 把整份文案攤平成字串（含巢狀的 levels、colors、steps） */
function strings(v: unknown): string[] {
  if (typeof v === 'string') return [v];
  if (Array.isArray(v)) return v.flatMap(strings);
  if (v && typeof v === 'object') return Object.values(v).flatMap(strings);
  return [];
}
/** 結構（key 的路徑），六個語系要一模一樣 */
function shape(v: unknown, path = ''): string[] {
  if (Array.isArray(v)) return [`${path}[${v.length}]`];
  if (v && typeof v === 'object') return Object.entries(v).flatMap(([k, x]) => shape(x, `${path}.${k}`));
  return [path];
}

describe('盲眼五子棋的文案', () => {
  it('六個語系的 key 與陣列長度都一樣', () => {
    const base = shape(TEXT['zh-TW']).sort();
    for (const l of LOCALES) expect(shape(TEXT[l]).sort(), l).toEqual(base);
    expect(Object.keys(TEXT['zh-TW'].colors).sort()).toEqual([...COLORS].sort());
    expect(Object.keys(TEXT['zh-TW'].levels).sort()).toEqual([...LEVELS].sort());
  });

  it('模板的 {n}、{side} 每個語系都有', () => {
    for (const l of LOCALES) {
      const t = TEXT[l];
      expect(t.moveN, l).toContain('{n}');
      expect(t.winBodyYou, l).toContain('{n}');
      expect(t.winBodyAi, l).toContain('{n}');
      expect(t.winBodySide, l).toContain('{side}');
    }
  });

  it('簡中不殘留繁體字、英文與泰文不混中文', () => {
    // 這款遊戲文案實際會用到、而且繁簡字形不同的字
    const trad = /[牆圍計謀個這們對戰連線開關發說話設裝錄較點與從為會時選擇區擋離網頁載註冊鍵結復號碼顏電腦難讓衝殺節樣輪機兩後盤換顯適讀曉獲勝動種狀認級紅綠藍黃圓贏輸滿約鐘監獄隱顆應費記準執來裡顧進幾續剛橫豎沒誰]/;
    for (const s of strings(TEXT['zh-Hans'])) expect(trad.test(s), `zh-Hans: ${s.slice(0, 30)} → ${s.match(trad)?.[0]}`).toBe(false);
    const cjk = /[一-鿿]/;
    for (const l of ['en', 'th'] as const) for (const s of strings(TEXT[l])) expect(cjk.test(s), `${l}: ${s.slice(0, 30)}`).toBe(false);
  });

  it('語系 key 在兩格縮排、依規定的順序（字型子集靠這個切字）', () => {
    const src = readFileSync(join(process.cwd(), 'app/games/blind-gomoku/text.ts'), 'utf8');
    const order = ["'zh-TW'", 'en', 'ja', 'ko', "'zh-Hans'", 'th'].map((k) => src.indexOf(`\n  ${k}: `));
    expect(order.every((i) => i > 0)).toBe(true);
    expect([...order].sort((a, b) => a - b)).toEqual(order);
  });
});
