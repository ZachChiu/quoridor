'use client';
import { SIZE, type Cell, type Move, type Point } from '@/games/bagh-chal/engine';
import { GOAT_SRC, TIGER_SRC } from './tokens';

/**
 * Bagh Chal 的棋盤。對局用的 BaghBoard（交叉點是按鈕）與規則說明用的 MiniBoard（靜態）共用同一套畫法。
 *
 * 長相取自尼泊爾的印刷棋盤（Wikimedia Commons 那張：番紅花色的外框裡一圈老虎追羊、四角花飾、
 * 交叉點上一朵朵小花），2026-10-20 試做：
 * - 外框四邊是 AI 畫的「老虎追羊」飾帶（public/games/bagh-chal/frieze.webp），一邊三段。
 *   繞著棋盤順時針追：上邊往右、右邊往下、下邊往左、左邊往上；上下兩邊是正的，左右兩邊轉 90° 讓地面朝內
 * - 棋子是 AI 畫的虎、羊圓牌（tokens.tsx），跟飾帶同一套畫風 —— 用剪影圖示的話，
 *   滿是花紋的外框會把平面的圖示襯得很突兀（Zach 的擔心：會亂棋子）
 * - 花紋只在外框。盤面保持素淨：紙色、細線、交叉點的小花壓低彩度，讓棋子與落點提示永遠最顯眼
 *
 * 版面：外層是正方形，盤面用 absolute 內縮（inset 的 % 上下以高度、左右以寬度計，外層是正方形所以一致）。
 * aspect-square 不跟 padding 寫在同一個元素 —— 兩者寫在一起時，iPhone 的 WebKit 算出來的內框比寬度高一點，
 * 交叉點按鈕照高度的 % 定位、線照正方形畫，點和棋子就越往下越偏上（Zach 截圖：歪歪的）。
 */
export const xy = (p: Point) => ({ x: 10 + (p % SIZE) * 20, y: 10 + Math.floor(p / SIZE) * 20 });

/** 印刷棋盤的顏色（取自那張棋盤與 AI 飾帶） */
const C = {
  olive: '#5b6620',
  saffron: '#e3a43c',
  corner: '#d9822b',
  brown: '#4a2616',
  terracotta: '#b8471f',
  paper: '#fbf4e1',
  line: '#4a3426',
} as const;

/* 外框的尺寸（viewBox 0–1000）。飾帶一段的長寬比要接近原圖（900×237 ≈ 3.8），
   一邊放三段：(1000 − 2·OUT − 2·BAND) / 3 ÷ BAND ≈ 3.83 */
const OUT = 14;
const BAND = 72;
const IN = 8;
/** 盤面離外緣多遠（%） */
const FIELD_INSET = (OUT + BAND + IN) / 10;
const SIDE = 1000 - 2 * OUT - 2 * BAND;

/** 外框：外圈橄欖綠、四邊飾帶、四角花飾、內圈橄欖綠、紙色盤面 */
function Frame() {
  const band = <rect x={OUT + BAND} y={OUT} width={SIDE} height={BAND} fill="url(#bagh-frieze)" />;
  return (
    <svg viewBox="0 0 1000 1000" className="absolute inset-0 size-full" aria-hidden="true">
      <defs>
        <pattern id="bagh-frieze" patternUnits="userSpaceOnUse" x={OUT + BAND} y={OUT} width={SIDE / 3} height={BAND}>
          <image href="/games/bagh-chal/frieze.webp" width={SIDE / 3} height={BAND} preserveAspectRatio="none" />
        </pattern>
        <symbol id="bagh-rosette" viewBox="-50 -50 100 100">
          <rect x="-50" y="-50" width="100" height="100" fill={C.corner} />
          {[0, 90, 180, 270].map((r) => (
            <g key={r} transform={`rotate(${r})`}>
              <path d="M0-44C15-24 13-9 0 0C-13-9-15-24 0-44Z" fill={C.brown} />
              <path d="M0-33C7-21 6-11 0-6C-6-11-7-21 0-33Z" fill={C.saffron} />
              <path d="M0-30C9-30 22-22 22-22C14-14 6-10 0-8Z" transform="rotate(45)" fill={C.terracotta} />
            </g>
          ))}
          <circle r="8" fill={C.paper} stroke={C.brown} strokeWidth="3" />
        </symbol>
      </defs>
      <rect x="0" y="0" width="1000" height="1000" rx="18" fill={C.olive} />
      <rect x={OUT} y={OUT} width={1000 - 2 * OUT} height={1000 - 2 * OUT} fill={C.saffron} />
      {band}
      <g transform="rotate(90 500 500)">{band}</g>
      <g transform="rotate(-90 500 500)">{band}</g>
      {/* 下邊：左右鏡射而不是轉 180°，動物才是正的、往左跑 */}
      <g transform={`translate(1000 ${1000 - 2 * OUT - BAND}) scale(-1 1)`}>{band}</g>
      {[[OUT, OUT], [1000 - OUT - BAND, OUT], [OUT, 1000 - OUT - BAND], [1000 - OUT - BAND, 1000 - OUT - BAND]].map(([x, y]) => (
        <use key={`${x}-${y}`} href="#bagh-rosette" x={x} y={y} width={BAND} height={BAND} />
      ))}
      <rect x={OUT + BAND} y={OUT + BAND} width={SIDE} height={SIDE} fill={C.olive} />
      <rect x={OUT + BAND + IN} y={OUT + BAND + IN} width={SIDE - 2 * IN} height={SIDE - 2 * IN} fill={C.paper} />
    </svg>
  );
}

/** 交叉點上的小花：中心最大、四個斜線交會點次之、其他最小（照印刷棋盤） */
function Rosette({ x, y, r }: { x: number; y: number; r: number }) {
  return (
    <g transform={`translate(${x} ${y}) scale(${r})`} opacity={0.8}>
      {[0, 90, 180, 270].map((a) => (
        <path key={a} transform={`rotate(${a})`} d="M0-1C.28-.5.24-.18 0 0C-.24-.18-.28-.5 0-1Z" fill={C.brown} />
      ))}
      {[45, 135, 225, 315].map((a) => (
        <path key={a} transform={`rotate(${a})`} d="M0-.72C.22-.4.18-.16 0 0C-.18-.16-.22-.4 0-.72Z" fill={C.terracotta} />
      ))}
      <circle r=".2" fill={C.paper} />
    </g>
  );
}

/** 棋盤線：直線、橫線、兩條對角線與中間的菱形 —— 斜線只經過列＋行為偶數的點 */
export function BoardLines({ width = 0.45 }: { width?: number }) {
  return (
    <svg viewBox="0 0 100 100" className="absolute inset-0 size-full" aria-hidden="true">
      <g stroke={C.line} strokeWidth={width} strokeLinecap="round" fill="none">
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

/* 棋子底下一道硬邊的影子，像一塊有厚度的圓牌放在紙上；外框花紋多，沒有這道邊棋子會融進去 */
const LIFT = 'drop-shadow-[0_2px_0_rgba(74,38,22,0.45)]';

export function TigerPiece({ selected = false }: { selected?: boolean }) {
  return (
    <span className={`relative block size-[96%] rounded-full transition ${LIFT} ${selected ? 'scale-110 ring-4 ring-tile-ink' : ''}`}>
      {/* eslint-disable-next-line @next/next/no-img-element -- 靜態匯出，棋子圖已是 256px webp */}
      <img src={TIGER_SRC} alt="" draggable={false} className="size-full select-none" />
    </span>
  );
}

export function GoatPiece({ ring }: { ring?: 'selected' | 'victim' | 'movable' }) {
  const r = ring === 'selected' ? 'scale-110 ring-4 ring-tile-ink' : ring === 'victim' ? 'ring-4 ring-[#c62f2f]' : ring === 'movable' ? 'ring-2 ring-tile-ink/35' : '';
  return (
    <span className={`relative block size-[84%] rounded-full transition ${LIFT} ${r}`}>
      {/* eslint-disable-next-line @next/next/no-img-element -- 同上 */}
      <img src={GOAT_SRC} alt="" draggable={false} className="size-full select-none" />
    </span>
  );
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
    <div className="relative aspect-square w-full">
      <Frame />
      <div className="absolute" style={{ inset: `${FIELD_INSET}%` }}>
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
 * 小棋盤不畫飾帶（一頁好幾張，太花），只留紙色盤面與橄欖綠細框。
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
