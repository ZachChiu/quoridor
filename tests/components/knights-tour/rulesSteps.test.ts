import { describe, it, expect } from 'vitest';
import {
  FIGS, PRACTICE_6, TOUR_5, WARNSDORFF_8, WARNSDORFF_8_NEXT,
} from '@/components/knights-tour/RulesSteps';
import { canStartFrom, isComplete, legalMoves, move, replay, verdict, warnsdorff } from '@/games/knights-tour/engine';
import { TEXT } from '@/games/knights-tour/text';

/** 規則頁與說明彈窗的圖：每一張都要是真的走得到的局面，跟文字一一對應 */
describe('規則的六張圖', () => {
  it('每個語系的小標、內文都跟圖一樣多張', () => {
    for (const [locale, t] of Object.entries(TEXT)) {
      expect(t.howSteps, locale).toHaveLength(FIGS.length);
      expect(t.howTitles, locale).toHaveLength(FIGS.length);
    }
  });

  it('每一張的走法都合法（engine 重播得出來），圓點就是下一步能去的格子', () => {
    for (const f of FIGS) {
      const tour = replay(f.n, f.path);
      if (f.targets && f.path.length) expect([...f.targets].sort((a, b) => a - b)).toEqual([...legalMoves(tour)].sort((a, b) => a - b));
    }
  });

  it('第 3 張是一條走完 5×5 的走法，第 2 張是它的開頭', () => {
    expect(isComplete(replay(5, TOUR_5))).toBe(true);
    expect(FIGS[1].path).toEqual(TOUR_5.slice(0, FIGS[1].path.length));
  });

  it('第 4 張的 × 就是 7×7 出發走不完的格子（跟四角不同色的 24 格）', () => {
    const dead = FIGS[3].dead!;
    expect(dead.size).toBe(24);
    for (let sq = 0; sq < 49; sq++) expect(dead.has(sq)).toBe(!canStartFrom(7, sq));
  });

  it('第 5 張（練習）圖上寫「還走得完」，真的走得完', () => {
    expect(verdict(replay(6, PRACTICE_6))).toBe('yes');
  });

  it('第 6 張（訣竅）照「出路最少」走 24 步，閃的那格就是下一步', () => {
    let t = replay(8, [WARNSDORFF_8[0]]);
    while (t.path.length < WARNSDORFF_8.length) t = move(t, warnsdorff(t)!);
    expect(t.path).toEqual(WARNSDORFF_8);
    expect(warnsdorff(t)).toBe(WARNSDORFF_8_NEXT);
    expect(FIGS[5].hinted).toBe(WARNSDORFF_8_NEXT);
  });
});
