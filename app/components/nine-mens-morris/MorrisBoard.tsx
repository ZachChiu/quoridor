'use client';
import type { IconType } from 'react-icons';
import { LuX } from 'react-icons/lu';
import { COORDS, MILLS, POINT_NAMES, sideOf, type Cell, type Point, type Side } from '@/games/nine-mens-morris/engine';

/**
 * 九子棋的棋盤與棋子。
 *
 * 遊戲主色是平台卡片的青金石藍 #1d3b8a（米白字 9.6:1、OKLCH 彩度約 0.14，過 0.125 的下限）。
 * tailwind.config 是共用檔，這款先寫成任意值 `[#1d3b8a]`；正式上線時再收進 tile 色票。
 * 主色只用在「現在可以做的事」：輪到誰、可以走的點、選中的子、可以拿的子、剛連成的線。
 *
 * 兩方的棋子不只靠顏色分：黑方是實心圓、白方是米白底加深墨粗框的「環」，色盲或黑白列印都分得出來。
 * 棋子用 SVG 畫，環的粗細跟著棋子大小走（狀態卡上的小棋子也是同一個形狀）。
 *
 * 版面照 Bagh Chal 的棋盤：外層只管內距，正方形放在內層（aspect-square 不跟 padding 寫在同一個元素 ——
 * iPhone 的 WebKit 會把內框算得比寬度高一點，點和棋子就越往下越偏）。
 */

/** 7×7 格線上的座標 0..6 → 棋盤的百分比位置 8..92 */
const pos = (i: number) => 8 + i * 14;

export function PieceGlyph({ side, className = '' }: { side: Side; className?: string }) {
  return (
    <svg viewBox="0 0 100 100" className={className} aria-hidden="true">
      {side === 'black'
        ? <circle cx="50" cy="50" r="46" fill="rgb(var(--tile-ink))" />
        : <circle cx="50" cy="50" r="39" fill="rgb(var(--tile-cream))" stroke="rgb(var(--tile-ink))" strokeWidth="14" />}
    </svg>
  );
}

/**
 * Modal 標題列（主色色帶）上的棋子圖示，跟 react-icons 同一個介面。
 * 畫真正的棋子顏色而不是 currentColor：米白的實心圓會被讀成白子。
 * 黑子在藍底上對比不夠，多一圈米白外框。
 */
export const BlackPieceIcon: IconType = ({ className }) => (
  <svg viewBox="0 0 100 100" width="1em" height="1em" className={className} aria-hidden="true">
    <circle cx="50" cy="50" r="43" fill="rgb(var(--tile-ink))" stroke="rgb(var(--tile-cream))" strokeWidth="7" />
  </svg>
);
export const WhitePieceIcon: IconType = ({ className }) => (
  <svg viewBox="0 0 100 100" width="1em" height="1em" className={className} aria-hidden="true">
    <circle cx="50" cy="50" r="39" fill="rgb(var(--tile-cream))" stroke="rgb(var(--tile-ink))" strokeWidth="14" />
  </svg>
);

/** 棋盤線：三個同心正方形加四條中線 —— 剛好就是 16 條成三的線，從 MILLS 直接畫 */
function BoardLines({ mills }: { mills: Point[][] }) {
  return (
    <svg viewBox="0 0 100 100" className="absolute inset-0 size-full" aria-hidden="true">
      <g stroke="rgb(var(--board-line))" strokeWidth={0.7} strokeLinecap="round">
        {MILLS.map((l, i) => {
          const a = COORDS[l[0]];
          const b = COORDS[l[2]];
          return <line key={i} x1={pos(a.x)} y1={pos(a.y)} x2={pos(b.x)} y2={pos(b.y)} />;
        })}
      </g>
      {/* 剛連成的線：主色粗線，壓在棋子底下 */}
      <g stroke="#1d3b8a" strokeWidth={3} strokeLinecap="round">
        {mills.map((l, i) => {
          const a = COORDS[l[0]];
          const b = COORDS[l[2]];
          return <line key={i} x1={pos(a.x)} y1={pos(a.y)} x2={pos(b.x)} y2={pos(b.y)} />;
        })}
      </g>
      <g fill="rgb(var(--board-line))">
        {COORDS.map((c, p) => <circle key={p} cx={pos(c.x)} cy={pos(c.y)} r={1.4} />)}
      </g>
    </svg>
  );
}

export type BoardLabels = { black: string; white: string; empty: string; remove: string };

/** 對局用的棋盤：每個點都是按鈕 */
export function MorrisBoard({ board, targets, movable, removable, selected, lastTo, lastFrom, lastRemoved, mills, labels, onPick }: {
  board: Cell[];
  /** 現在可以放／走過去的空點 */
  targets: Map<Point, 'place' | 'move'>;
  /** 可以走的子（還沒選的時候淡淡標出來） */
  movable: Set<Point>;
  /** 拿子步驟：可以拿掉的對方棋子 */
  removable: Set<Point>;
  selected: Point | null;
  /** 上一手放下或走到的子：中間一個反色小點（圍棋 App 標最後一手的慣例），電腦剛下哪裡一眼就看到 */
  lastTo?: Point;
  /** 上一手從哪裡走過來（現在是空點） */
  lastFrom?: Point;
  /** 上一手拿掉了哪一點的子 */
  lastRemoved?: Point;
  mills: Point[][];
  labels: BoardLabels;
  onPick: (p: Point) => void;
}) {
  return (
    <div className="w-full rounded-3xl bg-primary-50 p-[3%]">
      <div className="relative aspect-square w-full">
        <BoardLines mills={mills} />
        {board.map((cell, p) => {
          const { x, y } = COORDS[p];
          const target = targets.get(p);
          const canRemove = !!cell && removable.has(p);
          const ring = selected === p ? 'scale-110 ring-4 ring-[#1d3b8a]'
            : canRemove ? 'ring-4 ring-[#1d3b8a]'
            : movable.has(p) ? 'ring-2 ring-[#1d3b8a]/45' : '';
          const label = `${POINT_NAMES[p]} ${cell ? (cell === 'B' ? labels.black : labels.white) : labels.empty}${canRemove ? ` · ${labels.remove}` : ''}`;
          return (
            <button key={p} type="button" onClick={() => onPick(p)} aria-label={label} aria-pressed={selected === p || undefined}
              className="absolute grid size-[13.5%] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full"
              style={{ left: `${pos(x)}%`, top: `${pos(y)}%` }}>
              {/* 可以拿的子：後面一圈往外擴散的光（開了「減少動態」就不閃，只留外框和 ×） */}
              {canRemove && <span aria-hidden="true" className="absolute inset-[8%] rounded-full bg-[#1d3b8a]/45 motion-safe:animate-ping" />}
              {cell && (
                <span className={`relative grid size-4/5 place-items-center rounded-full transition ${ring}`}>
                  <PieceGlyph side={sideOf(cell)} className="absolute inset-0 size-full" />
                  {p === lastTo && <span aria-hidden="true" className={`relative size-[24%] rounded-full ${cell === 'B' ? 'bg-tile-cream' : 'bg-tile-ink'}`} />}
                </span>
              )}
              {canRemove && (
                <span aria-hidden="true" className="absolute right-0 top-0 grid size-[38%] place-items-center rounded-full bg-[#1d3b8a] text-tile-cream ring-2 ring-primary-50">
                  <LuX className="size-[72%]" />
                </span>
              )}
              {!cell && target === 'move' && <span className="size-[32%] rounded-full bg-[#1d3b8a]" />}
              {!cell && target === 'place' && <span className="size-[34%] rounded-full bg-[#1d3b8a]/25" />}
              {!cell && !target && p === lastFrom && <span className="size-[36%] rounded-full border-2 border-tile-ink/30" />}
              {!cell && !target && p === lastRemoved && <LuX aria-hidden="true" className="size-[46%] text-tile-ink/35" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
