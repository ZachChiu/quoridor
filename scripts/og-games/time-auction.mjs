// 時間拍賣的分享圖（格式見同資料夾的 README.md）。產出 public/og/time-auction-<語系>.png，設定頁、規則頁、連線頁同一張。
import { TEXT } from '../../app/games/time-auction/text.ts';

const timeAuction = {
  page: 'time-auction',
  // 拍賣傳單的紙與墨（《Puck》1888）、Cruikshank 1819 的紅（app/components/time-auction/theme.ts）：
  // 墨在紙上 9.8:1、紙色在紅上 5.6:1
  tone: { bg: '#ebe1b8', fg: '#35331c', pill: '#92383a', pillFg: '#ebe1b8' },
  // 主視覺：Cruikshank〈Sales by Auction〉的拍賣場。橫幅裁正方形時靠左，拍賣官整個站在講台上、左邊是看拍賣的人
  art: { file: 'public/games/time-auction/auction.webp', position: 'west' },
  // 膠囊是平台名；標題是遊戲名＋英文名（英文版兩個一樣，只寫一行）
  copy: (locale, { brandName }) => {
    const t = TEXT[locale];
    return { kicker: brandName(locale), title: t.nameEn === t.title ? [t.title] : [t.title, t.nameEn] };
  },
};

export default timeAuction;
