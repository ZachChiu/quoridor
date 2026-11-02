/**
 * 用引擎＋電腦對手下完一盤兩人局，寫成「要在頁面上點的動作清單」給錄影腳本用。
 * 輸出：{ placements: [{row,col}], turns: [{from,to,wall}], wgfs: [每一回合下完後的 WGF] }
 *
 *   node scripts/social/gen-game.mjs [seed] > game.json
 */
import { createServer } from 'vite';
import { fileURLToPath } from 'node:url';
const root = fileURLToPath(new URL('../../', import.meta.url));
// 用 vite 的 ssrLoadModule 直接載入 TS（@/ 別名照 tsconfig），跟 vitest 跑測試是同一套
const vite = await createServer({ root, configFile: false, logLevel: 'error', appType: 'custom',
  resolve: { alias: { '@': root + 'app' } }, server: { middlewareMode: true, hmr: false }, optimizeDeps: { noDiscovery: true, include: [] } });
const E = await vite.ssrLoadModule('/app/game/engine.ts');
const AI = await vite.ssrLoadModule('/app/game/ai.ts');
const SC = await vite.ssrLoadModule('/app/game/score.ts');

let seed = Number(process.argv[2] ?? 7);
const random = () => ((seed = (seed * 1103515245 + 12345) % 2147483648) / 2147483648);

let s = E.createGame(2);
const placements = [];
while (E.isPlacingPhase(s)) {
  const p = AI.chooseOpeningPlacement(s, { difficulty: 'normal', random });
  placements.push({ player: s.currentPlayer, ...p });
  s = E.placeOpeningPiece(s, p.row, p.col);
}
const turns = [], wgfs = [E.toWgf(s)];
while (!E.isGameOver(s) && turns.length < 80) {
  const { turn } = AI.chooseTurn(s, { difficulty: 'normal', budgetMs: 400, random });
  if (!turn) break;
  turns.push({ player: s.currentPlayer, ...turn });
  s = E.applyTurn(s, turn);
  wgfs.push(E.toWgf(s));
}
// 圖卡上寫的終局比分，跟結算畫面算的是同一個函式
const scores = SC.getScores(E.computeTerritories(s), 2);
process.stdout.write(JSON.stringify({ placements, turns, wgfs, over: E.isGameOver(s), scores }, null, 1));
await vite.close();
