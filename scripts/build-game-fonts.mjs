#!/usr/bin/env node
/**
 * 有自己字的遊戲，整頁（按鈕、說明、彈窗）都用那套字：把那款用到的字切成網頁字型，一款一語系一份。
 * 2026-10-25 Zach：「我以為是一個遊戲內會統一字體 / 結果是標題跟內容不同字體」—— 名字的字標（build-name-lettering）
 * 只管標題，這支管其他所有的字。每款挑的字寫在 scripts/game-fonts/<遊戲>.mjs（格式見那裡的 README）。
 *
 * 跟 build-font-subset.mjs 的分工：那支切全站的黑體（每一頁都用、也是這裡的備援），這支只收**那一款**畫面上會出現的字：
 *   - 那款自己的程式：app/games/<遊戲>/、app/components/<遊戲>/，文案表依語系區塊分開（寫法見 i18n/gameText.ts），
 *     區塊外寫死的字（符號、備援字）每個語系都收
 *   - 那款會叫到的共用文案：元件裡的 g.xxx（i18n/content/game.ts）、m.xxx／t.xxx（messages），
 *     從那款的程式、以及它用到的共用元件（@/components/… 一路往下找）裡找出路徑，取那個語系的字
 *   - 語言選單的六個語系名（中日韓那幾份）、完整可見 ASCII
 * 泰文字型只收泰文字；泰文頁上的英數、符號由那款的英文那份補上（跟全站一樣）。
 *
 * 產物（跟程式一起 commit）：
 *   public/fonts/games/<遊戲>/<語系>[-<字重>].woff2   字型
 *   public/fonts/games/<遊戲>/chars-<語系>.txt         收了哪些字（CI 比對這份，不比對 woff2 的位元組）
 *   app/components/<遊戲>/gameFont.css                @font-face＋那款頁面上的 --font-app，由那款的外框元件 import
 * 換字只換 --font-app：html:has(.<root>) 才生效，其他頁不受影響；@font-face 沒用到就不會下載。
 * 分享圖從 html 讀 --font-app（getComputedStyle(document.documentElement)），所以換在 html 上，不是 body。
 *
 *   npm run font:subset              連同全站子集一起重建（要連網下載原始字型，存在 node_modules/.cache/wallgo-fonts）
 *   npm run font:check               只比對字表與 CSS，不連網（CI 用，落後就 exit 1）
 *   node scripts/build-game-fonts.mjs <遊戲>…   只重建那幾款 —— 各款的分支只重建自己的，合併才不會撞
 */
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { join, extname, dirname } from 'node:path';
import { pathToFileURL } from 'node:url';

const CONFIG_DIR = 'scripts/game-fonts';
const CACHE = 'node_modules/.cache/wallgo-fonts';
const LOCALES = ['zh-TW', 'en', 'ja', 'ko', 'zh-Hans', 'th'];
const imp = (p) => import(pathToFileURL(p).href);
const { HTML_LANG, LOCALE_NAME } = await imp('app/i18n/locales.ts');
const { GAME_TEXT } = await imp('app/i18n/content/game.ts');
const MESSAGES = Object.fromEntries(await Promise.all(LOCALES.map(async (l) => [l, (await imp(`app/i18n/messages/${l}.ts`)).default])));

const check = process.argv.includes('--check');
const only = process.argv.slice(2).filter((a) => !a.startsWith('--'));
const files = (existsSync(CONFIG_DIR) ? readdirSync(CONFIG_DIR) : []).filter((f) => f.endsWith('.mjs'))
  .filter((f) => !only.length || only.includes(f.replace(/\.mjs$/, '')));
const missingConfig = only.filter((id) => !files.includes(`${id}.mjs`));
if (missingConfig.length) { console.error(`  ✗ 沒有這幾款的設定檔：${missingConfig.join('、')}（${CONFIG_DIR}/<遊戲>.mjs）`); process.exit(1); }
if (!files.length) { console.log(`  （${CONFIG_DIR} 裡沒有設定檔，沒有遊戲用自己的字）`); process.exit(0); }

/** 剝註解：同 build-font-subset.mjs（這個 repo 的註解是中文的，不會渲染） */
function stripComments(src) {
  let out = '', i = 0, quote = null;
  const n = src.length;
  while (i < n) {
    const ch = src[i];
    if (quote) {
      out += ch;
      if (ch === '\\' && i + 1 < n) { out += src[i + 1]; i += 2; continue; }
      if (ch === quote) quote = null;
      i++; continue;
    }
    if (ch === '\'' || ch === '"' || ch === '`') { quote = ch; out += ch; i++; continue; }
    if (ch === '/' && src[i + 1] === '/') { while (i < n && src[i] !== '\n') i++; continue; }
    if (ch === '/' && src[i + 1] === '*') {
      i += 2;
      while (i + 1 < n && !(src[i] === '*' && src[i + 1] === '/')) i++;
      i += 2; continue;
    }
    if (ch === '{' && src.slice(i, i + 3) === '{/*') {
      let depth = 1, j = i + 1;
      while (j < n && depth) { if (src[j] === '{') depth++; else if (src[j] === '}') depth--; j++; }
      i = j; continue;
    }
    out += ch; i++;
  }
  return out;
}

const SKIP = /\.test\.tsx?$|[\\/]workers[\\/]/;
function walk(dir) {
  if (!existsSync(dir)) return [];
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) return walk(p);
    if (SKIP.test(p)) return [];
    return ['.ts', '.tsx'].includes(extname(p)) ? [p] : [];
  });
}

/**
 * 一個檔案的字依語系分開。文案表的語系 key 在兩格縮排（i18n/gameText.ts 的規定）；
 * 一個檔案裡可以有好幾張表（每個 key 都找，不只第一個）。區塊外的字是 common：每個語系都收。
 */
const KEY = /\n {2}('zh-TW'|en|ja|ko|'zh-Hans'|th): /g;
function splitByLocale(src) {
  const marks = [...src.matchAll(KEY)].map((m) => [m.index, m[1].replace(/'/g, '')]);
  const out = { common: marks.length ? src.slice(0, marks[0][0]) : src };
  marks.forEach(([i, loc], n) => { out[loc] = (out[loc] ?? '') + src.slice(i, n + 1 < marks.length ? marks[n + 1][0] : src.length); });
  return out;
}

/** 那款用到的共用元件：從那款的程式 import 的 @/components/…，再一路往下找（只找 app/components 裡、不屬於別款的） */
function sharedComponents(own) {
  const seen = new Set(own);
  const queue = [...own];
  const found = [];
  while (queue.length) {
    const f = queue.shift();
    const src = readFileSync(f, 'utf8');
    for (const [, spec] of src.matchAll(/from '(@\/components\/[^']+|\.\.?\/[^']+)'/g)) {
      const base = spec.startsWith('@/') ? join('app', spec.slice(2)) : join(dirname(f), spec);
      if (!base.startsWith('app/components/') || base.split('/').length !== 3) continue; // 只要 app/components 底下第一層（各款的資料夾不算）
      const file = ['.tsx', '.ts'].map((e) => base + e).find(existsSync);
      if (!file || seen.has(file)) continue;
      seen.add(file); found.push(file); queue.push(file);
    }
  }
  return found;
}

/** 元件裡叫到的共用文案路徑：g.xxx → GAME_TEXT、m.xxx／t.xxx → messages。解析不到的（別的物件剛好叫 m）就略過 */
function textPaths(src) {
  const paths = { game: new Set(), messages: new Set() };
  for (const [, v, path] of src.matchAll(/\b([gmt])\.([a-zA-Z]\w*(?:\.[a-zA-Z0-9]\w*)*)/g)) paths[v === 'g' ? 'game' : 'messages'].add(path);
  return paths;
}
function stringsAt(obj, path) {
  let cur = obj;
  for (const k of path.split('.')) {
    if (cur == null || typeof cur !== 'object') break;
    cur = cur[k];
  }
  const out = [];
  (function collect(v) {
    if (typeof v === 'string') out.push(v);
    else if (v && typeof v === 'object') Object.values(v).forEach(collect);
  })(cur);
  return out;
}

const isThai = (ch) => { const c = ch.codePointAt(0); return c >= 0x0e00 && c <= 0x0e7f; };
const ASCII = Array.from({ length: 0x7f - 0x20 }, (_, i) => String.fromCharCode(0x20 + i)).join('');

/** 一款每個語系要收的字 */
function charsOf(config) {
  const own = [...walk(`app/games/${config.id}`), ...walk(`app/components/${config.id}`)];
  const shared = sharedComponents(own);
  const text = { common: '' };
  const paths = { game: new Set(), messages: new Set() };
  for (const f of [...own, ...shared]) {
    const src = stripComments(readFileSync(f, 'utf8'));
    const p = textPaths(src);
    p.game.forEach((x) => paths.game.add(x));
    p.messages.forEach((x) => paths.messages.add(x));
    // 區塊外寫死的字只收元件的（app/games 裡是規則與 AI，區塊外的中文是丟出去的錯誤訊息，不會畫在畫面上）；
    // 文案表的區塊只收那款自己的（共用元件的文案在 GAME_TEXT／messages，靠上面的路徑取）
    for (const [loc, t] of Object.entries(splitByLocale(src))) {
      if (loc === 'common' ? f.startsWith('app/components/') : own.includes(f)) text[loc] = (text[loc] ?? '') + t;
    }
  }
  const sets = Object.fromEntries(Object.keys(config.locales).map((loc) => [loc, new Set()]));
  for (const loc of Object.keys(sets)) {
    let s = (text[loc] ?? '') + text.common;
    // 語言選單的語系名只收中日韓：英文、泰文那份收了「繁體中文」這幾個漢字，一個字就幾 KB，換來的只是選單裡那一行
    if (!['en', 'th'].includes(loc)) s += Object.values(LOCALE_NAME).join('');
    for (const p of paths.game) s += stringsAt(GAME_TEXT[loc], p).join('');
    for (const p of paths.messages) s += stringsAt(MESSAGES[loc], p).join('');
    for (const ch of s) {
      // 表情符號（回饋的三張臉）交給系統的表情字型，哪一套字裡都沒有
      if (ch.codePointAt(0) <= 0x7f || /\s|\p{Extended_Pictographic}|\uFE0F/u.test(ch)) continue;
      // 泰文頁上的非泰文符號（✓ · …）由那款的英文那份提供（跟全站一樣：泰文字型裡沒有）
      if (loc === 'th' && !isThai(ch)) { (sets.en ?? sets.th).add(ch); continue; }
      sets[loc].add(ch);
    }
  }
  // 泰文的 ำ：WebKit 會拆成 ํ＋า 再畫（見 build-font-subset.mjs）
  if (sets.th?.has('ำ')) { sets.th.add('ํ'); sets.th.add('า'); }
  for (const set of Object.values(sets)) for (const c of ASCII) set.add(c);
  return Object.fromEntries(Object.entries(sets).map(([loc, set]) => [loc, [...set].sort().join('')]));
}

const facesOf = (spec) => (Array.isArray(spec) ? spec : [spec]);
const family = (config, loc) => `${config.id} ${loc}`;
/** 一個 face 的字重：可變字型取 axes.wght（範圍或釘死的值），靜態字型取 weight（預設 400） */
function weightOf(face) {
  const w = face.axes?.wght;
  if (w && typeof w === 'object') return [w.min, w.max];
  return [w ?? face.weight ?? 400];
}
const fileOf = (config, loc, face, faces) => `/fonts/games/${config.id}/${loc}${faces.length > 1 ? `-${weightOf(face)[0]}` : ''}.woff2`;

function cssOf(config) {
  const sel = (loc) => `:root:lang(${HTML_LANG[loc]}):has(.${config.root})`;
  const lines = [
    `/* 由 scripts/build-game-fonts.mjs 依 scripts/game-fonts/${config.id}.mjs 產生，不要手改（npm run font:subset）。`,
    `   這款的頁面（html:has(.${config.root})）整頁換成自己的字，--font-site 是全站那套黑體、當備援。 */`,
  ];
  for (const [loc, spec] of Object.entries(config.locales)) {
    const faces = facesOf(spec);
    for (const face of faces) {
      lines.push(`@font-face { font-family: '${family(config, loc)}'; src: url('${fileOf(config, loc, face, faces)}') format('woff2'); font-weight: ${weightOf(face).join(' ')}; font-style: normal; font-display: swap; }`);
    }
  }
  for (const [loc, spec] of Object.entries(config.locales)) {
    const chain = [`'${family(config, loc)}'`];
    if (loc === 'th' && config.locales.en) chain.push(`'${family(config, 'en')}'`);
    // 最粗只到 500 的字（單一字重、文楷簡中的 Medium）不讓瀏覽器自己描粗：假粗體會糊成一團
    const heaviest = Math.max(...facesOf(spec).map((f) => Math.max(...weightOf(f))));
    lines.push(`${sel(loc)} { --font-app: ${chain.join(', ')}, var(--font-site);${heaviest < 600 ? ' font-synthesis-weight: none;' : ''} }`);
  }
  return lines.join('\n') + '\n';
}

const configs = [];
for (const f of files) configs.push((await imp(join(CONFIG_DIR, f))).default);

let ok = true;
const results = configs.map((config) => ({ config, chars: charsOf(config), css: cssOf(config) }));
for (const { config, chars, css } of results) {
  const dir = `public/fonts/games/${config.id}`;
  const cssPath = `app/components/${config.id}/gameFont.css`;
  for (const [loc, text] of Object.entries(chars)) console.log(`  ${config.id} ${loc.padEnd(7)} 用到 ${[...text].length} 個字元`);
  if (!check) continue;
  for (const [loc, text] of Object.entries(chars)) {
    const manifest = `${dir}/chars-${loc}.txt`;
    let recorded = '';
    try { recorded = readFileSync(manifest, 'utf8').replace(/\n$/, ''); } catch { /* 還沒產生過 */ }
    const fonts = facesOf(config.locales[loc]).map((face, _, faces) => `public${fileOf(config, loc, face, faces)}`);
    if (recorded === text && fonts.every(existsSync)) continue;
    ok = false;
    const rec = new Set(recorded);
    const missing = [...text].filter((c) => !rec.has(c));
    const stale = [...rec].filter((c) => !text.includes(c));
    console.error(`  ✗ ${config.id} ${loc} 的字型落後於原始碼（${manifest}）`);
    if (missing.length) console.error(`    缺 ${missing.length} 字（會掉到全站的黑體）：${missing.join('')}`);
    if (stale.length) console.error(`    多 ${stale.length} 字（白白增加體積）：${stale.join('')}`);
  }
  let recordedCss = '';
  try { recordedCss = readFileSync(cssPath, 'utf8'); } catch { /* 還沒產生過 */ }
  if (recordedCss !== css) { ok = false; console.error(`  ✗ ${cssPath} 跟設定檔對不上`); }
}
if (check) {
  if (!ok) { console.error('    執行 npm run font:subset 重建後一併提交。'); process.exit(1); }
  console.log('  ✓ 各款自己的字型都是最新的');
  process.exit(0);
}

/*
  只留橫排會用到的 OpenType 功能。subset-font 預設全部保留（--layout-features=*），直排字形、全形／半形、比例寬度
  這些換出來的字形也一起收進來：英文那份 65 KB → 19 KB、繁中 170 → 121、日文 218 → 103（時間拍賣，2026-10-25 量的）。
  tnum：計時、步數用 tabular-nums。泰文全部保留：上下標靠 GSUB 換字形，砍錯了會疊在一起（而且只差 1 KB）。
*/
const FEATURES = ['ccmp', 'locl', 'mark', 'mkmk', 'kern', 'liga', 'clig', 'calt', 'rlig', 'rvrn', 'tnum', 'lnum', 'pnum'];
const { default: subsetFont } = await import('subset-font');
const hb = await import('harfbuzzjs');
mkdirSync(CACHE, { recursive: true });
async function load(src) {
  const cached = join(CACHE, decodeURIComponent(src.split('/').pop()));
  if (!existsSync(cached)) {
    console.log(`  下載 ${cached.split('/').pop()}…`);
    const res = await fetch(src);
    if (!res.ok) { console.error(`  ✗ 下載失敗 ${res.status}：${src}`); process.exit(1); }
    writeFileSync(cached, Buffer.from(await res.arrayBuffer()));
  }
  return readFileSync(cached);
}
for (const { config, chars, css } of results) {
  const dir = `public/fonts/games/${config.id}`;
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(dir, { recursive: true });
  for (const [loc, text] of Object.entries(chars)) {
    const faces = facesOf(config.locales[loc]);
    for (const face of faces) {
      const buf = await load(face.src);
      // 字型裡沒有的字會掉到下一套（泰文頁的英數 → 英文那份、其他 → 全站黑體），列出來看要不要換字型
      const has = new Set(new hb.Face(new hb.Blob(buf)).collectUnicodes());
      const lacks = [...text].filter((c) => c.codePointAt(0) > 0x7f && !has.has(c.codePointAt(0)) && !Object.values(LOCALE_NAME).join('').includes(c));
      const out = await subsetFont(buf, text, {
        targetFormat: 'woff2',
        ...(face.axes ? { variationAxes: face.axes } : {}),
        ...(loc === 'th' ? {} : { keepFeatures: FEATURES }),
      });
      const path = `public${fileOf(config, loc, face, faces)}`;
      writeFileSync(path, out);
      console.log(`  ✓ ${path}  ${(out.length / 1024).toFixed(1)} KB${lacks.length ? `  （字型裡沒有：${lacks.join('')}）` : ''}`);
    }
    writeFileSync(`${dir}/chars-${loc}.txt`, text + '\n');
  }
  writeFileSync(`app/components/${config.id}/gameFont.css`, css);
  console.log(`  ✓ app/components/${config.id}/gameFont.css`);
}
