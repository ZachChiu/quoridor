import { TEXT } from '../../app/games/balance-mancala/text.ts';

/**
 * 平衡播棋的分享圖（規則頁、首頁、連線頁同一張；格式見同資料夾的 README.md）。
 *
 * 配色取自 app/components/balance-mancala/palette.ts（2026-10-21 從原件取樣的那幾個，不另外調）：
 * 底是 Adinkra 印花布的布色 #ebd2cb、字是印花的墨 #201211（13:1）；膠囊是黃銅砝碼的黃銅 #af9b71、上面同一個墨（6.7:1）——
 * 跟這款的主要按鈕（.mcl-plaque，黃銅牌）同一組。
 *
 * 右邊是首頁主視覺的三件阿坎黃金砝碼（克里夫蘭美術館，CC0），重新排成正方形放在同一個布色上
 * （scripts/og-art/balance-mancala.jpg：首頁那張 weights.webp 是橫的一排，裁成方的會切掉兩邊）。
 * 做法：同一批去背圖（羚羊 1935.306、魚、幾何形 1962.244），魚寬 680 放上面、羚羊高 340 與幾何形寬 385 底部對齊放下面，
 * 816×816、底色 #ebd2cb，JPEG q88。底色跟分享圖的底同色，圖的邊界看不出來，三件砝碼像直接擺在布上。
 */
const BALANCE_MANCALA = {
  page: 'balance-mancala',
  tone: { bg: '#ebd2cb', fg: '#201211', pill: '#af9b71', pillFg: '#201211' },
  art: { file: 'scripts/og-art/balance-mancala.jpg', position: 'centre' },
  // 膠囊是平台名；標題是遊戲名＋英文名（同尼泊爾虎棋）。英文版的 altName 是空的，只有一行
  copy: (locale, { brandName }) => ({ kicker: brandName(locale), title: [TEXT[locale].title, TEXT[locale].altName].filter(Boolean) }),
};

export default BALANCE_MANCALA;
