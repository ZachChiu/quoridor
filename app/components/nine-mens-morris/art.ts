import type { Side } from '@/games/nine-mens-morris/engine';

/**
 * 九子棋的棋盤與棋子的形狀，對局的棋盤（MorrisBoard，SVG）與結算分享圖（shareCard，canvas）共用同一份。
 *
 * 照首頁那幅《遊戲之書》（1283）插圖裡的棋盤（Zach 10/24：「棋盤可以跟視覺圖一樣」）：
 * - 線不是墨線，是**嵌在木頭裡的木條** —— 淺金色的條、兩側深色的邊；交叉處直接接在一起
 * - 棋盤邊上一圈同樣的木條；下方比左右多留一段空木頭（插圖裡放三顆骰子的地方），這裡拿來放被拿掉的子
 * - 棋子是側面看的鐘形小人（圓頭、細頸、喇叭狀的身體），**腳底**站在交叉點上
 *
 * 座標系：整塊棋盤寬 106、高 118（含木頭邊）。
 *
 * 10/25 Zach：「棋子的定位有點怪」—— 原本把小人的方框置中在交叉點上，交叉點落在小人的胸口，
 * 看起來整顆子掛在線下面、比交叉點低半顆；腳下的粉筆圈也跟著畫在交叉點下面，跟正中央的粉筆點對不上。
 * 側面看的小人，眼睛認的是它站在哪裡（腳底），所以改成腳底對準交叉點（MAN_FOOT），
 * 整個格線往下挪一點（GRID_DROP），最上面一排小人的頭才不會頂到邊框；點的按鈕跟著往上挪，蓋住站在上面的小人（SPOT_Y）。
 */
export const BOARD_W = 106;
export const BOARD_H = 118;
const PAD = 3;

/** 7×7 格線上的座標 0..6 → 棋盤座標（左右：下棋的正方形內 8..92，跟原本的盤面比例一樣） */
export const gx = (i: number) => PAD + 8 + i * 14;
/** 上下整排往下挪：小人從交叉點往上站，最上面一排的頭要有地方放 */
export const GRID_DROP = 4;
export const gy = (i: number) => gx(i) + GRID_DROP;

/** 棋盤邊那一圈木條，離邊多遠 */
export const FRAME_INSET = 1.7;

/** 木條：深色的邊（整條的寬）與中間的淺金色（顏色見 palette.ts 的 strip／stripEdge） */
export const STRIP = { edge: 2.7, core: 1.3 };

/** 點的按鈕的大小；站著的棋子比按鈕小一點（左右各內縮 4%），白方的墨線框才不會互相碰到 */
export const MAN_BOX = 13.5;
export const MAN_SCALE = 0.92;
export const MAN_SIZE = MAN_BOX * MAN_SCALE;

/** 站著的時候腳底在小人方框的哪個高度（0..1）：腳底對準交叉點，搖晃、鞠躬、倒下都以這裡為軸 */
export const MAN_FOOT = 0.9;
export const MAN_ORIGIN = `50% ${MAN_FOOT * 100}%`;

/**
 * 交叉點在按鈕的哪個高度（0..1）。按鈕是 MAN_BOX 的正方形、往上挪，剛好框住站在交叉點上的小人
 * （頭頂只多出一點點）—— 點小人的頭也點得到它自己，不會點到上面那個點。
 * 正中間那條直線上相鄰的點只差 14，按鈕高 13.5：上下兩顆的按鈕不重疊。
 */
export const SPOT_Y = 0.72;
/** 小人的方框在按鈕裡的上緣（按鈕高的比例；負的＝頭頂超出按鈕一點） */
export const MAN_TOP = SPOT_Y - MAN_FOOT * MAN_SCALE;

/** 下方那段空木頭的中線：被拿掉的子躺在這裡（最下面一排的木條與棋盤邊的木條正中間） */
export const TRAY_Y = 107.5;
/** 躺著的子的大小與間距：黑方的從左邊排過來、白方的從右邊排過來，最多 7 顆（剩 2 顆就輸了） */
export const TRAY_BOX = 7.6;
export const trayX = (side: Side, i: number) => (side === 'black' ? 10 + i * 6.9 : BOARD_W - 10 - i * 6.9);
/** 躺著的方向：黑的頭朝左、白的頭朝右（都朝棋盤外） */
export const trayTurn = (side: Side) => (side === 'black' ? -90 : 90);

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
/** 頭的中心：上一手的子在頭上點一個反色的小點；拿子時手指捏的也是這裡 */
export const MAN_HEAD = { x: 50, y: 24 };
