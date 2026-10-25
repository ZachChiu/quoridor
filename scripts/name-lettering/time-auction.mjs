// 時間拍賣的英文字標是肥臉體（Fat Face）海報字，各語系的對應是最粗的宋體／明朝：Noto Serif TC／SC／JP／KR／Thai 的 900。2026-10-25 Zach 看過對照表選的。
import { TEXT } from '../../app/games/time-auction/text.ts';

const GF = 'https://raw.githubusercontent.com/google/fonts/main/ofl';
const BLACK = { wght: 900 };

const timeAuction = {
  id: 'time-auction',
  tracking: 0.04,
  locales: {
    'zh-TW': { text: TEXT['zh-TW'].title, font: { src: `${GF}/notoseriftc/NotoSerifTC%5Bwght%5D.ttf`, axes: BLACK } },
    'zh-Hans': { text: TEXT['zh-Hans'].title, font: { src: `${GF}/notoserifsc/NotoSerifSC%5Bwght%5D.ttf`, axes: BLACK } },
    // 沒有中間點，放不下時在「タイム」後面換行
    ja: { text: TEXT.ja.title, pieces: ['タイム', 'オークション'], font: { src: `${GF}/notoserifjp/NotoSerifJP%5Bwght%5D.ttf`, axes: BLACK } },
    ko: { text: TEXT.ko.title, font: { src: `${GF}/notoserifkr/NotoSerifKR%5Bwght%5D.ttf`, axes: BLACK } },
    // 平台上泰文照英文寫，只有首頁標題用得到
    th: { text: TEXT.th.title, font: { src: `${GF}/notoserifthai/NotoSerifThai%5Bwdth,wght%5D.ttf`, axes: { ...BLACK, wdth: 100 } } },
  },
};

export default timeAuction;
