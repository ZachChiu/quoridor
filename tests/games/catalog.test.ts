import { describe, expect, it } from 'vitest';
import { HERO_DEFAULT } from '@/games/catalog';
import { WALL_GO } from '@/i18n/routes';

describe('平台首頁的大卡片', () => {
  it('Google 認得 /wall-go/ 之前預設放 Wall Go（10/25 Zach 照大腦的建議）', () => {
    expect(HERO_DEFAULT?.playable).toBe(WALL_GO);
  });
});
