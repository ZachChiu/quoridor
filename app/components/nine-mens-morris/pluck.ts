import { COORDS, type Point, type Side } from '@/games/nine-mens-morris/engine';
import { BOARD_W, MAN_FOOT, MAN_HEAD, MAN_SIZE, TRAY_BOX, TRAY_Y, gx, gy, trayTurn, trayX } from './art';

/**
 * 拿子的手怎麼動（Zach 10/25：「有一隻手去把它拔掉的感覺」）。純計算，MorrisBoard 拿去 element.animate()：
 *
 * 1. 手從拿子那一方坐的那一側、畫面外伸進來，手指張開
 * 2. 食指、拇指一左一右捏住小人的頭
 * 3. 提起來，帶到棋盤下方那段木頭，邊走邊放倒、縮成躺著的大小
 * 4. 放下、手指張開，手縮回畫面外
 *
 * 誰坐哪一側：被拿掉的子躺在拿走它的人那一側 —— 白子躺在右邊，所以拿白子的是黑方、從右邊伸進來；
 * 黑子躺在左邊，拿黑子的白方從左邊。袖子照插圖：左邊那位朱紅條紋、右邊那位土黃條紋。
 *
 * 被拿的那顆在局面裡已經不在了（拿子是走法字串裡的一步，畫面只是補演）：
 * 盤上那一點畫一顆一模一樣的替身（MorrisBoard 的 data-pluck），手帶走的是替身；
 * 下方那一格真正的子先藏著，替身放到同一個位置、手指一張開就換回真的。
 * 替身以頭為軸（transform-origin 在頭的中心）轉、縮，所以頭永遠在手指之間。
 */

/** 手指張開時各轉幾度（食指往外、拇指往外，MorrisHand 的 data-finger 以指根為軸） */
export const FINGER_OPEN = { index: 16, thumb: -16 } as const;
/** 手指張開時，離捏住的那一點最遠到哪（小人方框＝100）：手要從畫面外整隻伸進來，起點至少要退這麼多 */
export const HAND_REACH = 45;

/** 整段多長 */
export const PLUCK_MS = 1900;
/** 各段在整段的哪裡（0..1）：伸到、捏住、提起、到下方、放下、手指張開 */
export const PLUCK_AT = { reach: 0.28, grip: 0.36, lift: 0.47, carry: 0.7, set: 0.77, release: 0.82 } as const;

/** 被拿的是白子 → 黑方的手從右邊來；黑子 → 白方的手從左邊來 */
export const handFrom = (removed: Side): 'left' | 'right' => (removed === 'white' ? 'right' : 'left');
export const handSleeve = (removed: Side): 'red' | 'gold' => (removed === 'white' ? 'gold' : 'red');

/** 小人的頭（手指捏的地方）在方框中心上方多遠（方框的比例） */
const HEAD_ABOVE_CENTER = 0.5 - MAN_HEAD.y / 100;

/** 棋盤座標：站在 p 點上的小人，頭的中心 */
export function standingGrip(p: Point) {
  const { x, y } = COORDS[p];
  return { x: gx(x), y: gy(y) - (MAN_FOOT - MAN_HEAD.y / 100) * MAN_SIZE };
}

/** 棋盤座標：躺在下方第 i 格的子，頭的中心（黑的頭朝左、白的頭朝右） */
export function trayGrip(side: Side, i: number) {
  return { x: trayX(side, i) + Math.sign(trayTurn(side)) * HEAD_ABOVE_CENTER * TRAY_BOX, y: TRAY_Y };
}

type XY = { x: number; y: number };
const px = ({ x, y }: XY) => `${x}px ${y}px`;

export type PluckPlan = {
  /** 手：整隻的位置（捏住那一點，相對棋盤左上角，px） */
  hand: Keyframe[];
  /** 食指、拇指：張開／捏住 */
  index: Keyframe[];
  thumb: Keyframe[];
  /** 替身：相對它原本站的地方，以頭為軸 */
  piece: Keyframe[];
  /** 下方那一格真正的子：手指張開時才出現 */
  tray: Keyframe[];
};

/**
 * 算出整段的關鍵影格。
 * board：棋盤在畫面上的左緣與寬（px）；viewport：畫面寬（px）—— 手的起點、終點要在畫面外
 */
export function pluckPlan({ at, side, slot, board, viewport }: {
  at: Point;
  side: Side;
  /** 被拿掉的子躺在下方第幾格（0 起算） */
  slot: number;
  board: { left: number; width: number };
  viewport: number;
}): PluckPlan {
  const u = board.width / BOARD_W;
  const man = MAN_SIZE * u;
  const scale = (p: XY) => ({ x: p.x * u, y: p.y * u });
  const P = scale(standingGrip(at));
  const S = scale(trayGrip(side, slot));
  const from = handFrom(side);
  // 手整隻在畫面外：捏住那一點再退一個「手指張開的寬」
  const reach = (HAND_REACH / 100) * man + 8;
  const offX = from === 'right' ? viewport - board.left + reach : -board.left - reach;

  const lift = man * 0.55;
  const mid = { x: (P.x + S.x) / 2, y: Math.min(P.y, S.y) - lift - man * 0.35 };
  const turn = trayTurn(side);
  const k = TRAY_BOX / MAN_SIZE;
  const A = PLUCK_AT;
  const midAt = (A.lift + A.carry) / 2;
  const glide = 'cubic-bezier(.45,0,.55,1)';

  // 捏住到放下這一段：手跟替身走同一條路（同樣的 offset、同樣的 easing），頭才會一直在手指之間
  const path: { offset: number; at: XY; easing: string }[] = [
    { offset: A.grip, at: P, easing: 'cubic-bezier(.3,0,.4,1)' },
    { offset: A.lift, at: { x: P.x, y: P.y - lift }, easing: glide },
    { offset: midAt, at: mid, easing: glide },
    { offset: A.carry, at: { x: S.x, y: S.y - lift * 0.45 }, easing: 'cubic-bezier(.3,0,.5,1)' },
    { offset: A.set, at: S, easing: 'linear' },
  ];
  // 替身被提著走時的樣子：先往手的反方向晃一下，再慢慢轉成躺著、縮成下方那格的大小
  const pose = [
    { rotate: 0, scale: 1 },
    { rotate: -Math.sign(turn) * 7, scale: 1 },
    { rotate: turn * 0.45, scale: (1 + k) / 2 },
    { rotate: turn * 0.92, scale: k },
    { rotate: turn, scale: k },
  ];

  const hand: Keyframe[] = [
    { offset: 0, translate: px({ x: offX, y: P.y - man * 0.3 }), easing: 'cubic-bezier(.2,.7,.35,1)' },
    { offset: A.reach, translate: px({ x: P.x, y: P.y - man * 0.04 }), easing: 'ease-in-out' },
    ...path.map(({ offset, at, easing }) => ({ offset, translate: px(at), easing })),
    { offset: A.release, translate: px(S), easing: 'cubic-bezier(.5,0,.8,.5)' },
    { offset: 1, translate: px({ x: offX, y: S.y - man * 0.5 }) },
  ];

  const finger = (open: number): Keyframe[] => [
    { offset: 0, transform: `rotate(${open}deg)` },
    { offset: A.reach, transform: `rotate(${open}deg)`, easing: 'ease-in' },
    { offset: A.grip, transform: 'rotate(0deg)' },
    { offset: A.set, transform: 'rotate(0deg)', easing: 'ease-out' },
    { offset: A.release, transform: `rotate(${open}deg)` },
    { offset: 1, transform: `rotate(${open}deg)` },
  ];

  const rel = (p: XY) => px({ x: p.x - P.x, y: p.y - P.y });
  // 開頭那段（原本是手伸過來的時間）：替身自己在原地掙一下、被拔起來之前晃兩晃（11/1 起畫面上不畫手）
  const tug = (offset: number, y: number, deg: number): Keyframe => ({ offset, translate: px({ x: 0, y: -y * man }), rotate: `${deg}deg`, scale: '1', opacity: 1, easing: 'ease-in-out' });
  const piece: Keyframe[] = [
    { offset: 0, translate: '0px 0px', rotate: '0deg', scale: '1', opacity: 1 },
    tug(A.reach * 0.55, 0, 0),
    tug(A.reach * 0.75, 0.05, -6),
    tug(A.reach * 0.95, 0.02, 5),
    tug((A.reach + A.grip) / 2, 0.06, -3),
    ...path.map(({ offset, at, easing }, i) => ({ offset, translate: rel(at), rotate: `${pose[i].rotate}deg`, scale: `${pose[i].scale}`, opacity: 1, easing })),
    { offset: A.release, translate: rel(S), rotate: `${turn}deg`, scale: `${k}`, opacity: 1 },
    { offset: A.release, translate: rel(S), rotate: `${turn}deg`, scale: `${k}`, opacity: 0 },
    { offset: 1, translate: rel(S), rotate: `${turn}deg`, scale: `${k}`, opacity: 0 },
  ];

  const tray: Keyframe[] = [
    { offset: 0, opacity: 0 },
    { offset: A.release, opacity: 0 },
    { offset: A.release, opacity: 1 },
    { offset: 1, opacity: 1 },
  ];

  return { hand, index: finger(FINGER_OPEN.index), thumb: finger(FINGER_OPEN.thumb), piece, tray };
}
