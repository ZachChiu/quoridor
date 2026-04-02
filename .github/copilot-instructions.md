# Quoridor 專案指南

## 程式碼風格

- **語言**: TypeScript (嚴格模式，`tsconfig.json` 設定 `strict: true`)
- **React 模式**: 函數式元件搭配 Hooks；客戶端元件使用 `"use client"` 指令
- **樣式**: Tailwind CSS + 自訂 CSS 變數 (玩家顏色 `--player-A`, `--player-B`, `--player-C`)
- **匯入別名**: 使用 `@/*` 路徑 (例: `@/components/Button`)
- **格式化**: ESLint 設定 `next/core-web-vitals`、TypeScript 規則、tailwindcss 外掛

參見 [tailwind.config.ts](tailwind.config.ts) 了解響應式螢幕和顏色變數。

## 架構

靜態 **Next.js 15 應用** (`output: "export"`)，遊戲邏輯在客戶端執行：

- **遊戲狀態**: React Context 管理 (`GameContext.tsx`, `RuleModalContext.tsx`)
  - `GameContext` - 玩家數、遊戲流程狀態
  - `RuleModalContext` - 規則彈窗顯示狀態
- **主遊戲迴圈**: [PlayClient.tsx](app/play/PlayClient.tsx) 包含所有遊戲邏輯：
  - 棋盤狀態 (7×7 棋格)、玩家位置、牆壁放置
  - 移動驗證、領地計算、勝負判定
  - 使用 Lodash 工具函式 (`flatten`, `uniq`, `cloneDeep`, `max`, `min`)
- **UI 元件**:
  - [Chessboard.tsx](app/components/Chessboard.tsx) - 棋盤繪製、點擊事件處理
  - 遊戲狀態、彈窗、按鈕在 `/components/` 資料夾
- **遊戲配置**: [playerTemplates.tsx](app/config/playerTemplates.tsx) - 初始棋盤、回合順序、牆壁模板
- **型別定義**: [chessboard.ts](app/types/chessboard.ts) - `Player` ('A'|'B'|'C'|null)、`Direction`、`Move`

## 構建和測試

```bash
npm run dev       # 啟動開發伺服器 (http://localhost:3000)
npm run build     # 生成靜態輸出到 /out
npm start         # 本地提供 /out
npm run lint      # 執行 ESLint 檢查
```

**重點**:
- `postbuild` 自動生成網站地圖和 robots.txt (next-sitemap)
- 透過 `SITE_URL` 環境變數設定網址 (預設: `https://quoridorgame.com`)
- 部署: GitHub Actions (`.github/workflows/deploy.yml`) 構建並同步 `/out` 到 AWS S3

## 開發慣例

### 遊戲狀態管理
- 玩家型別為 `Player` ('A'|'B'|'C'|null)
- 棋盤為 `Player[][]` (7×7)；牆壁為獨立陣列
- **避免直接修改狀態** — 使用 `cloneDeep` 修改嵌套物件
- 範例: `const newBoard = cloneDeep(board); newBoard[row][col] = currentPlayer;`

### Context Hooks 模式
Context Provider 必須在 layout 層級包裝，使用此模式定義 hooks：
```typescript
export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) throw new Error("useGame 必須在 GameProvider 內使用");
  return context;
};
```

### 元件模式
- **客戶端元件**: 頂部使用 `"use client"`；匯入子元件時注意
- **記憶化**: 重元件 (如 Chessboard) 使用 `React.memo()` (見 [Chessboard.tsx](app/components/Chessboard.tsx#L30))
- **分析追蹤**: 用 `trackButtonClick()` 包裝使用者操作 (見 [analytics.ts](app/utils/analytics.ts))

### UI 自訂
- 玩家顏色定義為 CSS 變數 (見 [globals.css](app/globals.css) 第 5-45 行)
- 響應式設計使用 Tailwind 螢幕: `portrait`, `landscape`, `md`, `lg`
- 按鈕/圖示元件支援 className 合併 — 優先用 Tailwind 擴充

### 遊戲規則（注意項）
- **領地計算**: 用洪泛演算法在 PlayClient；必須驗證後才判定勝負
- **移動驗證**: `getAvailableMovesRecursive()` 遞迴函式；visited 集合防止無窮迴圈
- **牆壁破壞** (三人模式): 每玩家限 1 次，追蹤在 `breakWallCountObj`
- **開局階段**: 玩家自動放置一枚棋 (狀態: `openingStep[]`)

## 目錄結構

```
app/
  ├── components/        # 可重用 UI 元件
  ├── contexts/          # React Context 提供者
  ├── types/             # TypeScript 型別定義
  ├── config/            # 遊戲模板 (棋盤、回合)
  ├── utils/             # 分析、輔助函式
  ├── hook/              # 自訂 Hooks (useConfirm)
  ├── play/              # 遊戲頁面 (伺服器 + 客戶端)
  ├── providers/         # 分析提供者包裝
  └── layout.tsx         # 根布局與 Context 提供者
```
