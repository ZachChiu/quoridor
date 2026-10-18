# 連線錯誤回報到 Sentry

2026-10-18 從 GA4（BigQuery `ga4_history.quoridorgame_params`）與 Sentry 查到的現況與要改的事。

## 現況

`online_error` 自 9/25 開始記錄，共 32 次，幾乎全集中在 **2026-10-03 單日**：

| 日期 | connectFail | createFail | 連線 game_start | 連線 game_end |
|---|---|---|---|---|
| 9/29 | 1 | — | 4 | — |
| **10/3** | **17** | **6** | 2 | 2 |
| 10/8 | — | 1 | 14 | 11 |
| 10/9 | — | 1 | — | — |
| 10/13 | — | — | 6 | 6 |

- 10/3 那天 5 個使用者撞了 25 次錯誤；當天沒有發版、`database.rules.json` 也沒改。疑似 Firebase 端的問題（服務異常、匿名登入、Spark 方案 100 條同時連線用滿）。
- **原因查不到**：`PlayClient.tsx` 的 Firebase 初始化與 `OnlineClient.tsx` 的開房，錯誤都被 `catch` 接住，只 `console.error` ＋ GA `online_error`，**沒有送 Sentry**，也不知道卡在哪一步。
- Sentry 裡跟連線相關的只有 QUORIDOR-E（React `insertBefore` NotFoundError，`/online`，6 次，英國 Windows Chrome），疑似瀏覽器自動翻譯改了 DOM，跟 10/3 無關，優先度低。

## 要改的事

1. **連線與開房失敗送 Sentry**
   - `PlayClient.tsx` 的 Firebase 初始化 `catch`、`OnlineClient.tsx` 的開房 `catch`：`captureException`，tag 帶 `reason`（connectFail／createFail）與 **`step`**。
   - `step` 分成 `auth`（ensureUser）、`getRoom`、`join`、`create`。
   - 是不是逾時（`withTimeout` 的 15 秒）要看得出來，例如逾時改丟自訂的 `TimeoutError`，或 tag 加 `timeout: true`。
   - 照專案既有寫法動態 `import('@sentry/nextjs')`，不要讓連線頁多載整包 SDK。
   - **不要送 roomId、uid** 這類可識別資訊。
2. **GA `online_error` 加參數 `step`**（同上四個值）。
   - `app/utils/analytics.ts` 的型別一起改。
   - 提醒站長到 GA 後台把 `step` 註冊成事件範圍的自訂維度。
3. noRoom、roomFull 是正常流程，不送 Sentry。
4. 測試：
   - 能抽成純函式的部分（判斷 step、是否逾時）補 `tests/`。
   - 本機模擬 Firebase 連不上（例如斷網或改錯 databaseURL），確認 Sentry 收得到、tag 正確。
