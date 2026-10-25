// 有前綴的語系，要跟 app/i18n/locales.ts 的 PREFIXED 一致
const PREFIXED = ['en', 'ja', 'ko', 'zh-Hans', 'th'];
const LEGACY = ['', ...PREFIXED.map((l) => `/${l}`)].flatMap((p) => [
  `${p}/rules`, `${p}/solo`, `${p}/local`, `${p}/local/2`, `${p}/local/3`, `${p}/online`, `${p}/replay`,
]);

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
    '/wall-go/local', '/*/wall-go/local', '/wall-go/local/*', '/*/wall-go/local/*',
    '/wall-go/online', '/*/wall-go/online',
    // 每個回放網址都是某一局的棋譜（內容在 hash），對搜尋引擎是
    // 無限多個「同一頁」
    '/wall-go/replay', '/*/wall-go/replay',
    // Bagh Chal 的對局頁（跟電腦下的靜態 HTML 是空的，選邊與難度在掛載後才畫）
    '/bagh-chal/solo', '/*/bagh-chal/solo', '/bagh-chal/local', '/*/bagh-chal/local', '/bagh-chal/online', '/*/bagh-chal/online',
    // 第二批五款還在試做（頁面 robots noindex），上線前再拿掉
    // 規則頁（2026-10-25 加）跟著首頁一起：試做期間不收，上線時跟上面那行一起拿掉
    ...['/time-auction', '/nine-mens-morris', '/blind-gomoku', '/balance-mancala', '/knights-tour'].flatMap((p) => [p, `/*${p}`, `${p}/rules`, `/*${p}/rules`]),
    // 第二批的連線房（2026-10-24 加）：跟 Wall Go、虎棋的連線頁一樣是空殼，上線後也不收
    ...['/time-auction', '/nine-mens-morris', '/blind-gomoku', '/balance-mancala'].flatMap((p) => [`${p}/online`, `/*${p}/online`]),
    // 舊網址（2026-10 平台化前），只做轉址：真正的 301 在 CloudFront，這些頁面是備援。
    // 逐一列出，不能寫 '/*/rules' —— * 也會對到 wall-go，連新的 /wall-go/rules 一起排除掉
    '/match',
    ...LEGACY,
    '/404',
    // 加到主畫面的設定檔（i18n/pwa.ts），不是頁面
    '/pwa/*',
  ],
};
