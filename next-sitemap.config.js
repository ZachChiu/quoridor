/** @type {import('next-sitemap').IConfig} */
module.exports = {
  siteUrl: process.env.SITE_URL || 'https://quoridorgame.com',

  // next build 先產生 out/，postbuild 才執行 next-sitemap。
  // 預設 outDir 是 public/，此時寫進去已來不及被複製進 out/，
  // 導致實際部署的 sitemap 永遠是上次 build 留在 repo 裡的舊檔。
  outDir: 'out',

  // robots.txt 改由 app/robots.ts 單一產出（Next 原生），
  // 避免兩處產生器互相覆蓋。
  generateRobotsTxt: false,

  exclude: [
    // robots.txt 是路由不是頁面，收進 sitemap 會變成 /robots.txt/ 這種垃圾 URL
    '/robots.txt',
    // 對局頁：沒有 roomId 就是空頁，有 roomId 是某兩個人的私人對局
    '/online', '/*/online',
    // 舊網址，只做轉址
    '/match',
    // 每個回放網址都是某一局的棋譜（內容在 hash），對搜尋引擎是
    // 無限多個「同一頁」
    '/replay', '/*/replay',
    '/404',
  ],
};
