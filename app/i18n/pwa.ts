import type { Metadata, MetadataRoute } from 'next';
import { brandName } from '@/brand';
import { getMessages } from '@/i18n';
import { HTML_LANG, LOCALES, type Locale, localePath } from '@/i18n/locales';

/**
 * 加到主畫面（PWA），2026-10-25 Zach：「PWA 也做上去」。
 *
 * **不管從哪一款遊戲的頁面加，打開都是平台首頁**（Zach：「設定上一定要回根目錄，不管從哪一個遊戲註冊」）：
 * - start_url 是那個語系的平台首頁（繁中 `/`、英文 `/en/`…）—— 英文頁加的人不該一打開就是中文
 * - scope 是整個站，id 全部同一個：在哪個語系、哪一款加，都是同一個 App
 * - 名字是平台名、圖示是骰子惡魔；主畫面的圖示（apple-touch-icon）因此每一頁都用平台的，
 *   分頁上的 favicon 才是各款自己的（metadata.ts 的 iconSet）
 *
 * 設定檔一個語系一份（app/pwa/[file]/route.ts → /pwa/zh-TW.json…），每一頁的
 * <link rel="manifest"> 由兩個 root layout 依語系掛上（pwaMetadata）。
 * 副檔名用 .json 不用 .webmanifest：`aws s3 sync` 依副檔名猜 Content-Type，猜不到就是 binary/octet-stream。
 *
 * 沒有 service worker：Chrome 從選單「安裝應用程式」不需要它（Android 108、桌機 112 起），
 * iPhone 的「加入主畫面」本來就不看。離線快取在這個站反而危險 —— 換版之後拿到舊的 chunk 清單，
 * 動態載入就會失敗（Sentry 的 ignoreErrors 濾的就是這種）。
 */

/** 平台的深色底（globals.css 的 --plat-bg）：Android 打開時的啟動畫面 */
const PLAT_BG = '#1c1816';

/** 設定檔的網址 */
export const manifestPath = (locale: Locale) => `/pwa/${locale}.json`;

/** 每個語系一份設定檔的檔名（route 的 generateStaticParams 用） */
export const MANIFEST_FILES = LOCALES.map((locale) => ({ locale, file: `${locale}.json` }));

export function webManifest(locale: Locale): MetadataRoute.Manifest {
  const home = localePath(locale, '/');
  return {
    id: '/',
    name: brandName(locale),
    short_name: brandName(locale),
    description: getMessages(locale).platform.ogDescription,
    lang: HTML_LANG[locale],
    // trailingSlash: true：/en 會被轉成 /en/，直接給轉完的
    start_url: home.endsWith('/') ? home : `${home}/`,
    scope: '/',
    display: 'standalone',
    background_color: PLAT_BG,
    theme_color: PLAT_BG,
    icons: [
      { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
      { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
    ],
  };
}

/** 兩個 root layout 共用：設定檔連結與 iPhone 主畫面上的名字 */
export function pwaMetadata(locale: Locale): Pick<Metadata, 'manifest' | 'appleWebApp'> {
  return {
    manifest: manifestPath(locale),
    appleWebApp: { capable: true, title: brandName(locale), statusBarStyle: 'default' },
  };
}
