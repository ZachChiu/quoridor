# 平台首頁在 Google 的縮圖

大腦筋 11/2 寫。Zach 11/2 搜「WALL GO」：我們排第 1，AI 摘要也引用我們，但縮圖是**九子棋的中世紀古畫**（`/games/nine-mens-morris/libro.webp`）。Zach 說「為什麼是這張縮圖」，決定改。

## 現況

- Google 顯示的還是 `/` 的舊標題（牆壁圍棋 Wall Go 線上免費玩），但縮圖已經是平台首頁的圖。舊標題配新圖，看起來跟 Wall Go 無關。
- 平台首頁 og:image 是 `/og/platform-zh-TW.png`：很多遊戲的圖拼在一起，裁成正方形只剩中間一塊。
- 頁面上的 img 有 wall-go hero.svg、bagh-chal hero.webp、knights-tour hero-wide.webp、nine-mens-morris libro.webp…。古畫顏色最重、最像照片，Google 挑了它。
- JSON-LD 有 Organization、WebSite、TVSeries，沒有指定代表圖。
- robots.txt 全部 Allow。
- `/wall-go/` 的事 Zach 已經在 Search Console 要求建立索引了，那頁的 og:image 是 Wall Go 棋盤，不用動。

## 要改的

1. **JSON-LD 指定代表圖**（六個語系的平台首頁）：
   - 加 WebPage，帶 `primaryImageOfPage`（ImageObject），`image` 給三種比例：1:1、4:3、16:9，每張至少 1200px 寬（照 Google 的圖片建議）。
   - 圖用「骰子惡魔」logo 或 Wall Go 棋盤放正中間，背景單純。你們選，跟 Zach 確認過再定。
2. **og:image 改成裁切不會壞的版本**：主體放正中間，裁成正方形、4:3 都還認得出是骰子惡魔。季目錄頁如果也用拼貼圖，一起看。
3. **擋掉古畫給 Google 圖片當縮圖**：
   - robots.txt 加 `User-agent: Googlebot-Image` 並 `Disallow: /games/nine-mens-morris/libro.webp`。只擋這一張。
   - 九子棋頁會不會因此沒有縮圖：九子棋頁的 og:image 不是這張就沒差；是的話，九子棋頁也要換一張自己的代表圖。

## 規則

- 只動代表圖、分享圖、robots.txt、JSON-LD。網址、title、畫面不動。
- 開分支、做完跑檢查、**打版前先問 Zach**，這份 docs 一起 commit。
- 可以跟 page_type 那版（fix/ga-page-type）一起打。

## 驗收

- 上線當下：大腦筋看六個語系平台首頁的 JSON-LD 有 primaryImageOfPage、og:image 換了、robots.txt 有那一行。用 Google 的「複合式搜尋結果測試」看得到 WebPage 和圖片。
- 2～3 週內（11/23 前後）：搜「骰子惡魔」「魔鬼的計謀 遊戲」時，縮圖不是古畫。縮圖最後是 Google 選的，不保證。
