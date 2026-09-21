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
    // 對局畫面：沒有可讀內容，收錄了也只是空殼。四個語系一起排除 ——
    // sitemap 與頁面的 robots 必須說同一件事，不然 Search Console 會報錯。
    // /local/2 與 /local/3 也一起排除 —— 跟 /local 是同一個空殼畫面
    '/local', '/*/local', '/local/*', '/*/local/*',
    '/online', '/*/online',
    // 舊網址，只做轉址
    '/match',
    // 每個回放網址都是某一局的棋譜（內容在 hash），對搜尋引擎是
    // 無限多個「同一頁」
    '/replay', '/*/replay',
    '/404',
  ],
};
