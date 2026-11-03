// 提問與真相整頁的字：原件是 1635 年前後的法國油畫（La Tour〈方塊 A 的老千〉），拉丁字用同一個年代、同一個國家的 Garamond（EB Garamond），
// 中日韓用明朝體／宋體（Noto Serif，同一套刻本字的系統），泰文用 Noto Serif Thai、英數由 en 那份補上。字重 400–800（EB Garamond 最粗 800）。
const GF = 'https://raw.githubusercontent.com/google/fonts/main/ofl';
const serif = (file, max = 900) => ({ src: `${GF}/${file}`, axes: { wght: { min: 400, max } } });

const questionAndTruth = {
  id: 'question-and-truth',
  root: 'qt-root',
  locales: {
    'zh-TW': serif('notoseriftc/NotoSerifTC%5Bwght%5D.ttf'),
    en: serif('ebgaramond/EBGaramond%5Bwght%5D.ttf', 800),
    ja: serif('notoserifjp/NotoSerifJP%5Bwght%5D.ttf'),
    ko: serif('notoserifkr/NotoSerifKR%5Bwght%5D.ttf'),
    'zh-Hans': serif('notoserifsc/NotoSerifSC%5Bwght%5D.ttf'),
    th: { src: `${GF}/notoserifthai/NotoSerifThai%5Bwdth,wght%5D.ttf`, axes: { wdth: 100, wght: { min: 400, max: 900 } } },
  },
};

export default questionAndTruth;
