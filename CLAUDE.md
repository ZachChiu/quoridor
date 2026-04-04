# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

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

### 路由

| 路由 | 說明 |
|---|---|
| `/` | 首頁（`HomeClient.tsx`）— 選擇本機或連線對戰、建立房間 |
| `/local` | 本機對戰（`local/PlayClient.tsx`） |
| `/match?roomId=…` | 連線對戰（`MatchClient` → `components/PlayClient`） |

### 狀態管理（React Context，全包在 `app/layout.tsx`）

- `GameContext` — 玩家人數（2 或 3）、遊戲流程狀態；本機模式用
- `RuleModalContext` — 規則說明 Modal 顯示狀態
- `UserContext` — Firebase 匿名 UID，自動登入並持久化至 Cookie

### 核心遊戲邏輯：`app/components/PlayClient.tsx`

單一元件同時支援本機與連線模式，靠 `roomId?: string` prop 判斷：

- **無 `roomId`** → 本機模式，`playersNum` 讀自 `GameContext`
- **有 `roomId`** → 連線模式，`playersNum` 讀自 Firebase Room，顯示 initializing / waiting / playing / error 四個 phase

棋盤邏輯：
- 7×7 棋盤（`Player[][]`），`horizontalWalls[][]` 與 `verticalWalls[][]` 分開存
- `getTerritories()` — BFS 洪水填充，計算每顆棋子可到達的格子
- `calculateAllTerritories()` → 領地計算 → 勝負判定（`winingStatus`）
- 三人模式破牆機制：`breakWallCountObj`，每位玩家最多 1 次
- 開局階段（`openingStep[]`）：玩家逐一手動放置棋子

### 3D 棋盤：`app/components/Chessboard3D.tsx`

`PlayClient` 目前使用 `Chessboard3D`（Three.js r183）渲染棋盤，`Chessboard.tsx` 保留為參考但已不 import。Props 介面與原 2D `Chessboard` 完全一致。

**關鍵設計：**
- **`latestPropsRef` 模式**：`useRef(props)` 每次 render 同步，event handler 內一律讀 `latestPropsRef.current` 取得最新 props，避免 stale closure 又不觸發 effect 重建。
- **Pawn map**：`pawnMapRef` 以 `"row,col"` 為 key（非 player）。每位玩家可有多顆棋子，同一格一個 Group。
- **Reactive effects**：`useEffect([board])` 重建棋子、`useEffect([horizontalWalls, verticalWalls])` 重建牆、`useEffect([selectedChess])` 棋子 lift + wall preview、`useEffect([availableMoves, flattenTerritoriesObj])` tile emissive。
- **互動**：Raycaster 優先序 — 破牆指示球 → preview 牆 → 棋子 hitbox → tile。

### 連線對戰（Firebase）

**Firebase RTDB 路徑：`rooms/{roomId}/`**

```
id, playersNum, status, createdAt, currentPlayer, wgf, winners?
players/{ A?, B?, C? }/{ uid, displayName, joinedAt }
```

`status` 生命週期：`waiting` → `opening` → `playing` → `finished`

- `app/utils/firebase.ts` — Firebase 初始化（Auth + RTDB）
- `app/utils/gameService.ts` — `createRoom`, `joinRoom`, `getRoom`, `subscribeRoom`, `updateGameState`, `setRoomStatus`, `setRoomWinner`
- `app/types/room.ts` — `Room`, `RoomPlayer`, `RoomStatus` 型別
- `HomeClient.tsx` — 建立房間（`createRoom`，含初始 WGF）並跳轉 `/match?roomId=…`
- `MatchClient.tsx` — 薄層，只讀 `useSearchParams` 拿 `roomId` 後渲染 `<PlayClient roomId={roomId} />`

### WGF（Wall Go Format）棋譜

自定義棋譜格式，4 個區塊以 `|` 分隔：

```
{playersNum}|{init}|{opening}|{turns}
```

每回合結束後序列化為字串，存入 Firebase `rooms/{roomId}/wgf`。

- `app/utils/wgf.ts` — 完整序列化 / 反序列化邏輯（`serializeWGF`, `parseWGF`, `serializeTurn`, `buildPieceIndex` 等）
- `app/types/wgf.ts` — `GameAction`, `PieceIndex`, `PiecePlacement`, `WGFRecord` 型別

**WGF 同步設計重點（連線模式）：**
- **寫路徑**：`selectWall`（回合結束）、`setChessPosition`（開局放棋）呼叫 `updateGameState(roomId, wgfStr, nextPlayer)`
- **讀路徑**：`useEffect` 監聽 `room?.wgf`，呼叫 `replayFromWgf` 從空棋盤完整重建（init → opening → turns）
- **Echo 防止**：`lastAppliedWgf` ref 記錄自己最後寫入的 WGF，避免自己寫入觸發自己的重播
- **Stale closure**：`gameTurnsRef` / `openingPlacementsRef` / `wgfInitPositionsRef` 每次 render 同步，供 `useCallback` 內使用
- **`isMyTurn`**：`useMemo` 統一管控操作權限；遊戲結束（`isLock`）或非當前玩家一律回傳 `false`
- **自動跳過**：若某玩家所有棋子領地已確定且無破牆機會，`useEffect` 自動推進 `currentPlayer`；各客戶端從相同 WGF 計算結果一致，無需寫 Firebase

## 主要慣例

- **狀態變更**：巢狀狀態一律使用 `cloneDeep()`（lodash-es），禁止直接修改。
- **型別定義**：統一放 `app/types/`；`app/utils/` 只放邏輯函式。
- **玩家顏色**：定義為 CSS 變數 `--player-A/B/C`，位於 `app/globals.css` 第 5–45 行；透過 Tailwind 自訂色彩 `player-A`、`player-B`、`player-C` 引用。
- **響應式斷點**：`portrait`、`landscape`、`md`、`lg`（見 `tailwind.config.ts`）。
- **數據分析**：使用者觸發的操作請以 `trackButtonClick()` 包裹，來源為 `app/utils/analytics.ts`。
- **Import 別名**：使用 `@/*` 代表 `app/*`（例如 `@/components/Button`）。
- **Context hooks**：在 Provider 外使用時必須拋出錯誤（參考 `GameContext.tsx` 中的模式）。

## 部署

GitHub Actions（`.github/workflows/`）負責建置並將 `/out` 同步至 AWS S3。設定 `SITE_URL` 環境變數可覆蓋預設的 `https://quoridorgame.com` 以產生 sitemap。

## 其他規範

每次對話結尾都要說：Zach + 隨機稱讚語
