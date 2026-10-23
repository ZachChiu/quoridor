'use client';
import { useEffect, useLayoutEffect, useRef } from 'react';
import { SIZE, type Cell, type Move, type Point, type Side } from '@/games/bagh-chal/engine';
import { GOAT_SRC, TIGER_SRC } from './tokens';
import { BAGH } from './palette';
import { playIdle } from './idleMotion';

/**
 * Bagh Chal 的棋盤。對局用的 BaghBoard（交叉點是按鈕）與規則說明用的 MiniBoard 共用同一套畫法。
 *
 * 長相取自尼泊爾的印刷棋盤（Wikimedia Commons 那張）：紙色盤面、細墨線。老虎追羊的飾帶畫在整頁的畫框上（BaghFrame），
 * 棋盤自己只留一道橄欖綠粗框與番紅花內線 —— 兩層飾帶疊在一起太花，而且手機上會把盤面擠小
 * （2026-10-20 Zach 選了「整頁圖騰」的平均版，見 docs 與設計總表）。
 * 交叉點原本各有一朵米字形的小花（印刷棋盤上的），Zach 10/24：棋盤一開始不要有符號，選了老虎或羊才出現 ——
 * 所以盤面只剩線，選了棋子之後，可以去的點才開出那朵小花（同一天他要的：可選移動的地方用剛剛換掉的米字標示）；
 * 放羊的時候不標（每個空點都能放），桌機滑過去會浮出一隻淡淡的羊。
 *
 * 棋子是 AI 畫的虎、羊圓牌，用**背景圖**畫、影子用 box-shadow，不用 <img> 加 filter：
 * iPhone 的 WebKit 會漏畫「套了 filter: drop-shadow 的元素裡動態插入的圖」——
 * 棋子一移動就是新插入的，Zach 的截圖裡就這樣少了 2 隻老虎、2 隻羊（只剩外圈）。
 *
 * 版面：外層只管邊框，正方形放在內層自己身上（aspect-square 不跟 padding／border 寫在同一個元素）——
 * 兩者寫在一起時，iPhone 的 WebKit 算出來的內框比寬度高一點，交叉點按鈕照高度的 % 定位、
 * 線照正方形畫，點和棋子就越往下越偏上（Zach 截圖：歪歪的）。
 *
 * 動作（Zach 10/24：學 Wall Go 補上棋子的互動）：羊放上來是落下、走一步是滑過去、老虎吃羊是一口吞下
 * （衝過去、羊被吸進落點、嚼兩下）；沒輪到的那一方偶爾自己動一下（見 idleMotion.ts）。全部用 WAAPI，只動 transform／opacity。
 */
export const xy = (p: Point) => ({ x: 10 + (p % SIZE) * 20, y: 10 + Math.floor(p / SIZE) * 20 });

const reducedMotion = () => typeof window !== 'undefined' && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** 米字形的小花：四瓣深褐、四瓣陶紅、紙色花心（印刷棋盤交叉點上的那朵）。現在是「可以走到這裡」的標記 */
function Rosette({ className = '' }: { className?: string }) {
  return (
    <svg viewBox="-1 -1 2 2" className={className} aria-hidden="true">
      {[0, 90, 180, 270].map((a) => (
        <path key={a} transform={`rotate(${a})`} d="M0-1C.28-.5.24-.18 0 0C-.24-.18-.28-.5 0-1Z" fill={BAGH.brown} />
      ))}
      {[45, 135, 225, 315].map((a) => (
        <path key={a} transform={`rotate(${a})`} d="M0-.72C.22-.4.18-.16 0 0C-.18-.16-.22-.4 0-.72Z" fill={BAGH.terracotta} />
      ))}
      <circle r=".2" fill={BAGH.paper} />
    </svg>
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
    </svg>
  );
}

/* 一枚有厚度的圓牌：底下一道硬邊的影子（box-shadow），選取／可走的外圈用 ring（也是 box-shadow，兩者會疊加） */
const TOKEN = 'block rounded-full bg-cover bg-center shadow-[0_2px_0_rgba(74,38,22,0.45)] transition-transform';

export function TigerPiece({ selected = false }: { selected?: boolean }) {
  return (
    <span data-piece aria-hidden="true" className={`${TOKEN} size-[96%] ${selected ? 'scale-110 ring-4 ring-tile-ink' : ''}`}
      style={{ backgroundImage: `url(${TIGER_SRC})` }} />
  );
}

export function GoatPiece({ ring }: { ring?: 'selected' | 'victim' | 'movable' }) {
  const r = ring === 'selected' ? 'scale-110 ring-4 ring-tile-ink' : ring === 'victim' ? 'ring-4 ring-[#c62f2f]' : ring === 'movable' ? 'ring-2 ring-tile-ink/35' : '';
  return <span data-piece aria-hidden="true" className={`${TOKEN} size-[84%] ${r}`} style={{ backgroundImage: `url(${GOAT_SRC})` }} />;
}

/**
 * 空點上的標記：可以走的點（米字小花，開出來時轉半圈放大）、放羊的點（只有規則說明的小棋盤會畫）。
 * 原本還有一個「上一手從這裡離開」的淡灰點，Zach 10/24 看到以為是莫名其妙的黑點 —— 拿掉了，上一手看滑過去的動畫就好。
 * 對局裡吃子的落點也是同一朵花（不另外標，Zach 10/24：老虎可以吃羊時不要有任何提示）；
 * 規則說明的小棋盤要教「跳過去吃」，jump 才畫成陶紅色的圈。
 */
export function Marker({ kind, board = false }: { kind: Move['kind']; board?: boolean }) {
  if (kind === 'jump' && !board) return (
    <span className="grid size-[62%] place-items-center rounded-full bg-[#b8471f]/15 ring ring-[#b8471f]">
      <Rosette className="size-[70%]" />
    </span>
  );
  if (kind === 'place') return <span className="size-[46%] rounded-full ring-2 ring-[#4a2616]/25" />;
  return <Rosette className="size-1/2 motion-safe:animate-[bagh-bloom_260ms_ease-out]" />;
}

const SEAT = 'absolute grid size-[17%] -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full';

/* 上一手的動畫（落下、滑過去、吞下去）。位移以棋盤正方形的寬度換算：交叉點的座標是寬度的百分比 */
const DROP: Keyframe[] = [
  { opacity: 0, translate: '0 -45%', scale: '1.3', offset: 0 },
  { opacity: 1, translate: '0 0', scale: '0.9', offset: 0.55, easing: 'ease-out' },
  { scale: '1.05', offset: 0.78 },
  { opacity: 1, translate: '0 0', scale: '1' },
];

/** 對局用的棋盤 */
export function BaghBoard({ board, targets, movable, selected, last, plies, placing, idle, labels, onPick }: {
  board: Cell[];
  targets: Map<Point, Move>;
  movable: Set<Point>;
  selected: Point | null;
  last?: Move;
  /** 走了幾手（history 的長度）：剛好多一手才播動畫 —— 悔棋、重整接回、連線一次補好幾手都不播 */
  plies: number;
  /** 羊還在放：空點滑過去浮出一隻淡淡的羊 */
  placing: boolean;
  /** 沒輪到、在等的那一方（它的棋子偶爾自己動一下）；分出勝負後 null */
  idle: Side | null;
  labels: { tiger: string; goat: string };
  onPick: (p: Point) => void;
}) {
  const squareRef = useRef<HTMLDivElement>(null);
  const seen = useRef(plies);

  useLayoutEffect(() => {
    const prev = seen.current;
    seen.current = plies;
    const root = squareRef.current;
    if (plies !== prev + 1 || !last || !root || reducedMotion()) return;
    const piece = root.querySelector<HTMLElement>(`[data-point="${last.to}"] [data-piece]`);
    if (!piece) return;
    if (last.kind === 'place') { piece.animate(DROP, { duration: 380, easing: 'linear' }); return; }
    const w = root.clientWidth;
    const a = xy(last.from), b = xy(last.to);
    const dx = ((a.x - b.x) / 100) * w, dy = ((a.y - b.y) / 100) * w;
    if (last.kind === 'move') {
      piece.animate([{ translate: `${dx}px ${dy}px` }, { translate: '0 0' }], { duration: 260, easing: 'cubic-bezier(.2,.8,.3,1)' });
      return;
    }
    // 老虎吃羊：一口吞下 —— 老虎貼地衝過去，被吃的羊被吸進落點縮不見，老虎嚼兩下。
    // Zach 10/24 從五種（跳過去羊彈開、一口吞下、甩出棋盤、收進比分、踩扁）裡選的
    piece.animate([
      { translate: `${dx}px ${dy}px`, scale: '1', offset: 0 },
      { translate: `${dx * 0.08}px ${dy * 0.08}px`, scale: '1.1', offset: 0.42, easing: 'ease-out' },
      { translate: '0 0', scale: '1.18 0.84', offset: 0.58 },
      { scale: '0.9 1.1', offset: 0.7 },
      { scale: '1.12 0.88', offset: 0.82 },
      { translate: '0 0', scale: '1' },
    ], { duration: 640, easing: 'ease-in' });
    root.querySelector<HTMLElement>('[data-captured] [data-piece]')?.animate([
      { opacity: 1, translate: '0 0', scale: '1', offset: 0 },
      { opacity: 1, translate: '0 0', scale: '1', offset: 0.3 },
      { opacity: 1, translate: `${-dx / 2}px ${-dy / 2}px`, scale: '0.25', offset: 0.55, easing: 'ease-in' },
      { opacity: 0, translate: `${-dx / 2}px ${-dy / 2}px`, scale: '0' },
    ], { duration: 640, fill: 'both' });
  }, [plies, last]);

  // 等的那一方偶爾動一下：每 2～5 秒挑一顆
  useEffect(() => {
    const root = squareRef.current;
    if (!idle || !root || reducedMotion()) return;
    let id = 0;
    const tick = () => { id = window.setTimeout(() => { playIdle(root, board, idle); tick(); }, 2200 + Math.random() * 2800); };
    tick();
    return () => window.clearTimeout(id);
  }, [idle, board]);

  const over = last?.kind === 'jump' ? xy(last.over) : null;

  return (
    <div className="relative w-full rounded-xl border-[6px] border-[#5b6620] bg-[#fbf4e1] shadow-[inset_0_0_0_2px_#e3a43c]">
      <div ref={squareRef} className="relative aspect-square w-full">
        <BoardLines />
        {/* 被吃掉的那隻羊：盤面上已經沒有牠了，畫一隻替身被吸進老虎嘴裡。沒播動畫（悔棋、重整）時一直是透明的 */}
        {over && (
          <span key={`captured-${plies}`} data-captured aria-hidden="true" className={`${SEAT} pointer-events-none z-10`} style={{ left: `${over.x}%`, top: `${over.y}%` }}>
            <span data-piece className={`${TOKEN} size-[84%] opacity-0`} style={{ backgroundImage: `url(${GOAT_SRC})` }} />
          </span>
        )}
        {board.map((cell, p) => {
          const { x, y } = xy(p);
          const target = targets.get(p);
          const label = cell === 'T' ? labels.tiger : cell === 'G' ? labels.goat : `${Math.floor(p / SIZE) + 1}-${(p % SIZE) + 1}`;
          return (
            <button key={p} type="button" data-point={p} onClick={() => onPick(p)} aria-label={label} aria-pressed={selected === p || undefined}
              className={`${SEAT} group`} style={{ left: `${x}%`, top: `${y}%` }}>
              {cell === 'T' && <TigerPiece selected={selected === p} />}
              {cell === 'G' && <GoatPiece ring={selected === p ? 'selected' : movable.has(p) ? 'movable' : undefined} />}
              {!cell && target && <Marker kind={target.kind} board />}
              {!cell && placing && (
                <span aria-hidden="true" className={`${TOKEN} size-[84%] opacity-0 shadow-none fine:group-hover:opacity-40`} style={{ backgroundImage: `url(${GOAT_SRC})` }} />
              )}
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

