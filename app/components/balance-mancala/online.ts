import {
  DEFAULT_PIECES, MAX_SEATS, MIN_SEATS, encodeGame, encodeMove, replay, setupOrderOf,
  type GameConfig, type MancalaState, type Move,
} from '@/games/balance-mancala/engine';
import { MAX_ROOM_SEATS } from '@/types/turnRoom';
import type { NewSeat } from '@/hook/useTurnRoom';

/**
 * 平衡播棋的連線房（共用的 turnRooms，game = 'balance-mancala'；流程在 hook/useTurnRoom.ts）。
 * 這裡只放純函式：網址怎麼開房、房間的字串怎麼變回局面、畫面上的局面怎麼一步一步追上房間。
 *
 * - setup：開局設定，跟整局棋譜的開頭同一個寫法（`5x4`＝5 人、每人 4 顆；`s` 是蛇形，連線目前不開）
 * - moves：整局棋譜去掉開頭，`開局放的格子|每一手`（engine 的 encodeGame）。開局放子也是輪流的，一樣走房間
 * - turn：engine 算出來的下一個該動的座位（遊戲結束後是最後動的那個人）
 *
 * 座位全是真人，坐滿才開打：房間的 s0..s(N-1) 就是 engine 的座位 A..G。
 */

/** 連線局的人數：engine 的 4–7 與房間的 8 取小的（下限 4 是 engine 的規則：少於 4 席局太短、分數太低） */
export const ONLINE_MIN = MIN_SEATS;
export const ONLINE_MAX = Math.min(MAX_SEATS, MAX_ROOM_SEATS);

/** 房間的 setup 字串 */
export function setupOf(c: GameConfig): string {
  return `${c.seats}x${c.pieces}${c.snake ? 's' : ''}`;
}

/** `#new=5` → 開一間 5 人房，開房的人坐 A；第一個放子的是 engine 的開局順序第一位 */
export function parseNew(p: URLSearchParams): NewSeat | null {
  const raw = p.get('new') ?? '';
  if (!/^\d$/.test(raw)) return null;
  const seats = Number(raw);
  if (seats < ONLINE_MIN || seats > ONLINE_MAX) return null;
  const config: GameConfig = { seats, pieces: DEFAULT_PIECES, snake: false };
  return { seats, seat: 0, setup: setupOf(config), turn: setupOrderOf(config)[0] };
}

/** 局面 → 房間的 moves（整局棋譜去掉開頭的設定） */
export function movesOf(s: Pick<MancalaState, 'config' | 'placements' | 'moves'>): string {
  const full = encodeGame(s);
  return full.slice(full.indexOf('|') + 1);
}

/** 房間 → 局面。解不開、不合規則、人數跟房間對不上都丟錯（呼叫端當作連線壞了） */
export function stateOf(setup: string, moves: string, seats: number): MancalaState {
  const s = replay(`${setup}|${moves || '|'}`);
  if (s.config.seats !== seats) throw new Error(`seats mismatch: setup ${s.config.seats}, room ${seats}`);
  return s;
}

/** 畫面上的局面要怎麼追上房間：一樣、下一顆放子、下一手播種（還落後幾手）、或對不上（直接換成房間的局面） */
export type CatchUp =
  | { kind: 'same' }
  | { kind: 'place'; cell: number }
  | { kind: 'move'; move: Move; behind: number }
  | { kind: 'reset' };

export function catchUp(shown: MancalaState, target: MancalaState): CatchUp {
  if (setupOf(shown.config) !== setupOf(target.config)) return { kind: 'reset' };
  const p = shown.placements, q = target.placements;
  if (p.length > q.length || p.some((c, i) => c !== q[i])) return { kind: 'reset' };
  // 比對用棋譜的寫法：走過的手都已經正規化（落在天使／惡魔格的一律帶顏色），兩邊寫出來一樣才是同一手
  const a = shown.moves.map(encodeMove), b = target.moves.map(encodeMove);
  if (a.length > b.length || a.some((m, i) => m !== b[i])) return { kind: 'reset' };
  if (p.length < q.length) return a.length ? { kind: 'reset' } : { kind: 'place', cell: q[p.length] };
  if (a.length < b.length) return { kind: 'move', move: target.moves[a.length], behind: b.length - a.length };
  return { kind: 'same' };
}

/** 房間的局面倒退到最後一手之前（一次落後很多手時，只播最後一手） */
export function beforeLast(target: MancalaState): MancalaState {
  return replay({ config: target.config, placements: target.placements, moves: target.moves }, target.moves.length - 1);
}
