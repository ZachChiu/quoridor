/* eslint-disable */
// 試做用的一次性腳本（explore/mancala-skins）：從 scratchpad/mcl/src 的原件取樣、裁主視覺；路徑是相對那個資料夾
const sharp=require('/Users/zach/Desktop/projects/quoridor/node_modules/sharp');
const D=process.argv[2];
const rel=async(f,[l,t,w,h])=>{const m=await sharp(f).metadata();return sharp(f).extract({left:Math.round(l*m.width),top:Math.round(t*m.height),width:Math.round(w*m.width),height:Math.round(h*m.height)})};
const feather=(W,H,bg)=>Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><defs><radialGradient id="g" cx="50%" cy="50%" r="50%"><stop offset="0.72" stop-color="#fff"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient></defs><ellipse cx="${W/2}" cy="${H/2}" rx="${W/2}" ry="${H/2}" fill="url(#g)"/></svg>`);
async function key(src,box,W,H,bg,out){
  const img=await (await rel(src,box)).resize(W,H,{fit:'cover'}).png().toBuffer();
  const masked=await sharp(img).composite([{input:feather(W,H),blend:'dest-in'}]).png().toBuffer();
  await sharp({create:{width:W,height:H,channels:3,background:bg}}).composite([{input:masked}]).webp({quality:82}).toFile(out);
}
(async()=>{
  // Bao：棋盤那一段（右邊的手裁掉一部分）
  await key('bao-full.jpg',[0,0.615,0.64,0.29],1000,500,'#c7d2d5',D+'/wood-key.webp');
  await (await rel('bao-full.jpg',[0,0.62,0.6,0.27])).resize(960,540,{fit:'cover'}).webp({quality:80}).toFile(D+'/wood-card.webp');
  // 時禱書：聖米迦勒秤靈魂（天秤、金秤盤、旁邊拉秤的小惡魔）
  // 時禱書的主視覺不用橢圓淡出：整塊方的，外面一道金線、一道墨線（像頁上框起來的小插圖）
  {const W=1000,H=560,b=14;const img=await (await rel('hours-print.jpg',[0.12,0.47,0.62,0.29])).resize(W-2*b,H-2*b,{fit:'cover'}).png().toBuffer();
   await sharp({create:{width:W,height:H,channels:3,background:'#d2ae67'}}).composite([{input:Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><rect x="${b-4}" y="${b-4}" width="${W-2*b+8}" height="${H-2*b+8}" fill="#3f3833"/></svg>`)},{input:img,left:b,top:b}]).webp({quality:82}).toFile(D+'/hours-key.webp');}
  await (await rel('hours-print.jpg',[0.08,0.44,0.72,0.36])).resize(960,540,{fit:'cover'}).webp({quality:80}).toFile(D+'/hours-card.webp');
})();
