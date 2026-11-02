import { MetadataRoute } from 'next'

// 添加靜態匯出所需的配置
export const dynamic = "force-static";
export const revalidate = false;

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      { userAgent: '*', allow: '/' },
      // 九子棋那張古畫（《遊戲之書》插圖）不給 Google 圖片當縮圖：平台首頁的卡片上也有它，
      // 搜「WALL GO」時被挑成平台首頁的縮圖（11/2，docs/platform-thumbnail.md）。只擋這一張；
      // 九子棋頁的分享圖是另外產的 public/og/nine-mens-morris-*.png，不受影響。
      // 有了自己的一組，Googlebot-Image 就不看 * 那組 —— allow 要再寫一次
      { userAgent: 'Googlebot-Image', allow: '/', disallow: '/games/nine-mens-morris/libro.webp' },
    ],
    sitemap: `${process.env.SITE_URL}/sitemap.xml`,
  }
}