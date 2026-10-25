# 平台上線：舊網址 → 新網址、新 sitemap（2026-10-25，給大腦）

同一個網域（quoridorgame.com），不換網域。換網域那份是另一個情境，在 `docs/domain-move/`。
上線的是 `feat/platform-bagh`：平台＋Wall Go＋尼泊爾虎棋。第二批五款照「還沒做」的卡片，頁面不上。

## 上線那天網址怎麼變

- **`/`（每個語系）網址不變、內容換掉**：從 Wall Go 首頁變成平台首頁，Wall Go 首頁搬到 `/wall-go/`。
  這一條**沒有 301**（`/` 自己就是平台）。Search Console 上 `/` 原本吃的 Wall Go 字詞，接下來要看 `/wall-go/` 接不接得住 —— 這是這次搬家最大的風險。
  平台首頁上 Wall Go 的卡片連到 `/wall-go/`。
- **其他舊路徑一律 301**：CloudFront Function（`infra/cloudfront-redirects.js`），main 的部署會一起更新它（`deploy.yml` 的「更新 CloudFront Function」）。
  query 照帶過去；`#roomId=` 這類 hash 由瀏覽器自己帶（舊的邀請連結不會壞）。舊路徑上另有瀏覽器端轉址當備援（`LegacyRedirect`）。
- 表跟程式的 `MOVED`（`app/i18n/routes.ts`）是同一份，`tests/infra/redirects.test.ts` 鎖住 CloudFront 那邊跟它一致。

## 對照表（六個語系全列；同一份的 CSV：`redirect-map.csv`）

舊站送進 sitemap 的是標「有」的那 18 個（每個語系 `/`、`/rules/`、`/solo/`），其他本來就是 noindex。

| 舊網址 | 新網址 | 語系 | 舊站有沒有進 sitemap |
|---|---|---|---|
| `/` | `/`（不轉址，內容換成平台首頁；Wall Go 首頁搬到 `/wall-go/`） | zh-TW | 有 |
| `/rules/` | `/wall-go/rules/` | zh-TW | 有 |
| `/solo/` | `/wall-go/solo/` | zh-TW | 有 |
| `/local/` | `/wall-go/local/` | zh-TW | 沒有（noindex） |
| `/local/2/` | `/wall-go/local/` | zh-TW | 沒有（noindex） |
| `/local/3/` | `/wall-go/local/3/` | zh-TW | 沒有（noindex） |
| `/online/` | `/wall-go/online/` | zh-TW | 沒有（noindex） |
| `/replay/` | `/wall-go/replay/` | zh-TW | 沒有（noindex） |
| `/match/` | `/wall-go/online/` | zh-TW | 沒有（舊網址，本來就只轉址） |
| `/en/` | `/en/`（不轉址，內容換成平台首頁；Wall Go 首頁搬到 `/en/wall-go/`） | en | 有 |
| `/en/rules/` | `/en/wall-go/rules/` | en | 有 |
| `/en/solo/` | `/en/wall-go/solo/` | en | 有 |
| `/en/local/` | `/en/wall-go/local/` | en | 沒有（noindex） |
| `/en/local/2/` | `/en/wall-go/local/` | en | 沒有（noindex） |
| `/en/local/3/` | `/en/wall-go/local/3/` | en | 沒有（noindex） |
| `/en/online/` | `/en/wall-go/online/` | en | 沒有（noindex） |
| `/en/replay/` | `/en/wall-go/replay/` | en | 沒有（noindex） |
| `/ja/` | `/ja/`（不轉址，內容換成平台首頁；Wall Go 首頁搬到 `/ja/wall-go/`） | ja | 有 |
| `/ja/rules/` | `/ja/wall-go/rules/` | ja | 有 |
| `/ja/solo/` | `/ja/wall-go/solo/` | ja | 有 |
| `/ja/local/` | `/ja/wall-go/local/` | ja | 沒有（noindex） |
| `/ja/local/2/` | `/ja/wall-go/local/` | ja | 沒有（noindex） |
| `/ja/local/3/` | `/ja/wall-go/local/3/` | ja | 沒有（noindex） |
| `/ja/online/` | `/ja/wall-go/online/` | ja | 沒有（noindex） |
| `/ja/replay/` | `/ja/wall-go/replay/` | ja | 沒有（noindex） |
| `/ko/` | `/ko/`（不轉址，內容換成平台首頁；Wall Go 首頁搬到 `/ko/wall-go/`） | ko | 有 |
| `/ko/rules/` | `/ko/wall-go/rules/` | ko | 有 |
| `/ko/solo/` | `/ko/wall-go/solo/` | ko | 有 |
| `/ko/local/` | `/ko/wall-go/local/` | ko | 沒有（noindex） |
| `/ko/local/2/` | `/ko/wall-go/local/` | ko | 沒有（noindex） |
| `/ko/local/3/` | `/ko/wall-go/local/3/` | ko | 沒有（noindex） |
| `/ko/online/` | `/ko/wall-go/online/` | ko | 沒有（noindex） |
| `/ko/replay/` | `/ko/wall-go/replay/` | ko | 沒有（noindex） |
| `/zh-Hans/` | `/zh-Hans/`（不轉址，內容換成平台首頁；Wall Go 首頁搬到 `/zh-Hans/wall-go/`） | zh-Hans | 有 |
| `/zh-Hans/rules/` | `/zh-Hans/wall-go/rules/` | zh-Hans | 有 |
| `/zh-Hans/solo/` | `/zh-Hans/wall-go/solo/` | zh-Hans | 有 |
| `/zh-Hans/local/` | `/zh-Hans/wall-go/local/` | zh-Hans | 沒有（noindex） |
| `/zh-Hans/local/2/` | `/zh-Hans/wall-go/local/` | zh-Hans | 沒有（noindex） |
| `/zh-Hans/local/3/` | `/zh-Hans/wall-go/local/3/` | zh-Hans | 沒有（noindex） |
| `/zh-Hans/online/` | `/zh-Hans/wall-go/online/` | zh-Hans | 沒有（noindex） |
| `/zh-Hans/replay/` | `/zh-Hans/wall-go/replay/` | zh-Hans | 沒有（noindex） |
| `/th/` | `/th/`（不轉址，內容換成平台首頁；Wall Go 首頁搬到 `/th/wall-go/`） | th | 有 |
| `/th/rules/` | `/th/wall-go/rules/` | th | 有 |
| `/th/solo/` | `/th/wall-go/solo/` | th | 有 |
| `/th/local/` | `/th/wall-go/local/` | th | 沒有（noindex） |
| `/th/local/2/` | `/th/wall-go/local/` | th | 沒有（noindex） |
| `/th/local/3/` | `/th/wall-go/local/3/` | th | 沒有（noindex） |
| `/th/online/` | `/th/wall-go/online/` | th | 沒有（noindex） |
| `/th/replay/` | `/th/wall-go/replay/` | th | 沒有（noindex） |

## 新 sitemap（54 個，清單：`sitemap-urls.txt`）

從 `feat/platform-bagh` 建置出來的 `out/sitemap-0.xml`（10/25）。網域是 `https://quoridorgame.com`。

| 區塊 | 每個語系 | × 6 語系 |
|---|---|---|
| 平台首頁 `/` | 1 | 6 |
| 季目錄 `/season/1`、`/season/2`、`/season/3` | 3 | 18 |
| Wall Go：`/wall-go/`、`/wall-go/rules/`、`/wall-go/solo/` | 3 | 18 |
| 尼泊爾虎棋：`/bagh-chal/`、`/bagh-chal/rules/` | 2 | 12 |

**不進 sitemap（都是 noindex）**：對局畫面（Wall Go 的 local／online／replay、虎棋的 solo／local／online）、舊網址、第二批五款（還沒上）、加到主畫面的設定檔 `/pwa/*.json`。
第二批每上一款，那款的首頁與規則頁會進 sitemap，到時候再補這份清單。

## 驗收時可以對的

- 舊 `/rules/` → `/wall-go/rules/`、舊 `/solo/` → `/wall-go/solo/`（各語系）：舊的曝光應該轉到新網址。
- `/`：同一個網址換了內容，曝光、點擊的字詞會變；Wall Go 的字詞要在 `/wall-go/` 找。
- 從主畫面打開的造訪：`utm_source=pwa`、`utm_medium=homescreen`（預設管道會落在 Unassigned）。canonical 不帶這兩個參數。
