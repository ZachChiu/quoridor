import { TEXT } from '../../app/games/knights-tour/text.ts';

/**
 * 騎士巡遊的分享圖（格式見同資料夾的 README.md）。
 * 配色照這款的 palette（app/components/knights-tour/palette.ts，18 世紀原件取樣）：紙色底、墨字（11:1）、
 * 紅粉筆膠囊配紙色字（5.1:1）。
 *
 * 右邊是主視覺 plate.webp 裡的那張棋盤（歐拉 1759 的走法）。原圖 960×540、外圈有銅版雙線框：直接裁正方形的話
 * 上下兩條框線會懸在左邊、少一邊（試過 east），所以先切出棋盤那一塊放在 scripts/og-art/knights-tour.webp ——
 * 從 plate.webp 切 left 450、top 29、480×480（棋盤 472–907 × 52–486 正好置中，碰不到框線）：
 *   sharp('public/games/knights-tour/plate.webp').extract({ left: 450, top: 29, width: 480, height: 480 }).webp({ quality: 92 })
 * 主視覺換了要照這行重切。標題是遊戲名＋英文名（英文本身只有一行）。
 */
const knightsTour = {
  page: 'knights-tour',
  tone: { bg: '#edddc7', fg: '#322e2a', pill: '#834d36', pillFg: '#edddc7' },
  art: { file: 'scripts/og-art/knights-tour.webp' },
  copy: (locale, { brandName }) => ({
    kicker: brandName(locale),
    title: [TEXT[locale].title, TEXT[locale].subtitle].filter(Boolean),
  }),
};

export default knightsTour;
