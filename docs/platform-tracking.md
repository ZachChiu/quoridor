# 平台版的 GA 追蹤：分得出是哪一款遊戲、從平台首頁點了哪張卡

大腦筋 11/1 寫。平台版上線（`feat/platform-bagh`）時一起做，不用另外打版。

## 為什麼

- 平台上線後，同一個 GA 資源會有 Wall Go、尼泊爾虎棋，之後還有更多遊戲。現在的事件（`game_start`、`game_end`、`mode_select`…）沒有帶「哪一款遊戲」，虎棋的局會跟 Wall Go 混在一起。
- 只看網址（`/wall-go/`、`/bagh-chal/`）分得出 page_view，但分不出「開了幾局、玩完幾局」。
- 平台首頁是新的入口，要知道大家從首頁點了哪一款，才能決定首頁大卡放什麼（loop.md：4 週後 Wall Go Clicks 達標才換成「放最新的那款」）。

## 要做的

1. **所有跟對局有關的事件加 `game`**：`mode_select`、`room_created`、`game_start`、`game_end`、`game_restart`、`online_error`、`share_room_link`、`share`、`nudge_send`、`tutorial_close`。
   - 值用網址的 slug：`wall-go`、`bagh-chal`，之後的遊戲照它的網址。
   - 放進 `analytics.ts` 的型別表，每款遊戲都一定要帶，漏了編譯就擋下來。
2. **虎棋也送同一套事件**：`mode_select`、`game_start`、`game_end`（result、ended、turns、duration_sec）、`game_restart`、`tutorial_close`，帶 `game: 'bagh-chal'`。虎棋特有的（例如哪一方贏：虎或羊）放 `winner`，不要另開事件名稱。
3. **平台首頁、季目錄點遊戲卡：新事件 `select_game`**
   - `game`：點的是哪款。
   - `location`：`home_hero`（首頁大卡）、`home_grid`（首頁格子）、`season`（季目錄）、`related`（遊戲頁底下的其他遊戲）。
   - `season`：1、2、3（數字）。
   - 參數不要用 source、medium、campaign、term、content（GA 會拿去蓋掉流量來源，見 `analytics.ts` 開頭）。
4. **page_view 帶 `page_type`**（用 GA 的 config 參數或 `page_view` 事件參數都可以）：`platform_home`、`season`、`game_home`、`rules`、`play`。`game` 也一起帶（平台首頁、季目錄不帶）。
5. **`feedback_send` 加 `game`**（平台頁尾送的不帶）。

## Zach 要在 GA 後台做的

「管理 → 自訂定義 → 建立自訂維度」，範圍都是「事件」：`game`、`location`、`page_type`。`season` 也註冊成維度。

**上線後再註冊也可以**：註冊前的資料 BigQuery 讀得到，只是 GA 報表看不到。

## 驗收

- 上線當天：
  - 大腦筋用 BigQuery 看（GA 匯出隔天才有）：
    - `game_start` 的 `game` 有沒有 wall-go、bagh-chal 兩種。
    - `select_game` 有沒有進來。
  - 用 GA 即時報表看也可以。
- 4 週後：照 `loop.md`「條件到了才做」那條，看 Wall Go 的 Clicks 有沒有掉。
