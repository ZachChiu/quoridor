// 九子棋的哥德手抄本字標（英文）在各語系的對應：繁簡用霞鶩文楷（楷書；繁中 Bold、簡中只到 Medium），日文 Zen Antique（古風明朝），韓文 Song Myung（宋體）。
// 2026-10-25 Zach 看過對照表選了繁簡 Yuji Boku（毛筆）；同一天整頁統一字體時改成文楷 —— Yuji Boku 缺常用字，內文排不了，標題跟內文要同一套（scripts/game-fonts/nine-mens-morris.mjs）。
import { TEXT } from '../../app/games/nine-mens-morris/text.ts';

const GF = 'https://raw.githubusercontent.com/google/fonts/main/ofl';

const nineMensMorris = {
  id: 'nine-mens-morris',
  tracking: 0.06,
  locales: {
    'zh-TW': { text: TEXT['zh-TW'].title, font: { src: `${GF}/lxgwwenkaitc/LXGWWenKaiTC-Bold.ttf` } },
    'zh-Hans': { text: TEXT['zh-Hans'].title, font: { src: 'https://github.com/lxgw/LxgwWenKai/releases/download/v1.520/LXGWWenKai-Medium.ttf' } },
    ja: { text: TEXT.ja.title, font: { src: `${GF}/zenantique/ZenAntique-Regular.ttf` } },
    ko: { text: TEXT.ko.title, font: { src: `${GF}/songmyung/SongMyung-Regular.ttf` } },
  },
};

export default nineMensMorris;
