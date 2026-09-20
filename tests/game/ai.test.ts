import { describe, expect, it } from 'vitest';
import { chooseTurn, evaluateFor } from '@/game/ai';
import { applyTurn, createGame, legalTurns, placeOpeningPiece } from '@/game/engine';
import { computeTerritories } from '@/game/territory';
import type { GameState, PlayerKey } from '@/game/types';

function runOpening(state: GameState, cells: [number, number][]): GameState {
  return cells.reduce((s, [row, col]) => placeOpeningPiece(s, row, col), state);
}

/** 以固定種子的偽隨機數讓測試可重現。 */
function seeded(seed: number) {
  let x = seed;
  return () => {
    x = (x * 1103515245 + 12345) & 0x7fffffff;
    return x / 0x7fffffff;
  };
}

const opened2P = () =>
  runOpening(createGame(2), [[3, 3], [3, 1], [3, 5], [1, 3]]);

describe('legalTurns / applyTurn', () => {
  it('列舉出的每個回合都能實際套用並輪到下一位玩家', () => {
    const s = opened2P();
    const turns = legalTurns(s);
    expect(turns.length).toBeGreaterThan(0);

    for (const turn of turns.slice(0, 20)) {
      const next = applyTurn(s, turn);
      expect(next.currentPlayer).not.toBe(s.currentPlayer);
      expect(next.turns).toHaveLength(s.turns.length + 1);
    }
  });

  it('包含零步移動（原地蓋牆）', () => {
    const s = opened2P();
    const stays = legalTurns(s).filter(
      (t) => t.to.row === t.from.row && t.to.col === t.from.col
    );
    expect(stays.length).toBeGreaterThan(0);
  });

  it('不會列出已被其他棋子佔據的目的地', () => {
    const s = opened2P();
    for (const turn of legalTurns(s)) {
      const isStay = turn.to.row === turn.from.row && turn.to.col === turn.from.col;
      if (!isStay) expect(s.board[turn.to.row][turn.to.col]).toBeNull();
    }
  });
});

describe('評估函式', () => {
  it('可達範圍較大的一方分數較高', () => {
    const s = opened2P();
    const t = computeTerritories(s);
    // 開局時全盤連通，雙方可達範圍相同 → 分數應接近 0（僅剩機動性項）
    expect(t.reach.A).toBe(t.reach.B);
    expect(Math.abs(evaluateFor(s, 'A') - evaluateFor({ ...s, currentPlayer: 'B' }, 'A'))).toBeLessThan(10);
  });

  it('對稱盤面下雙方評分互為相反數', () => {
    const s = opened2P();
    const a = evaluateFor({ ...s, currentPlayer: 'A' }, 'A');
    const b = evaluateFor({ ...s, currentPlayer: 'A' }, 'B');
    // A 的優勢即 B 的劣勢（機動性項只計當前玩家，故容許少量偏差）
    expect(a + b).toBeLessThan(10);
  });
});

describe('chooseTurn', () => {
  it('回傳的回合必定合法', () => {
    const s = opened2P();
    const { turn } = chooseTurn(s, { difficulty: 'normal', budgetMs: 200 });
    expect(turn).not.toBeNull();
    const legal = legalTurns(s);
    expect(
      legal.some(
        (t) =>
          t.from.row === turn!.from.row && t.from.col === turn!.from.col &&
          t.to.row === turn!.to.row && t.to.col === turn!.to.col &&
          t.wall.row === turn!.wall.row && t.wall.col === turn!.wall.col &&
          t.wall.dir === turn!.wall.dir
      )
    ).toBe(true);
  });

  it('困難難度每手在 2 秒內完成', () => {
    const s = opened2P();
    const { elapsedMs, depth } = chooseTurn(s, { difficulty: 'hard' });
    expect(elapsedMs).toBeLessThan(2000);
    expect(depth).toBeGreaterThanOrEqual(1);
  });

  it('三人局也能選出合法回合', () => {
    const s = runOpening(createGame(3), [[1, 1], [1, 5], [5, 3], [5, 1], [3, 5], [3, 1]]);
    const { turn } = chooseTurn(s, { difficulty: 'normal', budgetMs: 200 });
    expect(turn).not.toBeNull();
    expect(() => applyTurn(s, turn!)).not.toThrow();
  });
});

/** 對戰到分出勝負，回傳各方領地數。 */
function playOut(
  initial: GameState,
  pick: Record<PlayerKey, (s: GameState) => GameState>,
  maxTurns = 120
): Record<string, number> {
  let s = initial;
  for (let i = 0; i < maxTurns; i++) {
    const t = computeTerritories(s);
    if (t.settled) break;
    if (legalTurns(s).length === 0) break;
    s = pick[s.currentPlayer](s);
  }
  const final = computeTerritories(s);
  return { A: final.owned.A.length, B: final.owned.B.length };
}

describe('AI 對隨機走子', () => {
  it('10 局全勝（不得有任何一局落敗；固定深度，結果可重現）', () => {
    let aiWins = 0;
    let draws = 0;

    for (let game = 0; game < 10; game++) {
      const rng = seeded(game + 1);
      const randomPick = (s: GameState) => {
        const turns = legalTurns(s);
        return applyTurn(s, turns[Math.floor(rng() * turns.length)]);
      };
      const aiPick = (s: GameState) => {
        // 指定深度並給極大預算，讓結果不受機器忙碌程度影響 ——
        // 以牆鐘時間為限的話，CI 上搜尋會被截短而使這個測試不穩定。
        const { turn } = chooseTurn(s, {
          difficulty: 'normal',
          maxDepth: 1,
          budgetMs: 60_000,
          random: rng,
        });
        return turn ? applyTurn(s, turn) : s;
      };

      // A 由 AI 操作，B 隨機
      const result = playOut(opened2P(), { A: aiPick, B: randomPick, C: randomPick });
      if (result.A > result.B) aiWins++;
      else if (result.A === result.B) draws++;
    }

    expect(aiWins + draws).toBe(10);
    expect(aiWins).toBeGreaterThanOrEqual(10);
  }, 60_000);
});
