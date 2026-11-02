/**
 * 規則圖卡（4:5，1080×1350）與影片的字幕、片頭片尾（9:16，1080×1920，透明底）。
 * 用無頭 Chrome 排版：字是站上同一套 Noto Sans TC（og:build 下載到 node_modules/.cache 的完整版，不是網站的子集），
 * 韓文照全站的做法用系統字（Apple SD Gothic Neo）。顏色是首頁磁磚的色票（app/globals.css 的 --tile-*）。
 * 盤面是 capture-boards.mjs 截的真畫面。
 *
 *   node scripts/social/render.mjs <game.json> <boardsDir> <outDir>
 */
import { mkdirSync, readFileSync, writeFileSync, existsSync } from 'node:fs';
import { join, resolve } from 'node:path';
import { pathToFileURL, fileURLToPath } from 'node:url';
import { launch, sleep } from './cdp.mjs';
import { COPY } from './copy.mjs';

const [gameFile, boardsDir, outDir] = process.argv.slice(2).map((p) => resolve(p));
const game = JSON.parse(readFileSync(gameFile, 'utf8'));
mkdirSync(outDir, { recursive: true });
const root = fileURLToPath(new URL('../../', import.meta.url));
const FONT = join(root, 'node_modules/.cache/wallgo-fonts/NotoSansTC[wght].ttf');
if (!existsSync(FONT)) throw new Error('缺 Noto Sans TC：先跑一次 npm run og:build（會下載到 node_modules/.cache/wallgo-fonts）');

// 首頁磁磚的色票（globals.css）。fg 是那個底色上過 4.5:1 的字色（數字見 globals.css 的註解）
const T = {
  forest: { bg: '#006944', fg: '#faf7f0' }, orange: { bg: '#df6c3f', fg: '#141010' },
  blue: { bg: '#2478b7', fg: '#faf7f0' }, red: { bg: '#cd4642', fg: '#faf7f0' },
  purple: { bg: '#83519c', fg: '#faf7f0' }, ink: { bg: '#141010', fg: '#faf7f0' },
};
const CARD_TONES = ['forest', 'orange', 'blue', 'red', 'purple'];
const img = (name) => pathToFileURL(join(boardsDir, `${name}.png`)).href;
const esc = (s) => s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/\n/g, '<br>');

function page(locale, w, h, body, { transparent = false } = {}) {
  const fam = locale === 'ko' ? `'Apple SD Gothic Neo', 'NotoTC'` : `'NotoTC', 'Apple SD Gothic Neo'`;
  return `<!doctype html><html lang="${COPY[locale].lang}"><head><meta charset="utf-8"><style>
@font-face { font-family: 'NotoTC'; src: url('${pathToFileURL(FONT).href}'); font-weight: 100 900; }
* { box-sizing: border-box; margin: 0; padding: 0; }
html, body { width: ${w}px; height: ${h}px; overflow: hidden; background: ${transparent ? 'transparent' : '#e8e1d7'}; }
body { font-family: ${fam}; -webkit-font-smoothing: antialiased; word-break: keep-all; overflow-wrap: anywhere; }
.pill { display: inline-block; border-radius: 999px; padding: 14px 34px; font-weight: 900; font-size: 34px; }
.board { display: block; border-radius: 28px; }
</style></head><body>${body}</body></html>`;
}

function card(locale, i) {
  const c = COPY[locale], k = c.cards[i], t = T[CARD_TONES[i]];
  const head = `<div style="display:flex;justify-content:space-between;align-items:center">
      <span class="pill" style="background:${t.fg};color:${t.bg}">${esc(c.pill)}</span>
      <span style="font-weight:900;font-size:34px;opacity:.75">${i + 1} / ${c.cards.length}</span></div>`;
  const foot = `<div style="position:absolute;left:72px;right:72px;bottom:56px;display:flex;justify-content:space-between;font-weight:700;font-size:28px;opacity:.8">
      <span>${c.url}</span><span>${esc(c.fan)}</span></div>`;
  let main = '';
  if (i === 0) {
    main = `<div style="margin-top:56px;font-weight:700;font-size:38px;opacity:.85">${esc(k.kicker)}</div>
      <h1 style="margin-top:14px;font-weight:900;font-size:112px;line-height:1.08">${esc(k.title)}</h1>
      <p style="margin-top:28px;font-weight:700;font-size:40px;line-height:1.45">${esc(k.body)}</p>
      <img class="board" src="${img('mid')}" style="position:absolute;right:72px;bottom:130px;width:560px">`;
  } else if (i === 1) {
    main = `<h1 style="margin-top:56px;font-weight:900;font-size:74px;line-height:1.15">${esc(k.title)}</h1>
      <div style="margin-top:44px;display:flex;gap:36px">${k.steps.map((s, j) => `<div style="flex:1">
        <div style="font-weight:900;font-size:46px">${esc(s.label)}</div>
        <img class="board" src="${img(j ? 'wall' : 'move')}" style="margin-top:18px;width:100%">
        <p style="margin-top:22px;font-weight:700;font-size:33px;line-height:1.45">${esc(s.body)}</p></div>`).join('')}</div>`;
  } else if (i === 2) {
    main = `<h1 style="margin-top:56px;font-weight:900;font-size:80px;line-height:1.15">${esc(k.title)}</h1>
      <p style="margin-top:26px;font-weight:700;font-size:37px;line-height:1.5">${esc(k.body)}</p>
      <div style="margin-top:36px;display:flex;gap:40px;align-items:flex-end">
        <img class="board" src="${img('final')}" style="width:560px">
        <div style="flex:1;font-weight:900;font-size:40px;line-height:1.5;padding-bottom:12px;white-space:nowrap">${k.score(game.scores).split(/\s{2,}|　/).map((x) => `<div>${esc(x)}</div>`).join('')}</div></div>`;
  } else if (i === 3) {
    main = `<h1 style="margin-top:56px;font-weight:900;font-size:80px;line-height:1.15">${esc(k.title)}</h1>
      <p style="margin-top:26px;font-weight:700;font-size:38px;line-height:1.5">${esc(k.body)}</p>
      <img class="board" src="${img('trap')}" style="position:absolute;left:50%;transform:translateX(-50%);bottom:140px;width:520px;border-radius:24px">`;
  } else {
    main = `<h1 style="margin-top:80px;font-weight:900;font-size:100px;line-height:1.12">${esc(k.title)}</h1>
      <div style="margin-top:56px;display:flex;flex-wrap:wrap;gap:18px">${k.modes.map((m) => `<span class="pill" style="background:${t.fg};color:${t.bg};font-size:38px">${esc(m)}</span>`).join('')}</div>
      <div style="margin-top:110px;font-weight:900;font-size:88px;letter-spacing:-1px;white-space:nowrap">${c.url}</div>
      <div style="margin-top:70px;padding:30px 36px;border-radius:28px;background:rgba(0,0,0,.18);font-weight:700;font-size:34px;line-height:1.5">${esc(c.disclaimer)}</div>`;
  }
  return page(locale, 1080, 1350, `<div style="position:relative;width:1080px;height:1350px;padding:64px 72px;background:${t.bg};color:${t.fg}">
    ${head}${main}${i === 4 ? '' : foot}</div>`);
}

/** 影片上的字：放在盤面下方那塊空地（盤面底 ≈ y1450、狀態鈕頂 ≈ y1760）；結算時壓在按鈕那一帶 */
function caption(locale, text, { big = false, y = 1490 } = {}) {
  const c = COPY[locale];
  return page(locale, 1080, 1920, `
    ${big ? `<div style="position:absolute;top:262px;left:0;right:0;text-align:center"><span class="pill" style="background:#141010;color:#faf7f0;font-size:40px">${esc(c.pill)}</span></div>` : ''}
    <div style="position:absolute;left:60px;right:60px;top:${y}px;padding:${big ? 40 : 34}px 44px;border-radius:40px;background:#141010;color:#faf7f0;
      font-weight:900;line-height:1.3;text-align:center"><div data-fit="${text.split('\n').length}" style="font-size:${big ? 66 : 58}px">${esc(text)}</div></div>`, { transparent: true });
}

function outro(locale) {
  const c = COPY[locale];
  return page(locale, 1080, 1920, `<div style="position:relative;width:1080px;height:1920px;background:#006944;color:#faf7f0;padding:0 80px;
      display:flex;flex-direction:column;justify-content:center">
    <span class="pill" style="align-self:flex-start;background:#faf7f0;color:#006944;font-size:44px">${esc(c.pill)}</span>
    <img class="board" src="${img('final')}" style="margin-top:60px;width:920px">
    <div style="margin-top:70px;font-weight:900;font-size:88px;letter-spacing:-1px;white-space:nowrap">${c.url}</div>
    <div style="margin-top:26px;font-weight:900;font-size:50px;line-height:1.35">${esc(c.video.outro)}</div>
    <div style="margin-top:60px;font-weight:700;font-size:34px;line-height:1.5;opacity:.9">${esc(c.disclaimer)}</div></div>`);
}

const b = await launch({ width: 1080, height: 1920 });
async function render(html, out, w, h, transparent) {
  const f = join(outDir, '_tmp.html');
  writeFileSync(f, html);
  await b.s('Emulation.setDeviceMetricsOverride', { width: w, height: h, deviceScaleFactor: 1, mobile: false });
  await b.s('Emulation.setDefaultBackgroundColorOverride', transparent ? { color: { r: 0, g: 0, b: 0, a: 0 } } : {});
  await b.goto(pathToFileURL(f).href);
  await b.ev('document.fonts.ready.then(()=>1)');
  await b.ev(`Promise.all([...document.images].map(i=>i.complete?1:new Promise(r=>i.onload=r)))`);
  // 字幕最多照原文的行數排（英文比較長，字級放不下就一次縮 2px），不然會多折一行、壓到下面的按鈕
  await b.ev(`document.querySelectorAll('[data-fit]').forEach((e)=>{const n=+e.dataset.fit;let f=parseFloat(getComputedStyle(e).fontSize);
    while(e.getBoundingClientRect().height>n*f*1.3+4&&f>32){f-=2;e.style.fontSize=f+'px';}})`);
  await sleep(150);
  await b.shot(out, { x: 0, y: 0, width: w, height: h });
}
for (const locale of Object.keys(COPY)) {
  const dir = join(outDir, locale);
  mkdirSync(join(dir, 'cards'), { recursive: true });
  mkdirSync(join(dir, 'overlay'), { recursive: true });
  for (let i = 0; i < COPY[locale].cards.length; i++) await render(card(locale, i), join(dir, 'cards', `wallgo-rules-${locale}-${i + 1}.png`), 1080, 1350);
  const v = COPY[locale].video;
  await render(caption(locale, v.intro, { big: true }), join(dir, 'overlay', 'intro.png'), 1080, 1920, true);
  for (const key of ['place', 'move', 'wall', 'late']) await render(caption(locale, v[key]), join(dir, 'overlay', `${key}.png`), 1080, 1920, true);
  await render(caption(locale, v.result, { y: 1660 }), join(dir, 'overlay', 'result.png'), 1080, 1920, true);
  await render(outro(locale), join(dir, 'overlay', 'outro.png'), 1080, 1920);
  console.log(locale, 'ok');
}
b.close();
process.exit(0);
