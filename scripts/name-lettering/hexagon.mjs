// 六角數字盤的名字：跟整頁同一套圓體 Chiron GoRound TC（scripts/game-fonts/hexagon.mjs），粗細 800。英文 Hexagon 用網頁字型、不做字標。
import { TEXT } from '../../app/games/hexagon/text.ts';

const GF = 'https://raw.githubusercontent.com/google/fonts/main/ofl';
const ROUND = { src: `${GF}/chirongoroundtc/ChironGoRoundTC%5Bwght%5D.ttf`, axes: { wght: 800 } };

const hexagon = {
  id: 'hexagon',
  tracking: 0.04,
  locales: {
    'zh-TW': { text: TEXT['zh-TW'].title, font: ROUND },
  },
};

export default hexagon;
