import { createTour, isComplete, isStuck, move, tapKind, type Square, type Tour } from './engine';

/**
 * 節目模式：照《魔鬼的計謀：死亡密室》的 RULE 卡（docs/games-deep-s2.md §4）。
 * 純函式、零副作用；時間一律由呼叫端傳進來（now），測試才能固定。
 *
 * - 6×6 → 7×7 → 8×8 三關連續，總時限 60 分鐘，三關都走完就成功
 * - 走到走過的格（revisit）或還沒走完就沒路可走（stuck）→ 這一關整盤清空重來
 * - 計時從第一關放下騎士那一刻開始（讓人先看清楚規則），之後一路不停：
 *   過關到按「下一關」之間、失敗到按「重來」之間都照算 —— 節目裡的時鐘也沒有停
 *
 * 失敗與過關都停在原地等玩家按鈕（failed／cleared），而不是自動清空、自動換關：
 * 自動清空的話，玩家來不及看清楚自己卡在哪裡，盤面就不見了。
 */
export const SHOW_SIZES = [6, 7, 8] as const;
export const SHOW_TIME_LIMIT_MS = 60 * 60 * 1000;

export type ShowStatus =
  | 'playing'
  /** 這一關失敗，等玩家按「重來」（整盤清空） */
  | 'failed'
  /** 這一關走完了，等玩家按「下一關」 */
  | 'cleared'
  /** 三關全破 */
  | 'won'
  | 'timeUp';

export type ShowFailure = { reason: 'revisit' | 'stuck'; square: Square };

export type ShowRun = {
  /** 第幾關（0 起算），對應 SHOW_SIZES */
  readonly level: number;
  readonly tour: Tour;
  /** 放下第一顆騎士的時間；之前不計時 */
  readonly startedAt: number | null;
  /** 每一關走完時，從開始算起過了多久（ms） */
  readonly splits: readonly number[];
  /** 每一關挑戰了幾次（含現在這一次） */
  readonly attempts: readonly number[];
  readonly status: ShowStatus;
  readonly failure: ShowFailure | null;
  /** 全破或時間到的那一刻 */
  readonly endedAt: number | null;
};

export function startShow(): ShowRun {
  return {
    level: 0, tour: createTour(SHOW_SIZES[0]), startedAt: null,
    splits: [], attempts: [1], status: 'playing', failure: null, endedAt: null,
  };
}

const over = (run: ShowRun) => run.status === 'won' || run.status === 'timeUp';

/** 時間到就結束。每一個動作之前、以及畫面上的計時器每一跳都先過這一關 */
export function showTick(run: ShowRun, now: number): ShowRun {
  if (over(run) || run.startedAt === null || now - run.startedAt < SHOW_TIME_LIMIT_MS) return run;
  return { ...run, status: 'timeUp', endedAt: run.startedAt + SHOW_TIME_LIMIT_MS };
}

/**
 * 點一格。合法的就走；走到走過的格子是犯規（整關失敗）；
 * 不是騎士步、點騎士自己這種「沒有走出去」的點擊不算犯規，局面不變（畫面另外提示）。
 */
export function showTap(run: ShowRun, sq: Square, now: number): ShowRun {
  const r = showTick(run, now);
  if (r.status !== 'playing') return r;
  const kind = tapKind(r.tour, sq);
  if (kind === 'revisit') return { ...r, status: 'failed', failure: { reason: 'revisit', square: sq } };
  if (kind !== 'start' && kind !== 'move') return r;

  const tour = move(r.tour, sq);
  const startedAt = r.startedAt ?? now;
  if (isComplete(tour)) {
    const splits = [...r.splits, now - startedAt];
    if (r.level === SHOW_SIZES.length - 1) return { ...r, tour, startedAt, splits, status: 'won', endedAt: now };
    return { ...r, tour, startedAt, splits, status: 'cleared' };
  }
  if (isStuck(tour)) return { ...r, tour, startedAt, status: 'failed', failure: { reason: 'stuck', square: sq } };
  return { ...r, tour, startedAt };
}

/** 這一關整盤清空、再挑戰一次。失敗之後按「重來」，或自己覺得走不完了主動重來，都走這裡 */
export function showRetry(run: ShowRun, now: number): ShowRun {
  const r = showTick(run, now);
  if (r.status !== 'failed' && !(r.status === 'playing' && r.tour.path.length > 0)) return r;
  const attempts = r.attempts.map((a, i) => (i === r.level ? a + 1 : a));
  return { ...r, tour: createTour(r.tour.n), attempts, status: 'playing', failure: null };
}

/** 過關之後進下一關 */
export function showNext(run: ShowRun, now: number): ShowRun {
  const r = showTick(run, now);
  if (r.status !== 'cleared') return r;
  const level = r.level + 1;
  return { ...r, level, tour: createTour(SHOW_SIZES[level]), attempts: [...r.attempts, 1], status: 'playing', failure: null };
}

/** 已經用掉的時間（ms），最多 60 分鐘 */
export function showElapsed(run: ShowRun, now: number): number {
  if (run.startedAt === null) return 0;
  return Math.min(SHOW_TIME_LIMIT_MS, Math.max(0, (run.endedAt ?? now) - run.startedAt));
}

/** 剩下的時間（ms） */
export function showRemaining(run: ShowRun, now: number): number {
  return SHOW_TIME_LIMIT_MS - showElapsed(run, now);
}

/** 計時器還在跑嗎（放下騎士之後、結束之前） */
export function showRunning(run: ShowRun): boolean {
  return run.startedAt !== null && !over(run);
}
