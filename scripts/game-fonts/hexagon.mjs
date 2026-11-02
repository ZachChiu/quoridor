// 六角數字盤整頁用 Chiron GoRound TC（圓體）：磁磚上的鈷藍是毛筆畫在釉上的，筆畫的頭尾都是圓的；數字放大寫在磁磚上也最好認。
// 跟名字字標（scripts/name-lettering/hexagon.mjs）同一套。英文頁也用它（它的拉丁字是同一個設計）；日韓泰照全站的字。
const GF = 'https://raw.githubusercontent.com/google/fonts/main/ofl';
const round = { src: `${GF}/chirongoroundtc/ChironGoRoundTC%5Bwght%5D.ttf`, axes: { wght: { min: 400, max: 900 } } };

const hexagon = {
  id: 'hexagon',
  root: 'hx-root',
  locales: {
    'zh-TW': round,
    en: round,
  },
};

export default hexagon;
