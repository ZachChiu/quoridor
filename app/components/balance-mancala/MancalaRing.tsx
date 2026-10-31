'use client';
import type { ReactNode } from 'react';
import { GiAngelWings, GiImpLaugh } from 'react-icons/gi';
import { CELLS, ANGEL, DEVIL, CELL_COLOUR, type Colour, type Seat } from '@/games/balance-mancala/engine';
import { CREAM, DISH_BG, GOLD, INK, NAVY } from './palette';
import PieceDisc from './PieceDisc';

/**
 * 環形盤：14 格繞一圈，0（惡魔）在頂端、7（天使）在底端，順時針編號 —— 跟節目的盤面同一個方向。
 *
 * 尺寸全部用 cqw（盤面本身是 inline-size container）：手機 340px 與桌機 600px 是同一張圖等比縮放，
 * 不必分兩套數字。格子中心在半徑 37%、直徑 15%，外側印顏色短標（色盲也分得出三色）、內側印子數。
 *
 * 同一格裡 4 顆以內一顆一顆畫；超過就依主人合併成一顆、右上角標數量（同一個人的子沒有差別，合併不丟資訊）。
 */
const R = 37;
const D = 15;
const rad = (i: number) => ((-90 + (i * 360) / CELLS) * Math.PI) / 180;
const pos = (i: number, r: number) => ({ left: `${50 + r * Math.cos(rad(i))}%`, top: `${50 + r * Math.sin(rad(i))}%` });

/** 盤面上的得分標記：誰、+幾分、記到哪一色（還沒選色時 colour 是 null） */
export type RingMark = { cell: number; owner: Seat; points: number; colour: Colour | null; faded?: boolean };

function CellPieces({ owners, incoming, dropped, dropKey }: { owners: Seat[]; incoming: boolean; dropped: boolean; dropKey: number }) {
  const n = owners.length;
  if (!n) return null;
  const newest = n - 1;
  if (n <= 4) {
    const size = n === 1 ? 8 : n === 2 ? 6.2 : 5.5;
    const items = owners.map((seat, i) => ({ seat, i })).sort((a, b) => a.seat - b.seat || a.i - b.i);
    return (
      <span className="relative flex flex-wrap items-center justify-center" style={{ width: n === 1 ? undefined : `${size * 2 + 0.9}cqw`, gap: '0.9cqw' }}>
        {items.map(({ seat, i }) => (
          <PieceDisc key={i === newest && dropped ? `${i}-${dropKey}` : i} seat={seat} size={`${size}cqw`}
            ring={incoming && i === newest ? 'incoming' : undefined}
            className={dropped && i === newest ? 'animate-piece-drop' : ''} />
        ))}
      </span>
    );
  }
  const groups = new Map<Seat, number>();
  for (const s of owners) groups.set(s, (groups.get(s) ?? 0) + 1);
  const list = [...groups.entries()].sort((a, b) => a[0] - b[0]);
  const g = list.length;
  const size = g === 1 ? 7.5 : g <= 4 ? 5.5 : 4;
  const cols = g === 1 ? 1 : g <= 4 ? 2 : 3;
  const newOwner = owners[newest];
  return (
    <span className="relative flex flex-wrap items-center justify-center" style={{ width: `${size * cols + 1.1 * (cols - 1)}cqw`, gap: '1.1cqw' }}>
      {list.map(([seat, count]) => (
        <PieceDisc key={seat === newOwner && dropped ? `${seat}-${dropKey}` : seat} seat={seat} size={`${size}cqw`} count={count}
          ring={incoming && seat === newOwner ? 'incoming' : undefined}
          className={dropped && seat === newOwner ? 'animate-piece-drop' : ''} />
      ))}
    </span>
  );
}

export default function MancalaRing({
  board, colourShort, highLabel, lowLabel, ariaOf, selectable, dimOthers, selected, incoming, emptied, dropped, dropKey = 0, mark, onPick, center,
}: {
  board: Seat[][];
  colourShort: string[];
  highLabel: string;
  lowLabel: string;
  /** 每一格的讀屏文字 */
  ariaOf: (cell: number) => string;
  /** 現在可以點的格子（外圈米白框）；null 表示不在選格 */
  selectable: Set<number> | null;
  /** 把不能點的格子調暗（選起點時）。預覽時不調暗 —— 落點常常不是自己的格子，暗掉就看不到剛放進去的子 */
  dimOthers: boolean;
  selected: number | null;
  /** 預覽中：這些格最後一顆是剛放進來的 */
  incoming?: Set<number>;
  /** 預覽／播種中被拿空的起點格 */
  emptied?: number | null;
  /** 播種動畫：剛落下一顆的格子 */
  dropped?: number | null;
  dropKey?: number;
  mark?: RingMark | null;
  onPick: (cell: number) => void;
  center?: ReactNode;
}) {
  return (
    <div className="relative aspect-square w-full select-none [container-type:inline-size]">
      <svg viewBox="0 0 100 100" className="absolute inset-0 size-full" aria-hidden="true">
        <circle cx={50} cy={50} r={R} fill="none" stroke={GOLD} strokeOpacity={0.35} strokeWidth={0.35} />
        {/* 格與格之間的小箭頭：順時針 */}
        {Array.from({ length: CELLS }, (_, i) => {
          const a = rad(i + 0.5);
          const deg = -90 + ((i + 0.5) * 360) / CELLS + 90;
          return (
            <path key={i} d="M -0.55 -0.75 L 0.45 0 L -0.55 0.75" fill="none" stroke={GOLD} strokeWidth={0.42}
              strokeLinecap="round" strokeLinejoin="round" strokeOpacity={0.85}
              transform={`translate(${50 + R * Math.cos(a)} ${50 + R * Math.sin(a)}) rotate(${deg})`} />
          );
        })}
      </svg>

      {center && (
        <div className="absolute inset-[27%] flex flex-col items-center justify-center text-center" style={{ color: CREAM }}>
          {center}
        </div>
      )}

      {board.map((owners, cell) => {
        const colour = CELL_COLOUR[cell];
        const bg = colour !== null ? DISH_BG[colour] : cell === DEVIL ? '#0b0d18' : CREAM;
        const canPick = selectable?.has(cell) ?? false;
        const dim = dimOthers && selectable !== null && !canPick && selected !== cell;
        const isSel = selected === cell;
        const outline = isSel ? `0.8cqw solid ${GOLD}` : canPick ? `0.5cqw solid ${CREAM}` : emptied === cell ? `0.4cqw dashed ${CREAM}` : 'none';
        const showMark = mark && mark.cell === cell;
        return (
          <div key={cell}>
            <button
              type="button"
              onClick={() => onPick(cell)}
              aria-label={ariaOf(cell)}
              aria-pressed={isSel || undefined}
              className="absolute grid place-items-center rounded-full transition-[opacity,transform] duration-200"
              style={{
                ...pos(cell, R),
                width: `${D}cqw`, height: `${D}cqw`,
                transform: `translate(-50%, -50%)${isSel ? ' scale(1.07)' : ''}`,
                background: bg,
                boxShadow: `inset 0 0 0 0.45cqw ${GOLD}`,
                outline, outlineOffset: '0.5cqw',
              }}
            >
              {cell === DEVIL && <GiImpLaugh aria-hidden="true" className="absolute size-[62%]" style={{ color: GOLD, opacity: owners.length ? 0.35 : 0.9 }} />}
              {cell === ANGEL && <GiAngelWings aria-hidden="true" className="absolute size-[66%]" style={{ color: NAVY, opacity: owners.length ? 0.18 : 0.55 }} />}
              <CellPieces owners={owners} incoming={!!incoming?.has(cell)} dropped={dropped === cell} dropKey={dropKey} />
              {/* 不能選的格子蓋一層夜空藍調暗。不用 opacity：半透明的格子會透出底下那圈軌道線 */}
              {dim && <span aria-hidden="true" className="pointer-events-none absolute inset-0 rounded-full" style={{ background: NAVY, opacity: 0.6 }} />}
            </button>

            {/* 外側：顏色短標；惡魔、天使寫記到哪一色 */}
            <span aria-hidden="true" className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 whitespace-nowrap font-black leading-none"
              style={{ ...pos(cell, R + D / 2 + 3.4), fontSize: '2.7cqw', color: colour !== null ? CREAM : GOLD, opacity: colour !== null ? 0.8 : 1 }}>
              {colour !== null ? colourShort[colour] : cell === DEVIL ? highLabel : lowLabel}
            </span>

            {/* 內側：子數（得分標記出現時讓位） */}
            {!showMark && owners.length > 0 && (
              <span aria-hidden="true" className="pointer-events-none absolute -translate-x-1/2 -translate-y-1/2 font-black leading-none"
                style={{ ...pos(cell, R - D / 2 - 3), fontSize: '2.8cqw', color: CREAM, opacity: 0.7 }}>
                {owners.length}
              </span>
            )}

            {showMark && (
              <span aria-hidden="true"
                className={`pointer-events-none absolute z-10 flex -translate-x-1/2 -translate-y-1/2 items-center rounded-full font-black leading-none ${mark.faded ? '' : 'animate-piece-drop'}`}
                style={{ ...pos(cell, R - D / 2 - 6.2), gap: '0.7cqw', padding: '0.6cqw 1.2cqw 0.6cqw 0.6cqw', fontSize: '3.2cqw', background: CREAM, color: INK, opacity: mark.faded ? 0.8 : 1 }}>
                <PieceDisc seat={mark.owner} size="3.8cqw" />
                +{mark.points}
                {mark.colour !== null && (
                  <span className="rounded-full leading-none" style={{ padding: '0.5cqw 1cqw', fontSize: '2.6cqw', background: DISH_BG[mark.colour], color: CREAM }}>
                    {colourShort[mark.colour]}
                  </span>
                )}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
