/**
 * 無頭 Chrome 的最小包裝（CDP over WebSocket，不另裝 puppeteer）。錄影、圖卡都用它。
 * CHROME_PATH 可以覆寫 Chrome 的位置（同 og:build）。
 */
import { spawn } from 'node:child_process';
import { mkdtempSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const CHROME = process.env.CHROME_PATH ?? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome';

/**
 * native：不用 Emulation 模擬視窗，改用 Chrome 自己的視窗大小與縮放（--window-size、--force-device-scale-factor）。
 * screencast 收到的畫面是 CSS 像素，模擬的 deviceScaleFactor 不算進去；要錄 2 倍清晰度的影片得用這個。
 */
export async function launch({ width, height, scale = 1, native = false }) {
  const port = 9400 + Math.floor(Math.random() * 500);
  const proc = spawn(CHROME, [`--remote-debugging-port=${port}`, `--user-data-dir=${mkdtempSync(join(tmpdir(), 'social-'))}`,
    '--headless=new', '--no-first-run', '--hide-scrollbars', '--autoplay-policy=no-user-gesture-required',
    ...(native ? [`--window-size=${width},${height}`, `--force-device-scale-factor=${scale}`] : []), 'about:blank'], { stdio: 'ignore' });
  let ver;
  for (let i = 0; i < 60 && !ver; i++) { try { ver = await (await fetch(`http://127.0.0.1:${port}/json/version`)).json(); } catch { await sleep(200); } }
  const ws = new WebSocket(ver.webSocketDebuggerUrl);
  await new Promise((r) => (ws.onopen = r));
  let id = 0;
  const pend = new Map(), listeners = new Set();
  ws.onmessage = (e) => {
    const m = JSON.parse(e.data);
    if (m.id && pend.has(m.id)) { pend.get(m.id)(m.result ?? {}); pend.delete(m.id); }
    else if (m.method) for (const f of listeners) f(m);
  };
  const send = (method, params = {}, sessionId) => new Promise((r) => {
    const i = ++id; pend.set(i, r);
    ws.send(JSON.stringify({ id: i, method, params, ...(sessionId ? { sessionId } : {}) }));
  });
  const { targetId } = await send('Target.createTarget', { url: 'about:blank' });
  const { sessionId } = await send('Target.attachToTarget', { targetId, flatten: true });
  const s = (m, p) => send(m, p, sessionId);
  if (!native) await s('Emulation.setDeviceMetricsOverride', { width, height, deviceScaleFactor: scale, mobile: false });
  await s('Page.enable');
  // 對局中換頁會跳「確定要離開嗎？」（beforeunload），無頭模式沒人按就一直卡著
  listeners.add((m) => { if (m.method === 'Page.javascriptDialogOpening') s('Page.handleJavaScriptDialog', { accept: true }); });
  const ev = async (x) => (await s('Runtime.evaluate', { expression: x, returnByValue: true, awaitPromise: true })).result?.value;
  if (native) {
    // --window-size 是整個視窗（含無頭模式也有的框），量出頁面實際的高度差、把視窗撐到內容剛好 width×height
    const { windowId, bounds } = await send('Browser.getWindowForTarget', { targetId });
    const inner = await ev('innerHeight');
    if (inner !== height) await send('Browser.setWindowBounds', { windowId, bounds: { width: bounds.width, height: bounds.height + height - inner } });
    await sleep(200);
  }
  const goto = async (url) => {
    const loaded = new Promise((r) => { const f = (m) => { if (m.method === 'Page.loadEventFired') { listeners.delete(f); r(); } }; listeners.add(f); });
    await s('Page.navigate', { url }); await loaded;
  };
  const shot = async (file, clip) => {
    const { data } = await s('Page.captureScreenshot', { format: 'png', ...(clip ? { clip: { ...clip, scale: 1 } } : {}) });
    if (file) writeFileSync(file, Buffer.from(data, 'base64'));
    return Buffer.from(data, 'base64');
  };
  /** 真的滑鼠點擊（在元素中心），跟使用者一樣會觸發 hover、pointer 事件 */
  const clickSel = async (sel) => {
    const r = await ev(`(()=>{const e=document.querySelector(${JSON.stringify(sel)});if(!e)return null;const b=e.getBoundingClientRect();return {x:b.x+b.width/2,y:b.y+b.height/2}})()`);
    if (!r) return false;
    await s('Input.dispatchMouseEvent', { type: 'mouseMoved', x: r.x, y: r.y });
    for (const type of ['mousePressed', 'mouseReleased']) await s('Input.dispatchMouseEvent', { type, x: r.x, y: r.y, button: 'left', clickCount: 1 });
    return true;
  };
  return { s, ev, goto, shot, clickSel, on: (f) => listeners.add(f), off: (f) => listeners.delete(f), close: () => { try { ws.close(); } catch {} proc.kill(); } };
}

/** 開發伺服器的 Next 浮動標籤、錄影時不該出現的東西 */
export const HIDE_DEV = `(()=>{const s=document.createElement('style');s.textContent='nextjs-portal{display:none!important}';document.head.append(s)})()`;
