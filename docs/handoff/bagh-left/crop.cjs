// 公有領域原件裁成首頁左圖的正方形（裁切位置是找圖代理建議的，原圖在 originals/）
const sharp = require(process.env.SHARP);
const path = require('path');
const O = path.join(__dirname, 'originals');
const CROPS = {
  '3': ['3-cma-tiger-hunt-ram-singh-1991-168.jpg', 620, 520, 1320],
  '2': ['2-cma-tiger-hunt-1985-64.jpg', 1880, 380, 1050],
  '1': ['1-met-study-for-a-tiger-hunt.jpg', 2150, 40, 1700],
  '4': ['4-cma-tiger-hunt-ram-singh-2011-139.jpg', 1110, 180, 1600],
};
(async () => {
  for (const [k, [f, x, y, s]] of Object.entries(CROPS)) {
    await sharp(path.join(O, f)).extract({ left: x, top: y, width: s, height: s }).resize(1000, 1000).webp({ quality: 82 }).toFile(path.join(__dirname, 'pd', `${k}.webp`));
    console.log(k, 'ok');
  }
})();
