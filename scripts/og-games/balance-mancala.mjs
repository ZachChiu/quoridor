import { TEXT } from '../../app/games/balance-mancala/text.ts';

/**
 * 平衡播棋的分享圖（規則頁、首頁、連線頁同一張；格式見同資料夾的 README.md）。
 *
 * 配色取自 app/components/balance-mancala/palette.ts（時禱書〈最後的審判〉取樣的那幾個，不另外調）：
 * 底是羊皮紙 #eedec1、字是墨 #3f3833（8.7:1）；膠囊是金 #d2ae67、上面同一個墨（5.5:1）——
 * 跟這款的主要按鈕（.mcl-plaque，金箔）同一組。
 *
 * 右邊是同一頁下方的聖米迦勒秤靈魂（克里夫蘭美術館 1999.130，CC0），裁成方的：scripts/og-art/balance-mancala.jpg
 * （816×816、JPEG q88，由 scripts/balance-mancala/art.cjs 從原件裁出來；天秤與拉秤的小惡魔在畫面中下方）。
 */
const BALANCE_MANCALA = {
  page: 'balance-mancala',
  tone: { bg: '#eedec1', fg: '#3f3833', pill: '#d2ae67', pillFg: '#3f3833' },
  art: { file: 'scripts/og-art/balance-mancala.jpg', position: 'centre' },
  // 膠囊是平台名；標題是遊戲名＋英文名（同尼泊爾虎棋）。英文版的 altName 是空的，只有一行
  copy: (locale, { brandName }) => ({ kicker: brandName(locale), title: [TEXT[locale].title, TEXT[locale].altName].filter(Boolean) }),
};

export default BALANCE_MANCALA;
