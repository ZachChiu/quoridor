"use client";

import "./globals.css";
import { useEffect } from "react";
import ErrorScreen from "@/components/ErrorScreen";
import { getMessages } from "@/i18n";
import { DEFAULT_LOCALE, localeFromPath } from "@/i18n/locales";

/**
 * 根層級錯誤邊界：連 root layout 都掛了才會走到這裡。
 * （頁面裡的錯誤由各語系 layout 底下的 error.tsx 接，那邊字型與 Provider 都還在。）
 *
 * 這一層取代整個 root layout，所以要自己帶 <html>、<body> 與全站樣式
 * （Next 16 文件：global-error 不會套用 layout 的 global styles）。
 * 沒有語系 Provider 可用，語系只能從網址推 —— 這裡推錯的代價只是
 * 錯誤訊息的語言，比 404 那邊（猜錯會把人帶到錯的站）輕得多。
 *
 * 先前這裡是 Next 預設的 NextError：英文、沒樣式，看起來像網站整個壞掉了。
 *
 * Sentry 用動態 import 而非靜態 import：靜態引入會把約 15 KB 的 Sentry core
 * 拉進「每一頁載入時就執行」的關鍵路徑，正好抵銷 instrumentation-client.ts
 * 刻意做的延遲載入。這裡只在真的爆炸時才需要 Sentry，等那時再載來得及。
 */
export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  const locale = typeof window === "undefined" ? DEFAULT_LOCALE : localeFromPath(window.location.pathname);
  const t = getMessages(locale);

  useEffect(() => {
    void import("@sentry/nextjs")
      .then((Sentry) => Sentry.captureException(error))
      .catch(() => {
        // 廣告阻擋器可能擋掉 SDK，靜默忽略 —— 此時畫面仍要正常顯示錯誤頁
      });
  }, [error]);

  return (
    <html lang={locale}>
      <body>
        <title>{t.error.title}</title>
        <ErrorScreen t={t.error} locale={locale} />
      </body>
    </html>
  );
}
