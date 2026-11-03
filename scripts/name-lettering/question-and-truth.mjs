// 提問與真相的名字用 Noto Serif 的 900（粗的明朝體／宋體），整頁的字是同一套（scripts/game-fonts/question-and-truth.mjs）。
// 英文、日文、泰文的名字照英文（Question and Truth）寫，用 EB Garamond 的字型、不做字標。
import { TEXT } from '../../app/games/question-and-truth/text.ts';

const GF = 'https://raw.githubusercontent.com/google/fonts/main/ofl';
const BLACK = { wght: 900 };

const questionAndTruth = {
  id: 'question-and-truth',
  tracking: 0.04,
  locales: {
    'zh-TW': { text: TEXT['zh-TW'].title, font: { src: `${GF}/notoseriftc/NotoSerifTC%5Bwght%5D.ttf`, axes: BLACK } },
    'zh-Hans': { text: TEXT['zh-Hans'].title, font: { src: `${GF}/notoserifsc/NotoSerifSC%5Bwght%5D.ttf`, axes: BLACK } },
    ko: { text: TEXT.ko.title, font: { src: `${GF}/notoserifkr/NotoSerifKR%5Bwght%5D.ttf`, axes: BLACK } },
  },
};

export default questionAndTruth;
