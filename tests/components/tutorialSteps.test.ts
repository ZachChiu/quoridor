import { describe, expect, it } from 'vitest';
import { STEPS } from '@/components/tutorialSteps';
import { STEP_TEXT } from '@/i18n/content/steps';
import { ownerByCellFor } from '@/game/territory';
import type { Player, PlayerKey } from '@/game/types';
import type { TutorialBoardProps } from '@/components/TutorialBoard';

/**
 * 教學插圖的領地是由規則推導的，所以「這張圖在示範什麼」可以被驗證。
 *
 * 會有這組測試是因為踩過兩次：
 * 1. 手寫的領地座標和牆對不上 —— 第 7 步畫成 5:3，依規則其實是 8:8
 * 2. 盤上只有一顆棋子時整盤會變成他的領地，第 3、4 步整張染紅，
 *    看起來像他已經贏了
 */
function ownership(board: TutorialBoardProps) {
  const size = board.size ?? 4;
  const grid = <T,>(fill: T) => Array.from({ length: size }, () => Array<T>(size).fill(fill));
  const cells: Player[][] = grid(null as Player);
  for (const p of board.pieces ?? []) cells[p.at[0]][p.at[1]] = p.player;
  const horizontalWalls: Player[][] = grid(null as Player);
  const verticalWalls: Player[][] = grid(null as Player);
  for (const w of board.hWalls ?? []) horizontalWalls[w.at[0]][w.at[1]] = w.player;
  for (const w of board.vWalls ?? []) verticalWalls[w.at[0]][w.at[1]] = w.player;

  const owner = ownerByCellFor(cells, { horizontalWalls, verticalWalls });
  const counts: Record<string, number> = {};
  for (const k of Object.values(owner)) counts[k] = (counts[k] ?? 0) + 1;
  return { counts, total: size * size };
}

describe('教學插圖', () => {
  it.each(STEPS.map((s, i) => [i + 1, STEP_TEXT['zh-TW'][i].title, s.board] as const))(
    '第 %i 步「%s」的盤面不會整張變成單一玩家的領地',
    (_i, _title, board) => {
      const { counts, total } = ownership(board);
      for (const [player, n] of Object.entries(counts)) {
        expect(n, `${player} 佔了 ${n}/${total} 格`).toBeLessThan(total);
      }
    }
  );

  it('每一步至少有兩位玩家的棋子 —— 只有一方時整盤都會算成他的', () => {
    STEPS.forEach((step, i) => {
      const players = new Set((step.board.pieces ?? []).map((p) => p.player));
      expect(players.size, `「${STEP_TEXT['zh-TW'][i].title}」只有 ${[...players].join('')} 一方`).toBeGreaterThan(1);
    });
  });

  it('最後一步要示範「格數最多的人獲勝」，所以兩方的地不能一樣多', () => {
    const last = STEPS[STEPS.length - 1];
    const { counts } = ownership(last.board);
    const values = (['A', 'B', 'C'] as PlayerKey[]).map((k) => counts[k] ?? 0).filter((n) => n > 0);
    expect(values.length).toBeGreaterThan(1);
    expect(new Set(values).size, `目前是 ${values.join(':')}，平手示範不出勝負`).toBe(values.length);
  });
});
