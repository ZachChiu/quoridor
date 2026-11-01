import type { MclSkin } from './skins';

/**
 * 試做三種皮的盤面細節（explore/mancala-skins）：惡魔格、天使格裡的圖，與整塊圓盤上的紋。現況不經過這裡（照舊 Gi 圖示）。
 *
 * 木雕版（桑吉巴的 Bao）：天使格是一枚白寶螺殼、惡魔格是三顆紅種子（設計總表 A 的寫法，不用宗教圖像）；
 * 圓盤邊上一圈刻出來的三角（照片裡 Bao 棋盤邊緣那一圈刻紋）。
 * 祈禱書版（1430 年代法蘭德斯的時禱書〈最後的審判〉）：天使格是頁邊的小天使（金光環、白袍、翅膀），惡魔格是朱紅底上的小惡魔；
 * 圓盤是插圖背景那種墨底金格紋（diaper）、外緣兩道金線。
 */
const fx = (v: number) => v.toFixed(2);

export function PitArt({ skin, cell, faded }: { skin: Exclude<MclSkin, 'adinkra'>; cell: 'angel' | 'devil'; faded: boolean }) {
  const op = faded ? 0.3 : 0.95;
  if (skin === 'wood') {
    return cell === 'angel' ? (
      // 寶螺殼：蛋形的殼、正中一道縫、兩邊一排齒
      <svg viewBox="0 0 100 100" className="absolute size-[62%]" aria-hidden="true" style={{ opacity: op }}>
        <ellipse cx={50} cy={50} rx={27} ry={38} fill="#ebeef1" stroke="#3e383f" strokeWidth={3.5} />
        <path d="M50 16 C 44 35, 56 65, 50 84" fill="none" stroke="#3e383f" strokeWidth={4} strokeLinecap="round" />
        {Array.from({ length: 7 }, (_, i) => {
          const y = 26 + i * 8;
          return <g key={i} stroke="#3e383f" strokeWidth={2.6} strokeLinecap="round">
            <path d={`M${fx(47 - Math.sin((i + 1) / 8 * Math.PI) * 2)} ${y} h-6`} />
            <path d={`M${fx(53 + Math.sin((i + 1) / 8 * Math.PI) * 2)} ${y} h6`} />
          </g>;
        })}
      </svg>
    ) : (
      // 三顆紅種子（照片裡紅帽的暗紅、亮面是石灰白）
      <svg viewBox="0 0 100 100" className="absolute size-[58%]" aria-hidden="true" style={{ opacity: op }}>
        {[[36, 40, -20], [64, 42, 25], [50, 66, 5]].map(([x, y, r], i) => (
          <g key={i} transform={`translate(${x} ${y}) rotate(${r})`}>
            <ellipse rx={13} ry={10} fill="#13151c" stroke="#c7d2d5" strokeWidth={2.2} />
            <ellipse cx={-4} cy={-3} rx={4} ry={2.4} fill="#c7d2d5" opacity={0.7} />
          </g>
        ))}
      </svg>
    );
  }
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
export function BoardFace({ skin }: { skin: Exclude<MclSkin, 'adinkra'> }) {
  if (skin === 'wood') {
    const n = 64;
    return (
      <svg viewBox="0 0 100 100" className="pointer-events-none absolute inset-0 size-full" aria-hidden="true">
        <circle cx={50} cy={50} r={49.2} fill="none" stroke="#a6a9aa" strokeOpacity={0.35} strokeWidth={0.5} />
        <circle cx={50} cy={50} r={46.1} fill="none" stroke="#a6a9aa" strokeOpacity={0.35} strokeWidth={0.5} />
        {Array.from({ length: n }, (_, i) => {
          const a0 = (i / n) * Math.PI * 2, a1 = ((i + 0.5) / n) * Math.PI * 2, a2 = ((i + 1) / n) * Math.PI * 2;
          const P = (a: number, r: number) => `${fx(50 + r * Math.cos(a))} ${fx(50 + r * Math.sin(a))}`;
          return <path key={i} d={`M${P(a0, 46.6)} L${P(a1, 48.7)} L${P(a2, 46.6)} Z`} fill="#a6a9aa" fillOpacity={i % 2 ? 0.22 : 0.4} />;
        })}
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 100 100" className="pointer-events-none absolute inset-0 size-full" aria-hidden="true">
      <defs>
        <pattern id="mcl-diaper" width={5} height={5} patternUnits="userSpaceOnUse" patternTransform="rotate(45 50 50)">
          <path d="M0 0 H5 M0 0 V5" stroke="#d2ae67" strokeOpacity={0.32} strokeWidth={0.28} />
          <circle cx={2.5} cy={2.5} r={0.42} fill="#d2ae67" fillOpacity={0.55} />
        </pattern>
        <clipPath id="mcl-disc"><circle cx={50} cy={50} r={47} /></clipPath>
      </defs>
      <rect width={100} height={100} fill="url(#mcl-diaper)" clipPath="url(#mcl-disc)" />
      <circle cx={50} cy={50} r={49.1} fill="none" stroke="#d2ae67" strokeWidth={0.7} />
      <circle cx={50} cy={50} r={47.4} fill="none" stroke="#d2ae67" strokeWidth={0.3} />
    </svg>
  );
}
