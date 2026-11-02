import type { CornerTheme } from '@/components/cornerTheme';

/**
 * 大話骰的配色：取自殖民時期秘魯的安地斯小披風（uncu，17–18 世紀，大都會藝術博物館 2017.231，CC0；Wikimedia「Miniature Tunic (Uncu) MET DP107700」）。
 * 2026-11-03 依色相分群、取那一群裡彩度最高的四成取樣（docs/liars-dice.md〈配色〉）。顏色一律從原件取樣，不自己調。
 *
 * - 頁面是披風的紫褐羊毛底（胸口與下擺之間那一大片），字是最亮的棉線色（6.4:1）
 * - 主要按鈕、彈窗的紙是棉線色；「開！」是胭脂蟲紅（棉線字 4.9:1）
 * - 胸前的階梯方格（黃、靛藍、紅，每格中間一顆「眼」）就是最外緣那一圈（globals.css 的 .ld-frame）
 * - 六個座位的顏色也是這件披風上的六種線
 */
export const LD = {
  /** 頁面：紫褐羊毛 */
  wool: '#41303a',
  /** 字、骰子、主要按鈕：最亮的棉線 */
  cotton: '#d4b98f',
  /** 黃線（階梯方格） */
  gold: '#c9b17b',
  /** 胭脂蟲紅：開、1 點 */
  red: '#8a3536',
  /** 靛藍 */
  indigo: '#242f44',
  /** 深色字（棉線底上） */
  ink: '#2e1822',
} as const;

/** 六個座位：紅、黃、藍、綠、粉、白（都是披風上的線色，照 text.ts 的 seats 順序） */
export const SEAT_HEX = ['#842e31', '#baa262', '#4a5f74', '#59614e', '#91464b', '#d4b98f'] as const;

/** 彈窗：標題列是胭脂蟲紅的一塊，底下一排黃與靛藍的小方格（披風的階梯），面板是棉線色 */
export const LD_BAND = {
  className: '',
  style: {
    background: `linear-gradient(${LD.red}, ${LD.red}) top / 100% calc(100% - 8px) no-repeat, repeating-linear-gradient(90deg, ${LD.gold} 0 8px, ${LD.indigo} 8px 16px)`,
  },
  fg: 'text-[#d4b98f]',
};
export const LD_PANEL = '!rounded-[4px] !bg-[#d4b98f] !text-[#2e1822]';

/** 首頁右上角「聯絡我們」與「語言」（components/cornerTheme.ts） */
export const LD_CORNER: CornerTheme = {
  button: 'ld-btn is-quiet',
  band: LD_BAND,
  panelClassName: LD_PANEL,
  primary: 'ld-btn is-ink',
  secondary: 'ld-btn is-soft',
  field: 'rounded-[3px] bg-[#2e1822]/[0.08] outline-none focus:ring-2 focus:ring-[#8a3536]',
  soft: 'text-[#2e1822]/70',
};
