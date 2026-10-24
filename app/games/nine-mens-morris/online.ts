import type { NewSeat } from '@/hook/useTurnRoom';
import { applyMove, decodeMoves, encodeMoves, replay, type MorrisState, type Move, type Rules, type Side } from './engine';

/**
 * 九子棋怎麼用共用的連線房（turnRooms，結構見 types/turnRoom.ts）。純函式，跟 engine 一樣零 React、零副作用。
 *
 * - 兩個座位：s0 是黑方（先手）、s1 是白方。開房的人在首頁選自己下哪一邊，進房的人坐剩下那個
 * - setup：開局規則。傳統規則 `classic`、節目規則 `show` —— 首頁那顆蠟封開關由開房的人決定，進房的人照著下
 * - moves：engine 的 encodeMoves（`d2 a1-a4 xd7`），每台裝置收到就整串重走（順便驗合不合規則）
 * - turn：局面輪到誰就寫誰的座位。成三之後還要拿子時 engine 的 turn 不變，所以 turn 還是自己 ——
 *   拿子是同一個人的下一筆寫入。房間的規則只看「寫入前輪到誰」，這兩筆都寫得進去，
 *   對方也會先看到連成的線、再看到被拿掉的子（跟電腦對手一樣分兩段）
 */
export const SEAT: Record<Side, number> = { black: 0, white: 1 };
export const SIDE_AT: readonly Side[] = ['black', 'white'];

export function encodeSetup(rules: Rules): string {
  return rules.showRules ? 'show' : 'classic';
}

/** 看不懂（被改過、別款遊戲的設定）回 null */
export function decodeSetup(setup: string): Rules | null {
  if (setup === 'show') return { showRules: true };
  if (setup === 'classic') return { showRules: false };
  return null;
}

/** 開房的網址 hash：`#new=black`、`#new=white&rules=show`（首頁的「邀請朋友」與結算的「再來一局」） */
export function newRoomHash(side: Side, showRules: boolean): string {
  return `#new=${side}${showRules ? '&rules=show' : ''}`;
}

/** 解析 `#new=…`（交給 useTurnRoom 的 parseRoomHash）。看不懂回 null，當作連結壞了 */
export function parseNewRoom(p: URLSearchParams): NewSeat | null {
  const side = p.get('new');
  if (side !== 'black' && side !== 'white') return null;
  const rules = p.get('rules');
  if (rules !== null && rules !== 'show') return null;
  return { seats: 2, seat: SEAT[side], setup: encodeSetup({ showRules: rules === 'show' }), turn: SEAT.black };
}

/** 房間的 setup＋moves → 局面。解不開、不合規則回 null —— 呼叫端當作連線壞了，不畫出一盤錯的棋 */
export function roomGame(setup: string, moves: string): MorrisState | null {
  const rules = decodeSetup(setup);
  if (!rules) return null;
  try {
    return replay(decodeMoves(moves), rules);
  } catch {
    return null;
  }
}

/** 自己走一手：新的局面，加上要寫進房間的整串走法與下一個輪到的座位（成三還要拿子時是自己） */
export function playOnline(game: MorrisState, m: Move): { state: MorrisState; moves: string; turn: number } {
  const state = applyMove(game, m);
  return { state, moves: encodeMoves(state.history), turn: SEAT[state.turn] };
}
