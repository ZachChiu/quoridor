import type { RoomPlayer } from './room';

/** 用這種房間的遊戲（跟網址、catalog 的 id 一樣） */
export type TurnGame = 'nine-mens-morris' | 'blind-gomoku' | 'balance-mancala';

/** 座位鍵 s0..s7。不用數字當鍵：RTDB 讀回來會把 0、1、2… 的物件變成陣列 */
export type SeatKey = `s${number}`;

/** 一間房最多幾個座位（安全規則也寫死這個數字） */
export const MAX_ROOM_SEATS = 8;

/**
 * 輪流下的遊戲共用的連線房（Firebase RTDB `turnRooms/{roomId}/`）。
 * 九子棋、盲眼五子棋、均衡曼卡拉共用這一份結構與安全規則，各款只決定 setup 與 moves 字串怎麼寫。
 * 尼泊爾虎棋早一步做、有自己的 `baghRooms`（座位是老虎／羊），Wall Go 是 `rooms`（WGF），都不動。
 *
 *   id         string
 *   game       TurnGame          —— 哪一款；貼錯遊戲的連結當作找不到房間
 *   seats      2..8              —— 幾個座位，坐滿就開打
 *   setup      string            —— 開局設定（各款自己編，例如曼卡拉的人數與子數），建房後不能改
 *   host       SeatKey           —— 開房的人坐哪
 *   createdAt  number
 *   players    { s0?, s1?, … }   —— 空位只能坐自己
 *   moves      string            —— 整串走法（各款自己的格式）；還沒人走時不存在
 *   turn       SeatKey           —— 只有輪到的人能寫 moves 與 turn（規則看寫入前的 turn）
 *
 * 沒有 status、winner：勝負由 moves 推導，每台裝置各自重走一次（也順便驗合不合規則）。
 * 看得到整個房間就看得到整串走法 —— 盲眼五子棋的黑白、誰是誰，打開開發者工具查得到；
 * 跟 Wall Go 一樣是「跟朋友玩」的信任程度，沒有後端可以藏資料。
 */
export type TurnRoom = {
  id: string;
  game: TurnGame;
  seats: number;
  setup: string;
  host: SeatKey;
  createdAt: number;
  players?: Partial<Record<SeatKey, RoomPlayer>>;
  moves?: string;
  turn: SeatKey;
};

export const seatKey = (i: number): SeatKey => `s${i}`;
export const seatIndex = (k: SeatKey): number => Number(k.slice(1));
