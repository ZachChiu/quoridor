/* eslint-disable */
// 均衡曼卡拉的圖（一次性，要重做時照這個）：原件是克里夫蘭美術館〈Leaf from a Book of Hours: The Last Judgment〉1430s
// （1999.130，CC0，open access 的 print 圖 2385×3400），存成 hours-print.jpg 放在 <資料夾>，不進專案。
// node scripts/balance-mancala/art.cjs <資料夾>
// 三張都是頁面下方的聖米迦勒秤靈魂（天秤、金秤盤、旁邊拉秤的小惡魔）：
// - public/games/balance-mancala/key-art.webp：首頁主視覺（1000×560），方的、外面一道金線一道墨線，像頁上框起來的小插圖
// - public/games/balance-mancala/card.webp：平台卡片（960×540）
// - scripts/og-art/balance-mancala.jpg：分享圖右邊的方圖（816×816）
// 顏色取樣用同資料夾的 km.cjs（k-means）。
const sharp = require('sharp');
const path = require('node:path');
const src = path.join(process.argv[2], 'hours-print.jpg');
const rel = async ([l, t, w, h]) => {
  const m = await sharp(src).metadata();
  return sharp(src).extract({ left: Math.round(l * m.width), top: Math.round(t * m.height), width: Math.round(w * m.width), height: Math.round(h * m.height) });
};
(async () => {
  { const W = 1000, H = 560, b = 14;
    const img = await (await rel([0.12, 0.47, 0.62, 0.29])).resize(W - 2 * b, H - 2 * b, { fit: 'cover' }).png().toBuffer();
    await sharp({ create: { width: W, height: H, channels: 3, background: '#d2ae67' } }).composite([
      { input: Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><rect x="${b - 4}" y="${b - 4}" width="${W - 2 * b + 8}" height="${H - 2 * b + 8}" fill="#3f3833"/></svg>`) },
      { input: img, left: b, top: b },
    ]).webp({ quality: 82 }).toFile('public/games/balance-mancala/key-art.webp'); }
  await (await rel([0.08, 0.44, 0.72, 0.36])).resize(960, 540, { fit: 'cover' }).webp({ quality: 80 }).toFile('public/games/balance-mancala/card.webp');
  // 方圖：天秤在正中間，上面留到聖米迦勒的頭，下面到頁邊的花
  await (await rel([0.08, 0.37, 0.64, 0.449])).resize(816, 816, { fit: 'cover' }).jpeg({ quality: 88 }).toFile('scripts/og-art/balance-mancala.jpg');
})();
