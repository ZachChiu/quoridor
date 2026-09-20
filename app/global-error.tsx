"use client";

import NextError from "next/error";
import { useEffect } from "react";

/**
 * 根層級錯誤邊界。靜態匯出下這是 client 端 boundary，會正常運作。
 *
 * Sentry 用動態 import 而非靜態 import：靜態引入會把約 15 KB 的 Sentry core
 * 拉進「每一頁載入時就執行」的關鍵路徑，正好抵銷 instrumentation-client.ts
 * 刻意做的延遲載入。這裡只在真的爆炸時才需要 Sentry，等那時再載來得及；
 * 正常情況下 instrumentation-client 早已在瀏覽器閒置時載好，import 直接命中快取。
 */
export default function GlobalError({
  error,
}: {
  error: Error & { digest?: string };
}) {
  useEffect(() => {
    void import("@sentry/nextjs")
      .then((Sentry) => Sentry.captureException(error))
      .catch(() => {
        // 廣告阻擋器可能擋掉 SDK，靜默忽略 —— 此時畫面仍要正常顯示錯誤頁
      });
  }, [error]);

  return (
    <html lang="zh-TW">
      <body>
        {/* `NextError` is the default Next.js error page component. Its type
        definition requires a `statusCode` prop. However, since the App Router
        does not expose status codes for errors, we simply pass 0 to render a
        generic error message. */}
        <NextError statusCode={0} />
      </body>
    </html>
  );
}
