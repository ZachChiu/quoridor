/**
 * 規則圖卡用的盤面：都是站上真的畫面截下來的（不另外畫一套）。
 * 對局的盤面從本機對戰頁截（sessionStorage 接回 gen-game.mjs 那盤棋的某一回合），
 * 「牆擋所有人」那張從規則頁的步驟圖截。盤面不分語言，截一次三個語系共用。
 *
 *   node scripts/social/capture-boards.mjs <game.json> <outDir> [base=http://localhost:3000]
 */
import { mkdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { launch, sleep, HIDE_DEV } from './cdp.mjs';

const [gameFile, outDir, base = 'http://localhost:3000'] = process.argv.slice(2);
const game = JSON.parse(readFileSync(gameFile, 'utf8'));
mkdirSync(outDir, { recursive: true });
const b = await launch({ width: 540, height: 960, scale: 3 });
const LOCAL = `${base}/wall-go/local/`;
// 靜態圖不要截到棋子閒置時撞牆、被夾扁的那一下（idleMotion 在減少動態效果時關掉）
await b.s('Emulation.setEmulatedMedia', { features: [{ name: 'prefers-reduced-motion', value: 'reduce' }] });

/** 盤面的外框（深色那圈牆）：從 0,0 那格往上找第一個比整片格子大一圈的元素 */
const BOARD_RECT = `(()=>{const c=document.querySelector('[data-cell="0,0"]');const last=document.querySelector('[data-cell="6,6"]');
  const a=c.getBoundingClientRect(), z=last.getBoundingClientRect();let e=c;
  while(e&&e.parentElement){e=e.parentElement;const r=e.getBoundingClientRect();if(r.left<a.left-4&&r.top<a.top-4&&r.right>z.right+4)return {x:r.x,y:r.y,width:r.width,height:r.height}}return null})()`;

async function at(turns) {
  await b.ev(`sessionStorage.setItem('wallgo:game:local:2', ${JSON.stringify(game.wgfs[turns])})`);
  await b.goto(LOCAL);
  await sleep(3000); await b.ev(HIDE_DEV);
  // 滑鼠移出盤面，免得停在某一格上有 hover 效果
  await b.s('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 5, y: 950 });
  await sleep(600);
}
const cell = (p) => `[data-cell="${p.row},${p.col}"]`;
const snap = async (name) => { const r = await b.ev(BOARD_RECT); await b.shot(join(outDir, `${name}.png`), r); console.log(name, Math.round(r.width)); };

await b.goto(LOCAL);
// 盤面中段：看得出牆與地盤
await at(26); await snap('mid');
// 選一顆棋子（灰點是走得到的地方）、走過去之後（四邊半透明的牆邊）
const T = 6;
await at(T);
await b.clickSel(cell(game.turns[T].from)); await sleep(700);
await b.s('Input.dispatchMouseEvent', { type: 'mouseMoved', x: 5, y: 950 }); await sleep(400);
await snap('move');
await b.clickSel(cell(game.turns[T].to)); await sleep(700);
// 滑鼠停在這一手真的要蓋的那一邊：預覽的牆會浮出來（滑鼠移開時四邊只是很淡的短線，縮小後看不出來）
{
  const t = game.turns[T], w = t.wall;
  const side = w.dir === 'H' ? (w.row === t.to.row ? 'bottom' : 'top') : (w.col === t.to.col ? 'right' : 'left');
  const pt = await b.ev(`(()=>{const c=document.querySelector('${cell(game.turns[T].to)}');const cb=c.getBoundingClientRect();
    const bs=[...c.querySelectorAll('button')].map(e=>{const r=e.getBoundingClientRect();return {x:r.x+r.width/2,y:r.y+r.height/2}});
    const cx=cb.x+cb.width/2, cy=cb.y+cb.height/2;const score={top:p=>cy-p.y,bottom:p=>p.y-cy,left:p=>cx-p.x,right:p=>p.x-cx}['${side}'];
    bs.sort((a,b)=>score(b)-score(a));return bs[0]})()`);
  await b.s('Input.dispatchMouseEvent', { type: 'mouseMoved', x: pt.x, y: pt.y }); await sleep(500);
}
await snap('wall');
// 終局：結算關掉、看盤面上的地盤
await at(game.turns.length);
await sleep(1500);
await b.s('Input.dispatchKeyEvent', { type: 'keyDown', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
await b.s('Input.dispatchKeyEvent', { type: 'keyUp', key: 'Escape', code: 'Escape', windowsVirtualKeyCode: 27 });
await sleep(1200);
await snap('final');
// 規則頁第 5 步「牆擋所有人」的圖
await b.goto(`${base}/wall-go/rules/`);
await sleep(3000); await b.ev(HIDE_DEV);
const r = await b.ev(`(()=>{const li=document.querySelectorAll('ol li')[4];const e=li&&li.querySelector('.aspect-square');if(!e)return null;e.scrollIntoView({block:'center'});const r=e.getBoundingClientRect();return {x:r.x+scrollX,y:r.y+scrollY,width:r.width,height:r.height}})()`);
await sleep(600);
const { data } = await b.s('Page.captureScreenshot', { format: 'png', captureBeyondViewport: true, clip: { ...r, scale: 1 } });
(await import('node:fs')).writeFileSync(join(outDir, 'trap.png'), Buffer.from(data, 'base64'));
console.log('trap', Math.round(r.width));
b.close();
process.exit(0);
