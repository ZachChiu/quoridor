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
import { LocaleProvider } from "./i18n/LocaleProvider";
import { HTML_LANG, type Locale } from "./i18n/locales";




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
export function Shell({ locale, children }: { locale: Locale; children: React.ReactNode }) {
  return (
    <html lang={HTML_LANG[locale]}>
      <body className="select-none antialiased">
        {/*
          LocaleProvider 必須包在**最外層**。

          原本它在各個 view 裡面，但 RuleModal 是掛在這個 shell 上的
          （它從任何頁面都能打開），於是它落在 provider 外面、永遠讀到
          預設語系 —— /ja 的首頁裡混著「遊玩方式」「下一步」就是這麼來的。
          放這裡之後，所有 client component 不論掛在哪一層都拿得到語系。
        */}
        <LocaleProvider locale={locale}>
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
        </LocaleProvider>
      </body>
      {process.env.NEXT_PUBLIC_APP_ENV === "production" && (
        <GoogleAnalytics gaId="G-1CTRTGRPFF" />
      )}
    </html>
  );
}

/** 與語系無關的 metadata（圖示、作者、metadataBase…），兩個 root layout 共用。 */
/*
  只放**與語系無關**的欄位（圖示、metadataBase、作者…）。

  標題、描述、keywords、openGraph、twitter 全部交給 i18n/metadata.ts
  依語系產生。留在這裡的話，任何忘記自訂 metadata 的新頁面都會
  安靜地掛上中文 og —— 而 og 不會出現在畫面上，要等到別人分享出去
  才會有人發現。
*/
export const baseMetadata: Metadata = {
  metadataBase: new URL(process.env.SITE_URL || 'https://quoridorgame.com'),
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
  authors: [{ name: "Zach Chiu" }],
  creator: "Zach Chiu",
  publisher: "Zach Chiu",
  formatDetection: {
    email: false,
    address: false,
    telephone: false,
  },
};
