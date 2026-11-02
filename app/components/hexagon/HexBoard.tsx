'use client';
import { CELL_POS, LETTERS, LINES } from '@/games/hexagon/engine';
import { HX } from './palette';

/**
 * 盤面：19 塊磁磚排成 3-4-5-4-3。每塊正面是數字、背面是字母，翻面是 rotateY（CSS 過渡，合成執行緒跑）。
 * 磁磚照館藏的六角磚畫：鈷藍的釉邊、內緣一道青綠細線、中間釉白（palette.ts）。選中的那塊整片上鈷藍。
 *
 * 版面：尖頂的六角形，邊長 s、寬 √3·s；整盤寬 5 塊、高 8s。位置全用百分比，字級用 cqw（跟著盤面寬度）。
 * 線（找到的組合、沒找到的答案）畫在上面一層 SVG，不擋點擊。
 */
const W = Math.sqrt(3) * 100;
export const BOARD_ASPECT = `${5 * Math.sqrt(3)} / 8`;

const center = (i: number) => {
  const { row, col } = CELL_POS[i];
  return { x: (Math.abs(row - 2) * 0.5 + col + 0.5) * W, y: row * 150 + 100 };
};

/** 翻面的波浪：從左上角往右下一排一排翻過去，每塊晚 35ms。回傳每塊的延遲（秒），音效也照這個時間喀 */
export const FLIP_DELAYS = CELL_POS.map(({ row, col }) => (row + col + Math.abs(row - 2) * 0.5) * 0.035);

export type BoardLine = { line: number; kind: 'found' | 'missed' | 'flash'; id?: string };

export default function HexBoard({ board, face, selected = [], lines = [], shake, pop, onTap, label, className = '' }: {
  board: readonly number[];
  face: 'numbers' | 'letters';
  selected?: readonly number[];
  lines?: readonly BoardLine[];
  /** 答錯時抖一下的格子（key 換了就重播） */
  shake?: { key: number; cells: readonly number[] };
  /** 答對時跳一下 */
  pop?: { key: number; cells: readonly number[] };
  onTap?: (i: number) => void;
  label?: string;
  className?: string;
}) {
  const flipped = face === 'letters';
  return (
    <div role={onTap ? 'group' : 'img'} aria-label={label}
      className={`relative w-full select-none [container-type:inline-size] ${className}`} style={{ aspectRatio: BOARD_ASPECT }}>
      {CELL_POS.map(({ row, col }, i) => {
        const on = selected.includes(i);
        const shaking = shake?.cells.includes(i);
        const popping = pop?.cells.includes(i);
        const style = {
          left: `${(Math.abs(row - 2) * 0.5 + col) * 20}%`,
          top: `${row * 18.75}%`,
          width: '20%',
          height: '25%',
        };
        const inner = (
          <span className="hx-flip absolute inset-[3.5%] block" style={{ transform: flipped ? 'rotateY(180deg)' : 'none', transitionDelay: `${FLIP_DELAYS[i]}s` }}>
            <Face on={false}>
              <span className="text-[8.4cqw] font-black tabular-nums leading-none" style={{ color: HX.ink }}>{board[i]}</span>
            </Face>
            <Face on={on} back>
              <span className="text-[6.2cqw] font-black leading-none" style={{ color: on ? HX.glaze : HX.cobalt }}>{LETTERS[i]}</span>
            </Face>
          </span>
        );
        const motion = `${shaking ? 'hx-shake' : ''} ${popping ? 'hx-pop' : ''}`;
        // key 帶上 shake／pop 的序號：同一格連續答錯兩次，動畫才會重播
        const key = `${i}:${shaking ? shake!.key : ''}:${popping ? pop!.key : ''}`;
        return onTap ? (
          <button key={key} type="button" onClick={() => onTap(i)} disabled={!flipped}
            aria-label={flipped ? LETTERS[i] : `${LETTERS[i]} ${board[i]}`} aria-pressed={flipped ? on : undefined}
            className={`hx-hex absolute touch-manipulation outline-none [perspective:600px] focus-visible:brightness-90 ${motion}`} style={style}>
            {inner}
          </button>
        ) : (
          <span key={key} aria-hidden="true" className={`absolute [perspective:600px] ${motion}`} style={style}>{inner}</span>
        );
      })}

      <svg aria-hidden="true" viewBox={`0 0 ${5 * W} 800`} className="pointer-events-none absolute inset-0 size-full overflow-visible">
        {lines.map(({ line, kind, id }) => {
          const [a, , c] = LINES[line].map(center);
          const found = kind !== 'missed';
          return (
            <line key={id ?? `${kind}:${line}`} x1={a.x} y1={a.y} x2={c.x} y2={c.y} pathLength={1}
              stroke={found ? HX.cobalt : HX.teal} strokeWidth={found ? 20 : 12} strokeLinecap="round"
              strokeDasharray={found ? '1' : '0.06 0.08'} opacity={found ? 0.6 : 0.85}
              style={kind === 'flash'
                ? { animation: 'hx-trace 0.25s ease-out both, hx-fade 1.4s ease-in both' }
                : found ? { animation: 'hx-trace 0.3s ease-out both' } : undefined} />
          );
        })}
      </svg>
    </div>
  );
}

/** 一面：鈷藍釉邊 → 青綠細線 → 釉白（選中是鈷藍） */
function Face({ on, back, children }: { on: boolean; back?: boolean; children: React.ReactNode }) {
  return (
    <span className="hx-face hx-hex absolute inset-0 block" style={{ background: HX.cobalt, transform: back ? 'rotateY(180deg)' : undefined }}>
      <span className="hx-hex absolute inset-[6%] block" style={{ background: HX.teal }} />
      <span className="hx-hex absolute inset-[8%] grid place-items-center" style={{ background: on ? HX.cobalt : HX.glaze }}>
        {children}
      </span>
    </span>
  );
}
