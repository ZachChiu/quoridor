'use client';
import { useEffect, useId, useLayoutEffect, useRef, type SVGProps } from 'react';
import type { IconType } from 'react-icons';
import { COORDS, MILLS, NEIGHBORS, POINT_NAMES, sideOf, type Cell, type Move, type Point, type Side } from '@/games/nine-mens-morris/engine';
import { BOARD_H, BOARD_W, FRAME_INSET, MAN_BOX, MAN_HEAD, MAN_ORIGIN, MAN_OUTLINE, MAN_PARTS, MAN_SIZE, STRIP, TRAY_BOX, TRAY_Y, gx, trayX } from './art';
import { playIdle } from './idleMotion';
import { NMM } from './palette';

/**
 * 九子棋的棋盤與棋子，照首頁那幅《遊戲之書》（1283）插圖（Zach 10/24：「棋盤可以跟視覺圖一樣」、「棋子有點醜」）：
 * 木頭棋盤上有深淺的斑，線是嵌進去的淺金色木條，邊上一圈同樣的木條，下方多一段空木頭；
 * 棋子是插圖裡那種側面看的鐘形小人，站在交叉點上。形狀與尺寸在 art.ts（分享圖也用同一份）。
 *
 * 「現在可以做的事」一律用羊皮紙色，像粉筆畫在木板上（群青、朱紅在木頭上都看不清楚，見 palette.ts）：
 * - 可以走的子：腳下一圈淡淡的粉筆圈；選起來的子被拿起來（往上浮），原地留一塊粉筆印
 * - 可以走過去的點：粉筆點
 * - 拿子：可以拿的子以腳底為軸左右搖，像快被推倒（.nmm-teeter）—— 取代原本的紅色 ×（Zach：叉叉很醜）
 * - 剛連成的線：木條上蓋一道粉筆，畫出來
 * - 上一手的子：頭上一個反色的小點
 * 放子時每個空點都能放，不畫標記（一整片點只會讓盤面變雜）；滑鼠滑過去才浮出一顆淡淡的子。
 *
 * 被拿掉的子倒下來、躺到下方那段木頭上（插圖裡放骰子的地方）：黑的從左邊排、白的從右邊排。
 *
 * 動作（剛好多一手才播，悔棋、重來、重整接回都不播）：放子從上面落下、走子沿線滑過去、飛子劃一道弧、
 * 連成一線時粉筆畫出來、三顆依序跳一下、被拿的子倒下飛進下方。等的那一方偶爾自己動（idleMotion.ts）。
 */

const reducedMotion = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** 棋盤座標 → 整塊棋盤的百分比位置 */
const left = (x: number) => `${(x / BOARD_W) * 100}%`;
const top = (y: number) => `${(y / BOARD_H) * 100}%`;

/** 鐘形小人。mark：上一手的子，頭上點一個反色小點 */
export function PieceGlyph({ side, mark = false, className = '' }: { side: Side; mark?: boolean; className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
      {side === 'black'
        ? <g fill={NMM.ink}>{MAN_PARTS.map((d) => <path key={d} d={d} />)}</g>
        : (
          <>
            <g fill={NMM.ink} stroke={NMM.ink} strokeWidth={MAN_OUTLINE} strokeLinejoin="round">{MAN_PARTS.map((d) => <path key={d} d={d} />)}</g>
            <g fill={NMM.parchment}>{MAN_PARTS.map((d) => <path key={d} d={d} />)}</g>
          </>
        )}
      {mark && <circle cx={MAN_HEAD.x} cy={MAN_HEAD.y} r={6} fill={side === 'black' ? NMM.parchment : NMM.ink} />}
    </svg>
  );
}

/** Modal 標題列上的棋子圖示，跟 react-icons 同一個介面 */
export const BlackPieceIcon: IconType = ({ className }) => <PieceGlyph side="black" className={`size-[1em] ${className ?? ''}`} />;
export const WhitePieceIcon: IconType = ({ className }) => <PieceGlyph side="white" className={`size-[1em] ${className ?? ''}`} />;

const lineLength = (l: readonly Point[]) => {
  const a = COORDS[l[0]], b = COORDS[l[2]];
  return Math.hypot(gx(b.x) - gx(a.x), gx(b.y) - gx(a.y));
};

function StripLine({ l, ...rest }: { l: readonly Point[] } & SVGProps<SVGLineElement>) {
  const a = COORDS[l[0]], b = COORDS[l[2]];
  return <line x1={gx(a.x)} y1={gx(a.y)} x2={gx(b.x)} y2={gx(b.y)} {...rest} />;
}

/** 木頭、斑、木條、粉筆線。斑用 SVG 的 feTurbulence 畫（插圖的棋盤是一塊塊深淺不一的木色），顏色是插圖取樣的 */
function BoardArt({ uid, mills }: { uid: string; mills: Point[][] }) {
  const clip = `${uid}c`, dark = `${uid}d`, light = `${uid}l`;
  const frame = <rect x={FRAME_INSET} y={FRAME_INSET} width={BOARD_W - FRAME_INSET * 2} height={BOARD_H - FRAME_INSET * 2} />;
  return (
    <svg viewBox={`0 0 ${BOARD_W} ${BOARD_H}`} className="absolute inset-0 size-full" aria-hidden="true">
      <defs>
        <clipPath id={clip}><rect width={BOARD_W} height={BOARD_H} rx={1.6} /></clipPath>
        {/* 雜訊的紅色頻道越低、深色斑越濃；綠色頻道越高、淺色斑越濃（兩張不同的雜訊） */}
        <filter id={dark} x="0" y="0" width="1" height="1" colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="0.05 0.03" numOctaves={3} seed={11} />
          <feColorMatrix type="matrix" values="0 0 0 0 0.471 0 0 0 0 0.278 0 0 0 0 0.090 -2.8 0 0 0 1.3" />
        </filter>
        <filter id={light} x="0" y="0" width="1" height="1" colorInterpolationFilters="sRGB">
          <feTurbulence type="fractalNoise" baseFrequency="0.07 0.035" numOctaves={2} seed={4} />
          <feColorMatrix type="matrix" values="0 0 0 0 0.608 0 0 0 0 0.420 0 0 0 0 0.180 0 2.6 0 0 -1.4" />
        </filter>
      </defs>
      <g clipPath={`url(#${clip})`}>
        <rect width={BOARD_W} height={BOARD_H} fill={NMM.wood} />
        <rect width={BOARD_W} height={BOARD_H} filter={`url(#${dark})`} />
        <rect width={BOARD_W} height={BOARD_H} filter={`url(#${light})`} />
      </g>
      <rect x={0.5} y={0.5} width={BOARD_W - 1} height={BOARD_H - 1} rx={1.3} fill="none" stroke={NMM.woodDark} strokeWidth={1} />
      {/* 木條：先畫整條深色的邊，再把淺金色疊上去 —— 交叉的地方淺色自然接在一起，跟插圖一樣 */}
      <g fill="none" stroke={NMM.stripEdge} strokeWidth={STRIP.edge} strokeLinecap="square">
        {frame}
        {MILLS.map((l, i) => <StripLine key={i} l={l} />)}
      </g>
      <g fill="none" stroke={NMM.strip} strokeWidth={STRIP.core} strokeLinecap="square">
        {frame}
        {MILLS.map((l, i) => <StripLine key={i} l={l} />)}
      </g>
      {/* 剛連成的線：木條上蓋一道粉筆（壓在棋子底下） */}
      <g stroke={NMM.parchment} strokeWidth={3.2} strokeLinecap="round" opacity={0.95}>
        {mills.map((l) => {
          const len = lineLength(l);
          return <StripLine key={l.join('-')} l={l} data-mill="" data-len={len} strokeDasharray={len} />;
        })}
      </g>
    </svg>
  );
}

/** 一個點的位置與大小（整塊棋盤的百分比） */
const pointStyle = (x: number, y: number) => ({ left: left(gx(x)), top: top(gx(y)), width: `${(MAN_BOX / BOARD_W) * 100}%` });

/**
 * 一個點上畫的東西：棋子、腳下的粉筆、粉筆點、浮出來的子。對局的棋盤（每個點是按鈕）與規則的小圖（靜態）共用，
 * 規則頁畫出來的就是對局裡看到的樣子。
 * hover：對局才有的「滑鼠滑過才浮出」—— 小圖沒有滑鼠互動，浮出的子直接畫成半透明。
 */
function PointMarks({ cell, selected, removable, movable, mark, target, ghost, from, hover = false }: {
  cell: Cell;
  selected: boolean;
  removable: boolean;
  movable: boolean;
  mark: boolean;
  target?: 'place' | 'move';
  ghost?: Side;
  from: boolean;
  hover?: boolean;
}) {
  // 腳下的粉筆：選起來的子原地留一塊印、可以拿的子是虛線圈、可以走的子是淡淡的實線圈
  const foot = !cell ? '' : selected ? 'bg-[#eee0c4]/75'
    : removable ? 'border-2 border-dashed border-[#eee0c4]'
    : movable ? 'border-2 border-[#eee0c4]/55' : '';
  return (
    <>
      {foot && <span aria-hidden="true" className={`absolute bottom-[-3%] left-1/2 h-[26%] w-[84%] -translate-x-1/2 rounded-[50%] ${foot}`} />}
      {cell && (
        <span data-piece="" style={{ transformOrigin: MAN_ORIGIN }}
          className={`absolute inset-[4%] transition-transform duration-200 ${selected ? 'translate-y-[-16%] scale-105' : movable && hover ? 'fine:group-hover:translate-y-[-6%]' : ''} ${removable ? 'nmm-teeter' : ''}`}>
          <PieceGlyph side={sideOf(cell)} mark={mark} className="size-full" />
        </span>
      )}
      {!cell && target === 'move' && <span aria-hidden="true" className="size-[30%] rounded-full bg-[#eee0c4] shadow-[0_0_0_1.5px_rgb(30_18_10/0.45)]" />}
      {!cell && target === 'place' && ghost && (
        <span aria-hidden="true" className={`absolute inset-0 transition-opacity ${hover ? 'opacity-0 fine:group-hover:opacity-45' : 'opacity-45'}`}>
          <PieceGlyph side={ghost} className="size-full" />
        </span>
      )}
      {!cell && !target && from && <span aria-hidden="true" className="size-[34%] rounded-full border-2 border-[#eee0c4]/60" />}
    </>
  );
}

/** 被拿掉的子：躺在下方那段木頭上，頭朝外（黑的從左邊排、白的從右邊排） */
function TrayPieces({ removed }: { removed: Record<Side, number> }) {
  return <>{(['black', 'white'] as const).map((s) => Array.from({ length: removed[s] }, (_, i) => (
    <span key={`${s}${i}`} data-tray={s} data-slot={i} aria-hidden="true"
      className="pointer-events-none absolute aspect-square -translate-x-1/2 -translate-y-1/2"
      style={{ left: left(trayX(s, i)), top: top(TRAY_Y), width: `${(TRAY_BOX / BOARD_W) * 100}%` }}>
      <span className={`block size-full ${s === 'black' ? '-rotate-90' : 'rotate-90'}`}><PieceGlyph side={s} className="size-full" /></span>
    </span>
  )))}</>;
}

/**
 * 規則的小圖（規則頁與對局中的說明彈窗）：同一塊棋盤、同一套記號，畫一個擺好的靜態局面。
 * 每個點是 span 不是按鈕（不能點、不進 Tab 順序），整張圖讀屏不念 —— 旁邊那段字就是圖在講的事。
 * 沒有落子、閒置這些動畫；可以拿的子照樣搖（對局裡就是靠這個認出能拿哪顆）。
 */
export function MorrisMiniBoard({ board, mills = [], removable = [], selected, targets = [], ghost, lastTo, lastFrom, removed = { black: 0, white: 0 } }: {
  board: Cell[];
  /** 剛連成的線（粉筆） */
  mills?: Point[][];
  /** 可以拿的子（搖晃） */
  removable?: Point[];
  /** 拿起來的子 */
  selected?: Point;
  /** 可以走過去的點（粉筆點） */
  targets?: Point[];
  /** 正要放下去的子（半透明） */
  ghost?: { side: Side; at: Point };
  /** 上一手的子（頭上一個點） */
  lastTo?: Point;
  /** 上一手從哪裡走過來（空點上一圈粉筆） */
  lastFrom?: Point;
  removed?: Record<Side, number>;
}) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  return (
    <div className="relative w-full" style={{ aspectRatio: `${BOARD_W} / ${BOARD_H}` }} aria-hidden="true">
      <BoardArt uid={uid} mills={mills} />
      <TrayPieces removed={removed} />
      {board.map((cell, p) => {
        const { x, y } = COORDS[p];
        const target = targets.includes(p) ? 'move' : ghost?.at === p ? 'place' : undefined;
        return (
          <span key={p} className="absolute grid aspect-square -translate-x-1/2 -translate-y-1/2 place-items-center" style={pointStyle(x, y)}>
            <PointMarks cell={cell} selected={selected === p} removable={!!cell && removable.includes(p)} movable={false} mark={p === lastTo}
              target={target} ghost={ghost?.at === p ? ghost.side : undefined} from={p === lastFrom} />
          </span>
        );
      })}
    </div>
  );
}

export type BoardLabels = { black: string; white: string; empty: string; remove: string };

/** 對局用的棋盤：每個點都是按鈕 */
export function MorrisBoard({ board, targets, movable, removable, selected, lastTo, lastFrom, mills, removed, last, removedSide, plies, idle, ghost, labels, onPick }: {
  board: Cell[];
  /** 現在可以放／走過去的空點 */
  targets: Map<Point, 'place' | 'move'>;
  /** 可以走的子（還沒選的時候淡淡標出來） */
  movable: Set<Point>;
  /** 拿子步驟：可以拿掉的對方棋子 */
  removable: Set<Point>;
  selected: Point | null;
  /** 上一手放下或走到的子 */
  lastTo?: Point;
  /** 上一手從哪裡走過來（現在是空點） */
  lastFrom?: Point;
  mills: Point[][];
  /** 兩方各被拿掉幾顆（躺在下方） */
  removed: Record<Side, number>;
  /** 最後一個動作與走了幾手：剛好多一手才播動畫 */
  last?: Move;
  plies: number;
  /** 最後一個動作是拿子時，被拿的是哪一方 */
  removedSide?: Side;
  /** 沒輪到、在等的那一方（它的子偶爾自己動一下）；分出勝負後 null */
  idle: Side | null;
  /** 放子階段：滑鼠滑過空點時浮出的那一方的子 */
  ghost?: Side;
  labels: BoardLabels;
  onPick: (p: Point) => void;
}) {
  const uid = useId().replace(/[^a-zA-Z0-9]/g, '');
  const rootRef = useRef<HTMLDivElement>(null);
  const seen = useRef(plies);

  useLayoutEffect(() => {
    const prev = seen.current;
    seen.current = plies;
    const root = rootRef.current;
    if (plies !== prev + 1 || !last || !root || reducedMotion()) return;
    const point = (p: Point) => root.querySelector<HTMLElement>(`[data-point="${p}"]`);
    const piece = (p: Point) => root.querySelector<HTMLElement>(`[data-point="${p}"] [data-piece]`);
    const center = (el: Element) => { const r = el.getBoundingClientRect(); return { x: r.left + r.width / 2, y: r.top + r.height / 2, h: r.height }; };

    if (last.kind === 'remove') {
      // 被拿的子：在原地被碰倒、飛進下方躺好。躺著的那顆一開始轉回站姿、放大成棋盤上的大小，從原本的點出發
      const from = point(last.at);
      const slot = removedSide && root.querySelector<HTMLElement>(`[data-tray="${removedSide}"][data-slot="${removed[removedSide] - 1}"]`);
      if (!from || !slot) return;
      const a = center(from), b = center(slot);
      const dx = a.x - b.x, dy = a.y - b.y;
      const up = removedSide === 'black' ? 90 : -90;
      const s = MAN_SIZE / TRAY_BOX;
      slot.animate([
        { translate: `${dx}px ${dy}px`, rotate: `${up}deg`, scale: `${s}` },
        { translate: `${dx}px ${dy}px`, rotate: `${up * 0.82}deg`, scale: `${s}`, offset: 0.18 },
        { translate: `${dx * 0.45}px ${dy * 0.45 - a.h * 0.7}px`, rotate: `${up * 0.3}deg`, scale: `${(s + 1) / 2}`, offset: 0.6 },
        { translate: '0 0', rotate: '0deg', scale: '1' },
      ], { duration: 720, easing: 'ease-in-out' });
      return;
    }

    const el = piece(last.to);
    if (!el) return;
    if (last.kind === 'place') {
      el.animate([
        { translate: '0 -32%', opacity: 0 },
        { translate: '0 0', opacity: 1, scale: '1.08 0.9', offset: 0.7 },
        { translate: '0 0', scale: '1' },
      ], { duration: 360, easing: 'ease-in' });
    } else {
      const fromEl = point(last.from);
      if (fromEl) {
        const a = center(fromEl), b = center(el);
        const dx = a.x - b.x, dy = a.y - b.y;
        const fly = !NEIGHBORS[last.from].includes(last.to);
        el.animate(fly ? [
          { translate: `${dx}px ${dy}px`, scale: '1' },
          { translate: `${dx / 2}px ${dy / 2 - Math.hypot(dx, dy) * 0.28}px`, scale: '1.12', offset: 0.5 },
          { translate: '0 0', scale: '1' },
        ] : [{ translate: `${dx}px ${dy}px` }, { translate: '0 0' }], { duration: fly ? 540 : 280, easing: 'cubic-bezier(.3,.7,.3,1)' });
      }
    }
    if (!mills.length) return;
    // 連成一線：粉筆畫出來，三顆依序跳一下
    root.querySelectorAll<SVGLineElement>('[data-mill]').forEach((ln) => {
      const len = Number(ln.dataset.len);
      ln.animate([{ strokeDashoffset: len }, { strokeDashoffset: 0 }], { duration: 380, delay: 240, easing: 'ease-out', fill: 'backwards' });
    });
    [...new Set(mills.flat())].forEach((p, i) => piece(p)?.animate([
      { translate: '0 0', scale: '1' },
      { translate: '0 0', scale: '1.05 0.93', offset: 0.2 },
      { translate: '0 -22%', scale: '0.97 1.04', offset: 0.5 },
      { translate: '0 0', scale: '1' },
    ], { duration: 480, delay: 560 + i * 100, easing: 'ease-in-out' }));
  }, [plies, last, mills, removed, removedSide]);

  // 等的那一方偶爾動一下：每 2.5～5.5 秒挑一顆
  useEffect(() => {
    const root = rootRef.current;
    if (!idle || !root || reducedMotion()) return;
    let id = 0;
    const tick = () => { id = window.setTimeout(() => { playIdle(root, board, idle); tick(); }, 2500 + Math.random() * 3000); };
    tick();
    return () => window.clearTimeout(id);
  }, [idle, board]);

  return (
    <div ref={rootRef} className="relative w-full" style={{ aspectRatio: `${BOARD_W} / ${BOARD_H}` }}>
      <BoardArt uid={uid} mills={mills} />

      <TrayPieces removed={removed} />

      {board.map((cell, p) => {
        const { x, y } = COORDS[p];
        const target = targets.get(p);
        const canRemove = !!cell && removable.has(p);
        const isSelected = selected === p;
        const label = `${POINT_NAMES[p]} ${cell ? (cell === 'B' ? labels.black : labels.white) : labels.empty}${canRemove ? ` · ${labels.remove}` : ''}`;
        return (
          <button key={p} data-point={p} type="button" onClick={() => onPick(p)} aria-label={label} aria-pressed={isSelected || undefined}
            className="group absolute grid aspect-square -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full"
            style={pointStyle(x, y)}>
            <PointMarks cell={cell} selected={isSelected} removable={canRemove} movable={movable.has(p)} mark={p === lastTo}
              target={target} ghost={target === 'place' ? ghost : undefined} from={p === lastFrom} hover />
          </button>
        );
      })}
    </div>
  );
}
