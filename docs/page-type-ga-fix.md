# page_view 沒帶 page_type、game

大腦筋 11/2 寫。平台版（v26.11.1）說好 page_view 要帶 `page_type` 和 `game`（`docs/platform-tracking.md` 第 4 條），但 GA 一筆都沒收到。

## 查到的

- GA Data API，11/1～11/2：383 筆 page_view，`page_type`、`game` 全部是空的。其他事件也都沒帶 page_type。
  - 同一天註冊的 `game`、`location` 在 select_game 上有值，所以不是維度沒註冊好。
- 11/2 在 Chrome 開 `https://quoridorgame.com/bagh-chal/`：
  - dataLayer 裡有 `['set', {page_type: 'game_home', game: 'bagh-chal'}]`，`app/utils/pageMeta.ts` 的內嵌 script 有跑。
  - 但送出去的 `/g/collect`（page_view、scroll）沒有 `ep.page_type`、`ep.game`。
- 結論：GA4 的 `gtag('set', {...})` 不會把自訂參數帶進事件。

## 要改的

- 把 page_type、game 改成真的帶在事件上。做法你們選，例如：
  - `gtag('config', 'G-1CTRTGRPFF', {page_type, game})`。換頁時再呼叫一次 config 會多送一筆 page_view，要注意。
  - 或關掉自動 page_view（`send_page_view: false`），每次換頁自己送 `gtag('event', 'page_view', {page_type, game})`。
- 平台首頁、季目錄不帶 game，照原規格。
- 之後的事件（mode_select、game_start…）有沒有帶 page_type 不強求。

## 規則

- 只動 GA。網址、title、畫面都不動。
- 開分支、做完跑檢查、**打版前先問 Zach**，這份 docs 一起 commit。
- 這是小修正，可以跟下一版一起打。

## 驗收

- 上線當下：大腦筋在 Chrome 看 `/g/collect` 的 page_view 有 `ep.page_type`，換頁（站內點連結）後也有，而且一次換頁只送一筆 page_view。
- 隔天：GA Data API 的 page_view 依 page_type 分得開（platform_home、game_home、rules、play、season）。
