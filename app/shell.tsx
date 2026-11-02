import type { Metadata } from "next";
import Script from "next/script";
import "./globals.css";
import { GameProvider } from "./contexts/GameContext";
import { RuleModalProvider } from "./contexts/RuleModalContext";
import { TransitionProvider } from "./contexts/TransitionContext";
import { UserProvider } from "./contexts/UserContext";
import { LocaleProvider } from "./i18n/LocaleProvider";
import { HTML_LANG, PREFIXED, type Locale } from "./i18n/locales";
import { PLAYABLE } from "./games/catalog";
import { pageMetaScript } from "./utils/pageMeta";

const GA_ID = "G-1CTRTGRPFF";
const PAGE_META = pageMetaScript(GA_ID, PREFIXED, PLAYABLE.map((g) => g.playable!.slice(1)));
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
        {/* GA 的初始化與 page_view（帶 page_type／game）：要在 GA 載入前先包住 history，見 utils/pageMeta.ts */}
        {process.env.NEXT_PUBLIC_APP_ENV === "production" && (
          <script dangerouslySetInnerHTML={{ __html: PAGE_META }} />
        )}
        {/*
          LocaleProvider 必須包在**最外層**。

          原本它在各個 view 裡面，但 RuleModal 當時是掛在這個 shell 上的
          （它從任何頁面都能打開），於是它落在 provider 外面、永遠讀到
          預設語系 —— /ja 的首頁裡混著「遊玩方式」「下一步」就是這麼來的。
          放這裡之後，所有 client component 不論掛在哪一層都拿得到語系。
          （RuleModal 2026-10-25 搬進 PlayClient：只有對局頁打得開它。）
        */}
        <LocaleProvider locale={locale}>
        <UserProvider>
          <RuleModalProvider>
            <TransitionProvider>
              <GameProvider>
                {children}
              </GameProvider>
            </TransitionProvider>
          </RuleModalProvider>
        </UserProvider>
        </LocaleProvider>
      </body>
      {/*
        頁面瀏覽（page_view）由 utils/pageMeta.ts 的內嵌 script 送，一次換頁一筆、帶 page_type／game；
        config 是 send_page_view: false，GA 後台的「依瀏覽器記錄事件判斷網頁變更」要關掉（11/2，docs/page-type-ga-fix.md）。
        所以不用 @next/third-parties 的 <GoogleAnalytics>：它自己再 config 一次會多送一筆 page_view。這裡只載 gtag.js。
        先前另外有一個 AnalyticsProvider 也手動送 page_view，於是每次瀏覽都算兩次 —— 送 page_view 的地方只能有一個。
      */}
      {process.env.NEXT_PUBLIC_APP_ENV === "production" && (
        <Script id="_ga" src={`https://www.googletagmanager.com/gtag/js?id=${GA_ID}`} strategy="afterInteractive" />
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
    // 全站預設是平台的骰子惡魔（/ 是平台首頁）；各遊戲的頁面在 i18n/metadata.ts 的 GAME_ICONS 換成自己的。
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
