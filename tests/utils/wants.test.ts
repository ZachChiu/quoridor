import { describe, expect, it } from 'vitest';
import { SEASONS } from '@/games/catalog';
import { wantKey } from '@/utils/wants';

describe('wantKey', () => {
  it('英文名轉成小寫連字號', () => {
    expect(wantKey('Time Auction')).toBe('time-auction');
    expect(wantKey("Knight's Tour")).toBe('knight-s-tour');
  });

  it('每款的鑰匙都符合資料庫規則的格式，而且不重複', () => {
    const keys = SEASONS.flatMap((s) => s.games).map((g) => wantKey(g.name));
    for (const k of keys) expect(k).toMatch(/^[a-z0-9-]{1,40}$/);
    expect(new Set(keys).size).toBe(keys.length);
  });
});
