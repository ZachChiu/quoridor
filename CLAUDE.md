# CLAUDE.md

此檔案提供 Claude Code (claude.ai/code) 在此專案中工作時的指引。

## 指令

```bash
npm run dev     # 啟動開發伺服器 (http://localhost:3000)
npm run build   # 產生靜態輸出至 /out（同時執行 next-sitemap postbuild）
npm run lint    # 執行 ESLint 檢查
npm start       # 在本地端提供 /out 靜態檔案
```

尚未設定測試套件。

## 架構

靜態 **Next.js 15** 應用程式（`output: "export"`）— 所有遊戲邏輯皆在客戶端執行。

**透過 React Context 管理狀態**（兩個 Provider 都包裹在 `app/layout.tsx` 中）：
- `GameContext` — 玩家人數（2 或 3）、遊戲流程狀態
- `RuleModalContext` — 規則說明 Modal 的顯示狀態

**核心遊戲邏輯完全位於 `app/play/PlayClient.tsx`**：
- 7×7 棋盤（`Player[][]`），水平與垂直牆壁分開存陣列
- `getAvailableMovesRecursive()` — 遞迴走法驗證，使用 visited set
- 洪水填充領地計算 → 勝負判定
- 三人模式破牆機制（記錄於 `breakWallCountObj`，每位玩家最多 1 次）
- 開局階段：玩家逐一手動放置棋子（`openingStep[]`）

**`app/components/Chessboard.tsx`** 負責棋盤渲染與點擊事件派發；以 `React.memo()` 包裹。

**`app/config/playerTemplates.tsx`** 存放 2 人與 3 人模式的初始棋盤狀態、回合順序與牆壁模板。

**型別**：`Player`（`'A' | 'B' | 'C' | null`）、`Direction`、`Move` — 定義於 `app/types/chessboard.ts`。

## 主要慣例

- **狀態變更**：巢狀狀態一律使用 `cloneDeep()`（lodash-es），禁止直接修改。
- **玩家顏色**：定義為 CSS 變數 `--player-A/B/C`，位於 `app/globals.css` 第 5–45 行；透過 Tailwind 自訂色彩 `player-A`、`player-B`、`player-C` 引用。
- **響應式斷點**：`portrait`、`landscape`、`md`、`lg`（見 `tailwind.config.ts`）。
- **數據分析**：使用者觸發的操作請以 `trackButtonClick()` 包裹，來源為 `app/utils/analytics.ts`。
- **Import 別名**：使用 `@/*` 代表 `app/*`（例如 `@/components/Button`）。
- **Context hooks**：在 Provider 外使用時必須拋出錯誤（參考 `GameContext.tsx` 中的模式）。

## 部署

GitHub Actions（`.github/workflows/`）負責建置並將 `/out` 同步至 AWS S3。設定 `SITE_URL` 環境變數可覆蓋預設的 `https://quoridorgame.com` 以產生 sitemap。

## 其他規範

每次對話結尾都要說：Zach + 隨機稱讚語
