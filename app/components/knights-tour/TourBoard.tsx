'use client';
import { useId, useMemo } from 'react';
import { GiChessKnight } from 'react-icons/gi';
import { colOf, colorOf, rowOf, type Square } from '@/games/knights-tour/engine';

const NONE: ReadonlySet<Square> = new Set();

/**
 * 騎士巡邏的棋盤（對局與說明彈窗共用；不給 onTap 就是靜態的示意圖）。
 *
 * 長相照 18 世紀的數學版畫與老書裡的棋譜圖（配色見 palette.ts）：紙色的淺格、深格用墨色斜線排線，
 * 外面一圈墨線是棋盤的邊。走過的格子淡淡一層紅粉筆、寫上第幾步（舊式數字，像歐拉 1759 年那張表），
 * 走過的整條路徑用淡紅粉筆連起來，最後一步用重的紅粉筆。現在點得到的落點是紅粉筆圓點，
 * 犯規或卡住的那一格整格塗紅粉筆。騎士是墨色圓底上的紙色剪影。
 *
 * 層次：格子（SVG）→ 路徑 → 最上面透明的按鈕（數字、圓點、騎士）。路徑畫在數字下面，才不會把步數劃掉。
 * 版面照 BaghBoard：外層只管邊框，正方形在內層自己身上 —— aspect-square 跟 padding／border
 * 寫在同一個元素時，iPhone 的 WebKit 會算錯高度。
 */
export default function TourBoard({ n, path, targets = NONE, dead = NONE, hinted = null, failed = null, label, boardLabel, onTap, showKnight = true }: {
  n: number;
  path: readonly Square[];
  /** 現在點得到的落點（圓點） */
  targets?: ReadonlySet<Square>;
  /** 出發走不完的格子（奇數盤還沒放騎士時打 ×） */
  dead?: ReadonlySet<Square>;
  /** 提示的那一格（圓點外一圈閃爍） */
  hinted?: Square | null;
  /** 犯規或卡住的那一格（整格紅粉筆） */
  failed?: Square | null;
  /** 每一格的讀屏文字 */
  label?: (sq: Square, order: number) => string;
  boardLabel?: string;
  /** 點了某一格；el 是那一格的按鈕（點錯時拿來晃一下） */
  onTap?: (sq: Square, el: HTMLElement) => void;
  /** 最後一格畫騎士（對局）；false 就照樣寫步數（首頁的 Fig. 1 是一張完整的解答） */
  showKnight?: boolean;
}) {
  // useId 可能帶冒號或特殊括號，放進 SVG 的 url(#…) 會引用不到：只留英數字
  const hatchId = `kt-hatch-${useId().replace(/[^a-zA-Z0-9]/g, '')}`;
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
        {sq === hinted && <span aria-hidden="true" className="absolute inset-[16%] animate-ping rounded-full bg-[#834d36]/40 motion-reduce:animate-none motion-reduce:bg-[#834d36]/25" />}
        {sq === current && showKnight ? <Knight />
          : k > 0 ? <Num k={k} light={isFail} />
          : targets.has(sq) || sq === hinted ? <span aria-hidden="true" className="size-[26%] rounded-full bg-[#834d36]" />
          : dead.has(sq) ? <Cross />
          : null}
      </>
    );
  };

  return (
    <div className="w-full bg-[#322e2a] p-[0.7%]">
      <div className="relative aspect-square w-full touch-manipulation overflow-hidden bg-[#edddc7]">
        <svg aria-hidden="true" viewBox={`0 0 ${n} ${n}`} className="pointer-events-none absolute inset-0 size-full">
          <defs>
            {/* 深格的斜線排線（銅版畫的陰影），間距跟著格子縮放 */}
            <pattern id={hatchId} width={0.16} height={0.16} patternUnits="userSpaceOnUse" patternTransform="rotate(45)">
              <line x1={0} y1={0} x2={0} y2={0.16} stroke="#322e2a" strokeWidth={0.035} strokeOpacity={0.55} />
            </pattern>
          </defs>
          {cells.map((sq) => {
            const x = colOf(n, sq), y = rowOf(n, sq);
            if (sq === failed) return <rect key={sq} x={x} y={y} width={1} height={1} fill="#834d36" />;
            if (order[sq] > 0) return <rect key={sq} x={x} y={y} width={1} height={1} fill="#e2c9b1" />;
            return colorOf(n, sq) === 0 ? null : <rect key={sq} x={x} y={y} width={1} height={1} fill={`url(#${hatchId})`} />;
          })}
          {/* 走過的整條路徑（淡紅粉筆），最後一步重一點 */}
          {path.length > 1 && (
            <polyline points={path.map((sq) => `${center(sq).x},${center(sq).y}`).join(' ')} fill="none"
              stroke="#bf8d70" strokeWidth={0.05} strokeLinecap="round" strokeLinejoin="round" />
          )}
          {prev !== null && current !== null && (
            <line x1={center(prev).x} y1={center(prev).y} x2={center(current).x} y2={center(current).y}
              stroke="#834d36" strokeWidth={0.08} strokeLinecap="round" />
          )}
        </svg>

        {onTap ? (
          <div role="group" aria-label={boardLabel} className="absolute inset-0 grid" style={grid}>
            {cells.map((sq) => (
              <button key={sq} type="button" onClick={(e) => onTap(sq, e.currentTarget)}
                aria-label={label?.(sq, order[sq])}
                className="relative grid place-items-center outline-none focus-visible:z-10 focus-visible:ring focus-visible:ring-inset focus-visible:ring-[#322e2a] fine:hover:bg-[#322e2a]/[0.07]">
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
    <span className="grid size-[84%] place-items-center rounded-full bg-[#322e2a] text-[#edddc7]">
      <GiChessKnight aria-hidden="true" className="size-[70%]" />
    </span>
  );
}

/** 第幾步。用 SVG 寫字，字就跟著格子一起縮放（5×5 到 10×10、手機到桌機都同一個比例）；舊式襯線，像歐拉那張表 */
function Num({ k, light }: { k: number; light: boolean }) {
  return (
    <svg aria-hidden="true" viewBox="0 0 100 100" className="size-full">
      <text x="50" y="50" dy="0.36em" textAnchor="middle" fontSize={k >= 100 ? 38 : 48} fontWeight={600}
        className={`kt-serif ${light ? 'fill-[#edddc7]' : 'fill-[#322e2a]'}`}>{k}</text>
    </svg>
  );
}

function Cross() {
  return (
    <svg aria-hidden="true" viewBox="0 0 100 100" className="size-[34%]">
      <path d="M18 18 82 82M82 18 18 82" stroke="#322e2a" strokeOpacity={0.38} strokeWidth={13} strokeLinecap="round" />
    </svg>
  );
}
