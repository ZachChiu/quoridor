import type { Difficulty } from '@/games/balance-mancala/ai';
import type { Seat } from '@/games/balance-mancala/engine';

/**
 * 開局設定。跟 AI 玩：你坐 A，其餘都是 AI（4–7 席）。
 * 本機對戰：2–7 人，少於 4 人時 AI 補到 4 席（研究的模擬：少於 4 席局太短、分數太低）。
 */
export type MatchSetup = {
  mode: 'solo' | 'local';
  /** 總席數 4–7 */
  seats: number;
  /** 真人數（跟 AI 玩是 1） */
  humans: number;
  difficulty: Difficulty;
};

export const DEFAULT_SETUP: MatchSetup = { mode: 'solo', seats: 4, humans: 1, difficulty: 'normal' };

/**
 * 真人坐哪幾席。本機對戰時把真人平均分散（2 人 4 席坐 A、C），
 * AI 不會連著動好幾手，每個人等的時間比較平均。
 */
export function humanSeatsOf(m: MatchSetup): Seat[] {
  if (m.mode === 'solo') return [0];
  const h = Math.max(1, Math.min(m.humans, m.seats));
  return Array.from({ length: h }, (_, i) => Math.round((i * m.seats) / h));
}

/** 本機對戰：真人數 → 總席數（AI 補到 4 席） */
export const localSeats = (humans: number) => Math.max(4, humans);
