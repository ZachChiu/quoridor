#!/usr/bin/env node
/**
 * 從原始碼實際用到的字元重建 Noto Sans TC 子集。
 *
 * 為什麼需要這支：中文字型完整檔有數 MB，站上只用到幾百個字，所以我們向
 * Google Fonts 要一份只含這些字的子集（`text=` 參數）。但那份清單一旦是手切的，
 * 文案一改就會失準 —— 新字沒被包進去時**不會報錯**，只會安靜地掉到系統備援字體，
 * 在 900 字重的標題上尤其明顯（真 900 vs 合成粗體）。
 *
 * 所以清單改由原始碼推導。註解會先剝掉：這個 repo 的註解是中文的，
 * 而註解不會渲染，算進去等於白白多載幾百個字。
 *
 *   npm run font:subset          重建子集並更新 public/fonts/
 *   npm run font:check           只比對字表，不連網（CI 用，落後就 exit 1）
 *
 * CI 比對的是**字表**（subset-chars.txt）而不是 woff2 的位元組 ——
 * Google Fonts 對同一個請求不保證回傳位元組相同的檔案，比位元組會假性失敗。
 */
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, extname } from 'node:path';

const SRC_DIR = 'app';
const OUT = 'public/fonts/noto-sans-tc-var.woff2';
// 上次產生子集時用的字表。CI 拿它跟原始碼重算的結果比對，
// 就能抓到「改了文案卻忘記重建字型」—— 那種錯不會報錯，只會安靜地掉字。
const MANIFEST = 'public/fonts/subset-chars.txt';
const FAMILY = 'Noto+Sans+TC:wght@400..900';
// Chrome 的 UA，Google Fonts 才會回 woff2；舊 UA 會拿到 ttf
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 '
  + '(KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36';

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

const chars = new Set();
for (const f of walk(SRC_DIR)) {
  for (const ch of stripComments(readFileSync(f, 'utf8'))) {
    if (ch.codePointAt(0) > 0x7f) chars.add(ch);
  }
}
// 完整可見 ASCII 一律帶上：Latin、數字、標點的體積微不足道，
// 卻能讓「加一個英文標點就掉字」這種事不會發生。
for (let c = 0x20; c < 0x7f; c++) chars.add(String.fromCharCode(c));

const text = [...chars].sort().join('');
console.log(`  原始碼用到 ${chars.size} 個字元`);

if (process.argv.includes('--check')) {
  let recorded = '';
  // 只剝結尾的換行，不能用 trim() —— 排序後的第一個字元正好是半形空白（0x20），
  // trim() 會把它吃掉，於是每次都誤判成「缺一個字」。
  try { recorded = readFileSync(MANIFEST, 'utf8').replace(/\n$/, ''); } catch { /* 還沒產生過 */ }
  if (recorded === text) {
    console.log('  ✓ 字型子集是最新的');
    process.exit(0);
  }
  const rec = new Set(recorded);
  const missing = [...chars].filter((c) => !rec.has(c));
  const stale = [...rec].filter((c) => !chars.has(c));
  console.error('  ✗ 字型子集已落後於原始碼');
  if (missing.length) console.error(`    缺 ${missing.length} 字（會掉到系統備援字體）：${missing.join('')}`);
  if (stale.length) console.error(`    多 ${stale.length} 字（白白增加體積）：${stale.join('')}`);
  console.error('    執行 npm run font:subset 重建後一併提交。');
  process.exit(1);
}

const cssUrl = `https://fonts.googleapis.com/css2?family=${FAMILY}&text=${encodeURIComponent(text)}&display=swap`;
const css = await (await fetch(cssUrl, { headers: { 'User-Agent': UA } })).text();
// Google Fonts 的子集 URL 是 /l/font?kit=… 形式，不以 .woff2 結尾，
// 所以認 format('woff2') 這個宣告而不是副檔名。
const m = css.match(/url\((https:\/\/[^)]+)\)\s*format\('woff2'\)/);
if (!m) {
  console.error('  ✗ Google Fonts 沒回 woff2，收到的 CSS：\n' + css.slice(0, 400));
  process.exit(1);
}
const buf = Buffer.from(await (await fetch(m[1])).arrayBuffer());
writeFileSync(OUT, buf);
writeFileSync(MANIFEST, text + '\n');
console.log(`  ✓ ${OUT}  ${(buf.length / 1024).toFixed(1)} KB`);
console.log(`  ✓ ${MANIFEST}`);
