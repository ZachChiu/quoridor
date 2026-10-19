import type { Side } from '@/games/nine-mens-morris/engine';
import type { Difficulty } from '@/games/nine-mens-morris/ai';

/**
 * 九子棋這一局的設定與棋譜，存在 sessionStorage（只活在這個分頁）。
 *
 * 跟 Wall Go 的重整接回同一個理由：手機切去別的 App 再回來，瀏覽器常常把分頁重新載入，
 * 下到一半的棋整盤不見很傷。每一步都存走法字串（encodeMoves），掛載時 replay 回來；
 * 分出勝負、換模式就清掉。讀寫一律包 try —— 無痕模式、封鎖網站資料時 sessionStorage 會丟錯，
 * 那時只是不能接回，遊戲照玩。
 */
export type MorrisMode = { kind: 'local' } | { kind: 'ai'; human: Side; difficulty: Difficulty };

export type Session = {
  mode: MorrisMode;
  /** 節目規則（見 engine 的 Rules） */
  showRules: boolean;
  /** 走過的動作（encodeMoves 的格式） */
  moves: string;
};

/** 內嵌 script 也用這個 key 判斷要不要先把選單藏起來（見 MorrisGame） */
export const SESSION_KEY = 'nmm:game';

const SIDES: readonly unknown[] = ['black', 'white'];
const LEVELS: readonly unknown[] = ['easy', 'normal', 'hard'];

function isSession(v: unknown): v is Session {
  if (!v || typeof v !== 'object') return false;
  const s = v as Record<string, unknown>;
  const m = s.mode as Record<string, unknown> | undefined;
  if (typeof s.showRules !== 'boolean' || typeof s.moves !== 'string' || !m) return false;
  return m.kind === 'local' || (m.kind === 'ai' && SIDES.includes(m.human) && LEVELS.includes(m.difficulty));
}

export function loadSession(): Session | null {
  try {
    const raw = sessionStorage.getItem(SESSION_KEY);
    const v: unknown = raw ? JSON.parse(raw) : null;
    return isSession(v) ? v : null;
  } catch {
    return null;
  }
}

export function saveSession(s: Session): void {
  try {
    sessionStorage.setItem(SESSION_KEY, JSON.stringify(s));
  } catch {
    // 存不了就只是不能接回
  }
}

export function clearSession(): void {
  try {
    sessionStorage.removeItem(SESSION_KEY);
  } catch {
    // 同上
  }
}
