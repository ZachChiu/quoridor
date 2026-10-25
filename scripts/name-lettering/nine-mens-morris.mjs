// 九子棋的哥德手抄本字標（英文）在各語系的對應：繁簡用 Yuji Boku（毛筆楷書），日文 Zen Antique（古風明朝），韓文 Song Myung（宋體）。2026-10-25 Zach 看過對照表選的。
import { TEXT } from '../../app/games/nine-mens-morris/text.ts';

const GF = 'https://raw.githubusercontent.com/google/fonts/main/ofl';

const nineMensMorris = {
  id: 'nine-mens-morris',
  tracking: 0.06,
  locales: {
    'zh-TW': { text: TEXT['zh-TW'].title, font: { src: `${GF}/yujiboku/YujiBoku-Regular.ttf` } },
    'zh-Hans': { text: TEXT['zh-Hans'].title, font: { src: `${GF}/yujiboku/YujiBoku-Regular.ttf` } },
    ja: { text: TEXT.ja.title, font: { src: `${GF}/zenantique/ZenAntique-Regular.ttf` } },
    ko: { text: TEXT.ko.title, font: { src: `${GF}/songmyung/SongMyung-Regular.ttf` } },
  },
};

export default nineMensMorris;
