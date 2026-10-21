'use client';
import type { IconType } from 'react-icons';
import { LuX } from 'react-icons/lu';
import { COORDS, MILLS, POINT_NAMES, sideOf, type Cell, type Point, type Side } from '@/games/nine-mens-morris/engine';
import { NMM } from './palette';

/**
 * 九子棋的棋盤與棋子：照《遊戲之書》（1283）那幅插圖，放在群青底上的一塊木頭棋盤，墨線（配色見 palette.ts）。
 *
 * 「現在可以做的事」（可以走的點、選中的子、可以拿的子、剛連成的線）一律用羊皮紙色，像粉筆畫在木板上
 * （放子時每個空點都能放，不畫標記 —— 一整片灰點只會讓盤面變雜，虎羊棋也是這樣）：
 * 群青放在木頭上只有 1.8:1、朱紅更低，看不出來；羊皮紙在木頭上 3.75:1。
 *
 * 兩方的棋子不只靠顏色分：黑方是墨色實心圓、白方是羊皮紙底加墨色粗框的「環」，色盲或黑白列印都分得出來。
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
        ? <circle cx="50" cy="50" r="46" fill={NMM.ink} />
        : <circle cx="50" cy="50" r="39" fill={NMM.parchment} stroke={NMM.ink} strokeWidth="14" />}
    </svg>
  );
}

/**
 * Modal 標題列（群青色帶）上的棋子圖示，跟 react-icons 同一個介面。
 * 畫真正的棋子顏色而不是 currentColor：羊皮紙的實心圓會被讀成白子。
 * 黑子在群青上對比不夠，多一圈羊皮紙外框。
 */
export const BlackPieceIcon: IconType = ({ className }) => (
  <svg viewBox="0 0 100 100" width="1em" height="1em" className={className} aria-hidden="true">
    <circle cx="50" cy="50" r="43" fill={NMM.ink} stroke={NMM.parchment} strokeWidth="7" />
  </svg>
);
export const WhitePieceIcon: IconType = ({ className }) => (
  <svg viewBox="0 0 100 100" width="1em" height="1em" className={className} aria-hidden="true">
    <circle cx="50" cy="50" r="39" fill={NMM.parchment} stroke={NMM.ink} strokeWidth="14" />
  </svg>
);

/** 棋盤線：三個同心正方形加四條中線 —— 剛好就是 16 條成三的線，從 MILLS 直接畫 */
function BoardLines({ mills }: { mills: Point[][] }) {
  return (
    <svg viewBox="0 0 100 100" className="absolute inset-0 size-full" aria-hidden="true">
      <g stroke={NMM.ink} strokeWidth={0.8} strokeLinecap="round">
        {MILLS.map((l, i) => {
          const a = COORDS[l[0]];
          const b = COORDS[l[2]];
          return <line key={i} x1={pos(a.x)} y1={pos(a.y)} x2={pos(b.x)} y2={pos(b.y)} />;
        })}
      </g>
      {/* 剛連成的線：羊皮紙色粗線（像粉筆），壓在棋子底下 */}
      <g stroke={NMM.parchment} strokeWidth={3} strokeLinecap="round">
        {mills.map((l, i) => {
          const a = COORDS[l[0]];
          const b = COORDS[l[2]];
          return <line key={i} x1={pos(a.x)} y1={pos(a.y)} x2={pos(b.x)} y2={pos(b.y)} />;
        })}
      </g>
      <g fill={NMM.ink}>
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
    // 木頭棋盤，邊上一圈深一點的木紋（插圖裡的棋盤就是這樣）—— 是棋盤本身，不是另外加的框
    <div className="w-full rounded-md bg-[#976728] p-[3%] shadow-[inset_0_0_0_4px_#784717]">
      <div className="relative aspect-square w-full">
        <BoardLines mills={mills} />
        {board.map((cell, p) => {
          const { x, y } = COORDS[p];
          const target = targets.get(p);
          const canRemove = !!cell && removable.has(p);
          const ring = selected === p ? 'scale-110 ring-4 ring-[#eee0c4]'
            : canRemove ? 'ring-4 ring-[#eee0c4]'
            : movable.has(p) ? 'ring-2 ring-[#eee0c4]/60' : '';
          const label = `${POINT_NAMES[p]} ${cell ? (cell === 'B' ? labels.black : labels.white) : labels.empty}${canRemove ? ` · ${labels.remove}` : ''}`;
          return (
            <button key={p} type="button" onClick={() => onPick(p)} aria-label={label} aria-pressed={selected === p || undefined}
              className="absolute grid size-[13.5%] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full"
              style={{ left: `${pos(x)}%`, top: `${pos(y)}%` }}>
              {/* 可以拿的子：後面一圈往外擴散的光（開了「減少動態」就不閃，只留外框和 ×） */}
              {canRemove && <span aria-hidden="true" className="absolute inset-[8%] rounded-full bg-[#eee0c4]/50 motion-safe:animate-ping" />}
              {cell && (
                <span className={`relative grid size-4/5 place-items-center rounded-full transition ${ring}`}>
                  <PieceGlyph side={sideOf(cell)} className="absolute inset-0 size-full" />
                  {p === lastTo && <span aria-hidden="true" className={`relative size-[24%] rounded-full ${cell === 'B' ? 'bg-[#eee0c4]' : 'bg-[#1e120a]'}`} />}
                </span>
              )}
              {canRemove && (
                <span aria-hidden="true" className="absolute right-0 top-0 grid size-[38%] place-items-center rounded-full bg-[#c54915] text-[#eee0c4] ring-2 ring-[#eee0c4]">
                  <LuX className="size-[72%]" />
                </span>
              )}
              {!cell && target === 'move' && <span className="size-[32%] rounded-full bg-[#eee0c4]" />}
              {!cell && !target && p === lastFrom && <span className="size-[36%] rounded-full border-2 border-[#eee0c4]/60" />}
              {!cell && !target && p === lastRemoved && <LuX aria-hidden="true" className="size-[46%] text-[#eee0c4]/70" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}
