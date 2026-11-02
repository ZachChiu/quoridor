#!/usr/bin/env node
/**
 * 各語系的遊戲名用那款自己風格的字：把名字轉成向量 SVG，平台卡片、大卡片、各款首頁的標題用。
 * 2026-10-25 Zach：「我發現很多字體可能是不是比較偏英文／各語系有沒有辦法也找到一樣的字型」。
 *
 * 英文名本來就是各款自己的字（字標、舊式襯線）；中日韓泰的名字沒有那種字，各語系挑同一種風格的對應 ——
 * 肥臉體 ↔ 粗宋／粗明朝、哥德手抄本 ↔ 楷書、舊式襯線 ↔ 宋體／明朝。每款挑的字寫在 scripts/name-lettering/<遊戲>.mjs（格式見那裡的 README）。
 *
 * 為什麼是向量圖、不是網頁字型：只有固定的幾個字，轉成外框就好 —— 不用下載字型，也不會先閃一下系統字。
 * 名字切成幾段（日文的中間點後面、空格；也可以在設定檔自己切），每段一張 SVG，
 * 畫面上放得下就排在同一行，放不下才在段與段之間換行（components/LocalName.tsx），不會斷在字中間；
 * 最多兩行，兩行還放不下就整個名字一起縮小（平台的小卡片上，ナイン・メンズ・モリス 排成三行會蓋到標籤）。
 *
 *   npm run name:build                重建全部（要連網下載原始字型，存在 node_modules/.cache/wallgo-fonts，跟 font:subset 共用）
 *   npm run name:build -- <遊戲>…     只重建那幾款 —— 各款的分支只重建自己的，合併才不會撞
 *
 * 產物：public/games/<遊戲>/name/<語系>-<第幾段>.svg ＋ app/games/<遊戲>/nameLettering.ts，跟程式一起 commit。
 * 名字改了沒重建：tests/components/nameLettering.test.ts 會擋，畫面上則退回一般文字（不會寫錯字）。
 *
 * harfbuzz 用 subset-font 帶進來的那份（harfbuzzjs）：排字（字距、泰文的上下標）與取外框都交給它，可變字型照設定的字重取。
 */
import { readFileSync, writeFileSync, readdirSync, existsSync, mkdirSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { pathToFileURL } from 'node:url';
import * as hb from 'harfbuzzjs';

const CONFIG_DIR = 'scripts/name-lettering';
const CACHE = 'node_modules/.cache/wallgo-fonts';
/** 段的上下、筆畫超出字身時左右多留的一點（字身的幾分之一），免得筆畫被切掉 */
const PAD = 0.02;
/** 換行之後兩行的行距（字級的倍數）：跟 leading-none 的字差不多、稍微鬆一點 */
const LINE = 1.1;

const only = process.argv.slice(2);
const files = readdirSync(CONFIG_DIR).filter((f) => f.endsWith('.mjs')).filter((f) => !only.length || only.includes(f.replace(/\.mjs$/, '')));
const missing = only.filter((id) => !files.includes(`${id}.mjs`));
if (missing.length) { console.error(`  ✗ 沒有這幾款的設定檔：${missing.join('、')}（${CONFIG_DIR}/<遊戲>.mjs）`); process.exit(1); }
if (!files.length) { console.log(`  （${CONFIG_DIR} 裡沒有設定檔）`); process.exit(0); }

const fonts = new Map();
async function loadFont({ src, axes = {} }) {
  const key = `${src} ${JSON.stringify(axes)}`;
  if (fonts.has(key)) return fonts.get(key);
  mkdirSync(CACHE, { recursive: true });
  const cached = join(CACHE, decodeURIComponent(src.split('/').pop()));
  if (!existsSync(cached)) {
    console.log(`  下載 ${cached.split('/').pop()}…`);
    const res = await fetch(src);
    if (!res.ok) { console.error(`  ✗ 下載失敗 ${res.status}：${src}`); process.exit(1); }
    writeFileSync(cached, Buffer.from(await res.arrayBuffer()));
  }
  const face = new hb.Face(new hb.Blob(readFileSync(cached)));
  const font = new hb.Font(face);
  const vars = Object.entries(axes).map(([tag, v]) => hb.Variation.fromString(`${tag}=${v}`));
  if (vars.length) font.setVariations(vars);
  // 可變字型的 name 1 是預設那一套（ExtraLight 之類），16 才是字族名；用了哪個字重寫在後面
  const family = (face.getName(16, 'en') || face.getName(1, 'en') || cached.split('/').pop()) +
    Object.entries(axes).map(([tag, v]) => ` ${tag} ${v}`).join('');
  const entry = { font, upem: face.upem, family };
  fonts.set(key, entry);
  return entry;
}

/** 切段：日文的中間點跟著前一段、空格是段與段之間的間隔。設定檔給了 pieces 就照它切（中間不能有空格） */
function split(text, pieces) {
  if (pieces) {
    if (pieces.join('') !== text) throw new Error(`pieces 接起來不是「${text}」：${pieces.join('｜')}`);
    return { parts: pieces, space: false };
  }
  const parts = text.split(' ').flatMap((w) => w.split(/(?<=・)/)).filter(Boolean);
  const space = text.includes(' ');
  if (space && text.includes('・')) throw new Error(`「${text}」同時有空格與中間點，請在設定檔用 pieces 自己切`);
  return { parts, space };
}

/** 排一段字：字距加在每個字（cluster）後面、最後一個字不加 —— 泰文的上下標母音、聲調跟前一個字同一個 cluster，不能被拉開 */
function shapePiece(font, text, tracking) {
  const buf = new hb.Buffer();
  buf.addText(text);
  buf.guessSegmentProperties();
  hb.shape(font, buf);
  const infos = buf.getGlyphInfos();
  const pos = buf.getGlyphPositions();
  const glyphs = [];
  let x = 0;
  infos.forEach((g, i) => {
    glyphs.push({ gid: g.codepoint, x: x + pos[i].xOffset, y: pos[i].yOffset });
    x += pos[i].xAdvance;
    if (i < infos.length - 1 && infos[i + 1].cluster !== g.cluster) x += tracking;
  });
  return { glyphs, adv: x };
}

/** 外框轉成 SVG 路徑：字型的 y 朝上、SVG 朝下 */
function pathOf(font, { gid, x, y }) {
  const r = (v) => Math.round(v);
  return font.glyphToJson(gid).map(({ type, values }) => {
    const pts = [];
    for (let i = 0; i < values.length; i += 2) pts.push(`${r(x + values[i])} ${r(-(y + values[i + 1]))}`);
    return type + pts.join(' ');
  }).join('');
}

/** 寫成 TS 的物件字面值（單引號、key 不加引號），跟手寫的程式碼一樣的樣子 */
function lit(v) {
  if (typeof v === 'string') return `'${v.replace(/\\/g, '\\\\').replace(/'/g, "\\'")}'`;
  if (typeof v === 'number') return String(v);
  if (Array.isArray(v)) return `[${v.map(lit).join(', ')}]`;
  return `{ ${Object.entries(v).filter(([, x]) => x !== undefined).map(([k, x]) => `${/^[a-z_$][\w$]*$/i.test(k) ? k : lit(k)}: ${lit(x)}`).join(', ')} }`;
}
const em = (v) => Math.round(v * 1000) / 1000;

for (const f of files) {
  const { default: cfg } = await import(pathToFileURL(join(CONFIG_DIR, f)).href);
  const outDir = `public/games/${cfg.id}/name`;
  rmSync(outDir, { recursive: true, force: true });
  mkdirSync(outDir, { recursive: true });
  const data = {};
  for (const [locale, entry] of Object.entries(cfg.locales)) {
    const { font, upem, family } = await loadFont(entry.font);
    const tracking = (entry.tracking ?? cfg.tracking ?? 0) * upem;
    const { parts, space } = split(entry.text, entry.pieces);
    const shaped = parts.map((t) => shapePiece(font, t, tracking));

    // 每一段共用同一個上下範圍，換不換行，字的基線都對得齊
    let top = -Infinity, bottom = Infinity;
    const inks = shaped.map(({ glyphs, adv }) => {
      let left = 0, right = adv;
      for (const g of glyphs) {
        const e = font.glyphExtents(g.gid);
        if (!e || !e.width) continue;
        left = Math.min(left, g.x + e.xBearing);
        right = Math.max(right, g.x + e.xBearing + e.width);
        top = Math.max(top, g.y + e.yBearing);
        bottom = Math.min(bottom, g.y + e.yBearing + e.height);
      }
      return { left, right };
    });
    const pad = PAD * upem;
    const y0 = -top - pad, y1 = -bottom + pad;
    const h = (y1 - y0) / upem;

    const pieces = shaped.map(({ glyphs, adv }, i) => {
      // 左右照字身（字距才對）；筆畫超出字身就多畫一點，用負的外距抵回來
      const { left, right } = inks[i];
      const x0 = left < 0 ? left - pad : 0, x1 = right > adv ? right + pad : adv;
      const file = `${locale}-${i}.svg`;
      const d = glyphs.map((g) => pathOf(font, g)).join('');
      writeFileSync(join(outDir, file),
        `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${Math.round(x0)} ${Math.round(y0)} ${Math.round(x1 - x0)} ${Math.round(y1 - y0)}">` +
        `<!-- ${parts[i]}：${family}（SIL Open Font License），scripts/build-name-lettering.mjs 產生 --><path d="${d}"/></svg>\n`);
      return { src: `/games/${cfg.id}/name/${file}`, w: em((x1 - x0) / upem), ml: x0 < 0 ? em(x0 / upem) : undefined, mr: x1 > adv ? em((adv - x1) / upem) : undefined };
    });

    const spaceAdv = space ? shapePiece(font, ' ', 0).adv : 0;
    const gap = (space ? spaceAdv + 2 * tracking : tracking) / upem;
    // 最多排兩行：每一種切成兩行的方式裡、比較寬那一行最窄是多寬（只有一段就是那一段）。
    // 畫面比這個窄就整個名字一起縮小 —— 不會排到第三行，也不會只有一段變小
    // （用寫進檔案、四捨五入過的數字算，再多留一點，免得差千分之一就被擠到第三行）
    const span = (a, b) => pieces.slice(a, b).reduce((sum, p) => sum + p.w + (p.ml ?? 0) + (p.mr ?? 0), 0) + em(gap) * (b - a - 1);
    const fit = pieces.length === 1 ? span(0, 1) : Math.min(...pieces.slice(1).map((_, i) => Math.max(span(0, i + 1), span(i + 1, pieces.length))));
    data[locale] = {
      text: entry.text,
      h: em(h),
      gap: em(gap),
      lead: em(Math.max(0.08, LINE - h)),
      fit: Math.ceil((fit + 0.01) * 1000) / 1000,
      pieces,
    };
    console.log(`  ✓ ${cfg.id} ${locale}「${entry.text}」${family}，${pieces.length} 段`);
  }

  const lines = Object.entries(data).map(([locale, v]) => `  ${/^[a-z]+$/.test(locale) ? locale : lit(locale)}: ${lit(v)},`);
  writeFileSync(`app/games/${cfg.id}/nameLettering.ts`,
    `// 由 scripts/build-name-lettering.mjs 產生（npm run name:build -- ${cfg.id}），不要手改；各語系挑的字在 scripts/name-lettering/${cfg.id}.mjs。\n` +
    `import type { NameLettering } from '@/types/lettering';\n\n` +
    `export const NAME_LETTERING: NameLettering = {\n${lines.join('\n')}\n};\n`);
}
