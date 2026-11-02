// 大話骰整頁用 Noto Serif（宋體／明朝）：原件是 17–18 世紀殖民時期秘魯的織物，同一個年代的印刷字是西班牙的舊式羅馬體，
// 漢字那邊就是明朝的刻本字 —— 明朝體的名字就是從那個年代的刻本來的。字重 400–900，標題的字標用 900（scripts/name-lettering/liars-dice.mjs）。
const GF = 'https://raw.githubusercontent.com/google/fonts/main/ofl';
const serif = (file) => ({ src: `${GF}/${file}`, axes: { wght: { min: 400, max: 900 } } });

const liarsDice = {
  id: 'liars-dice',
  root: 'ld-root',
  locales: {
    'zh-TW': serif('notoseriftc/NotoSerifTC%5Bwght%5D.ttf'),
    en: serif('notoseriftc/NotoSerifTC%5Bwght%5D.ttf'),
    ja: serif('notoserifjp/NotoSerifJP%5Bwght%5D.ttf'),
    ko: serif('notoserifkr/NotoSerifKR%5Bwght%5D.ttf'),
    'zh-Hans': serif('notoserifsc/NotoSerifSC%5Bwght%5D.ttf'),
    th: { src: `${GF}/notoserifthai/NotoSerifThai%5Bwdth,wght%5D.ttf`, axes: { wdth: 100, wght: { min: 400, max: 900 } } },
  },
};

export default liarsDice;
