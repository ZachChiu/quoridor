'use client';
import { GiGoat, GiTigerHead } from 'react-icons/gi';
import { SIZE, type Cell, type Move, type Point } from '@/games/bagh-chal/engine';

/**
 * Bagh Chal 的棋盤。對局用的 BaghBoard（交叉點是按鈕）與規則說明用的 MiniBoard（靜態）共用同一套畫法。
 *
 * 版面：外層只管內距，正方形放在內層自己身上（aspect-square 不跟 padding 寫在同一個元素）——
 * 兩者寫在一起時，iPhone 的 WebKit 算出來的內框比寬度高一點，交叉點按鈕照高度的 % 定位、
 * 線照正方形畫，點和棋子就越往下越偏上（Zach 截圖：歪歪的）。
 */
export const xy = (p: Point) => ({ x: 10 + (p % SIZE) * 20, y: 10 + Math.floor(p / SIZE) * 20 });

/** 棋盤線：直線、橫線、兩條對角線與中間的菱形 —— 斜線只經過列＋行為偶數的點 */
export function BoardLines({ width = 0.5 }: { width?: number }) {
  return (
    <svg viewBox="0 0 100 100" className="absolute inset-0 size-full" aria-hidden="true">
      <g stroke="rgb(var(--board-line))" strokeWidth={width} strokeLinecap="round" fill="none">
        {[0, 1, 2, 3, 4].map((i) => (
          <g key={i}>
            <line x1={10} y1={10 + i * 20} x2={90} y2={10 + i * 20} />
            <line x1={10 + i * 20} y1={10} x2={10 + i * 20} y2={90} />
          </g>
        ))}
        <line x1={10} y1={10} x2={90} y2={90} />
        <line x1={90} y1={10} x2={10} y2={90} />
        <polygon points="50,10 90,50 50,90 10,50" />
      </g>
    </svg>
  );
}

export function TigerPiece({ selected = false }: { selected?: boolean }) {
  return (
    <span className={`relative grid size-[86%] place-items-center rounded-full bg-tile-orange text-tile-ink transition ${selected ? 'scale-110 ring-4 ring-tile-ink' : ''}`}>
      <GiTigerHead aria-hidden="true" className="size-[64%]" />
    </span>
  );
}

export function GoatPiece({ ring }: { ring?: 'selected' | 'victim' | 'movable' }) {
  const r = ring === 'selected' ? 'scale-110 ring-4 ring-tile-orange' : ring === 'victim' ? 'ring-4 ring-tile-orange' : ring === 'movable' ? 'ring-2 ring-tile-orange/60' : '';
  return (
    <span className={`grid size-[74%] place-items-center rounded-full bg-tile-ink text-tile-cream transition ${r}`}>
      <GiGoat aria-hidden="true" className="size-[66%]" />
    </span>
  );
}

/** 空點上的標記：可以走的點（實心、不透明，線不會從中間穿過）、吃子的落點、放羊的點 */
export function Marker({ kind }: { kind: Move['kind'] | 'last' }) {
  if (kind === 'jump') return <span className="grid size-[46%] place-items-center rounded-full bg-tile-orange"><span className="size-[34%] rounded-full bg-tile-ink" /></span>;
  if (kind === 'place' || kind === 'last') return <span className="size-[24%] rounded-full bg-[#d6cec3]" />;
  return <span className="size-[30%] rounded-full bg-tile-ink" />;
}

const SEAT = 'absolute grid size-[17%] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full';

/** 對局用的棋盤 */
export function BaghBoard({ board, targets, capturers, victims, movable, selected, last, labels, onPick }: {
  board: Cell[];
  targets: Map<Point, Move>;
  capturers: Set<Point>;
  victims: Set<Point>;
  movable: Set<Point>;
  selected: Point | null;
  last?: Move;
  labels: { tiger: string; goat: string };
  onPick: (p: Point) => void;
}) {
  return (
    <div className="w-full rounded-3xl bg-primary-50 p-[4%]">
      <div className="relative aspect-square w-full">
        <BoardLines />
        {board.map((cell, p) => {
          const { x, y } = xy(p);
          const target = targets.get(p);
          const wasLast = last && (last.to === p || (last.kind !== 'place' && last.from === p));
          const label = cell === 'T' ? labels.tiger : cell === 'G' ? labels.goat : `${Math.floor(p / SIZE) + 1}-${(p % SIZE) + 1}`;
          return (
            <button key={p} type="button" onClick={() => onPick(p)} aria-label={label} aria-pressed={selected === p || undefined}
              className={SEAT} style={{ left: `${x}%`, top: `${y}%` }}>
              {/* 能吃子的老虎：後面一圈往外擴散的光（還沒選老虎時才閃，選了就看落點） */}
              {cell === 'T' && capturers.has(p) && selected === null && (
                <span aria-hidden="true" className="absolute inset-[7%] animate-ping rounded-full bg-tile-orange/70" />
              )}
              {cell === 'T' && <TigerPiece selected={selected === p} />}
              {cell === 'G' && <GoatPiece ring={selected === p ? 'selected' : victims.has(p) ? 'victim' : movable.has(p) ? 'movable' : undefined} />}
              {!cell && target && <Marker kind={target.kind} />}
              {!cell && !target && wasLast && <Marker kind="last" />}
            </button>
          );
        })}
      </div>
    </div>
  );
}

/**
 * 規則說明用的靜態小棋盤。`cells` 用字串畫：T 老虎、G 羊、. 空點，五列；
 * `marks` 標出點（move 可以走、jump 吃子落點、place 放羊），`victims` 標出會被吃的羊。
 */
export function MiniBoard({ rows, marks = {}, victims = [] }: {
  rows: string[];
  marks?: Partial<Record<Point, Move['kind']>>;
  victims?: Point[];
}) {
  const cells = rows.join('').split('');
  return (
    <div className="w-full rounded-2xl bg-primary-50 p-[5%]" aria-hidden="true">
      <div className="relative aspect-square w-full">
        <BoardLines width={0.7} />
        {cells.map((ch, p) => {
          const { x, y } = xy(p);
          const mark = marks[p];
          return (
            <span key={p} className={SEAT} style={{ left: `${x}%`, top: `${y}%` }}>
              {ch === 'T' && <TigerPiece />}
              {ch === 'G' && <GoatPiece ring={victims.includes(p) ? 'victim' : undefined} />}
              {ch === '.' && mark && <Marker kind={mark} />}
            </span>
          );
        })}
      </div>
    </div>
  );
}
