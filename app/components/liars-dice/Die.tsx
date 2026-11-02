import type { Face } from '@/games/liars-dice/engine';
import { LD } from './palette';

/**
 * 一顆骰子：棉線色的方塊，點是披風階梯方格裡的那種「眼」（直立的橢圓），1 點那顆是胭脂蟲紅。
 * 不放 'use client'：伺服器元件（規則說明、首頁）也畫得了。
 */
const PIPS: Record<Face, [number, number][]> = {
  1: [[50, 50]],
  2: [[29, 29], [71, 71]],
  3: [[29, 29], [50, 50], [71, 71]],
  4: [[29, 29], [71, 29], [29, 71], [71, 71]],
  5: [[29, 29], [71, 29], [50, 50], [29, 71], [71, 71]],
  6: [[29, 26], [71, 26], [29, 50], [71, 50], [29, 74], [71, 74]],
};

export default function Die({ face, className = 'size-9', tone = 'cotton', ring = false, dim = false }: {
  face: Face;
  className?: string;
  /** cotton：一般；ink：棉線色的彈窗上用深色骰子 */
  tone?: 'cotton' | 'ink';
  /** 掀開時「算進去」的那幾顆：外面一圈胭脂蟲紅 */
  ring?: boolean;
  dim?: boolean;
}) {
  const body = tone === 'ink' ? LD.ink : LD.cotton;
  const pip = tone === 'ink' ? LD.cotton : LD.ink;
  return (
    <svg viewBox="0 0 100 100" aria-hidden="true" className={`${className} shrink-0 transition-opacity ${dim ? 'opacity-30' : ''}`}>
      {ring && <rect x="1" y="1" width="98" height="98" rx="16" fill="none" stroke={LD.red} strokeWidth="8" />}
      <rect x={ring ? 10 : 4} y={ring ? 10 : 4} width={ring ? 80 : 92} height={ring ? 80 : 92} rx="12" fill={body} />
      {PIPS[face].map(([x, y], i) => (
        <ellipse key={i} cx={ring ? 50 + (x - 50) * 0.86 : x} cy={ring ? 50 + (y - 50) * 0.86 : y}
          rx={face === 1 ? 9 : 6.5} ry={face === 1 ? 14 : 10} fill={face === 1 ? LD.red : pip} />
      ))}
    </svg>
  );
}

/**
 * 骰盅：皮革盅倒扣在桌上，座位的顏色；口緣一圈棉線色，紫褐底上才看得出輪廓。
 * 底下一排小點是那個人還剩幾顆。
 */
export function Cup({ color, className = 'w-12', lifted = false }: { color: string; className?: string; lifted?: boolean }) {
  return (
    <svg viewBox="0 0 60 50" aria-hidden="true" className={`${className} overflow-visible transition-transform duration-300 ${lifted ? '-translate-y-1.5' : ''}`}>
      <path d="M12 6 Q30 0 48 6 L56 42 Q30 50 4 42 Z" fill={color} stroke={LD.cotton} strokeWidth="2" strokeLinejoin="round" />
      <path d="M8 34 Q30 41 52 34" fill="none" stroke={LD.cotton} strokeOpacity="0.55" strokeWidth="1.6" />
      <path d="M10 26 Q30 32 50 26" fill="none" stroke={LD.cotton} strokeOpacity="0.35" strokeWidth="1.2" strokeDasharray="3 3" />
    </svg>
  );
}
