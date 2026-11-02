import { TEXT } from '../../app/games/blind-gomoku/text.ts';

/**
 * 盲五子棋的分享圖（格式見同資料夾的 README.md）。產出 public/og/blind-gomoku-<語系>.png，首頁、規則頁、連線頁同一張。
 *
 * 配色從 components/blind-gomoku/palette.ts 取（那塊 19 世紀朝鮮包袱巾的布色）：底是包袱巾裡最多的青綠布 #046161
 *（平台卡片也是這個底），字與膠囊是白絲 #f2e4c9 —— 白絲字在青綠上 5.8:1，膠囊上的青綠字也是 5.8:1。
 * 試過膠囊用檸檬黃（太跳）、整張改奶油白絲底（跟平台卡片的青綠接不起來），留這一版。
 *
 * 右邊是主視覺那塊包袱巾本身：scripts/og-art/blind-gomoku.webp 是 public/games/blind-gomoku/pojagi.webp
 * 四邊各往內裁掉 7–16px —— 館藏照片的邊上有一條灰色的底，放在青綠上很明顯；裁掉之後四個角都是布。
 */
const blindGomoku = {
  page: 'blind-gomoku',
  tone: { bg: '#046161', fg: '#f2e4c9', pill: '#f2e4c9', pillFg: '#046161' },
  art: { file: 'scripts/og-art/blind-gomoku.webp', position: 'centre' },
  // 膠囊是平台名；標題是遊戲名＋副名（同尼泊爾虎棋：中日韓泰是當地名＋英文名，英文是名字＋一句副名）
  copy: (locale, { brandName }) => ({ kicker: brandName(locale), title: [TEXT[locale].title, TEXT[locale].subtitle] }),
};

export default blindGomoku;
