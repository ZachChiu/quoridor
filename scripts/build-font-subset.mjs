#!/usr/bin/env node
/**
 * 從原始碼實際用到的字元，建出三份字型子集：繁中、簡中、泰文。
 *
 * 為什麼需要這支：中文字型完整檔有十幾 MB，站上只用到幾百個字。那份清單
 * 一旦是手切的，文案一改就會失準 —— 新字沒被包進去時**不會報錯**，只會安靜地
 * 掉到系統備援字體，在 900 字重的標題上尤其明顯（真 900 vs 合成粗體）。
 * 所以清單由原始碼推導，註解先剝掉（這個 repo 的註解是中文的，不會渲染）。
 *
 * ── 為什麼自己切，不用 Google Fonts 的 text= 子集 ──────────────────
 * 先前是把用到的字塞進 Google Fonts 的 `text=` 參數。字一多（上千個），網址
 * 長到約 10KB，Google 就**默默忽略 text=**，改回傳整套 unicode-range 切片
 * （105 個 @font-face）；腳本只取第一個網址，拿到的是 emoji 與罕用字那一片 ——
 * 於是線上的中文字從來沒有用到思源黑體，全部是系統字型在撐（2026-09 發現）。
 * 現在改成下載完整字型檔、用 harfbuzz（hb-subset 的 wasm 版，subset-font）在本機切，
 * 可變字重 400–900 原樣保留。
 *
 * ── 三份子集 ──────────────────────────────────────────────────
 *   TC   繁中與英文：繁中文案＋元件裡寫死的字＋ASCII
 *   SC   簡中：只收簡中文案（messages/zh-Hans.ts 與 content/ 裡的 'zh-Hans' 區塊）
 *   Thai 泰文：只收泰文文案裡的泰文字元
 * 日文、韓文不做子集，用系統字型（見下方 FONT_OF 的註解）。
 * 瀏覽器只下載頁面實際用到的那一份（@font-face 沒被用到就不會下載），
 * 所以繁中頁面不會因為多了簡中、泰文而變重。
 *
 *   npm run font:subset          重建三份子集並更新 public/fonts/（要連網下載原始字型）
 *   npm run font:check           只比對字表，不連網（CI 用，落後就 exit 1）
 *
 * CI 比對的是**字表**（subset-chars*.txt）而不是 woff2 的位元組。
 */
import { readFileSync, writeFileSync, readdirSync, statSync, existsSync, mkdirSync } from 'node:fs';
import { join, extname } from 'node:path';

const SRC_DIR = 'app';
const CACHE = 'node_modules/.cache/wallgo-fonts';
const GF = 'https://raw.githubusercontent.com/google/fonts/main/ofl';
const FONTS = {
  tc: { src: `${GF}/notosanstc/NotoSansTC%5Bwght%5D.ttf`, out: 'public/fonts/noto-sans-tc-var.woff2', manifest: 'public/fonts/subset-chars.txt' },
  sc: { src: `${GF}/notosanssc/NotoSansSC%5Bwght%5D.ttf`, out: 'public/fonts/noto-sans-sc-var.woff2', manifest: 'public/fonts/subset-chars-sc.txt' },
  // 泰文字型多一條寬度軸，釘在 100（正常寬度）
  thai: { src: `${GF}/notosansthai/NotoSansThai%5Bwdth,wght%5D.ttf`, out: 'public/fonts/noto-sans-thai-var.woff2', manifest: 'public/fonts/subset-chars-thai.txt', axes: { wdth: 100 } },
};

/** 剝掉 // 與 /* *​/ 與 {/* *​/} 註解，但不能誤傷字串裡的 //（例如 https://）。 */
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

/**
 * 測試檔要排除：`it('…')` 的描述是字串不是註解，剝註解剝不掉，
 * 但那些字一個都不會渲染到畫面上。實測會多帶進 60 幾個字。
 * Worker 同理 —— 它沒有 UI。
 */
const SKIP = /\.test\.tsx?$|[\\/]workers[\\/]/;

function walk(dir) {
  return readdirSync(dir).flatMap((name) => {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) return walk(p);
    if (SKIP.test(p)) return [];
    return ['.ts', '.tsx'].includes(extname(p)) ? [p] : [];
  });
}

const isThai = (ch) => { const c = ch.codePointAt(0); return c >= 0x0e00 && c <= 0x0e7f; };

/**
 * 把一個檔案的文字依語系分開。
 * messages/ 是一個語系一份檔案；content/ 是一份檔案裡每個語系一個區塊，
 * 依 LOCALES 的順序排（'zh-TW' → en → ja → ko → 'zh-Hans' → th）。
 * 其餘原始碼（元件）歸到 zh-TW：畫面上寫死的字（符號、aria 備援）跟著繁中子集。
 */
const LOCALE_KEYS = [["'zh-TW'", 'zh-TW'], ['en', 'en'], ['ja', 'ja'], ['ko', 'ko'], ["'zh-Hans'", 'zh-Hans'], ['th', 'th']];
function splitByLocale(file, src) {
  const m = file.match(/[\\/]messages[\\/]([\w-]+)\.ts$/);
  if (m) return { [m[1]]: src };
  const marks = LOCALE_KEYS
    .map(([key, loc]) => [src.indexOf(`\n  ${key}: `), loc])
    .filter(([i]) => i >= 0)
    .sort((x, y) => x[0] - y[0]);
  if (!marks.length) return { 'zh-TW': src };
  const out = { 'zh-TW': src.slice(0, marks[0][0]) };
  marks.forEach(([i, loc], n) => { out[loc] = (out[loc] ?? '') + src.slice(i, n + 1 < marks.length ? marks[n + 1][0] : src.length); });
  return out;
}

/*
  哪個語系用哪份子集。ja／ko 刻意不收：它們用系統字型（Hiragino、Apple SD Gothic…）——
  用繁中字型顯示日文漢字，字形會是台灣的寫法，而那本來就不對。
*/
const FONT_OF = { 'zh-TW': 'tc', en: 'tc', 'zh-Hans': 'sc', th: 'thai' };
const sets = { tc: new Set(), sc: new Set(), thai: new Set() };
for (const f of walk(SRC_DIR)) {
  const parts = splitByLocale(f, stripComments(readFileSync(f, 'utf8')));
  for (const [loc, text] of Object.entries(parts)) {
    const font = FONT_OF[loc];
    if (!font) continue;
    for (const ch of text) {
      if (ch.codePointAt(0) <= 0x7f) continue;
      // 泰文頁上的非泰文符號（✓ · …）由後備的繁中子集提供
      sets[font === 'thai' && !isThai(ch) ? 'tc' : font].add(ch);
    }
  }
}
// 完整可見 ASCII 一律帶上：Latin、數字、標點的體積微不足道，
// 卻能讓「加一個英文標點就掉字」這種事不會發生。泰文頁的英文也靠這份。
for (const set of Object.values(sets)) for (let c = 0x20; c < 0x7f; c++) set.add(String.fromCharCode(c));

const texts = Object.fromEntries(Object.entries(sets).map(([k, set]) => [k, [...set].sort().join('')]));
for (const [k, set] of Object.entries(sets)) console.log(`  ${k.padEnd(4)} 用到 ${set.size} 個字元`);

if (process.argv.includes('--check')) {
  let ok = true;
  for (const [k, { manifest }] of Object.entries(FONTS)) {
    // 只剝結尾的換行，不能用 trim() —— 排序後的第一個字元正好是半形空白（0x20）
    let recorded = '';
    try { recorded = readFileSync(manifest, 'utf8').replace(/\n$/, ''); } catch { /* 還沒產生過 */ }
    if (recorded === texts[k]) continue;
    ok = false;
    const rec = new Set(recorded);
    const missing = [...sets[k]].filter((c) => !rec.has(c));
    const stale = [...rec].filter((c) => !sets[k].has(c));
    console.error(`  ✗ ${k} 字型子集已落後於原始碼（${manifest}）`);
    if (missing.length) console.error(`    缺 ${missing.length} 字（會掉到系統備援字體）：${missing.join('')}`);
    if (stale.length) console.error(`    多 ${stale.length} 字（白白增加體積）：${stale.join('')}`);
  }
  if (!ok) { console.error('    執行 npm run font:subset 重建後一併提交。'); process.exit(1); }
  console.log('  ✓ 三份字型子集都是最新的');
  process.exit(0);
}

const { default: subsetFont } = await import('subset-font');
mkdirSync(CACHE, { recursive: true });
for (const [k, { src, out, manifest, axes }] of Object.entries(FONTS)) {
  const cached = join(CACHE, decodeURIComponent(src.split('/').pop()));
  if (!existsSync(cached)) {
    console.log(`  下載 ${k} 原始字型…`);
    const res = await fetch(src);
    if (!res.ok) { console.error(`  ✗ 下載失敗 ${res.status}：${src}`); process.exit(1); }
    writeFileSync(cached, Buffer.from(await res.arrayBuffer()));
  }
  const buf = await subsetFont(readFileSync(cached), texts[k], {
    targetFormat: 'woff2',
    ...(axes ? { variationAxes: axes } : {}),
  });
  writeFileSync(out, buf);
  writeFileSync(manifest, texts[k] + '\n');
  console.log(`  ✓ ${out}  ${(buf.length / 1024).toFixed(1)} KB`);
}
