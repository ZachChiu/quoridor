'use client';
import { useEffect, useRef, useState, type ReactNode } from 'react';
import { LuChevronLeft, LuChevronRight } from 'react-icons/lu';

/**
 * 平台首頁一排橫向捲動的遊戲卡（10/24 Zach：捲軸要調整、電腦版要能捲）。
 *
 * - 捲軸藏起來（`.plat-row`）：Chrome 桌機、Windows 會畫一條白色的粗捲軸，在深色底上很突兀
 * - 滑鼠（`fine`）：兩端各一個箭頭，按一下翻一頁（Netflix 的做法）；只在那個方向還有卡片時出現，
 *   也順便告訴人「右邊還有」。滑鼠滾輪照舊捲整頁，不搶來橫捲 —— 捲到一半卡在某一排上很煩
 * - 手指：照舊滑；觸控板左右滑、Shift＋滾輪也照舊
 * 箭頭不進 tab 順序、不給螢幕報讀：用鍵盤 tab 到卡片時瀏覽器自己會捲過去，清單本身也讀得到每一張
 */
export default function CardRow({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLUListElement>(null);
  const [edge, setEdge] = useState({ left: false, right: false });

  useEffect(() => {
    const ul = ref.current;
    if (!ul) return;
    const sync = () => {
      const max = ul.scrollWidth - ul.clientWidth;
      // 差 1px 以內當作到底（縮放時 scrollLeft 會是小數）
      setEdge({ left: ul.scrollLeft > 1, right: ul.scrollLeft < max - 1 });
    };
    sync();
    ul.addEventListener('scroll', sync, { passive: true });
    const ro = new ResizeObserver(sync);
    ro.observe(ul);
    return () => { ul.removeEventListener('scroll', sync); ro.disconnect(); };
  }, []);

  const page = (dir: 1 | -1) => {
    const ul = ref.current;
    if (!ul) return;
    // 留一張卡的寬度不翻過去，翻完還看得到上一頁的最後一張，才知道接在哪
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;
    ul.scrollBy({ left: dir * Math.max(ul.clientWidth - 260, 240), behavior: reduce ? 'auto' : 'smooth' });
  };

  const arrow = 'absolute inset-y-0 z-10 hidden w-14 items-center text-tile-cream transition-opacity fine:flex';
  return (
    <div className="relative -mx-4">
      <ul ref={ref} className="plat-row flex gap-3 overflow-x-auto px-4 pb-2">
        {children}
      </ul>
      <button
        type="button" tabIndex={-1} aria-hidden="true" onClick={() => page(-1)}
        className={`${arrow} left-0 justify-start bg-gradient-to-r from-plat-bg from-25% to-transparent pb-2 pl-1.5 ${edge.left ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
      >
        <LuChevronLeft className="size-9 transition-transform hover:scale-125" />
      </button>
      <button
        type="button" tabIndex={-1} aria-hidden="true" onClick={() => page(1)}
        className={`${arrow} right-0 justify-end bg-gradient-to-l from-plat-bg from-25% to-transparent pb-2 pr-1.5 ${edge.right ? 'opacity-100' : 'pointer-events-none opacity-0'}`}
      >
        <LuChevronRight className="size-9 transition-transform hover:scale-125" />
      </button>
    </div>
  );
}
