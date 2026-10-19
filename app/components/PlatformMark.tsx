import { GiDevilMask } from 'react-icons/gi';

/**
 * 平台的標誌：深墨圓底上一張紅色惡魔面具（品牌還沒定，圖示是暫代的）。
 *
 * 每一頁都在同一個位置（左上）、同一個樣子（Zach：平台名都同一邊一個 ICON）：
 * 遊戲首頁只放圓形圖示（40px，跟右上角的圓鈕一樣大），平台首頁在圖示右邊多帶名字。
 * 先前遊戲首頁是一顆寫著平台名的膠囊，名字一長就擠到標題，矮的畫面還得縮小。
 */
export default function PlatformMark({ className = '' }: { className?: string }) {
  return (
    <span aria-hidden="true" className={`grid size-10 shrink-0 place-items-center rounded-full bg-tile-ink text-[1.4rem] text-brand-red ${className}`}>
      <GiDevilMask />
    </span>
  );
}
