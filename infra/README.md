# 部署端設定（不在程式碼裡，但會決定 SEO 對不對）

這個站是 `output: "export"`，產物是一堆靜態 HTML 丟到 S3、前面掛 CloudFront。
有兩件事 **Next 做不到、只能在 CloudFront 設**，而且兩件都直接影響搜尋收錄。

---

## 1. 404 必須回 404，不能回 200

### 現況會出什麼事

S3 找不到檔案時回 403 或 404，CloudFront 如果沒設 custom error response，
使用者會看到一頁 AWS 的 XML 錯誤。多數人會為了「畫面好看」把錯誤頁指到
`/index.html` 並回 200 —— **千萬不要**。那會讓每一個打錯的網址都變成
「一個內容跟首頁一樣的真實頁面」，Google 稱之為 soft 404，
大量出現會稀釋整站評價。

### 要設成什麼

CloudFront → Distribution → **Error pages** → Create custom error response：

| 欄位 | 值 |
|---|---|
| HTTP error code | `403: Forbidden` |
| Customize error response | Yes |
| Response page path | `/404.html` |
| **HTTP Response code** | **`404: Not Found`** |

再建一筆一模一樣的，把 HTTP error code 換成 `404: Not Found`。

兩筆都要，因為用 **OAC / OAI** 存取私有 bucket 時，S3 對不存在的物件
回的是 **403** 而不是 404（它不想洩漏「這個 key 存不存在」）。
只設 404 那一筆的話，實際上一筆都不會命中。

`Response code` 一定要填 404。填 200 就是前面說的 soft 404。

---

## 2. 網址搬家要回 301

`infra/cloudfront-redirects.js` 是一個 CloudFront Function（viewer request），
目前處理 `/match → /online`（含 `/en/ja/ko` 前綴）。

程式裡 `app/(default)/match/page.tsx` 有一個瀏覽器端的備援轉址 ——
**那不能取代 301**。它讓使用者到得了新頁，但舊網址累積的權重不會傳過去。
CloudFront Function 上線之後，那一頁實際上就不會再被執行（301 發生在更前面），
留著是為了萬一 function 沒部署時連結還是能用。

部署指令見該檔案開頭的註解。

**綁上去之前先看 Default (*) behavior 的 Viewer request 有沒有已經綁著別的 function。**
每個 behavior 只能綁一個，綁新的會把舊的換掉。這支已經把常見的那件事
（`/rules/` → `/rules/index.html`、`/rules` → 301 到 `/rules/`）一起做了，
所以舊的若只是在做這個，直接換掉即可；若舊的還做了別的事，要先合併進來。

---

## 3. 順帶一提：invalidation 目前是 `/*`

`deploy.yml` 每次部署都 invalidate `/*`。能用，但每個月前 1000 條免費之後
是按路徑計費的。若之後部署變頻繁，可以改成只 invalidate 真的變動的檔案，
或是給靜態資源加上 content hash（Next 已經有）後只 invalidate HTML。
現在的頻率不值得優化。
