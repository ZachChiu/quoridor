import { describe, expect, it } from 'vitest';
import { existsSync } from 'node:fs';
import { join } from 'node:path';
import { LOCALES, localePath } from '@/i18n/locales';
import { MANIFEST_FILES, PWA_UTM, manifestPath, pwaMetadata, webManifest } from '@/i18n/pwa';
import { brandName } from '@/brand';

describe('加到主畫面（PWA）', () => {
  it('每個語系都有一份設定檔，網址跟 layout 掛的一致', () => {
    expect(MANIFEST_FILES.map((m) => m.locale)).toEqual([...LOCALES]);
    for (const { locale, file } of MANIFEST_FILES) {
      expect(manifestPath(locale)).toBe(`/pwa/${file}`);
      expect(pwaMetadata(locale).manifest).toBe(manifestPath(locale));
    }
  });

  it('不管在哪一款加，打開都是那個語系的平台首頁，而且是同一個 App', () => {
    for (const locale of LOCALES) {
      const m = webManifest(locale);
      expect(m.start_url).toBe(`${locale === 'zh-TW' ? '/' : `${localePath(locale, '/')}/`}?${PWA_UTM}`);
      expect(m.scope).toBe('/');
      expect(m.id).toBe('/');
      expect(m.name).toBe(brandName(locale));
      expect(m.display).toBe('standalone');
    }
  });

  it('從主畫面打開的造訪在 GA 記成 pwa（大腦 10/25）', () => {
    expect(new URLSearchParams(PWA_UTM).get('utm_source')).toBe('pwa');
    expect(new URLSearchParams(PWA_UTM).get('utm_medium')).toBe('homescreen');
  });

  it('圖示檔都在', () => {
    for (const icon of webManifest('zh-TW').icons ?? []) {
      expect(existsSync(join(process.cwd(), 'public', icon.src))).toBe(true);
    }
  });
});
