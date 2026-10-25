// 九子棋整頁的字。2026-10-25 Zach：「我以為是一個遊戲內會統一字體」，看過繁中的試做（毛筆 Yuji Boku、霞鶩文楷）後交給我決定：
// 繁簡用霞鶩文楷 —— Yuji Boku 缺「你嗎說哪吧內擋辦」這些常用字，內文會一直混到黑體；文楷站上用到的字都有，名字字標也一起換成文楷。
// 日文、韓文跟名字字標同一套（Zen Antique、Song Myung，都只有一個字重）。英文、泰文的名字是哥德字、內文排不了，用 Noto Serif。
const GF = 'https://raw.githubusercontent.com/google/fonts/main/ofl';
// 簡中用簡體版（同一個字兩邊寫法不一樣）：Google Fonts 只有繁中版，簡體版從作者的 GitHub release 拿，只到 Medium
const WENKAI_SC = 'https://github.com/lxgw/LxgwWenKai/releases/download/v1.520';
const serif = { src: `${GF}/notoseriftc/NotoSerifTC%5Bwght%5D.ttf`, axes: { wght: { min: 400, max: 900 } } };

const nineMensMorris = {
  id: 'nine-mens-morris',
  root: 'nmm-root',
  locales: {
    'zh-TW': [{ src: `${GF}/lxgwwenkaitc/LXGWWenKaiTC-Regular.ttf`, weight: 400 }, { src: `${GF}/lxgwwenkaitc/LXGWWenKaiTC-Bold.ttf`, weight: 700 }],
    en: serif,
    ja: { src: `${GF}/zenantique/ZenAntique-Regular.ttf` },
    ko: { src: `${GF}/songmyung/SongMyung-Regular.ttf` },
    'zh-Hans': [{ src: `${WENKAI_SC}/LXGWWenKai-Regular.ttf`, weight: 400 }, { src: `${WENKAI_SC}/LXGWWenKai-Medium.ttf`, weight: 500 }],
    th: { src: `${GF}/notoserifthai/NotoSerifThai%5Bwdth,wght%5D.ttf`, axes: { wdth: 100, wght: { min: 400, max: 900 } } },
  },
};

export default nineMensMorris;
