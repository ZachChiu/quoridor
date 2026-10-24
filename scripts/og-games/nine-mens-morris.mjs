// 九子棋的分享圖（格式見同資料夾的 README.md）：首頁、規則頁、連線頁同一張
import { TEXT } from '../../app/games/nine-mens-morris/text.ts';

const nineMensMorris = {
  page: 'nine-mens-morris',
  // 配色照 app/components/nine-mens-morris/palette.ts（《遊戲之書》插圖取樣）：群青底、羊皮紙字（6.7:1）、
  // 膠囊是插圖框的朱紅＋羊皮紙字（3.7:1；膠囊字 26px 以上、900 字重，大字的門檻是 3:1）
  tone: { bg: '#4b4577', fg: '#eee0c4', pill: '#c54915', pillFg: '#eee0c4' },
  // 主視覺：《遊戲之書》（1283）九子棋那頁插圖，置中裁正方形 —— 棋盤在正中、兩邊的棋手各留半身
  art: { file: 'public/games/nine-mens-morris/libro.webp', position: 'centre' },
  // 膠囊是平台名；標題是遊戲名＋副名（同尼泊爾虎棋）
  copy: (locale, { brandName }) => ({ kicker: brandName(locale), title: [TEXT[locale].title, TEXT[locale].subtitle] }),
};

export default nineMensMorris;
