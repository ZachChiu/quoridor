import type { Metadata } from "next";
import { Suspense } from 'react'
import { GoogleAnalytics } from '@next/third-parties/google'
import "./globals.css";
import AnalyticsProvider from "./providers/analytics-provider";
import { GameProvider } from "./contexts/GameContext";
import { RuleModalProvider } from "./contexts/RuleModalContext";
import { TransitionProvider } from "./contexts/TransitionContext";
import { UserProvider } from "./contexts/UserContext";
import RuleModal from "./components/RuleModal";




/**
 * 站台外殼：<html> 與所有 provider。
 *
 * 抽出來是因為有**兩個 root layout** —— zh-TW 走 app/(default)，
 * en/ja/ko 走 app/(intl)/[locale]。Next 只允許一個 <html>，
 * 所以要讓 <html lang> 隨語系改變，就必須拆成兩個 root layout；
 * 而兩份 layout 各自維護一份 provider 樹遲早會漂掉。
 *
 * 之前 lang 一律寫死 zh-TW，連 /en /ja /ko 也是 —— 讀屏會用中文發音去念
 * 英文與韓文，而那是不會有人回報的那種壞掉。
 */
export function Shell({ lang, children }: { lang: string; children: React.ReactNode }) {
  return (
    <html lang={lang}>
      <body className="select-none antialiased">
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

/** 與語系無關的 metadata（圖示、作者、metadataBase…），兩個 root layout 共用。 */
export const baseMetadata: Metadata = {
  metadataBase: new URL(process.env.SITE_URL || 'https://quoridorgame.com'),
  /*
    標題與描述的三個修正：

    1. 節目正式名稱是《魔鬼的計謀：死亡密室》，不是「魔鬼的計謀 2」。
       寫錯的名字搜不到，而這是這個站最主要的流量來源。
    2. 標題不再掛 QUORIDOR。這個遊戲不是 Quoridor，掛著只會稀釋
       「牆壁圍棋 / Wall Go」的相關度，還會引來找錯遊戲的人。
       兩者的差別改在規則頁用一則 FAQ 好好講清楚 —— 那是真實存在的
       長尾查詢，集中在一處回答比散在 title 裡有用。
    3. 描述原本「魔鬼的計謀」出現兩次。關鍵字重複不會加分，
       只會讓那句話讀起來像機器寫的。改成講清楚這是什麼、怎麼玩、
       要不要註冊 —— 那才是點不點進來的依據。
  */
  title: {
    default: "牆壁圍棋 Wall Go 線上免費玩 | 2-3 人策略圈地遊戲",
    template: "%s | 牆壁圍棋 Wall Go"
  },
  description: "Netflix《魔鬼的計謀：死亡密室》裡的牆壁圍棋，線上免費玩。移動棋子、築牆圈地，地盤大的人獲勝。支援 2-3 人對戰、單人挑戰電腦與連線對局，免下載免註冊。",
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
  // 關鍵字欄位對 Google 早已無效，留著是給其他索引器看的。
  // 只保留真的描述這個遊戲的詞 —— 塞「圍棋」「迷宮遊戲」這種
  // 只是沾邊的字，對排名沒幫助，對點進來的人是誤導。
  keywords: ["牆壁圍棋", "Wall Go", "魔鬼的計謀", "死亡密室", "圈地遊戲", "策略遊戲", "線上桌遊"],
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
    title: "牆壁圍棋 Wall Go 線上免費玩",
    description: "Netflix《魔鬼的計謀：死亡密室》裡的牆壁圍棋。築牆圈地，地盤大的人獲勝。2-3 人對戰、單人挑戰電腦，免下載免註冊。",
    siteName: "牆壁圍棋 Wall Go",
    images: [
      {
        url: `/og-image.png`,
        width: 1200,
        height: 630,
        alt: "牆壁圍棋 Wall Go —— 7x7 棋盤上紅藍雙方以牆圍出各自地盤",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "牆壁圍棋 Wall Go 線上免費玩",
    description: "Netflix《魔鬼的計謀：死亡密室》裡的牆壁圍棋。築牆圈地，地盤大的人獲勝。免下載免註冊。",
    images: [`/og-image.png`],
  },
};
