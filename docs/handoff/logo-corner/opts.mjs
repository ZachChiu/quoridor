// 骰子惡魔 logo 在各遊戲首頁「太搶眼」的幾種收法（beta 站上注入，還沒改程式）
// A：縮小成 28px、換成那款自己的墨色（單色剪影）
// B：縮小成 28px、原本的藍、淡到 45%（滑過才亮）
import { chromium, webkit } from '/Users/zach/Desktop/projects/content-crawler/node_modules/playwright-core/index.mjs';
const OUT = new URL('./', import.meta.url).pathname;
const BASE = 'https://beta.quoridorgame.com';
const IPHONE = 'Mozilla/5.0 (iPhone; CPU iPhone OS 18_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.5 Mobile/15E148 Safari/604.1';
const PAGES = ['wall-go', 'bagh-chal', 'nine-mens-morris', 'blind-gomoku', 'knights-tour', 'time-auction', 'balance-mancala'];
// 各款的墨色（各自 palette 的 ink；九子棋在群青底上用羊皮紙色）
const INK = { 'wall-go': '#1d1b19', 'bagh-chal': '#3b2a1a', 'nine-mens-morris': '#eee0c4', 'blind-gomoku': '#2a2525', 'knights-tour': '#322e2a', 'time-auction': '#35331c', 'balance-mancala': '#201211' };
const OPT = {
  A: (ink) => `img[src="/brand/die-mark.svg"]{width:28px!important;height:28px!important;object-position:-9999px 0;background:${ink};opacity:.8;
     -webkit-mask:url(/brand/die-mark-mono.svg) center/contain no-repeat;mask:url(/brand/die-mark-mono.svg) center/contain no-repeat}`,
  B: () => `img[src="/brand/die-mark.svg"]{width:28px!important;height:28px!important;opacity:.45}`,
};
const cr = await chromium.launch(); const wk = await webkit.launch();
try {
  for (const [name, b, ctx] of [
    ['desk', cr, { viewport: { width: 1440, height: 860 }, deviceScaleFactor: 1 }],
    ['phone', wk, { viewport: { width: 393, height: 852 }, deviceScaleFactor: 2, isMobile: true, hasTouch: true, userAgent: IPHONE }],
  ]) {
    const c = await b.newContext(ctx);
    for (const p of PAGES) {
      const page = await c.newPage();
      await page.goto(`${BASE}/${p}/`, { waitUntil: 'networkidle' }).catch(() => {});
      await page.addStyleTag({ content: 'nextjs-portal{display:none!important}' });
      for (const [k, css] of Object.entries(OPT)) {
        const t = await page.addStyleTag({ content: css(INK[p]) });
        await page.waitForTimeout(500);
        // 只截左上角那一塊，看得清楚 logo 跟周圍的關係
        await page.screenshot({ path: `${OUT}${k}-${name}-${p}.png`, clip: name === 'desk' ? { x: 0, y: 0, width: 520, height: 300 } : { x: 0, y: 0, width: 393, height: 300 } });
        await t.evaluate((el) => el.remove());
      }
      await page.screenshot({ path: `${OUT}now-${name}-${p}-clip.png`, clip: name === 'desk' ? { x: 0, y: 0, width: 520, height: 300 } : { x: 0, y: 0, width: 393, height: 300 } });
      await page.close();
    }
  }
} finally { await cr.close(); await wk.close(); }
