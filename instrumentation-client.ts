/**
 * Sentry client 端初始化（延遲載入版）。
 *
 * 本專案是 `output: "export"` 純靜態站，沒有 server / edge runtime，
 * 因此只有這個 client 設定會實際執行。
 *
 * 為什麼要延遲：實測 @sentry/nextjs 會讓每頁 bundle 增加約 61 KB gzip，
 * 且 Turbopack 下 bundleSizeOptimizations 的 tree-shaking 旗標無效。
 * 對一個「開啟就要能馬上玩」的遊戲來說，不該讓監控擋在關鍵路徑上。
 *
 * 為什麼不會漏錯誤：SDK 載入前先掛一組極輕量的原生監聽器把錯誤暫存起來，
 * SDK 就緒後再補送，因此載入期間發生的錯誤一樣會回報。
 */

/**
 * Sentry DSN。
 *
 * 寫死而不是走環境變數：NEXT_PUBLIC_ 前綴代表它一定會被編進 client bundle，
 * 任何人打開 devtools 都看得到 —— 它設計上就是公開的，Sentry 官方文件也這麼說。
 * 放進環境變數不會讓它更安全，只會多一個「忘了設就安靜不回報」的地方。
 *
 * 要防的是別人拿它灌假事件消耗配額，那靠 Sentry 專案設定裡的 Allowed Domains，
 * 不是靠把 DSN 藏起來。
 */
const DSN = 'https://1f39a71b488240ae2416c557057af19f@o4512074543529984.ingest.us.sentry.io/4512074824155136';

type BufferedError = { error: unknown; type: 'error' | 'unhandledrejection' };

const buffered: BufferedError[] = [];
const MAX_BUFFERED = 10;

function bufferError(error: unknown, type: BufferedError['type']) {
  if (buffered.length < MAX_BUFFERED) buffered.push({ error, type });
}

const onError = (event: ErrorEvent) => bufferError(event.error ?? event.message, 'error');
const onRejection = (event: PromiseRejectionEvent) =>
  bufferError(event.reason, 'unhandledrejection');

async function initSentry() {
  window.removeEventListener('error', onError);
  window.removeEventListener('unhandledrejection', onRejection);

  const Sentry = await import('@sentry/nextjs');

  Sentry.init({
    dsn: DSN,

    // release 必須與建置時上傳 source map 所用的值一致，否則堆疊無法還原，
    // 且 crash-free 率（按 release 分組統計）會失去意義。
    // 值由 next.config.ts 從 package.json 的 version 算出（npm run release 維護），
    // 透過 env 同時餵給建置期與 runtime，所以只有一個來源、不會對不上。
    release: process.env.NEXT_PUBLIC_SENTRY_RELEASE,
    environment: process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT ?? 'development',

    // 實測：Turbopack 下 bundleSizeOptimizations.excludeTracing 無效，
    // BrowserTracing 無論如何都會被打包（關掉只是放棄功能卻省不到位元組）。
    // 既然已經付出體積，就低取樣啟用，等於免費取得 Core Web Vitals 與導覽計時。
    tracesSampleRate:
      process.env.NEXT_PUBLIC_SENTRY_ENVIRONMENT === 'production' ? 0.1 : 1,

    // Session Replay：只在錯誤發生時錄，不做常態取樣
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 1.0,

    // Release Health（crash-free 率）預設即開啟：每次頁面載入算一個 session，
    // 未捕捉的錯誤打到 global handler 時標記為 crashed。無需額外設定。

    // 濾掉不是本站問題的雜訊。沒有這層的話 crash-free 率會被瀏覽器與網路
    // 環境的噪音壓低，指標就失去意義。
    ignoreErrors: [
      // Chrome 的既知無害警告。棋盤是隨視窗縮放的方形容器，轉向時很容易冒
      'ResizeObserver loop completed with undelivered notifications',
      'ResizeObserver loop limit exceeded',
      // 瀏覽器外掛注入的腳本
      /^chrome-extension:/,
      /^moz-extension:/,
      // 動態 import 失敗。本站的 Firebase 與 Sentry 自己（含 Replay）都是
      // 動態載入，行動網路不穩或瀏覽器快取到舊的 chunk 清單時一定會出現，
      // 但那是環境問題不是程式錯誤
      'Failed to fetch dynamically imported module',
      'Importing a module script failed',
      'error loading dynamically imported module',
      // 使用者切走頁面、網路斷線造成的請求中斷（連線對戰的 RTDB 訂閱會遇到）
      'AbortError',
      'Failed to fetch',
      'NetworkError when attempting to fetch resource',
      'Load failed',
    ],
  });


  // 補送 SDK 就緒前緩衝的錯誤
  for (const item of buffered) {
    Sentry.captureException(item.error, {
      tags: { buffered_before_sdk_ready: true, buffered_type: item.type },
    });
  }
  buffered.length = 0;

  // Replay 再往後推一層，它比核心 SDK 更重
  Sentry.lazyLoadIntegration('replayIntegration')
    .then((replayIntegration) => {
      Sentry.addIntegration(
        replayIntegration({ maskAllText: true, blockAllMedia: true })
      );
    })
    .catch(() => {
      // 廣告阻擋器可能擋掉 Replay 的 CDN 載入，靜默忽略，不影響錯誤回報本身
    });
}

if (typeof window !== 'undefined') {
  window.addEventListener('error', onError);
  window.addEventListener('unhandledrejection', onRejection);

  // 不用 `'requestIdleCallback' in window`：該屬性在 lib.dom 中恆定存在，
  // TS 會把 else 分支窄化成 never。改以執行期型別判斷。
  if (typeof window.requestIdleCallback === 'function') {
    window.requestIdleCallback(() => void initSentry(), { timeout: 4000 });
  } else {
    window.setTimeout(() => void initSentry(), 2000);
  }
}

/**
 * 刻意不匯出 `onRouterTransitionStart`。
 *
 * 取捨理由：
 * 匯出它需要靜態匯入 @sentry/nextjs，會把一大塊 SDK 拉回關鍵路徑。
 * 實測 /：273.8 KB → 305.0 KB gzip（+31 KB），而換得的只是「client 端路由
 * 切換計時」。本站僅三個路由，且玩家幾乎全程停在同一個遊戲頁，價值不成比例。
 *
 * pageload transaction 與 Core Web Vitals 由 BrowserTracing 的 pageload
 * instrumentation 提供，不受此決定影響，仍正常運作。
 *
 * 附帶說明：Sentry 建置期會掃描本檔是否有 `Sentry.init()` 呼叫，若有而未匯出
 * 此 hook 就會噴 "ACTION REQUIRED" 警告。因為我們的 init 被移進動態 import 的
 * async 函式中，該掃描看不到，所以建置輸出是乾淨的。init 本身在執行期正常運作
 * （已於瀏覽器驗證 DSN、release、environment 與 BrowserSession integration）。
 */
