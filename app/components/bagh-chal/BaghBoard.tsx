'use client';
import { SIZE, type Cell, type Move, type Point } from '@/games/bagh-chal/engine';
import { GOAT_SRC, TIGER_SRC } from './tokens';
import { BAGH } from './palette';

/**
 * Bagh Chal 的棋盤。對局用的 BaghBoard（交叉點是按鈕）與規則說明用的 MiniBoard（靜態）共用同一套畫法。
 *
 * 長相取自尼泊爾的印刷棋盤（Wikimedia Commons 那張）：紙色盤面、細墨線、交叉點一朵朵小花
 * （中心最大、四個斜線交會點次之）。老虎追羊的飾帶畫在整頁的畫框上（BaghFrame），
 * 棋盤自己只留一道橄欖綠粗框與番紅花內線 —— 兩層飾帶疊在一起太花，而且手機上會把盤面擠小
 * （2026-10-20 Zach 選了「整頁圖騰」的平均版，見 docs 與設計總表）。
 *
 * 棋子是 AI 畫的虎、羊圓牌，用**背景圖**畫、影子用 box-shadow，不用 <img> 加 filter：
 * iPhone 的 WebKit 會漏畫「套了 filter: drop-shadow 的元素裡動態插入的圖」——
 * 棋子一移動就是新插入的，Zach 的截圖裡就這樣少了 2 隻老虎、2 隻羊（只剩外圈）。
 *
 * 版面：外層只管邊框，正方形放在內層自己身上（aspect-square 不跟 padding／border 寫在同一個元素）——
 * 兩者寫在一起時，iPhone 的 WebKit 算出來的內框比寬度高一點，交叉點按鈕照高度的 % 定位、
 * 線照正方形畫，點和棋子就越往下越偏上（Zach 截圖：歪歪的）。
 */
export const xy = (p: Point) => ({ x: 10 + (p % SIZE) * 20, y: 10 + Math.floor(p / SIZE) * 20 });

/** 交叉點上的小花：四瓣深褐、四瓣陶紅、紙色花心 */
function Rosette({ x, y, r }: { x: number; y: number; r: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${r})`} opacity={0.8}>
      {[0, 90, 180, 270].map((a) => (
        <path key={a} transform={`rotate(${a})`} d="M0-1C.28-.5.24-.18 0 0C-.24-.18-.28-.5 0-1Z" fill={BAGH.brown} />
      ))}
      {[45, 135, 225, 315].map((a) => (
        <path key={a} transform={`rotate(${a})`} d="M0-.72C.22-.4.18-.16 0 0C-.18-.16-.22-.4 0-.72Z" fill={BAGH.terracotta} />
      ))}
      <circle r=".2" fill={BAGH.paper} />
    </g>
  );
}

/** 棋盤線：直線、橫線、兩條對角線與中間的菱形 —— 斜線只經過列＋行為偶數的點 */
export function BoardLines({ width = 0.45 }: { width?: number }) {
  return (
    <svg viewBox="0 0 100 100" className="absolute inset-0 size-full" aria-hidden="true">
      <g stroke={BAGH.line} strokeWidth={width} strokeLinecap="round" fill="none">
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
      {Array.from({ length: SIZE * SIZE }, (_, p) => {
        const { x, y } = xy(p);
        const r = p === 12 ? 4.6 : [6, 8, 16, 18].includes(p) ? 3.6 : 2.6;
        return <Rosette key={p} x={x} y={y} r={r} />;
      })}
    </svg>
  );
}

/* 一枚有厚度的圓牌：底下一道硬邊的影子（box-shadow），選取／可走的外圈用 ring（也是 box-shadow，兩者會疊加） */
const TOKEN = 'block rounded-full bg-cover bg-center shadow-[0_2px_0_rgba(74,38,22,0.45)] transition-transform';

export function TigerPiece({ selected = false }: { selected?: boolean }) {
  return (
    <span aria-hidden="true" className={`${TOKEN} size-[96%] ${selected ? 'scale-110 ring-4 ring-tile-ink' : ''}`}
      style={{ backgroundImage: `url(${TIGER_SRC})` }} />
  );
}

export function GoatPiece({ ring }: { ring?: 'selected' | 'victim' | 'movable' }) {
  const r = ring === 'selected' ? 'scale-110 ring-4 ring-tile-ink' : ring === 'victim' ? 'ring-4 ring-[#c62f2f]' : ring === 'movable' ? 'ring-2 ring-tile-ink/35' : '';
  return <span aria-hidden="true" className={`${TOKEN} size-[84%] ${r}`} style={{ backgroundImage: `url(${GOAT_SRC})` }} />;
}

/**
 * 空點上的標記：可以走的點（實心深墨，蓋住底下的小花）、吃子的落點、放羊的點。
 * 放羊時每個空點都能放，交叉點的小花本身就標出了點，所以放羊點只畫一圈淡淡的環，不再每點一顆圓。
 */
export function Marker({ kind }: { kind: Move['kind'] | 'last' }) {
  if (kind === 'jump') return <span className="grid size-1/2 place-items-center rounded-full bg-tile-orange ring-2 ring-tile-ink"><span className="size-[34%] rounded-full bg-tile-ink" /></span>;
  if (kind === 'place') return <span className="size-[46%] rounded-full ring-2 ring-[#4a2616]/25" />;
  if (kind === 'last') return <span className="size-[46%] rounded-full bg-[#4a2616]/15" />;
  return <span className="size-[32%] rounded-full bg-tile-ink ring ring-[#fbf4e1]" />;
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
    <div className="relative w-full rounded-xl border-[6px] border-[#5b6620] bg-[#fbf4e1] shadow-[inset_0_0_0_2px_#e3a43c]">
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
    <div className="w-full rounded-2xl border-4 border-[#5b6620] bg-[#fbf4e1] p-[4%]" aria-hidden="true">
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
