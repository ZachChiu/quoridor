import { describe, expect, it } from 'vitest';
import { LOCALES } from '@/i18n/locales';
import { platformDescription } from '@/i18n/metadata';
import { PLAYABLE, gameName } from '@/games/catalog';

describe('平台首頁的描述', () => {
  it('列出每一款能玩的遊戲，Wall Go 排第一個（大腦 10/25）', () => {
    for (const locale of LOCALES) {
      const d = platformDescription(locale);
      expect(d).not.toContain('{games}');
      const at = PLAYABLE.map((g) => d.indexOf(gameName(g, locale)));
      expect(at.every((i) => i >= 0)).toBe(true);
      const wallGo = d.indexOf(gameName(PLAYABLE.find((g) => g.name === 'Wall Go')!, locale));
      expect(Math.min(...at)).toBe(wallGo);
    }
  });
});
