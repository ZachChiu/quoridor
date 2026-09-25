import { describe, it, expect } from 'vitest';
import {
  createGame, isPlacingPhase, openingOrder, placeOpeningPiece,
  legalTurns, applyTurn, isGameOver, skipUnplayable, toWgf, replay,
} from '@/game/engine';
import type { GameState } from '@/game/types';
import { readFileSync } from 'node:fs';

/**
 * WGF 字串長度的上界。
 *
 * 這不是為了測序列化 —— 是為了確認 `database.rules.json` 的
 * `wgf.length` 上限有依據。訂太小的後果特別惡劣：
 * 前面幾十手都同步正常，直到某一局下得夠長才突然寫入被拒，
 * 而畫面上只會看到「對手不動了」。
 *
 * 所以這裡把兩人與三人局各隨機打完整局，量真實的最大值。
 */

/** 用固定種子的 PRNG，讓失敗可重現。 */
function rng(seed: number) {
  let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 0x100000000);
}

function playRandomGame(playersNum: 2 | 3, seed: number): GameState {
  const rand = rng(seed);
  let state = createGame(playersNum);

  // 開局擺子：依 openingStep 順序隨機挑空格。
  let guard = 0;
  while (isPlacingPhase(state) && guard++ < 200) {
    const empty: [number, number][] = [];
    for (let r = 0; r < state.board.length; r++)
      for (let c = 0; c < state.board.length; c++)
        if (!state.board[r][c]) empty.push([r, c]);
    const [r, c] = empty[Math.floor(rand() * empty.length)];
    state = placeOpeningPiece(state, r, c);
  }
  expect(openingOrder(playersNum).length).toBeGreaterThan(0);

  // 正式回合：隨機挑一個合法回合，直到終局。
  guard = 0;
  while (!isGameOver(state) && guard++ < 500) {
    state = skipUnplayable(state);
    if (isGameOver(state)) break;
    const turns = legalTurns(state);
    if (turns.length === 0) break;
    state = applyTurn(state, turns[Math.floor(rand() * turns.length)]);
  }
  expect(guard).toBeLessThan(500); // 沒有因為 guard 而中斷 —— 是真的下完
  return state;
}

describe('WGF 長度上界', () => {
  /*
    上限直接從規則檔讀，不在這裡另寫一個數字 —— 先前寫死 4096，
    規則換成線上那份（20000）之後，兩邊就悄悄對不上了。
  */
  const rules = JSON.parse(readFileSync('database.rules.json', 'utf8').replace(/\/\*[\s\S]*?\*\//g, ''));
  const LIMIT = Number(/length <= (\d+)/.exec(rules.rules.rooms.$roomId.wgf['.validate'])?.[1]);
  it('讀得到規則裡的上限', () => expect(LIMIT).toBeGreaterThan(0));

  for (const playersNum of [2, 3] as const) {
    it(`${playersNum} 人局隨機打完 40 局，WGF 都遠小於 rules 上限`, () => {
      let max = 0;
      let worst = '';
      for (let seed = 1; seed <= 40; seed++) {
        const end = playRandomGame(playersNum, seed);
        const wgf = toWgf(end);
        if (wgf.length > max) { max = wgf.length; worst = wgf; }

        // 順帶確認：序列化 → 反序列化後盤面一致。
        expect(replay(wgf).board).toEqual(end.board);
      }
      // 留三倍餘裕才算安全 —— 剛好卡在上限等於沒訂。
      expect(max).toBeLessThan(LIMIT / 3);
      expect(worst.length).toBe(max);
      console.log(`  ${playersNum} 人局最長 WGF：${max} 字元（上限 ${LIMIT}）`);
    });
  }
});
