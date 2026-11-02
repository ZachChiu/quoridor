import { useId } from 'react';

/**
 * 盤面的細節，照 1430 年代法蘭德斯的時禱書〈最後的審判〉（克里夫蘭美術館 1999.130，CC0；顏色見 palette.ts）：
 * 天使格是頁邊的小天使（金光環、白袍、綠翅膀），惡魔格是朱紅底上的小惡魔（同一頁聖米迦勒秤靈魂旁邊拉秤的那隻）；
 * 整塊圓盤是插圖背景那種墨底金格紋（diaper）、外緣兩道金線。
 * 線條與填色直接寫取樣值（SVG 裡不用 CSS 變數，對局、規則圖、連線等人的小盤共用）。
 */

export function PitArt({ cell, faded }: { cell: 'angel' | 'devil'; faded: boolean }) {
  const op = faded ? 0.3 : 0.95;
  return cell === 'angel' ? (
    // 頁邊的小天使：金光環、白袍、兩片翅膀，墨線
    <svg viewBox="0 0 100 100" className="absolute size-[70%]" aria-hidden="true" style={{ opacity: op }}>
      <g fill="none" stroke="#3f3833" strokeWidth={2.6} strokeLinejoin="round" strokeLinecap="round">
        <path d="M44 44 C 26 30, 14 40, 12 58 C 24 54, 34 56, 44 54 Z" fill="#628a54" />
        <path d="M56 44 C 74 30, 86 40, 88 58 C 76 54, 66 56, 56 54 Z" fill="#628a54" />
        <path d="M50 40 L 34 86 H 66 Z" fill="#f5ecd9" />
        <circle cx={50} cy={30} r={14} fill="#d2ae67" />
        <circle cx={50} cy={31} r={8.5} fill="#f5ecd9" />
      </g>
    </svg>
  ) : (
    // 朱紅底上的小惡魔：兩支角、尖耳、咧嘴，墨線
    <svg viewBox="0 0 100 100" className="absolute size-[66%]" aria-hidden="true" style={{ opacity: op }}>
      <g fill="none" stroke="#3f3833" strokeWidth={3} strokeLinejoin="round" strokeLinecap="round">
        <path d="M34 36 C 28 24, 26 16, 30 10 C 36 18, 40 24, 42 32" fill="#3f3833" />
        <path d="M66 36 C 72 24, 74 16, 70 10 C 64 18, 60 24, 58 32" fill="#3f3833" />
        <path d="M30 46 L 18 40 L 28 56" fill="#eedec1" />
        <path d="M70 46 L 82 40 L 72 56" fill="#eedec1" />
        <ellipse cx={50} cy={54} rx={22} ry={25} fill="#eedec1" />
        <path d="M40 48 l6 3 M60 48 l-6 3" />
        <path d="M38 62 C 44 72, 56 72, 62 62 Z" fill="#3f3833" />
        <path d="M44 64 l2 4 l2 -4 M52 64 l2 4 l2 -4" stroke="#eedec1" strokeWidth={1.6} />
      </g>
    </svg>
  );
}

/** 整塊圓盤上的紋（蓋在木頭上、盤子底下，不擋點擊） */
/** 一頁上可能有好幾塊（規則頁每一步一塊），pattern／clipPath 的 id 各自不同 */
export function BoardFace() {
  const id = useId();
  return (
    <svg viewBox="0 0 100 100" className="pointer-events-none absolute inset-0 size-full" aria-hidden="true">
      <defs>
        <pattern id={`${id}d`} width={5} height={5} patternUnits="userSpaceOnUse" patternTransform="rotate(45 50 50)">
          <path d="M0 0 H5 M0 0 V5" stroke="#d2ae67" strokeOpacity={0.32} strokeWidth={0.28} />
          <circle cx={2.5} cy={2.5} r={0.42} fill="#d2ae67" fillOpacity={0.55} />
        </pattern>
        <clipPath id={`${id}c`}><circle cx={50} cy={50} r={47} /></clipPath>
      </defs>
      <rect width={100} height={100} fill={`url(#${id}d)`} clipPath={`url(#${id}c)`} />
      <circle cx={50} cy={50} r={49.1} fill="none" stroke="#d2ae67" strokeWidth={0.7} />
      <circle cx={50} cy={50} r={47.4} fill="none" stroke="#d2ae67" strokeWidth={0.3} />
    </svg>
  );
}
