import { decodeMoves, replay, type GomokuState, type Side } from './engine';

/**
 * 盲五子棋的連線房：用平台共用的 `turnRooms`（結構與安全規則見 types/turnRoom.ts、hook/useTurnRoom.ts），
 * 這款只決定三件事。純函式，畫面在 components/blind-gomoku/GomokuOnline.tsx。
 *
 * - 座位：兩個，`s0` 是黑（先下）、`s1` 是白。開房的人選自己執黑或執白，就是坐 s0 或 s1；永遠從 s0 開始
 * - setup：`blind` 或 `classic`（盲棋或一般五子棋），建房後不能改
 * - moves：engine 的 encodeMoves（每手「位置＋顏色代碼」，黑白不寫，第幾手就決定是誰的子）
 *
 * 網址：`/blind-gomoku/online#new=blind-black`（開房：盲棋、自己執黑），開好換成 `#roomId=…`。
 *
 * 盲棋的兩個人各自選色，沒有對電腦時「跟你上一手同色」那條（那是節目裡 AI 的規矩）。
 * 黑白寫在走法的順序裡，打開開發者工具查得到 —— 跟朋友玩的信任程度，見 types/turnRoom.ts。
 */
export const ONLINE_SEATS = 2;

export type OnlineSetup = { blind: boolean };

export const seatOf = (s: Side): number => (s === 'black' ? 0 : 1);
export const sideOfSeat = (seat: number): Side => (seat === 0 ? 'black' : 'white');

export function encodeSetup({ blind }: OnlineSetup): string {
  return blind ? 'blind' : 'classic';
}

/** 看不懂（別款的房間、被竄改）回 null */
export function decodeSetup(text: string): OnlineSetup | null {
  return text === 'blind' ? { blind: true } : text === 'classic' ? { blind: false } : null;
}

/** 開房的網址 hash：`#new=blind-black` */
export function newRoomHash(blind: boolean, side: Side): string {
  return `#new=${encodeSetup({ blind })}-${side}`;
}

/**
 * `#new=…` → 開房設定（交給 useTurnRoom 的 parseRoomHash）。看不懂回 null，畫面當作連結壞了。
 * 回傳的形狀就是 useTurnRoom 的 NewSeat（這裡不 import 它：hook 檔是 client 端的，規則這層保持乾淨）。
 */
export function parseNewRoom(p: URLSearchParams): { seats: number; seat: number; setup: string; turn: number } | null {
  const m = /^(blind|classic)-(black|white)$/.exec(p.get('new') ?? '');
  if (!m) return null;
  return { seats: ONLINE_SEATS, seat: seatOf(m[2] as Side), setup: m[1], turn: seatOf('black') };
}

/** 房間裡的整串走法 → 局面。解不開、中間有不合規則的一手就丟錯（畫面當作連線壞了，不畫出一盤錯的棋） */
export function roomGame(moves: string): GomokuState {
  return replay(decodeMoves(moves));
}
