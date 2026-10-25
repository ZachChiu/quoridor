import { describe, it, expect } from 'vitest';
import { createElement } from 'react';
import { renderToStaticMarkup } from 'react-dom/server';
import { existsSync, readdirSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import GameName from '@/components/platform/GameName';
import { SEASONS, gameName, type CatalogGame } from '@/games/catalog';
import { LOCALES } from '@/i18n/locales';
import type { NameLettering } from '@/types/lettering';

// 各款的設定檔與產物（scripts/build-name-lettering.mjs）
const CONFIG_DIR = 'scripts/name-lettering';
const configs = readdirSync(CONFIG_DIR).filter((f) => f.endsWith('.mjs'));

describe('各語系的遊戲名字標', () => {
  for (const f of configs) {
    it(`${f}：產物跟設定檔寫的名字一致（名字改了要重跑 npm run name:build）`, async () => {
      const { default: cfg } = await import(pathToFileURL(resolve(CONFIG_DIR, f)).href);
      const { NAME_LETTERING } = (await import(pathToFileURL(resolve(`app/games/${cfg.id}/nameLettering.ts`)).href)) as { NAME_LETTERING: NameLettering };
      expect(Object.keys(NAME_LETTERING).sort()).toEqual(Object.keys(cfg.locales).sort());
      for (const [locale, entry] of Object.entries(cfg.locales as Record<string, { text: string }>)) {
        expect(NAME_LETTERING[locale as keyof NameLettering]?.text, `${cfg.id} ${locale}`).toBe(entry.text);
      }
    });
  }

  const lettered = SEASONS.flatMap((s) => s.games).filter((g) => g.look?.lettering?.local);
  it('平台上在地的名字都有字標，每一段的圖都在', () => {
    for (const game of lettered) {
      const local = game.look!.lettering!.local!;
      for (const locale of LOCALES) {
        const name = gameName(game, locale);
        // 英文（泰文照英文）是那款原本的字，不在這裡
        if (name !== game.name) expect(local[locale]?.text, `${game.name} ${locale}`).toBe(name);
      }
      for (const l of Object.values(local)) for (const p of l!.pieces) expect(existsSync(join('public', p.src)), p.src).toBe(true);
    }
  });

  it('字對得上才畫字標（螢幕報讀另外有名字），對不上退回一般文字', () => {
    const piece = { src: '/games/x/name/zh-TW-0.svg', w: 3.12 };
    const game = (text: string): CatalogGame => ({
      name: 'Nine Men\'s Morris', names: { 'zh-TW': '九子棋' }, playable: '/x',
      look: { card: '', wipe: '', art: '', lettering: { mark: '/games/x/wordmark.svg', ratio: 10, spellsName: true, local: { 'zh-TW': { text, h: 0.94, gap: 0.06, lead: 0.16, pieces: [piece] } } } },
    });
    const html = (g: CatalogGame) => renderToStaticMarkup(createElement(GameName, { game: g, locale: 'zh-TW', sub: { mark: 0.5, font: '' }, swap: 0.95 }));
    const ok = html(game('九子棋'));
    expect(ok).toContain('<span class="sr-only">九子棋</span>');
    expect(ok).toContain(`url(${piece.src})`);
    const stale = html(game('九子旗'));
    expect(stale).not.toContain(piece.src);
    expect(stale.startsWith('九子棋')).toBe(true);
  });
});
