// 騎士巡遊整頁用 Noto Serif：跟各語系的名字字標同一套（scripts/name-lettering/knights-tour.mjs 釘在 500），內文保留 400–900。
// 拉丁字與數字照舊用 .kt-serif（系統的舊式襯線）。2026-10-25 Zach：「我以為是一個遊戲內會統一字體」，看過繁中的試做後交給我決定。
const GF = 'https://raw.githubusercontent.com/google/fonts/main/ofl';
const serif = (file) => ({ src: `${GF}/${file}`, axes: { wght: { min: 400, max: 900 } } });

const knightsTour = {
  id: 'knights-tour',
  root: 'kt-root',
  locales: {
    'zh-TW': serif('notoseriftc/NotoSerifTC%5Bwght%5D.ttf'),
    en: serif('notoseriftc/NotoSerifTC%5Bwght%5D.ttf'),
    ja: serif('notoserifjp/NotoSerifJP%5Bwght%5D.ttf'),
    ko: serif('notoserifkr/NotoSerifKR%5Bwght%5D.ttf'),
    'zh-Hans': serif('notoserifsc/NotoSerifSC%5Bwght%5D.ttf'),
    th: { src: `${GF}/notoserifthai/NotoSerifThai%5Bwdth,wght%5D.ttf`, axes: { wdth: 100, wght: { min: 400, max: 900 } } },
  },
};

export default knightsTour;
