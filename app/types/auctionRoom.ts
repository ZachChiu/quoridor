import type { Mode } from '@/games/time-auction/engine';
import type { RoomPlayer } from './room';

/** 座位鍵 s0..s5。不用數字當鍵：RTDB 讀回來會把 0、1、2… 的物件變成陣列 */
export type AuctionSeatKey = `s${number}`;
/** 回合鍵 r1..r19（同上，不用數字） */
export type AuctionRoundKey = `r${number}`;

/**
 * 某一席在某一回合按下、放開的時間。**兩個都是伺服器時間**（寫入時填 ServerValue.TIMESTAMP，
 * 安全規則要求 `newData.val() === now`，自己填的數字一律被拒），而且各只能寫一次。
 * 不參加（倒數前或倒數中放手、「這回合不參加」）就是 up 早於回合開始 —— 出價 0。
 */
export type AuctionPress = { down?: number; up?: number };

/** 一回合裡每一席的按鍵紀錄 */
export type AuctionRoundPresses = Partial<Record<AuctionSeatKey, AuctionPress>>;

/**
 * 時間拍賣的連線房（Firebase RTDB `auctionRooms/{roomId}/`）。
 *
 * 不用輪流下的 turnRooms：這款不是輪流下，是**所有人同時按住出價**。房間裡不存「誰出了多少」，
 * 只存每個人按下、放開的伺服器時間；出價、得標、剩餘時間都由每台裝置用同一份資料各自推出來
 * （games/time-auction/online.ts 的 deriveAuction），沒有後端，結果必須能由資料推導、各台一致。
 *
 *   id         string
 *   mode       'quick' | 'show'   —— 快速局／節目局（每人的時間、倒數秒數照 engine 的 MODES）
 *   seats      2..6               —— 幾個人，坐滿才開拍。全是真人，沒有電腦
 *   createdAt  number
 *   players    { s0, s1?, … }     —— 開房的人坐 s0；空位只能坐自己
 *   rounds     { r1: { s0: { down, up }, … }, … }
 *
 * mode、seats、createdAt 建房後不能改。沒有 status、winner、turn：全部由 rounds 推導。
 *
 * **資料庫讀得到每個人放手的時間。** 有人打開開發者工具盯著 rounds，就能在回合進行中知道誰已經放手 ——
 * 沒有後端可以把它藏到回合結束，這跟 Wall Go、盲眼五子棋一樣是「跟朋友玩」的信任程度。
 * 畫面與聲音則刻意不洩漏：別人放手時畫面上什麼都不變、不出聲，只有最後一個人放手、
 * 回合結算的那一刻才公布得標者與秒數（跟節目的大螢幕一樣）。倒數開始前看得到誰已經按住了
 * （節目裡大家的手都放在按鈕上），開始之後就看不到了。
 */
export type AuctionRoom = {
  id: string;
  mode: Mode;
  seats: number;
  createdAt: number;
  players?: Partial<Record<AuctionSeatKey, RoomPlayer>>;
  rounds?: Partial<Record<AuctionRoundKey, AuctionRoundPresses>>;
};

/** 一間房最多幾個座位（engine 的 MAX_SEATS；安全規則也寫死這個數字） */
export const MAX_AUCTION_SEATS = 6;

export const auctionSeatKey = (i: number): AuctionSeatKey => `s${i}`;
export const auctionRoundKey = (n: number): AuctionRoundKey => `r${n}`;
