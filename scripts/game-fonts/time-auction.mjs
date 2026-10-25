// 時間拍賣整頁用 Noto Serif：跟各語系的名字字標同一套（scripts/name-lettering/time-auction.mjs 釘在 900），內文保留 400–900。
// 2026-10-25 Zach：「我以為是一個遊戲內會統一字體」，看過繁中的試做後交給我決定。
const GF = 'https://raw.githubusercontent.com/google/fonts/main/ofl';
const serif = (file) => ({ src: `${GF}/${file}`, axes: { wght: { min: 400, max: 900 } } });

const timeAuction = {
  id: 'time-auction',
  root: 'tau-root',
  locales: {
    'zh-TW': serif('notoseriftc/NotoSerifTC%5Bwght%5D.ttf'),
    en: serif('notoseriftc/NotoSerifTC%5Bwght%5D.ttf'),
    ja: serif('notoserifjp/NotoSerifJP%5Bwght%5D.ttf'),
    ko: serif('notoserifkr/NotoSerifKR%5Bwght%5D.ttf'),
    'zh-Hans': serif('notoserifsc/NotoSerifSC%5Bwght%5D.ttf'),
    th: { src: `${GF}/notoserifthai/NotoSerifThai%5Bwdth,wght%5D.ttf`, axes: { wdth: 100, wght: { min: 400, max: 900 } } },
  },
};

export default timeAuction;
