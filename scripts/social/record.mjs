/**
 * 錄 Wall Go 的教學影片素材：在真的本機對戰頁（/wall-go/local/）照 gen-game.mjs 產生的那盤棋，
 * 用滑鼠一步一步點（放子、選子、移動、點牆邊），用 CDP 的 screencast 收每一格畫面。
 *
 *   node scripts/social/record.mjs <locale> <game.json> <outDir> [base=http://localhost:3000]
 *
 * 錄兩段：A 是開局到前幾回合，B 是從快結束的局面（sessionStorage 接回）下完最後幾手、跳出結算。
 * 每段輸出 frames/*.jpg 與 timeline.json（每格的時間戳記），之後由 make-video.mjs 剪成影片。
 */
import { mkdirSync, readFileSync, writeFileSync, rmSync } from 'node:fs';
import { join } from 'node:path';
import { launch, sleep, HIDE_DEV } from './cdp.mjs';

const [locale = 'zh-TW', gameFile, outDir, base = 'http://localhost:3000'] = process.argv.slice(2);
const game = JSON.parse(readFileSync(gameFile, 'utf8'));
const prefix = locale === 'zh-TW' ? '' : `/${locale}`;
const URL_ = `${base}${prefix}/wall-go/local/`;
const SAVE_KEY = 'wallgo:game:local:2';
/** B 段從第幾回合之後接回、下到最後 */
const LATE = Math.max(0, game.turns.length - 3);
const EARLY_TURNS = 4;

// 版面照 540×960 的手機直式排（跟真的手機一樣大的字與按鈕），畫面錄成 2 倍的 1080×1920
const b = await launch({ width: 540, height: 960, scale: 2, native: true });
console.log('viewport', await b.ev('innerWidth+"x"+innerHeight+" @"+devicePixelRatio'));

async function record(name, act) {
  const dir = join(outDir, name);
  rmSync(dir, { recursive: true, force: true });
  mkdirSync(join(dir, 'frames'), { recursive: true });
  const timeline = [];
  let n = 0;
  const onFrame = (m) => {
    if (m.method !== 'Page.screencastFrame') return;
    const file = `f${String(n++).padStart(5, '0')}.jpg`;
    writeFileSync(join(dir, 'frames', file), Buffer.from(m.params.data, 'base64'));
    timeline.push({ file, t: m.params.metadata.timestamp });
    b.s('Page.screencastFrameAck', { sessionId: m.params.sessionId });
  };
  b.on(onFrame);
  const marks = [];
  const mark = (label) => marks.push({ label, t: Date.now() / 1000 });
  await b.s('Page.startScreencast', { format: 'jpeg', quality: 92, maxWidth: 1080, maxHeight: 1920, everyNthFrame: 1 });
  await sleep(300);
  await act(mark);
  await b.s('Page.stopScreencast');
  await sleep(300);
  b.off(onFrame);
  writeFileSync(join(dir, 'timeline.json'), JSON.stringify({ timeline, marks }, null, 1));
  console.log(name, n, 'frames', marks.map((m) => m.label).join(' '));
}

const cell = (p) => `[data-cell="${p.row},${p.col}"]`;
/** 牆存在格子的下緣（H）或右緣（V）；換成「移動後那一格的哪一邊」，再找那一邊的牆邊按鈕 */
function wallSide(to, w) {
  if (w.dir === 'H') return w.row === to.row ? 'bottom' : 'top';
  return w.col === to.col ? 'right' : 'left';
}
async function findWall(to, side) {
  // 四個牆邊按鈕都在那一格裡；照位置判斷是哪一邊（不靠各語系的 aria-label）
  return b.ev(`(()=>{const c=document.querySelector('${cell(to)}');const cb=c.getBoundingClientRect();
    const bs=[...c.querySelectorAll('button')].map(e=>{const r=e.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}});
    const cx=cb.x+cb.width/2, cy=cb.y+cb.height/2;
    const score={top:p=>cy-p.y,bottom:p=>p.y-cy,left:p=>cx-p.x,right:p=>p.x-cx}['${side}'];
    bs.sort((a,b)=>score(b)-score(a));return bs[0]&&score(bs[0])>2?bs[0]:null})()`);
}
async function clickWall(to, side) {
  let pt = null;
  for (let i = 0; i < 20 && !pt; i++) { pt = await findWall(to, side); if (!pt) await sleep(150); }
  if (!pt) throw new Error(`找不到 ${side} 的牆邊 @${to.row},${to.col}`);
  await b.s('Input.dispatchMouseEvent', { type: 'mouseMoved', x: pt.x, y: pt.y });
  await sleep(250);
  for (const type of ['mousePressed', 'mouseReleased']) await b.s('Input.dispatchMouseEvent', { type, x: pt.x, y: pt.y, button: 'left', clickCount: 1 });
}
async function playTurn(t, mark) {
  mark('select');
  await b.clickSel(cell(t.from)); await sleep(650);
  if (t.to.row !== t.from.row || t.to.col !== t.from.col) { mark('move'); await b.clickSel(cell(t.to)); await sleep(650); }
  mark('wall');
  try { await clickWall(t.to, wallSide(t.to, t.wall)); }
  catch {
    // 偶爾第一下沒選到（頁面剛接回、還在換人）：從選子重來一次
    console.log('  retry turn', t.from, t.to);
    await b.clickSel(cell(t.from)); await sleep(650);
    if (t.to.row !== t.from.row || t.to.col !== t.from.col) { await b.clickSel(cell(t.to)); await sleep(650); }
    await clickWall(t.to, wallSide(t.to, t.wall));
  }
  await sleep(1100);
}

// ── A：開局＋前幾回合
await b.goto(URL_);
await b.ev(`sessionStorage.clear()`);
await b.goto(URL_);
await sleep(3500); await b.ev(HIDE_DEV); await sleep(400);
await record('A', async (mark) => {
  mark('intro'); await sleep(2200);
  mark('place');
  for (const p of game.placements) { await b.clickSel(cell(p)); await sleep(700); }
  await sleep(300);
  for (const t of game.turns.slice(0, EARLY_TURNS)) await playTurn(t, mark);
  mark('end');
});

// ── B：接回快結束的局面，下完最後幾手
await b.ev(`sessionStorage.setItem('${SAVE_KEY}', ${JSON.stringify(game.wgfs[LATE])})`);
await b.goto(URL_);
await sleep(3500); await b.ev(HIDE_DEV); await sleep(400);
await record('B', async (mark) => {
  mark('late'); await sleep(800);
  for (const t of game.turns.slice(LATE)) await playTurn(t, mark);
  mark('result'); await sleep(4200);
  mark('end');
});
b.close();
process.exit(0);
