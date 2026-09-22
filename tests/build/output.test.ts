import { describe, expect, it } from 'vitest';
import { existsSync, readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { roomShareUrl } from '@/utils/gameMode';
import { LOCALES as ALL_LOCALES } from '@/i18n/locales';

/*
  對**建置產物**（out/）的檢查。

  這一組跟其他測試不一樣：它驗的不是函式，是「跑完 next build 之後
  磁碟上長什麼樣」。會需要它，是因為今天踩到的幾個問題全都只在產物上
  看得見 —— 路由沒產生、sitemap 收了不該收的網址、hash 不會送到伺服器
  所以靜態 HTML 是錯的人數。這些東西在單元測試層級完全看不到。

  out/ 不存在就整組跳過（本機沒建置過很正常）。CI 在 build 之後會再跑
  一次這個檔案，那時它一定存在 —— 見 .github/workflows/deploy.yml。
*/
const OUT = 'out';
const built = existsSync(OUT);
const html = (p: string) => readFileSync(join(OUT, p), 'utf8');
const LOCALES = ['en', 'ja', 'ko'];

describe.skipIf(!built)('建置產物', () => {
  describe('路由都有產生', () => {
    it('zh-TW 走無前綴，而且不存在 /zh-TW/（那會是重複內容）', () => {
      expect(existsSync(join(OUT, 'index.html'))).toBe(true);
      expect(existsSync(join(OUT, 'zh-TW'))).toBe(false);
    });

    it('四語系的每一頁都在', () => {
      const pages = ['', 'rules', 'local', 'solo', 'online', 'replay'];
      for (const p of pages) {
        expect(existsSync(join(OUT, p, 'index.html')), `/${p}`).toBe(true);
        for (const l of LOCALES) {
          expect(existsSync(join(OUT, l, p, 'index.html')), `/${l}/${p}`).toBe(true);
        }
      }
    });

    /*
      邀請連結指的那一頁，在每個語系都必須真的存在。

      這條是用建置產物驗 roomShareUrl，而不是再比對一次字串 ——
      先前它指著 `/match`，那是舊路由的相容層、而且只有 zh-TW 有，
      所以 /ja 的人分享出去就是 404。單純比對字串不會發現這件事，
      因為字串本身「看起來」完全合理。
    */
    it('邀請連結的目的地，四語系都有這一頁', () => {
      for (const l of ALL_LOCALES) {
        const url = new URL(roomShareUrl('https://example.com', l, 'r'));
        expect(existsSync(join(OUT, url.pathname, 'index.html')), url.pathname).toBe(true);
      }
    });

    it('本機人數的路由：/local/2 與 /local/3，四語系都有', () => {
      for (const n of ['2', '3']) {
        expect(existsSync(join(OUT, 'local', n, 'index.html')), `/local/${n}`).toBe(true);
        for (const l of LOCALES) {
          expect(existsSync(join(OUT, l, 'local', n, 'index.html')), `/${l}/local/${n}`).toBe(true);
        }
      }
    });

    /*
      分享圖：每一頁每一語系都要有自己的一張，而且那張檔案真的在 out/ 裡。

      這條擋的是兩種安靜的壞掉：
      1. 六頁共用一張圖（先前如此），而且那張是中文的 —— 英日韓的人
         分享出去預覽圖上是一排中文字，沒人會回報。
      2. og:image 指向一個不存在的檔案 —— 抓取器拿不到圖就只顯示一行字，
         頁面本身完全正常，所以在瀏覽器裡怎麼看都看不出來。
    */
    it('六頁 × 四語系各有自己的分享圖，檔案都在，而且沒有兩頁共用', () => {
      const PAGES = ['', 'rules', 'solo', 'local', 'online', 'replay'];
      const seen = new Map<string, string>();
      for (const l of ALL_LOCALES) {
        for (const page of PAGES) {
          const dir = l === 'zh-TW' ? page : join(l, page);
          const src = html(join(dir, 'index.html'));
          const m = src.match(/property="og:image"\s+content="([^"]+)"/);
          expect(m, `/${dir} 沒有 og:image`).not.toBeNull();

          const rel = new URL(m![1]).pathname;
          expect(existsSync(join(OUT, rel)), `${rel} 不存在`).toBe(true);

          const key = `${l}|${page}`;
          const clash = [...seen.entries()].find(([, v]) => v === rel);
          expect(clash?.[0], `${key} 與 ${clash?.[0]} 共用 ${rel}`).toBeUndefined();
          seen.set(key, rel);
        }
      }
      expect(seen.size).toBe(PAGES.length * ALL_LOCALES.length);
    });

    it('404 是真的一頁，不是空殼', () => {
      expect(existsSync(join(OUT, '404.html'))).toBe(true);
      expect(html('404.html').length).toBeGreaterThan(1000);
    });
  });

  describe('人數寫在路由裡，所以靜態 HTML 就已經是對的盤面', () => {
    /*
      這一條擋的是「改回用 hash 或 context 傳人數」。
      那樣做的話 /local/3 的靜態 HTML 會是兩人盤，要等 hydration
      之後才跳成三人 —— 使用者看得到那一下。
    */
    it('/local/3 的 HTML 帶第三位玩家，/local 沒有', () => {
      const three = (html('local/3/index.html').match(/player-C/g) || []).length;
      const two = (html('local/index.html').match(/player-C/g) || []).length;
      expect(three).toBeGreaterThan(two);
    });
  });

  describe('sitemap 與 robots 說同一件事', () => {
    const locs = () => [...html('sitemap-0.xml').matchAll(/<loc>([^<]+)<\/loc>/g)].map(m => m[1]);

    it('只收得了值的頁面：首頁、規則、單人', () => {
      const paths = locs().map(u => new URL(u).pathname);
      expect(paths).toContain('/');
      for (const l of ['', ...LOCALES.map(l => `/${l}`)]) {
        expect(paths, `${l}/rules/`).toContain(`${l}/rules/`);
        expect(paths, `${l}/solo/`).toContain(`${l}/solo/`);
      }
    });

    it('對局類的頁面一個都不能在裡面 —— 它們都是 noindex，收了會被 Search Console 報錯', () => {
      const paths = locs().map(u => new URL(u).pathname);
      for (const p of paths) {
        expect(p, `sitemap 收了 ${p}`).not.toMatch(/\/(local|online|replay|match)(\/|$)/);
      }
    });

    it('sitemap 裡沒有 /robots.txt/ 這種垃圾網址', () => {
      expect(locs().some(u => u.includes('robots.txt'))).toBe(false);
    });

    it('每一個 sitemap 收錄的頁面，自己也沒有寫 noindex', () => {
      for (const u of locs()) {
        const p = new URL(u).pathname.replace(/^\//, '');
        const file = join(p, 'index.html').replace(/^index\.html$/, 'index.html');
        const doc = html(p === '' ? 'index.html' : file);
        const robots = doc.match(/name="robots" content="([^"]*)"/)?.[1] ?? '';
        expect(robots, `${u} 的 robots`).not.toContain('noindex');
      }
    });

    /*
      四語系一起檢查，而且連 follow 都要一樣。

      實測掃出來過：(default) 寫 follow、(intl) 寫 nofollow，同一頁在不同
      語系下行為不同。這些頁面有回首頁與規則的連結，nofollow 等於把站內
      連結切斷 —— 不索引本來就不需要連帶封鎖連結。
    */
    it('對局頁面四語系都是 noindex, follow', () => {
      const pages = ['local', 'local/2', 'local/3', 'online', 'replay'];
      for (const prefix of ['', ...LOCALES]) {
        for (const p of pages) {
          const file = join(prefix, p, 'index.html');
          if (!existsSync(join(OUT, file))) continue;   // /local/2 只有本機與四語系都有
          const robots = html(file).match(/name="robots" content="([^"]*)"/)?.[1] ?? '';
          expect(robots, `/${prefix}/${p}`).toBe('noindex, follow');
        }
      }
    });
  });

  describe('hreflang', () => {
    /*
      屬性名在產物裡是 React 的 `hrefLang` 而不是 `hreflang` —— HTML 屬性名
      不分大小寫，瀏覽器與爬蟲都讀得到，所以這裡比對也要不分大小寫。
    */
    const alternates = (file: string) =>
      [...html(file).matchAll(/hreflang="([^"]+)"/gi)].map(m => m[1]);

    it('首頁四語互指，而且有 x-default', () => {
      const alts = alternates('index.html');
      for (const l of ['zh-TW', 'en', 'ja', 'ko', 'x-default']) {
        expect(alts, l).toContain(l);
      }
    });

    it('每個語系的首頁都指回同一組 alternate', () => {
      for (const l of LOCALES) {
        const alts = alternates(join(l, 'index.html'));
        for (const x of ['zh-TW', 'en', 'ja', 'ko', 'x-default']) {
          expect(alts, `${l} 少了 ${x}`).toContain(x);
        }
      }
    });

    it('<html lang> 用 HTML_LANG 的值（zh-TW 寫成更精確的 zh-Hant-TW）', () => {
      const want: Record<string, string> = { '': 'zh-Hant-TW', en: 'en', ja: 'ja', ko: 'ko' };
      for (const [dir, lang] of Object.entries(want)) {
        expect(html(join(dir, 'index.html')), dir || '/').toMatch(new RegExp(`<html[^>]+lang="${lang}"`));
      }
    });
  });

  describe('不能把原始碼公開出去', () => {
    /*
      out/ 會整包 aws s3 sync 上去。source map 留著就是把 app/ 底下
      每一行都公開 —— Sentry 設定裡 deleteSourcemapsAfterUpload 就是在擋這個，
      但那是「設定有開才會擋」，所以這裡再驗一次產物。
    */
    const walk = (dir: string): string[] => readdirSync(dir).flatMap(n => {
      const p = join(dir, n);
      return statSync(p).isDirectory() ? walk(p) : [p];
    });

    it('沒有 .map 檔', () => {
      expect(walk(OUT).filter(f => f.endsWith('.map'))).toEqual([]);
    });

    it('JS 裡沒有 sourceMappingURL', () => {
      const bad = walk(join(OUT, '_next')).filter(f => f.endsWith('.js'))
        .filter(f => readFileSync(f, 'utf8').includes('sourceMappingURL'));
      expect(bad).toEqual([]);
    });
  });
});

describe.skipIf(built)('建置產物（跳過）', () => {
  it('out/ 不存在，先跑 npm run build 才驗得到', () => {
    expect(built).toBe(false);
  });
});
