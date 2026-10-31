'use client';
import { useMemo } from 'react';
import { GiChessKnight } from 'react-icons/gi';
import { colOf, colorOf, rowOf, type Square } from '@/games/knights-tour/engine';

const NONE: ReadonlySet<Square> = new Set();

/**
 * 騎士巡邏的棋盤（對局與說明彈窗共用；不給 onTap 就是靜態的示意圖）。
 *
 * 三層疊在同一個正方形裡：底下是格子的顏色、中間一條線標出騎士剛從哪裡跳過來、
 * 最上面是透明的按鈕（數字、圓點、騎士）。線畫在數字下面，才不會把走過的步數劃掉。
 *
 * 配色只有琥珀一個色相＋中性：沒走過的格子是奶油／沙色的棋盤格（左上角那種顏色是淺的，
 * 奇數盤四個角都是淺色 —— 規則說的「跟四個角同色」就是淺色格），走過的格子填琥珀、寫上第幾步，
 * 騎士是深墨圓底上的米白剪影。犯規或卡住的那一格整格變磚紅。
 *
 * 版面照 BaghBoard：外層只管內距（深色外框），正方形在內層自己身上 ——
 * aspect-square 跟 padding 寫在同一個元素時，iPhone 的 WebKit 會算錯高度。
 */
export default function TourBoard({ n, path, targets = NONE, dead = NONE, hinted = null, failed = null, label, boardLabel, onTap }: {
  n: number;
  path: readonly Square[];
  /** 現在點得到的落點（圓點） */
  targets?: ReadonlySet<Square>;
  /** 出發走不完的格子（奇數盤還沒放騎士時打 ×） */
  dead?: ReadonlySet<Square>;
  /** 提示的那一格（圓點外一圈閃爍） */
  hinted?: Square | null;
  /** 犯規或卡住的那一格（整格磚紅） */
  failed?: Square | null;
  /** 每一格的讀屏文字 */
  label?: (sq: Square, order: number) => string;
  boardLabel?: string;
  /** 點了某一格；el 是那一格的按鈕（點錯時拿來晃一下） */
  onTap?: (sq: Square, el: HTMLElement) => void;
}) {
  const order = useMemo(() => {
    const o: number[] = new Array(n * n).fill(0);
    path.forEach((sq, i) => { o[sq] = i + 1; });
    return o;
  }, [n, path]);
  const current = path.length ? path[path.length - 1] : null;
  const prev = path.length > 1 ? path[path.length - 2] : null;
  const grid = { gridTemplateColumns: `repeat(${n}, minmax(0, 1fr))`, gridTemplateRows: `repeat(${n}, minmax(0, 1fr))` };
  const cells = Array.from({ length: n * n }, (_, sq) => sq);
  const center = (sq: Square) => ({ x: colOf(n, sq) + 0.5, y: rowOf(n, sq) + 0.5 });

  const content = (sq: Square) => {
    const k = order[sq];
    const isFail = sq === failed;
    return (
      <>
        {/* 提示：一圈往外擴散；開了減少動態就改成一圈不動的淡色圓 */}
        {sq === hinted && <span aria-hidden="true" className="absolute inset-[16%] animate-ping rounded-full bg-tile-ink/35 motion-reduce:animate-none motion-reduce:bg-tile-ink/20" />}
        {sq === current ? <Knight />
          : k > 0 ? <Num k={k} light={isFail} />
          : targets.has(sq) || sq === hinted ? <span aria-hidden="true" className="size-[26%] rounded-full bg-tile-ink" />
          : dead.has(sq) ? <Cross />
          : null}
      </>
    );
  };

  return (
    <div className="w-full rounded-2xl bg-board-line p-[1.5%]">
      <div className="relative aspect-square w-full touch-manipulation overflow-hidden rounded-[0.55rem]">
        <div aria-hidden="true" className="absolute inset-0 grid" style={grid}>
          {cells.map((sq) => (
            <span key={sq} className={order[sq] > 0 ? 'bg-tile-amber' : colorOf(n, sq) === 0 ? 'bg-primary-50' : 'bg-[#e5dbca]'} />
          ))}
        </div>

        {prev !== null && current !== null && (
          <svg aria-hidden="true" viewBox={`0 0 ${n} ${n}`} className="pointer-events-none absolute inset-0 size-full">
            <line x1={center(prev).x} y1={center(prev).y} x2={center(current).x} y2={center(current).y}
              stroke="rgb(var(--tile-ink) / 0.4)" strokeWidth={0.07} strokeLinecap="round" />
          </svg>
        )}

        {onTap ? (
          <div role="group" aria-label={boardLabel} className="absolute inset-0 grid" style={grid}>
            {cells.map((sq) => (
              <button key={sq} type="button" onClick={(e) => onTap(sq, e.currentTarget)}
                aria-label={label?.(sq, order[sq])}
                className={`relative grid place-items-center outline-none focus-visible:z-10 focus-visible:ring focus-visible:ring-inset focus-visible:ring-tile-ink ${
                  sq === failed ? 'bg-tile-red' : 'fine:hover:bg-tile-ink/[0.07]'}`}>
                {content(sq)}
              </button>
            ))}
          </div>
        ) : (
          <div aria-hidden="true" className="absolute inset-0 grid" style={grid}>
            {cells.map((sq) => <span key={sq} className="relative grid place-items-center">{content(sq)}</span>)}
          </div>
        )}
      </div>
    </div>
  );
}

function Knight() {
  return (
    <span className="grid size-[84%] place-items-center rounded-full bg-tile-ink text-tile-cream">
      <GiChessKnight aria-hidden="true" className="size-[70%]" />
    </span>
  );
}

/** 第幾步。用 SVG 寫字，字就跟著格子一起縮放（5×5 到 10×10、手機到桌機都同一個比例） */
function Num({ k, light }: { k: number; light: boolean }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 100 100" className="size-full">
      <text x="50" y="50" dy="0.36em" textAnchor="middle" fontSize={k >= 100 ? 36 : 44} fontWeight={900}
        className={light ? 'fill-tile-cream' : 'fill-tile-ink'}>{k}</text>
    </svg>
  );
}

function Cross() {
  return (
    <svg aria-hidden="true" viewBox="0 0 100 100" className="size-[34%]">
      <path d="M18 18 82 82M82 18 18 82" stroke="rgb(var(--tile-ink) / 0.32)" strokeWidth={13} strokeLinecap="round" />
    </svg>
  );
}
