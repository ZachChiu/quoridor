import { useId } from 'react';
import { BOARD_H, BOARD_W, MAN_SIZE } from './art';
import { HAND } from './palette';
import { FINGER_OPEN } from './pluck';

/**
 * 拿子的那隻手（Zach 10/25：「被拔除可以跟視覺圖一樣嗎，有一隻手去把它拔掉的感覺」）。
 * 照首頁那幅《遊戲之書》插圖裡兩個跪著下棋的人畫：很淡的米黃手、細的深褐輪廓、細長的手指，
 * 袖子是條紋窄袖（顏色見 palette.ts 的 HAND）。插圖裡左邊那位把手垂到棋盤上，手腕彎下去、手指朝下 ——
 * 這裡也是：手臂從畫面側邊平平伸進來，手腕往下彎，食指與拇指一左一右捏住小人的頭。
 *
 * 座標以棋子為準：小人的方框是 100（跟 art.ts 的 MAN_PARTS 同一套），(0, 0) 是捏住的那一點（小人的頭）。
 * 手從右邊伸進來時手指朝左下、手臂往右延伸；從左邊進來就整個左右翻過來。
 * 袖子很長（SLEEVE），伸到哪裡都還連著畫面外 —— 多出去的由 .nmm-root 的 overflow: clip 裁掉。
 *
 * 只有食指與拇指會動（張開／捏住，data-finger 的 transform: rotate，以指根為軸），由 MorrisBoard 用 element.animate() 播。
 */

/** 手臂（袖子）多長：手機上約 1900px、桌機約 3200px，從哪一點伸過來都還連著畫面外 */
const SLEEVE = 4800;

const TOP = -142;
const BOTTOM = 12;
const NEAR = -40;
const FAR = 52 + SLEEVE;

/** 手與袖子。from：從哪一邊伸進來；sleeve：哪一位的袖子（左邊那位朱紅、右邊那位土黃） */
export function MorrisHand({ from, sleeve }: { from: 'left' | 'right'; sleeve: 'red' | 'gold' }) {
  const id = useId().replace(/[^a-zA-Z0-9]/g, '');
  const s = HAND[sleeve];
  const flip = from === 'left';
  const x0 = flip ? -FAR : NEAR;
  const w = FAR - NEAR;
  const h = BOTTOM - TOP;
  // 棋子方框（100）→ 棋盤寬的百分比
  const k = MAN_SIZE / 100;
  const line = { stroke: HAND.outline, strokeWidth: 1.8 };
  return (
    <svg viewBox={`${x0} ${TOP} ${w} ${h}`} aria-hidden="true" className="absolute max-w-none overflow-visible"
      style={{ left: `${((x0 * k) / BOARD_W) * 100}%`, top: `${((TOP * k) / BOARD_H) * 100}%`, width: `${((w * k) / BOARD_W) * 100}%`, aspectRatio: `${w} / ${h}` }}>
      <defs>
        {/* 袖子的條紋：一圈一圈的寬帶，帶與帶之間一粗一細兩道線（插圖左邊那位的袖子） */}
        <pattern id={`${id}s`} width={20} height={80} patternUnits="userSpaceOnUse" x={52}>
          <rect width={20} height={80} fill={s.base} />
          <rect x={13} width={3.6} height={80} fill={s.stripe} />
          <rect x={17.6} width={1.2} height={80} fill={s.fine} />
        </pattern>
      </defs>
      <g transform={flip ? 'scale(-1 1)' : undefined} strokeLinejoin="round" strokeLinecap="round">
        {/* 袖子與袖口 */}
        <path d={`M50 -133H${FAR}V-91H50Q43 -112 50 -133Z`} fill={`url(#${id}s)`} {...line} />
        <path d="M38 -136Q30 -112 38 -88L52 -89Q45 -112 52 -135Z" fill={s.base} {...line} />
        <path d="M44 -135.5Q36.5 -112 44 -88.5" fill="none" stroke={s.fine} strokeWidth={2.4} />
        {/* 手背：從手腕往左下彎到指根 */}
        <path d="M40 -127C18 -129 2 -114 -5 -90C-8 -80 -10 -71 -11 -63L-1 -57L16 -52L28 -57C34 -67 40 -80 43 -94Z" fill={HAND.skin} {...line} />
        <path d="M30 -118C16 -114 6 -100 1 -84" fill="none" stroke={HAND.shade} strokeWidth={3} />
        {/* 彎進掌心的中指、無名指、小指 */}
        <path d="M-2 -57C-5 -47 -3 -37 3 -36C7 -35.5 8.5 -39 8 -44C9 -37 14 -35 17 -39C18 -42 18 -46 17 -48C19 -44 24 -44 25 -49C26 -52 26 -55 25 -57" fill={HAND.skin} {...line} />
        <path d="M8 -44C7.5 -48 7.5 -51 8.5 -54M17 -48C16.5 -50 16.5 -52 17 -54" fill="none" stroke={HAND.crease} strokeWidth={1.2} />
        {/* 食指：以指根為軸張開、捏住 */}
        <g transform="translate(-6 -61)">
          <g data-finger="index" style={{ transform: `rotate(${FINGER_OPEN.index}deg)` }}>
            <g transform="translate(6 61)">
              <path d="M-11 -64C-15 -44 -22 -26 -25 -8C-26.5 0 -25.5 5 -21 6.5C-17.5 6 -16.5 1 -16.5 -6C-15 -24 -8 -42 -1 -58Z" fill={HAND.skin} {...line} />
              <path d="M-5 -52C-10 -40 -15 -26 -18 -10" fill="none" stroke={HAND.shade} strokeWidth={2.4} />
              <path d="M-21.5 -27Q-18.5 -25 -15 -28M-24.5 -10Q-21 -8.5 -17.5 -10.5" fill="none" stroke={HAND.crease} strokeWidth={1.2} />
            </g>
          </g>
        </g>
        {/* 拇指 */}
        <g transform="translate(24 -58)">
          <g data-finger="thumb" style={{ transform: `rotate(${FINGER_OPEN.thumb}deg)` }}>
            <g transform="translate(-24 58)">
              <path d="M31 -60C32 -42 27 -22 22 -6C20 0 18.5 5 15 5.5C12 5.5 11.5 1.5 12.5 -4C15.5 -20 17 -38 14 -54Z" fill={HAND.skin} {...line} />
              <path d="M27 -46C25 -32 21 -18 18 -6" fill="none" stroke={HAND.shade} strokeWidth={2.4} />
              <path d="M14.5 -17Q18 -15 22.5 -18" fill="none" stroke={HAND.crease} strokeWidth={1.2} />
            </g>
          </g>
        </g>
      </g>
    </svg>
  );
}
