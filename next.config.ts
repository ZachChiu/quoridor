import { readFileSync } from "node:fs";
import path from "node:path";
import { withSentryConfig } from "@sentry/nextjs/config";
import type { NextConfig } from "next";

// Sentry 的 release 識別碼＝打版的版號（npm run release 會把它寫進 package.json，
// 並開一個同名的 git tag）。用版號而不是 commit SHA，Sentry 的 Releases 頁才會是
// v26.9.1 這種看得懂的名字，跟 git tag 對得起來。
//
// **source map 的比對不靠這個名字**：上傳時每個檔案都帶 debug id，Sentry 是用
// debug id 配對的，所以同一個版號部署好幾次也不會對錯堆疊。release 真正影響的是
// **crash-free** —— Release Health 是「按 release 統計 session」，沒有 release
// 就算不出 crash-free rate。
//
// 用 process.cwd() 而非 import.meta.url：next.config.ts 會先被編譯，
// 編譯結果是 CJS 還是 ESM 不保證，import.meta 在前者不存在。
// next build 一律從專案根目錄執行，process.cwd() 是可靠的。
const pkg = JSON.parse(
  readFileSync(path.join(process.cwd(), "package.json"), "utf8")
) as { version: string };
const release = process.env.SENTRY_RELEASE || `v${pkg.version}`;

const nextConfig: NextConfig = {
  output: "export",
  trailingSlash: true,
  env: {
    SITE_URL: process.env.SITE_URL || 'https://quoridorgame.com',
    // release 要同時給建置期（上傳 source map）與 runtime（事件帶上同一個值）。
    // 定義在這裡，CI 就不必再重複設一次 —— 少一個會對不上的地方。
    NEXT_PUBLIC_SENTRY_RELEASE: release,
  },
};

export default withSentryConfig(nextConfig, {
  // org / project 必須跟 auth token 綁定的組織一致 —— `sntrys_` token 的組織是
  // 寫死在 token 裡的，CLI 會拿它覆蓋掉設定值，不一致就是 `error: Project not found`，
  // 而且上傳失敗不會讓 build 失敗，所以會安靜地壞掉。
  // org 與 project 寫死。它們是 Sentry 網址上就看得到的 slug，不是機密，
  // 而放進環境變數反而多一個會安靜出錯的地方 —— org 只要跟 auth token 綁定的
  // 組織不一致就是 `Project not found`，而上傳失敗不會讓 build 失敗。
  // 少一個要設的值，就少一個忘記設的機會。
  org: 'zach-chiu',
  project: 'quoridor',
  // token 才是機密，留在環境變數
  authToken: process.env.SENTRY_AUTH_TOKEN,

  // 只在 CI 輸出 source map 上傳日誌，本機 build 不要被它洗版。
  // 代價是本機看不到上傳失敗 —— 要驗證就跑 `CI=1 npm run build`，
  // 看到 "Uploaded files to Sentry" 才算成功。
  silent: !process.env.CI,

  /*
    上傳失敗只警告，不讓 build 失敗。

    沒有這個 handler 時，一個壞掉的 auth token 會整個擋住部署 —— 實際發生過：
    CI 的 secret 值被貼歪，`sentry-cli releases new` 回 401 Invalid org token，
    然後整條 deploy 就停在那裡。**監控工具不該有能力擋住出貨。**

    但也不能讓它安靜 —— 這裡印到 stderr，CI log 一定看得到。
    上一版的問題正好相反：silent 把訊息吃掉，壞了也沒人知道。
  */
  errorHandler: (err: Error) => {
    console.warn('\n[Sentry] source map 上傳失敗，build 繼續。線上堆疊會是壓縮後的亂碼。');
    console.warn(`[Sentry] ${err.message.split('\n')[0]}`);
    if (/401|Invalid org token/.test(err.message)) {
      console.warn('[Sentry] 401 代表 token 字串不被接受 —— 多半是貼進 GitHub secret 時被截斷或混進換行。');
    }
  },

  // 不要把 build 的使用資料回報給 Sentry
  telemetry: false,

  // 上傳較完整的 source map，換取可讀的堆疊（build 會慢一點）
  widenClientFileUpload: true,

  release: {
    name: release,
    create: true,
    // finalize：補上 dateReleased 時間戳，Releases 頁才不會一直顯示「(unreleased)」，
    // adoption 那類「距離發布多久」的圖也才算得出來。
    finalize: true,
    // setCommits：把 release 關聯到 git commit，Sentry 才有辦法指出
    // 「這個錯誤最可能是哪一個 commit 造成的」（suspect commits）。
    // 兩個 ignore 旗標是必要的 —— 第一次打版（找不到上一個 release 的 commit）
    // 與同一個 commit 重複 build（沒有新 commit）都會讓 setCommits 失敗，
    // 進而讓整個 build 失敗。
    // 另外 CI 的 checkout 要 fetch-depth: 0，淺層 clone 沒有歷史可關聯。
    setCommits: { auto: true, ignoreMissing: true, ignoreEmpty: true },
  },

  sourcemaps: {
    // 預設即為 true，這裡明寫是因為本專案的 out/ 會整包 aws s3 sync 上去，
    // source map 若殘留就是公開可下載。
    deleteSourcemapsAfterUpload: true,
  },

  // 注意：SDK 的 `webpack` 選項在 Turbopack 下完全不生效，
  // 而 Next 16 已將 Turbopack 設為 next build 預設，故 wizard 產生的
  // webpack 區塊（automaticVercelMonitors、treeshake）已移除。
  //
  // tunnelRoute 亦無法使用 —— 它需要 server route，靜態匯出沒有。
  // 代價是裝了廣告阻擋器的使用者其錯誤不會回報，判讀數據時要記得這個偏差。
});
