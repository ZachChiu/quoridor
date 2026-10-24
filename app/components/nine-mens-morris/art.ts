import type { Side } from '@/games/nine-mens-morris/engine';

/**
 * 九子棋的棋盤與棋子的形狀，對局的棋盤（MorrisBoard，SVG）與結算分享圖（shareCard，canvas）共用同一份。
 *
 * 照首頁那幅《遊戲之書》（1283）插圖裡的棋盤（Zach 10/24：「棋盤可以跟視覺圖一樣」）：
 * - 線不是墨線，是**嵌在木頭裡的木條** —— 淺金色的條、兩側深色的邊；交叉處直接接在一起
 * - 棋盤邊上一圈同樣的木條；下方比左右多留一段空木頭（插圖裡放三顆骰子的地方），這裡拿來放被拿掉的子
 * - 棋子是側面看的鐘形小人（圓頭、細頸、喇叭狀的身體），站在交叉點上
 *
 * 座標系：整塊棋盤寬 106、高 118（含木頭邊），中間 100×100 是下棋的正方形。
 */
export const BOARD_W = 106;
export const BOARD_H = 118;
const PAD = 3;

/** 7×7 格線上的座標 0..6 → 棋盤座標（下棋的正方形內 8..92，跟原本的盤面比例一樣） */
export const gx = (i: number) => PAD + 8 + i * 14;

/** 棋盤邊那一圈木條，離邊多遠 */
export const FRAME_INSET = 1.7;

/** 木條：深色的邊（整條的寬）與中間的淺金色（顏色見 palette.ts 的 strip／stripEdge） */
export const STRIP = { edge: 2.7, core: 1.3 };

/** 點的按鈕的大小；站著的棋子比按鈕小一點（MorrisBoard 內縮 4%），白方的墨線框才不會互相碰到 */
export const MAN_BOX = 13.5;
export const MAN_SIZE = MAN_BOX * 0.92;

/** 下方那段空木頭的中線：被拿掉的子躺在這裡 */
export const TRAY_Y = 106;
/** 躺著的子的大小與間距：黑方的從左邊排過來、白方的從右邊排過來，最多 7 顆（剩 2 顆就輸了） */
export const TRAY_BOX = 7.6;
export const trayX = (side: Side, i: number) => (side === 'black' ? 10 + i * 6.9 : BOARD_W - 10 - i * 6.9);

/**
 * 側面看的鐘形小人（viewBox 0 0 100 100）：身體、頸圈、頭三塊。
 * 黑方整個墨色；白方是羊皮紙色加一圈墨線（先用墨色粗線描三塊、再填羊皮紙，外框才會連成一個輪廓）——
 * 不只靠顏色分，色盲或黑白列印都看得出來。
 */
export const MAN_PARTS = [
  'M14 88Q50 99 86 88C82 68 63 58 59 43H41C37 58 18 68 14 88Z',
  'M36 37h28a3.8 3.8 0 0 1 0 7.6H36a3.8 3.8 0 0 1 0-7.6Z',
  'M64.5 24a14.5 14.5 0 1 1-29 0a14.5 14.5 0 1 1 29 0Z',
];
/** 白方那圈墨線的寬（描邊寫兩倍，因為一半會被填色蓋掉） */
export const MAN_OUTLINE = 10;
/** 頭的中心：上一手的子在頭上點一個反色的小點 */
export const MAN_HEAD = { x: 50, y: 24 };
/** 站著的時候腳底在哪：搖晃、倒下都以這裡為軸 */
export const MAN_ORIGIN = '50% 90%';
