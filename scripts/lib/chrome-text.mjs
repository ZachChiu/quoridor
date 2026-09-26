/**
 * 用無頭 Chrome 把一行字畫成去背 PNG。給分享圖（build-og-images.mjs）用。
 *
 * 為什麼需要：分享圖用 satori 產生，它不做複雜文字排版（沒有 GPOS 的
 * mark-to-mark）。泰文的母音與聲調是疊在子音上下的，單獨一個沒問題，
 * 但「上標母音 + 聲調」兩個疊在一起時（例如 เครื่อง 的 รื่），satori 會把
 * 聲調畫在母音同一個位置、整個蓋掉。Chrome 的排版引擎（HarfBuzz）排得對。
 *
 * 也試過 sharp 內建的 Pango：疊字排得對，但它讀不到指定的字型檔，
 * 會掉回系統的泰文字型（有圈的傳統字形、沒有 900 字重）。
 *
 * 只在本機跑 og:build 時需要 Chrome；CI 只跑 og:check（比對文案），不需要。
 * Chrome 路徑可以用 CHROME_PATH 覆蓋。
 */
import { spawn } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const CHROME = process.env.CHROME_PATH || '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

export async function openChrome() {
  const dir = mkdtempSync(join(tmpdir(), 'og-chrome-'));
  const port = 9400 + Math.floor(Math.random() * 400);
  const proc = spawn(CHROME, [
    `--remote-debugging-port=${port}`, `--user-data-dir=${dir}`, '--headless=new',
    '--no-first-run', '--no-default-browser-check', '--disable-extensions', 'about:blank',
  ], { stdio: 'ignore' });
  let ver;
  for (let i = 0; i < 60 && !ver; i++) {
    try { ver = await (await fetch(`http://127.0.0.1:${port}/json/version`)).json(); } catch { await sleep(200); }
  }
  if (!ver) throw new Error(`開不了 Chrome（${CHROME}）—— 可用 CHROME_PATH 指定路徑`);

  const ws = new WebSocket(ver.webSocketDebuggerUrl);
  await new Promise((r, j) => { ws.onopen = r; ws.onerror = j; });
  let id = 0; const pending = new Map();
  ws.onmessage = (ev) => {
    const msg = JSON.parse(ev.data);
    if (msg.id && pending.has(msg.id)) {
      const { res, rej } = pending.get(msg.id); pending.delete(msg.id);
      if (msg.error) rej(new Error(msg.error.message)); else res(msg.result);
    }
  };
  const send = (method, params = {}, sessionId) => new Promise((res, rej) => {
    const mid = ++id; pending.set(mid, { res, rej });
    ws.send(JSON.stringify({ id: mid, method, params, ...(sessionId ? { sessionId } : {}) }));
  });
  const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
  const s = (m, p) => send(m, p, sessionId);
  await s('Page.enable'); await s('Runtime.enable');
  await s('Emulation.setDefaultBackgroundColorOverride', { color: { r: 0, g: 0, b: 0, a: 0 } });

  return {
    /**
     * 一行字 → 去背 PNG（2 倍解析度，再由 satori 以原尺寸放進圖裡）。
     * fontFile 是完整的 TTF（含 900 字重的可變字型），由 build-font-subset 的快取提供。
     */
    async render({ text, fontFile, fontSize, color, weight = 900 }) {
      /*
        上下多留一段：疊在上方的聲調（母音上面再一個聲調）會超出行高，
        只截行高那一格會把它裁掉。pad 回傳給呼叫端，用負邊距抵回來，
        版面位置就跟直接畫字一樣。
      */
      const pad = Math.round(fontSize * 0.35);
      const font = readFileSync(fontFile).toString('base64');
      const html = `<!doctype html><html><head><style>
        @font-face { font-family: X; src: url(data:font/ttf;base64,${font}); font-weight: 100 900; }
        html, body { margin: 0; background: transparent; }
        #t { display: inline-block; font: ${weight} ${fontSize}px/1.08 X; color: ${color}; white-space: nowrap; padding: ${pad}px 2px; }
      </style></head><body><span id="t"></span></body></html>`;
      await s('Page.navigate', { url: 'data:text/html;base64,' + Buffer.from(html).toString('base64') });
      await sleep(150);
      const r = await s('Runtime.evaluate', {
        expression: `(async () => { const t = document.getElementById('t'); t.textContent = ${JSON.stringify(text)};
          await document.fonts.ready; const b = t.getBoundingClientRect(); return [b.x, b.y, b.width, b.height]; })()`,
        awaitPromise: true, returnByValue: true,
      });
      const [x, y, width, height] = r.result.value;
      const shot = await s('Page.captureScreenshot', {
        format: 'png', captureBeyondViewport: true,
        clip: { x, y, width, height, scale: 2 },
      });
      return { src: `data:image/png;base64,${shot.data}`, width: Math.ceil(width), height: Math.ceil(height), pad };
    },
    async close() {
      try { await send('Browser.close'); } catch { /* 已經關了 */ }
      proc.kill();
      try { rmSync(dir, { recursive: true, force: true }); } catch { /* 暫存目錄 */ }
    },
  };
}
