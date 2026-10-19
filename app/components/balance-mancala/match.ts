import type { Difficulty } from '@/games/balance-mancala/ai';
import type { Seat } from '@/games/balance-mancala/engine';

/**
 * 開局設定。跟電腦玩：你坐 A，其餘都是電腦（4–7 席）。
 * 多人同一台：2–7 人，少於 4 人時電腦補到 4 席（研究的模擬：少於 4 席局太短、分數太低）。
 */
export type MatchSetup = {
  mode: 'solo' | 'local';
  /** 總席數 4–7 */
  seats: number;
  /** 真人數（跟電腦玩是 1） */
  humans: number;
  difficulty: Difficulty;
};

export const DEFAULT_SETUP: MatchSetup = { mode: 'solo', seats: 4, humans: 1, difficulty: 'normal' };

/**
 * 真人坐哪幾席。多人同一台時把真人平均分散（2 人 4 席坐 A、C），
 * 電腦不會連著動好幾手，每個人等的時間比較平均。
 */
export function humanSeatsOf(m: MatchSetup): Seat[] {
  if (m.mode === 'solo') return [0];
  const h = Math.max(1, Math.min(m.humans, m.seats));
  return Array.from({ length: h }, (_, i) => Math.round((i * m.seats) / h));
}

/** 多人同一台：真人數 → 總席數（電腦補到 4 席） */
export const localSeats = (humans: number) => Math.max(4, humans);
