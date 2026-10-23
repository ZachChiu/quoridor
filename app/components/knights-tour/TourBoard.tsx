'use client';
import { useEffect, useId, useLayoutEffect, useMemo, useRef } from 'react';
import { GiChessKnight } from 'react-icons/gi';
import { colOf, colorOf, isKnightMove, rowOf, type Square } from '@/games/knights-tour/engine';
import { animateFail, animateStep, idleGlance, JUMP_MS, reducedMotion } from './motion';

const NONE: ReadonlySet<Square> = new Set();
/** 騎士一步的長度（格子座標）：√(1² + 2²) */
const STEP_LEN = Math.sqrt(5).toFixed(4);

/**
 * 騎士巡遊的棋盤（對局與說明彈窗共用；不給 onTap 就是靜態的示意圖）。
 *
 * 長相照 18 世紀的數學版畫與老書裡的棋譜圖（配色見 palette.ts）：紙色的淺格、深格用墨色斜線排線，
 * 外面一圈墨線是棋盤的邊。走過的格子淡淡一層紅粉筆、寫上第幾步（舊式數字，像歐拉 1759 年那張表），
 * 走過的整條路徑用淡紅粉筆連起來，最後一步用重的紅粉筆。現在點得到的落點是紅粉筆圓點，
 * 犯規或卡住的那一格整格塗紅粉筆。騎士是墨色圓底上的紙色剪影。
 *
 * 層次：格子（SVG）→ 路徑 → 最上面透明的按鈕（數字、圓點、騎士）。路徑畫在數字下面，才不會把步數劃掉。
 * 走完而且最後一步跳得回起點（封閉巡遊）時，多一段淡紅粉筆的虛線接回第 1 格。
 *
 * 動作（跳、紅粉筆畫過去、走完、走錯、閒著望向落點）在 motion.ts。只在剛好多走一步時播 ——
 * 悔棋、重來、換大小都不播；元件掛上去時看到的局面也不播。
 * 版面照 BaghBoard：外層只管邊框，正方形在內層自己身上 —— aspect-square 跟 padding／border
 * 寫在同一個元素時，iPhone 的 WebKit 會算錯高度。
 */
export default function TourBoard({ n, path, targets = NONE, dead = NONE, hinted = null, failed = null, label, boardLabel, onTap, showKnight = true, idle = false }: {
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
  /** 玩家正在想下一步（騎士已經放下、還沒走完、沒有提示）：騎士偶爾望向跳得到的格子 */
  idle?: boolean;
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
  const closed = path.length === n * n && isKnightMove(n, path[0], path[path.length - 1]);
  const squareRef = useRef<HTMLDivElement>(null);

  // 剛好多走一步才播跳的動作；走錯（failed 從沒有變成有）時騎士探過去搖頭、或原地張望
  const seen = useRef({ length: path.length, failed });
  useLayoutEffect(() => {
    const before = seen.current;
    seen.current = { length: path.length, failed };
    const root = squareRef.current;
    if (!root || !showKnight) return;
    const stepped = path.length === before.length + 1;
    if (stepped) animateStep(root, n, path, closed);
    if (failed !== null && before.failed === null && current !== null) animateFail(root, n, current, failed, stepped ? JUMP_MS : 0);
  }, [path, failed, n, closed, current, showKnight]);

  // 閒著：3.5–6.5 秒沒動就望向一個落點。碰一下棋盤（點錯也算）就重新計時
  useEffect(() => {
    const root = squareRef.current;
    if (!idle || !root || current === null || reducedMotion()) return;
    let id = 0;
    const schedule = () => {
      window.clearTimeout(id);
      id = window.setTimeout(() => {
        if (!document.hidden) idleGlance(root, n, current, [...targets]);
        schedule();
      }, 3500 + Math.random() * 3000);
    };
    schedule();
    root.addEventListener('pointerdown', schedule);
    return () => { window.clearTimeout(id); root.removeEventListener('pointerdown', schedule); };
  }, [idle, n, current, targets]);
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
          : targets.has(sq) || sq === hinted ? <span data-dot aria-hidden="true" className="size-[26%] rounded-full bg-[#834d36]" />
          : dead.has(sq) ? <Cross />
          : null}
      </>
    );
  };

  return (
    <div className="w-full bg-[#322e2a] p-[0.7%]">
      <div ref={squareRef} className="relative aspect-square w-full touch-manipulation overflow-hidden bg-[#edddc7]">
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
          {/* 封閉巡遊：最後一格接回第 1 格（虛線） */}
          {closed && (
            <line data-close x1={center(path[path.length - 1]).x} y1={center(path[path.length - 1]).y} x2={center(path[0]).x} y2={center(path[0]).y}
              stroke="#bf8d70" strokeWidth={0.05} strokeLinecap="round" strokeDasharray="0.14 0.1" />
          )}
          {/* 走過的整條路徑（淡紅粉筆），最後一步重一點。淡的那條只畫到上一格：最後一段反正被重的蓋住，
              跳的時候重的那段才能從無到有畫出來，底下不會先露出一條淡的 */}
          {path.length > 2 && (
            <polyline points={path.slice(0, -1).map((sq) => `${center(sq).x},${center(sq).y}`).join(' ')} fill="none"
              stroke="#bf8d70" strokeWidth={0.05} strokeLinecap="round" strokeLinejoin="round" />
          )}
          {/* 騎士的一步在格子座標裡一定是 √5 長（1² + 2²）：虛線長度設成它，動畫只要把 dashoffset 從 √5 收到 0 */}
          {prev !== null && current !== null && (
            <line data-last x1={center(prev).x} y1={center(prev).y} x2={center(current).x} y2={center(current).y}
              stroke="#834d36" strokeWidth={0.08} strokeLinecap="round" strokeDasharray={`${STEP_LEN} ${STEP_LEN}`} />
          )}
        </svg>

        {onTap ? (
          <div role="group" aria-label={boardLabel} className="absolute inset-0 grid" style={grid}>
            {cells.map((sq) => (
              <button key={sq} type="button" data-cell={sq} onClick={(e) => onTap(sq, e.currentTarget)}
                aria-label={label?.(sq, order[sq])}
                className="relative grid place-items-center outline-none focus-visible:z-10 focus-visible:ring focus-visible:ring-inset focus-visible:ring-[#322e2a] fine:hover:bg-[#322e2a]/[0.07]">
                {content(sq)}
              </button>
            ))}
          </div>
        ) : (
          <div aria-hidden="true" className="absolute inset-0 grid" style={grid}>
            {cells.map((sq) => <span key={sq} data-cell={sq} className="relative grid place-items-center">{content(sq)}</span>)}
          </div>
        )}
      </div>
    </div>
  );
}

function Knight() {
  return (
    <span data-knight className="grid size-[84%] place-items-center rounded-full bg-[#322e2a] text-[#edddc7]">
      <GiChessKnight aria-hidden="true" className="size-[70%]" />
    </span>
  );
}

/** 第幾步。用 SVG 寫字，字就跟著格子一起縮放（5×5 到 10×10、手機到桌機都同一個比例）；舊式襯線，像歐拉那張表 */
function Num({ k, light }: { k: number; light: boolean }) {
  return (
    <svg data-num aria-hidden="true" viewBox="0 0 100 100" className="size-full">
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
