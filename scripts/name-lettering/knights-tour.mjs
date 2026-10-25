// 騎士巡遊的英文名是舊式襯線（kt-serif），各語系的對應是宋體／明朝：Noto Serif TC／SC／JP／KR／Thai 的 500。2026-10-25 Zach 看過對照表選的。
import { TEXT } from '../../app/games/knights-tour/text.ts';

const GF = 'https://raw.githubusercontent.com/google/fonts/main/ofl';
const BOOK = { wght: 500 };

const knightsTour = {
  id: 'knights-tour',
  tracking: 0.04,
  locales: {
    'zh-TW': { text: TEXT['zh-TW'].title, font: { src: `${GF}/notoseriftc/NotoSerifTC%5Bwght%5D.ttf`, axes: BOOK } },
    'zh-Hans': { text: TEXT['zh-Hans'].title, font: { src: `${GF}/notoserifsc/NotoSerifSC%5Bwght%5D.ttf`, axes: BOOK } },
    // ナイトツアー 沒有好切的地方，放不下就整段縮小
    ja: { text: TEXT.ja.title, font: { src: `${GF}/notoserifjp/NotoSerifJP%5Bwght%5D.ttf`, axes: BOOK } },
    ko: { text: TEXT.ko.title, font: { src: `${GF}/notoserifkr/NotoSerifKR%5Bwght%5D.ttf`, axes: BOOK } },
    // 平台上泰文照英文寫，只有首頁標題用得到
    th: { text: TEXT.th.title, font: { src: `${GF}/notoserifthai/NotoSerifThai%5Bwdth,wght%5D.ttf`, axes: { ...BOOK, wdth: 100 } } },
  },
};

export default knightsTour;
