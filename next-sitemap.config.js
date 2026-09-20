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
    // 沒有 roomId 就是空頁，不該被索引
    '/match',
    '/404',
  ],
};
