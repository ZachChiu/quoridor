import { MetadataRoute } from 'next'

// 添加靜態匯出所需的配置
export const dynamic = "force-static";
export const revalidate = false;

export default function robots(): MetadataRoute.Robots {
  return {
    rules: {
      userAgent: '*',
      allow: '/',
    },
    sitemap: `${process.env.SITE_URL}/sitemap.xml`,
  }
}