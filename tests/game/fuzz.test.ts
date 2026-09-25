import { describe, it, expect } from 'vitest';
import {
  createGame, isPlacingPhase, placeOpeningPiece, legalTurns, playableTurns, applyTurn,
  isGameOver, skipUnplayable, shouldSkipTurn, toWgf, replay,
} from '@/game/engine';
import { computeTerritories } from '@/game/territory';

/*
  這幾項是整局整局地模擬，在 GitHub 的免費機器上會比 Mac 慢 2–3 倍。
  vitest 預設單項 5 秒 —— 本機 2.5 秒的 400 場在 CI 上就會逾時，
  而那不是程式壞了。（v26.9.2 第一次部署就是這樣失敗的；在本機同時跑
  7 份把 CPU 塞滿可以重現。）
*/
const HEAVY_TIMEOUT_MS = 60_000;


function rng(seed: number) { let s = seed >>> 0;
  return () => ((s = (s * 1664525 + 1013904223) >>> 0) / 0x100000000); }

type Violation = { seed: number; turn: number; kind: string; detail: string };

function playAndCheck(playersNum: 2 | 3, seed: number, out: Violation[]) {
  const rand = rng(seed);
  let state = createGame(playersNum);
  let guard = 0;
  while (isPlacingPhase(state) && guard++ < 200) {
    const empty: [number, number][] = [];
    for (let r = 0; r < state.board.length; r++)
      for (let c = 0; c < state.board.length; c++) if (!state.board[r][c]) empty.push([r, c]);
    const [r, c] = empty[Math.floor(rand() * empty.length)];
    state = placeOpeningPiece(state, r, c);
  }

  for (let turn = 0; turn < 400; turn++) {
    const before = state;
    state = skipUnplayable(state);

    // ── 不變量 1：跳過之後，要嘛遊戲結束、要嘛當前玩家真的能動 ──
    // 兩者皆非就是卡死：畫面停在某個人身上，但他做不了任何事。
    if (!isGameOver(state) && playableTurns(state).length === 0) {
      const t = computeTerritories(state);
      out.push({ seed, turn, kind: '卡死',
        detail: `輪到 ${state.currentPlayer} 但無合法手；settled=${t.settled}；` +
          `各家合法手=${(['A','B','C'] as const).slice(0, playersNum).map(p =>
            `${p}:${legalTurns({ ...state, currentPlayer: p, selected: null, remainSteps: 2 }).length}`).join(' ')}；` +
          `shouldSkip=${(['A','B','C'] as const).slice(0, playersNum).map(p =>
            `${p}:${shouldSkipTurn({ ...state, currentPlayer: p, selected: null, remainSteps: 2 })}`).join(' ')}`});
      return;
    }
    if (isGameOver(state)) break;

    // ── 不變量 2：WGF 往返必須連「輪到誰」都一致 ──
    // 不一致的話連線雙方會各自以為輪到不同的人。
    const rt = replay(toWgf(state));
    if (rt.currentPlayer !== state.currentPlayer) {
      out.push({ seed, turn, kind: 'WGF 往返輪次不符',
        detail: `本地 ${state.currentPlayer} vs 重播 ${rt.currentPlayer}` });
      return;
    }

    const turns = playableTurns(state);
    if (turns.length === 0) break;
    state = applyTurn(state, turns[Math.floor(rand() * turns.length)]);

    // ── 不變量 3：破牆次數不會變成負的或憑空增加 ──
    // 初始一律是 1（含兩人局），兩人局是靠 isBreakWallAvailable 擋住不給用，
    // 不是靠把計數設成 0 —— 所以上界固定是 1。
    for (const p of ['A', 'B', 'C'] as const) {
      const n = state.breakWallCount[p];
      if (n < 0 || n > 1) {
        out.push({ seed, turn, kind: '破牆次數異常', detail: `${p}=${n}` });
        return;
      }
    }
    if (state === before && turn > 0) {
      out.push({ seed, turn, kind: '狀態沒有前進', detail: 'applyTurn 回傳同一個 state' });
      return;
    }
  }
}

describe('隨機對局的不變量掃描', () => {
  for (const playersNum of [2, 3] as const) {
    it(`${playersNum} 人局 400 場都不會卡死`, () => {
      const out: Violation[] = [];
      for (let seed = 1; seed <= 400; seed++) playAndCheck(playersNum, seed, out);
      if (out.length) {
        console.log(`\n  ${playersNum} 人局撞到 ${out.length} 次：`);
        for (const v of out.slice(0, 5)) console.log(`   seed ${v.seed} 第 ${v.turn} 回合 [${v.kind}] ${v.detail}`);
      }
      expect(out).toEqual([]);
    }, HEAVY_TIMEOUT_MS);
  }
});
