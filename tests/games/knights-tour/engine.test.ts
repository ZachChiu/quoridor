import { describe, it, expect } from 'vitest';
import {
  createTour, move, replay, undo, truncate, legalMoves, knightMoves, isKnightMove, isComplete, isStuck,
  tapKind, canStartFrom, colorOf, visitOrder, current, solve, verdict, warnsdorff, hint, lastSolvableLength,
  SIZES, type Square,
} from '@/games/knights-tour/engine';
import {
  startShow, showTap, showRetry, showNext, showTick, showElapsed, showRemaining, SHOW_SIZES, SHOW_TIME_LIMIT_MS,
  type ShowRun,
} from '@/games/knights-tour/show';

/** 座標 → 格子編號（r 由上往下、c 由左往右） */
const sq = (n: number, r: number, c: number): Square => r * n + c;
const sorted = (xs: readonly number[]) => [...xs].sort((a, b) => a - b);

/** 一條路是不是合法的騎士巡邏（每格一次、每步都是「日」字） */
function isTour(n: number, path: readonly Square[]): boolean {
  if (path.length !== n * n || new Set(path).size !== n * n) return false;
  return path.every((s, i) => i === 0 || isKnightMove(n, path[i - 1], s));
}

describe('騎士步', () => {
  it('角落只有 2 步、邊上 3–4 步、中間 8 步', () => {
    expect(sorted(knightMoves(8, sq(8, 0, 0)))).toEqual(sorted([sq(8, 1, 2), sq(8, 2, 1)]));
    expect(sorted(knightMoves(8, sq(8, 7, 7)))).toEqual(sorted([sq(8, 5, 6), sq(8, 6, 5)]));
    expect(knightMoves(8, sq(8, 0, 1))).toHaveLength(3);
    expect(knightMoves(8, sq(8, 0, 3))).toHaveLength(4);
    expect(knightMoves(8, sq(8, 1, 1))).toHaveLength(4);
    expect(knightMoves(8, sq(8, 3, 3))).toHaveLength(8);
    // 5×5 的正中央：八個方向都在盤內
    expect(sorted(knightMoves(5, sq(5, 2, 2)))).toEqual(sorted([
      sq(5, 0, 1), sq(5, 0, 3), sq(5, 1, 0), sq(5, 1, 4), sq(5, 3, 0), sq(5, 3, 4), sq(5, 4, 1), sq(5, 4, 3),
    ]));
  });

  it('不會跨過棋盤邊緣繞到另一邊', () => {
    // 右邊緣的格子往右跳，編號 +1 或 +2 會落到下一列的開頭 —— 不能算
    for (const n of SIZES) {
      for (let s = 0; s < n * n; s++) {
        for (const t of knightMoves(n, s)) expect(isKnightMove(n, s, t), `${n}: ${s}→${t}`).toBe(true);
      }
    }
  });

  it('騎士步是對稱的', () => {
    for (let s = 0; s < 49; s++) {
      for (const t of knightMoves(7, s)) expect(knightMoves(7, t)).toContain(s);
    }
  });
});

describe('走法', () => {
  it('還沒放騎士時每一格都能當起點；放下之後只能走沒走過的「日」字', () => {
    const t = createTour(6);
    expect(legalMoves(t)).toHaveLength(36);
    const a = move(t, sq(6, 0, 0));
    expect(sorted(legalMoves(a))).toEqual(sorted([sq(6, 1, 2), sq(6, 2, 1)]));
    const b = move(a, sq(6, 1, 2));
    expect(legalMoves(b)).not.toContain(sq(6, 0, 0));
    expect(current(b)).toBe(sq(6, 1, 2));
    expect(visitOrder(b)[sq(6, 0, 0)]).toBe(1);
    expect(visitOrder(b)[sq(6, 1, 2)]).toBe(2);
  });

  it('不改傳入的局面，不合法的走法丟錯', () => {
    const t = move(createTour(6), 0);
    const before = JSON.stringify(t);
    move(t, sq(6, 1, 2));
    expect(JSON.stringify(t)).toBe(before);
    expect(() => move(t, 1)).toThrow();
    expect(() => createTour(4)).toThrow();
    expect(() => createTour(11)).toThrow();
  });

  it('悔棋退一步，退到底是空棋盤', () => {
    const t = replay(6, [0, sq(6, 1, 2), sq(6, 0, 4)]);
    expect(undo(t).path).toEqual([0, sq(6, 1, 2)]);
    expect(undo(t, 5).path).toEqual([]);
    expect(truncate(t, 1).path).toEqual([0]);
  });

  it('點格子的分類：起點、合法步、走過的格、不是騎士步', () => {
    const empty = createTour(6);
    expect(tapKind(empty, 20)).toBe('start');
    const t = replay(6, [0, sq(6, 1, 2), sq(6, 2, 0)]);
    expect(tapKind(t, sq(6, 2, 0))).toBe('current');
    expect(tapKind(t, sq(6, 0, 1))).toBe('move');
    expect(tapKind(t, sq(6, 1, 2))).toBe('revisit');
    expect(tapKind(t, sq(6, 3, 3))).toBe('notKnight');
  });
});

describe('走完與卡住', () => {
  it('走滿 n² 格就是走完', () => {
    const s = solve(move(createTour(5), 0));
    expect(s.verdict).toBe('yes');
    if (s.verdict !== 'yes') return;
    const done = replay(5, s.path);
    expect(isComplete(done)).toBe(true);
    expect(isStuck(done)).toBe(false);
    expect(legalMoves(done)).toEqual([]);
    expect(tapKind(done, 0)).toBe('over');
    expect(isComplete(undo(done))).toBe(false);
  });

  it('還沒走完卻沒有格子可走就是卡住（最短的例子：最後鑽進角落）', () => {
    // 5×5 的角落 0 只連到 7=(1,2) 與 11=(2,1)。7 → 18 → 11 → 0：兩個鄰居都走過了，騎士出不來
    const t = replay(5, [7, 18, 11]);
    expect(isStuck(t)).toBe(false);
    const stuck = move(t, 0);
    expect(isStuck(stuck)).toBe(true);
    expect(isComplete(stuck)).toBe(false);
    expect(legalMoves(stuck)).toEqual([]);
    // 6×6 同一招：8=(1,2) → 21 → 13=(2,1) → 0
    expect(isStuck(replay(6, [8, 21, 13, 0]))).toBe(true);
  });

  it('空棋盤不算卡住', () => {
    expect(isStuck(createTour(6))).toBe(false);
  });
});

describe('奇數盤的顏色', () => {
  it('7×7：只有跟角落同色的 25 格走得完，另外 24 格必定失敗（逐格用解題器驗證）', () => {
    let good = 0;
    let bad = 0;
    for (let s = 0; s < 49; s++) {
      const v = verdict(move(createTour(7), s));
      expect(v, `start ${s}`).toBe(canStartFrom(7, s) ? 'yes' : 'no');
      if (canStartFrom(7, s)) good++; else bad++;
      expect(canStartFrom(7, s)).toBe(colorOf(7, s) === colorOf(7, 0));
    }
    expect(good).toBe(25);
    expect(bad).toBe(24);
  });

  it('5×5、9×9 同理；偶數盤每一格都可以', () => {
    for (const n of SIZES) {
      for (let s = 0; s < n * n; s++) {
        const v = verdict(move(createTour(n), s));
        expect(v, `${n}×${n} start ${s}`).toBe(canStartFrom(n, s) ? 'yes' : 'no');
      }
    }
    expect(Array.from({ length: 25 }, (_, s) => s).filter((s) => canStartFrom(5, s))).toHaveLength(13);
    expect(Array.from({ length: 81 }, (_, s) => s).filter((s) => canStartFrom(9, s))).toHaveLength(41);
  });
});

describe('解題器', () => {
  it('6×6、8×8 從每一格出發都在 300 個節點內找到完整的巡邏', () => {
    for (const n of [6, 8]) {
      for (let s = 0; s < n * n; s++) {
        const r = solve(move(createTour(n), s), 300);
        expect(r.verdict, `${n}×${n} start ${s}`).toBe('yes');
        if (r.verdict === 'yes') {
          expect(isTour(n, r.path)).toBe(true);
          expect(r.path[0]).toBe(s);
        }
      }
    }
  });

  it('從走到一半的局面接著解，保留已經走的那一段', () => {
    const start = replay(8, [0, sq(8, 1, 2), sq(8, 0, 4)]);
    const r = solve(start);
    expect(r.verdict).toBe('yes');
    if (r.verdict === 'yes') {
      expect(r.path.slice(0, 3)).toEqual(start.path);
      expect(isTour(8, r.path)).toBe(true);
    }
  });

  it('死路（還沒卡住、但已經走不完）：角落的兩個入口都用掉了', () => {
    // 6×6 的角落 0 只連到 13=(2,1) 與 8=(1,2)。13 → 21 → 8 之後，0 只剩「下一步鑽進去」一條路，
    // 但鑽進去就出不來，還剩 32 格 —— 騎士還有別的路可走，可是這一局已經走不完了
    const corner = replay(6, [13, sq(6, 3, 3), sq(6, 1, 2)]);
    expect(isStuck(corner)).toBe(false);
    expect(legalMoves(corner).length).toBeGreaterThan(1);
    expect(verdict(corner)).toBe('no');
    // 提示：退回第 2 步（13 → 21）就還有救
    expect(verdict(truncate(corner, 2))).toBe('yes');
    expect(hint(corner)).toEqual({ kind: 'undo', keep: 2 });
  });

  it('角落只剩一個出口就只能當終點；終點顏色不對時，開局第三步就注定走不完', () => {
    // 8×8：d5(27) → c7(10) → e8(4)。c7 是 a8 角落的兩個出口之一，a8 只好當終點；
    // 還剩 61 格，終點必須跟騎士腳下（e8）不同色，a8 卻跟 e8 同色。
    // 沒有「死巷的顏色」這條剪枝時，這個局面跑一千萬個節點都證明不了
    const t = replay(8, [27, sq(8, 1, 2), sq(8, 0, 4)]);
    expect(solve(t, 50).verdict).toBe('no');
    expect(hint(t)).toEqual({ kind: 'undo', keep: 2 });
  });

  it('要搜尋才證明得了的死路，也能在上限內證明', () => {
    // 5×5：0 → 11 → 22 → 19 → 12。光看顏色、死巷、連通都看不出來（5 個節點不夠下結論），
    // 要回溯才知道走不完
    const t = replay(5, [0, 11, 22, 19, 12]);
    expect(solve(t, 5).verdict).toBe('unknown');
    expect(verdict(t)).toBe('no');
  });

  it('卡住的局面：解題器說走不完，提示建議退回到真的走得完的那一步', () => {
    const stuck = replay(6, [8, 21, 13, 0]);
    expect(verdict(stuck)).toBe('no');
    const h = hint(stuck);
    expect(h.kind).toBe('undo');
    if (h.kind === 'undo') {
      expect(h.keep).toBeLessThan(stuck.path.length);
      expect(h.keep).toBeGreaterThan(0);
      expect(verdict(truncate(stuck, h.keep))).toBe('yes');
      // 再多留一步就走不完了（退得剛剛好，不會叫人多退）
      expect(verdict(truncate(stuck, h.keep + 1))).toBe('no');
    }
  });

  it('7×7 從錯色的格子出發：連起點都不行，提示要換起點', () => {
    const t = replay(7, [1, sq(7, 2, 0)]);
    expect(verdict(t)).toBe('no');
    expect(lastSolvableLength(t)).toBe(0);
    expect(hint(t)).toEqual({ kind: 'undo', keep: 0 });
  });

  it('節點上限用完就回 unknown，不會一直算下去', () => {
    // 10×10 開局的前幾步亂走，讓解題器要回溯；上限 1 個節點一定不夠
    const t = replay(10, [0, sq(10, 2, 1), sq(10, 4, 0), sq(10, 6, 1)]);
    expect(solve(t, 1).verdict).toBe('unknown');
    expect(['yes', 'unknown']).toContain(solve(t, 50).verdict);
  });

  it('提示：走得完時給下一步，而且照著提示一路走就走完', () => {
    let t = move(createTour(6), sq(6, 2, 2));
    for (let i = 0; i < 35; i++) {
      const h = hint(t);
      expect(h.kind).toBe('move');
      if (h.kind !== 'move') return;
      expect(h.sure).toBe(true);
      t = move(t, h.square);
    }
    expect(isComplete(t)).toBe(true);
    expect(hint(t)).toEqual({ kind: 'done' });
  });

  it('還沒放騎士時，提示建議一個角落', () => {
    const h = hint(createTour(7));
    expect(h).toEqual({ kind: 'move', square: 0, sure: true });
  });

  it('Warnsdorff：選出路最少的格子', () => {
    // 6×6 從 8=(1,2) 出發：跳得到角落 0，角落只剩 1 條出路（另一條是起點本身），一定優先
    const t = move(createTour(6), sq(6, 1, 2));
    expect(legalMoves(t)).toContain(0);
    expect(warnsdorff(t)).toBe(0);
    // 還沒放騎士：出路最少的是角落
    expect(warnsdorff(createTour(6))).toBe(0);
    // 卡住了就沒有建議
    expect(warnsdorff(replay(6, [8, 21, 13, 0]))).toBeNull();
  });
});

describe('節目模式', () => {
  /** 用解題器把目前這一關走完（每一步都照提示），回傳最後的 run */
  function finishLevel(run: ShowRun, now: number): ShowRun {
    let r = run;
    if (r.tour.path.length === 0) r = showTap(r, 0, now);
    const s = solve(r.tour);
    if (s.verdict !== 'yes') throw new Error('level should be solvable');
    for (const x of s.path.slice(r.tour.path.length)) r = showTap(r, x, now);
    return r;
  }

  it('三關依序是 6×6、7×7、8×8，全破就成功並記下總時間', () => {
    let r = startShow();
    expect(r.tour.n).toBe(6);
    expect(r.startedAt).toBeNull();
    r = finishLevel(r, 1000);
    expect(r.status).toBe('cleared');
    expect(r.startedAt).toBe(1000);
    r = showNext(r, 5000);
    expect(r.tour.n).toBe(7);
    r = finishLevel(r, 9000);
    r = showNext(r, 9000);
    expect(r.tour.n).toBe(SHOW_SIZES[2]);
    r = finishLevel(r, 61_000);
    expect(r.status).toBe('won');
    expect(r.splits).toEqual([0, 8000, 60_000]);
    expect(showElapsed(r, 999_999)).toBe(60_000);
  });

  it('走到走過的格子：這一關失敗，按重來整盤清空、挑戰次數 +1', () => {
    let r = startShow();
    r = showTap(r, 0, 0);
    r = showTap(r, sq(6, 1, 2), 10);
    r = showTap(r, sq(6, 0, 4), 20);
    r = showTap(r, sq(6, 1, 2), 30);
    expect(r.status).toBe('failed');
    expect(r.failure).toEqual({ reason: 'revisit', square: sq(6, 1, 2) });
    expect(r.tour.path).toHaveLength(3);
    // 失敗時點盤面沒有作用
    expect(showTap(r, sq(6, 2, 3), 40)).toBe(r);
    r = showRetry(r, 50);
    expect(r.status).toBe('playing');
    expect(r.tour.path).toEqual([]);
    expect(r.attempts).toEqual([2]);
    expect(r.startedAt).toBe(0);
  });

  it('沒路可走：這一關失敗，盤面留著讓人看清楚卡在哪', () => {
    let r = startShow();
    for (const [i, x] of [8, 21, 13, 0].entries()) r = showTap(r, x, i * 100);
    expect(r.status).toBe('failed');
    expect(r.failure).toEqual({ reason: 'stuck', square: 0 });
    expect(r.tour.path).toEqual([8, 21, 13, 0]);
    expect(showRetry(r, 1000).tour.path).toEqual([]);
  });

  it('不是騎士步的點擊不算犯規', () => {
    let r = showTap(startShow(), 0, 0);
    const before = r;
    r = showTap(r, 1, 5);
    expect(r).toBe(before);
    r = showTap(r, 0, 5);
    expect(r).toBe(before);
  });

  it('60 分鐘一到就結束，之後的點擊都沒有作用', () => {
    let r = showTap(startShow(), 0, 1000);
    expect(showRemaining(r, 1000 + 30 * 60_000)).toBe(30 * 60_000);
    r = showTick(r, 1000 + SHOW_TIME_LIMIT_MS - 1);
    expect(r.status).toBe('playing');
    r = showTick(r, 1000 + SHOW_TIME_LIMIT_MS);
    expect(r.status).toBe('timeUp');
    expect(showRemaining(r, 1000 + SHOW_TIME_LIMIT_MS + 5000)).toBe(0);
    expect(showTap(r, sq(6, 1, 2), 1000 + SHOW_TIME_LIMIT_MS + 1)).toBe(r);
    // 時間到之後才點的那一下，也不能偷走一步
    const late = showTap(showTap(startShow(), 0, 0), sq(6, 1, 2), SHOW_TIME_LIMIT_MS + 1);
    expect(late.status).toBe('timeUp');
    expect(late.tour.path).toEqual([0]);
  });

  it('還沒放騎士之前不計時', () => {
    const r = startShow();
    expect(showElapsed(r, 123_456)).toBe(0);
    expect(showTick(r, 10 * SHOW_TIME_LIMIT_MS)).toBe(r);
  });

  it('主動重來：有走過才算一次', () => {
    const r = startShow();
    expect(showRetry(r, 0)).toBe(r);
    const moved = showTap(r, 0, 0);
    const again = showRetry(moved, 10);
    expect(again.tour.path).toEqual([]);
    expect(again.attempts).toEqual([2]);
  });
});
