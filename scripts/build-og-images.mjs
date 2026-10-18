#!/usr/bin/env node
/**
 * 產生每一頁每一語系的分享圖（og:image）到 public/og/。
 *
 * 為什麼是腳本產生、產物進版控，而不是 Next 的 opengraph-image.tsx：
 * 那個慣例產出的檔案**沒有副檔名**（out/rules/opengraph-image-1mfdno），
 * 而這站是 `aws s3 sync` 上 S3 —— 沒有副檔名就推不出 Content-Type，
 * 抓取器拿到 binary/octet-stream 就不會顯示那張圖。實測確認過。
 *
 * 跟 font:subset 同一種模式：要連網、手動跑、產物 commit，CI 只負責
 * 比對有沒有落後（npm run og:check）。
 *
 *   npm run og:build     重建 public/og/
 *   npm run og:check     只比對文案，不連網（CI 用，落後就 exit 1）
 *
 * 字型必須是 TTF/OTF/WOFF —— satori 不吃 woff2，而 Google Fonts 只有在
 * **不送 User-Agent** 時才回 TrueType（送瀏覽器 UA 一律是 woff2）。
 */
import { ImageResponse } from 'next/og.js';
import { mkdirSync, writeFileSync, readFileSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import { poster, titleSize, fitTitleSize, TONES } from './og-design.mjs';
import { openChrome } from './lib/chrome-text.mjs';

const OUT = 'public/og';
const MANIFEST = join(OUT, 'copy.json');
const CHECK = process.argv.includes('--check');

/** 語系 → 字型家族。TC 自己就帶拉丁字母，所以 en 跟著用同一套，字形才一致。 */
const FAMILY = { 'zh-TW': 'Noto+Sans+TC', en: 'Noto+Sans+TC', ja: 'Noto+Sans+JP', ko: 'Noto+Sans+KR', 'zh-Hans': 'Noto+Sans+SC', th: 'Noto+Sans+Thai' };
const LOCALES = ['zh-TW', 'en', 'ja', 'ko', 'zh-Hans', 'th'];
const PAGES = ['platform', 'home', 'rules', 'local', 'online', 'solo', 'replay', 'bagh-chal'];

const { BRAND } = await import('../app/brand.ts');
/** 右邊放各遊戲自己的主視覺（沒有的頁面畫 Wall Go 的棋盤） */
const ART = {
  'bagh-chal': 'data:image/svg+xml;base64,' + readFileSync('public/games/bagh-chal/key-art.svg').toString('base64'),
};
const messages = Object.fromEntries(await Promise.all(
  LOCALES.map(async (l) => [l, (await import(`../app/i18n/messages/${l}.ts`)).default])
));

/** 一張圖上的字：節目名（或站名）與標題，全部取自既有的 message。圖上不放描述句。 */
function copyFor(locale, page) {
  const t = messages[locale];
  // 英文的 titleLine2 整個不給 —— 用模板拼會變成字面上的 "undefined"（見 app/i18n/index.ts 的 siteName）
  const site = [t.home.titleLine1, t.home.titleLine2].filter(Boolean).join(' ');
  // 平台首頁：膠囊放平台名，標題逐行指定（metaTitle 太長；自動斷行會把節目名拆開）
  if (page === 'platform') return { kicker: BRAND, title: t.platform.ogLines, titleSize: fitTitleSize(t.platform.ogLines) };
  // Bagh Chal：膠囊放出自哪一季的節目名，標題是遊戲名＋副名
  if (page === 'bagh-chal') { const lines = [t.baghChal.title, t.baghChal.subtitle]; return { kicker: t.meta.showName, title: lines, titleSize: fitTitleSize(lines) }; }
  const title = page === 'home'
    ? [t.home.titleLine1, t.home.titleLine2].filter(Boolean)
    : [t[page].metaTitle];
  return {
    kicker: page === 'home' ? t.meta.showName : site,
    title,
  };
}

const copyAll = Object.fromEntries(
  LOCALES.map((l) => [l, Object.fromEntries(PAGES.map((p) => [p, copyFor(l, p)]))])
);

/* ── CI 模式：只比對文案有沒有變，不連網也不重畫 ───────────────────── */
if (CHECK) {
  if (!existsSync(MANIFEST)) {
    console.error('✗ 找不到 public/og/copy.json —— 先跑 npm run og:build');
    process.exit(1);
  }
  const was = readFileSync(MANIFEST, 'utf8');
  const now = JSON.stringify(copyAll, null, 2) + '\n';
  if (was !== now) {
    console.error('✗ 分享圖的文案跟 message 檔對不上了 —— 跑 npm run og:build 重建');
    process.exit(1);
  }
  console.log('✓ 分享圖是最新的');
  process.exit(0);
}

/* ── 產生 ──────────────────────────────────────────────────────────── */

/** 向 Google Fonts 要一份**只含這些字**的 TrueType 子集。 */
async function subset(family, weight, text) {
  const url = `https://fonts.googleapis.com/css2?family=${family}:wght@${weight}`
    + `&text=${encodeURIComponent([...new Set(text)].join(''))}`;
  // 不送 User-Agent：Google 認不出來的客戶端才會拿到 ttf
  const css = await fetch(url).then((r) => r.text());
  const m = css.match(/src:\s*url\(([^)]+)\)/);
  if (!m) throw new Error(`${family} ${weight} 拿不到字型：\n${css.slice(0, 300)}`);
  const data = await fetch(m[1]).then((r) => r.arrayBuffer());
  const sig = Buffer.from(data.slice(0, 4)).toString('latin1');
  if (sig === 'wOF2') throw new Error(`${family} 回了 woff2，satori 不吃`);
  return data;
}

mkdirSync(OUT, { recursive: true });
let total = 0;

/*
  需要完整文字排版的語系：標題交給 Chrome 畫（見 scripts/lib/chrome-text.mjs）。
  字型用 build-font-subset 下載的完整 TTF（先跑過 npm run font:subset 才有）。
*/
const SHAPED = { th: 'node_modules/.cache/wallgo-fonts/NotoSansThai[wdth,wght].ttf' };
const chrome = Object.keys(SHAPED).some((l) => LOCALES.includes(l)) ? await openChrome() : null;

for (const locale of LOCALES) {
  // 這個語系所有圖會用到的字，一次要齊 —— 分開要會拿到好幾份重疊的子集
  const chars = PAGES.flatMap((p) => {
    const c = copyAll[locale][p];
    return [c.kicker, ...c.title, c.line];
  }).join('') + 'quoridorgame.com';

  const [w700, w900] = await Promise.all([
    subset(FAMILY[locale], 700, chars),
    subset(FAMILY[locale], 900, chars),
  ]);
  const fonts = [
    { name: 'OG', data: w700, weight: 700, style: 'normal' },
    { name: 'OG', data: w900, weight: 900, style: 'normal' },
  ];

  for (const page of PAGES) {
    const copy = copyAll[locale][page];
    // 一行畫完再畫下一行：所有行共用同一個 Chrome 分頁，同時畫會互相蓋掉
    // （平台首頁的泰文標題有兩行，兩張圖都變成同一行，2026-10）
    let titleImages;
    if (SHAPED[locale]) {
      titleImages = [];
      for (const line of copy.title) {
        titleImages.push(await chrome.render({
          text: line, fontFile: SHAPED[locale], fontSize: copy.titleSize ?? titleSize(line), color: TONES[page].fg,
        }));
      }
    }
    const png = Buffer.from(await new ImageResponse(
      poster({ tone: page, copy, titleImages, art: ART[page] }),
      { width: 1200, height: 630, fonts }
    ).arrayBuffer());
    const file = join(OUT, `${page}-${locale}.png`);
    writeFileSync(file, png);
    total += png.length;
    console.log(`  ${file.padEnd(30)} ${(png.length / 1024).toFixed(0)}KB`);
  }
}

await chrome?.close();
writeFileSync(MANIFEST, JSON.stringify(copyAll, null, 2) + '\n');
console.log(`\n✓ ${LOCALES.length * PAGES.length} 張，共 ${(total / 1024).toFixed(0)}KB`);
