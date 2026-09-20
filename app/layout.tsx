import type { Metadata, Viewport } from "next";
import { Suspense } from 'react'
import { GoogleAnalytics } from '@next/third-parties/google'
import "./globals.css";
import AnalyticsProvider from "./providers/analytics-provider";
import { GameProvider } from "./contexts/GameContext";
import { RuleModalProvider } from "./contexts/RuleModalContext";
import { TransitionProvider } from "./contexts/TransitionContext";
import { UserProvider } from "./contexts/UserContext";
import RuleModal from "./components/RuleModal";



export const viewport: Viewport = {
  width: 'device-width',
  initialScale: 1,

  /*
    themeColor 必須與 globals.css 的 --background 同一個值。

    Safari 會拿它染 iOS 的狀態列與網址列。原本寫死 #ffffff 而頁面底色是
    #e8e1d7，於是畫面最上面永遠掛著一條白邊，捲動時特別明顯。

    改這個值時 globals.css 的 --background 要一起改 —— 兩邊分開寫死
    遲早會漂掉，而症狀只是「有點怪」，不會有人回報。
  */
  themeColor: '#e8e1d7',

  // 明確宣告是淺色配色。不宣告的話，部分瀏覽器在系統深色模式下會自行
  // 反轉表單控制項與捲軸，跟這套刻意平塗的配色對不起來。
  colorScheme: 'light',

  /*
    原本有 maximumScale: 1 與 userScalable: false。拿掉了 ——
    iOS Safari 從 iOS 10 起就直接忽略這兩個值，所以它們實際上只在
    Android 生效，效果是把縮放整個關掉，低視力使用者放不大
    （WCAG 1.4.4 要求能放大到 200%）。

    也就是說：想擋的平台擋不到，擋到的平台是不該擋的那個。
  */
};

export const metadata: Metadata = {
  metadataBase: new URL(process.env.SITE_URL || 'https://quoridorgame.com'),
  title: {
    default: "牆壁圍棋 Wall Go | QUORIDOR 類型的創意線上遊戲",
    template: "%s | 牆壁圍棋 Wall Go"
  },
  description: "體驗如同 Netflix 熱門影集「魔鬼的計謀 2」中的牆壁圍棋 Wall Go。在遊戲中運用策略與心理戰，佈局如同魔鬼的計謀，贏得勝利！",
  icons: {
    // SVG 優先（可無限縮放、檔案最小），.ico 是舊瀏覽器與「直接抓 /favicon.ico」
    // 那類行為的保底。兩者同一份設計，換版時要一起換。
    icon: [
      { url: '/favicon.svg', type: 'image/svg+xml' },
      { url: '/favicon.ico', sizes: '16x16 32x32' },
      { url: '/icon-192.png', type: 'image/png', sizes: '192x192' },
    ],
    shortcut: '/favicon.ico',
    apple: '/apple-touch-icon.png',
  },
  keywords: ["牆壁圍棋", "Wall Go", "QUORIDOR", "魔鬼的計謀 2", "Netflix", "心理戰", "智力對決", "棋盤遊戲", "策略遊戲", "圍棋", "迷宮遊戲", "益智遊戲"],
  authors: [{ name: "Zach Chiu" }],
  creator: "Zach Chiu",
  publisher: "Zach Chiu",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
  openGraph: {
    type: "website",
    locale: "zh_TW",
    url: process.env.SITE_URL,
    title: "牆壁圍棋 Wall Go - 如同「魔鬼的計謀 2」的智力對決",
    description: "體驗如同 Netflix 熱門影集「魔鬼的計謀 2」中的牆壁圍棋 Wall Go。在遊戲中運用策略與心理戰，佈局如同魔鬼的計謀，贏得勝利！",
    siteName: "牆壁圍棋 Wall Go",
    images: [
      {
        url: `/og-image.png`,
        width: 1200,
        height: 630,
        alt: "牆壁圍棋 Wall Go 遊戲畫面",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "牆壁圍棋 Wall Go - 如同「魔鬼的計謀 2」的智力對決",
    description: "體驗如同 Netflix 熱門影集「魔鬼的計謀 2」中的牆壁圍棋 Wall Go。在遊戲中運用策略與心理戰，佈局如同魔鬼的計謀，贏得勝利！",
    images: [`/og-image.png`],
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-TW">
      <body
        className="select-none antialiased"
      >
        <UserProvider>
          <RuleModalProvider>
            <TransitionProvider>
            <GameProvider>
              {children}
              <RuleModal />
              {/* Suspense 只包住 analytics 本身。它用了 useSearchParams()，
                  若連同內容一起包住，整棵子樹在靜態產生時會退回 client 渲染，
                  靜態 HTML 只剩 fallback（null）—— 爬蟲拿到空殼。 */}
              <Suspense fallback={null}>
                <AnalyticsProvider />
              </Suspense>
            </GameProvider>
            </TransitionProvider>
          </RuleModalProvider>
        </UserProvider>
      </body>
      {process.env.NEXT_PUBLIC_APP_ENV === "production" && (
        <GoogleAnalytics gaId="G-1CTRTGRPFF" />
      )}
    </html>
  );
}
