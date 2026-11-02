// 大話骰的名字用 Noto Serif 的 900（粗的明朝體／宋體），整頁的字是同一套（scripts/game-fonts/liars-dice.mjs）。
// 英文與泰文（照英文寫）不做字標，用字型。
import { TEXT } from '../../app/games/liars-dice/text.ts';

const GF = 'https://raw.githubusercontent.com/google/fonts/main/ofl';
const BLACK = { wght: 900 };

const liarsDice = {
  id: 'liars-dice',
  tracking: 0.02,
  locales: {
    'zh-TW': { text: TEXT['zh-TW'].title, font: { src: `${GF}/notoseriftc/NotoSerifTC%5Bwght%5D.ttf`, axes: BLACK } },
    'zh-Hans': { text: TEXT['zh-Hans'].title, font: { src: `${GF}/notoserifsc/NotoSerifSC%5Bwght%5D.ttf`, axes: BLACK } },
    ja: { text: TEXT.ja.title, font: { src: `${GF}/notoserifjp/NotoSerifJP%5Bwght%5D.ttf`, axes: BLACK } },
    ko: { text: TEXT.ko.title, font: { src: `${GF}/notoserifkr/NotoSerifKR%5Bwght%5D.ttf`, axes: BLACK } },
  },
};

export default liarsDice;
