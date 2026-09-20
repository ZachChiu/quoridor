# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 指令

```bash
npm run dev             # 啟動開發伺服器 (http://localhost:3000)，Next 16 預設使用 Turbopack
npm run build           # 產生靜態輸出至 /out（同時執行 next-sitemap postbuild）
npm run lint            # 執行 ESLint（Next 16 已移除 next lint，改用 ESLint CLI）
npm run typecheck       # tsc --noEmit
npm test                # 執行 Vitest（app/game 的規則與 AI 測試）
RUN_AI_BENCH=1 npm test # 連 AI 對局強度與難度階梯一起跑（約 5 分鐘）
npm run font:subset     # 依原始碼實際用字重建字型子集
npm run font:check      # 只檢查子集有沒有落後（CI 用）
npm start               # 以 serve 提供 /out 靜態檔案（next start 不支援 output: export）

npm run release:preview       # 先看會打成什麼版號、併哪條分支
npm run release -- "版本標題"  # 把目前分支併進 main、打 tag、推出去（詳見〈打版〉）
```

測試以 Vitest 執行，全部集中在 **`tests/`**，不與原始碼混放（`app/` 底下只留會被打包的東西）。
目錄對應 `app/`：`tests/game/` 對 `app/game/`、`tests/components/` 對 `app/components/`。
測試一律用 `@/` 別名 import，不用相對路徑。

## 架構

靜態 **Next.js 16** 應用程式（`output: "export"`）— 所有遊戲邏輯皆在客戶端執行。

### 路由

| 路由 | 說明 |
|---|---|
| `/` | 首頁（`HomeClient.tsx`）— 選擇本機或連線對戰、建立房間 |
| `/local` | 本機對戰（`local/page.tsx` → `components/PlayClient`，無 `roomId`） |
| `/match#roomId=…` | 連線對戰（`MatchClient` → `components/PlayClient`，帶 `roomId`）。roomId 放在 hash 而非 query |

### 狀態管理（React Context，全包在 `app/layout.tsx`）

- `GameContext` — 玩家人數（2 或 3）、遊戲流程狀態；本機模式用
- `RuleModalContext` — 規則說明 Modal 顯示狀態
- `UserContext` — Firebase 匿名 UID。**不在 mount 時自動登入**，改由 `ensureUser()` 在需要連線功能時才載入 SDK 並登入，UID 持久化至 Cookie

### 核心遊戲邏輯

全部規則都在 **`app/game/`**（純函式、零 React 相依、零副作用）。目前由 UI 使用，並刻意保持可在 Web Worker、棋譜回放與後端驗證中共用同一份實作：

| 檔案 | 職責 |
|---|---|
| `types.ts` | `GameState`、`WallSlot`、`TerritoryResult` |
| `board.ts` | 座標、方向、牆的低階判定 |
| `territory.ts` | 連通區塊掃描計算領地與中立區、`reachableCount()` |
| `score.ts` | 計分與勝負判定 |
| `engine.ts` | 建局、合法手、操作、回合推進、WGF 往返 |
| `ai.ts` | 單人對手：局面評分、回合列舉、alpha-beta 搜尋 |

重點：
- 7×7 棋盤（`Player[][]`），`horizontalWalls[][]` 與 `verticalWalls[][]` 分開存
- `computeTerritories()` 對整盤做**單次**連通區塊掃描（非逐棋子 BFS），同時算出中立區
- `skipUnplayable()` 自動跳過已無法影響結果的玩家。跳過不寫入棋譜，完全由盤面推導，故各客戶端結果一致；`replay()` 結尾也必須套用它
- `replay(wgf, upToTurn?)` 從空棋盤重建，`upToTurn` 供悔棋與逐步回放使用
- 三人模式破牆機制：`breakWallCount`，每位玩家最多 1 次；確認 UI 使用 `app/hook/useConfirm.tsx`

**`app/components/PlayClient.tsx`** — 唯一的遊戲元件，只持有一個不可變的 `GameState`、處理 UI 與 Firebase 同步，不含規則邏輯。靠 `roomId?: string` prop 區分本機與連線模式，連線模式顯示 `initializing / waiting / playing / error` 四個 phase。

棋盤渲染：`app/components/Chessboard.tsx`（2D，目前使用中）。

### 連線對戰（Firebase）

**Firebase RTDB 路徑：`rooms/{roomId}/`**

```
id, playersNum, status, createdAt, currentPlayer, wgf, winners?
players/{ A?, B?, C? }/{ uid, displayName, joinedAt }
```

`status` 生命週期：`waiting` → `opening` → `playing` → `finished`

- `app/utils/firebase.ts` — Firebase **惰性**初始化。匯出 `getFirebaseAuth()` / `getFirebaseDb()` 兩個 async 函式，內部以動態 import 載入 SDK 並用 Promise 記憶化。首頁與 `/local` 不會下載 Firebase（約 75 KB gzip）
- `app/utils/gameService.ts` — `createRoom`, `joinRoom`, `getRoom`, `subscribeRoom`, `updateGameState`, `setRoomWinner`
- `app/types/room.ts` — `Room`, `RoomPlayer`, `RoomStatus` 型別
- `HomeClient.tsx` — 建立房間（`createRoom`，含初始 WGF）並跳轉 `/match#roomId=…`。展開「連線對戰」選單時即呼叫 `ensureUser()` 預熱登入
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

## 視覺

改版後的語彙是**平塗撞色**：奶油底、實色磁磚、實心剪影圖示、900 字重，
沒有陰影也沒有粗描邊。層次由撞色與留白承擔，不模擬光源。

- **彩度下限 0.125（OKLCH）**。低於這個數字的顏色在這套配色裡會看起來「濁」，
  和旁邊夠豔的色放在一起就是畫面凌亂的來源。新增顏色前先量。
  明度負責文字對比、彩度負責視覺份量，兩者不要互相代償 ——
  想讓某個色更跳是加彩度，不是提亮。
- **一個面板只放一個色相＋中性**。Modal 的標題色帶已經是那個色相，
  主要按鈕就不能再帶一個（改用深墨）。色帶對應首頁磁磚：
  規則森綠、連線靛藍、破牆磚紅、單人陶橘、結算用勝方的顏色。
- **玩家色受棋盤格底的對比限制**：棋子與牆疊在 `#faf7f0` 上需 ≥3:1（WCAG 圖形元件）。
  黃方因此比紅藍暗一階（`#c0821d`）—— 黃本質上亮，同明度只有 1.83:1。
- **圖示**用 game-icons.net 的實心剪影（`react-icons/gi` 已內建，CC BY 3.0）。
  線條圖示在大尺寸色塊上會顯得單薄。署名放在遊玩方式 Modal 裡。
- **棋盤**：外圍那圈 9px 是「牆」不是裝飾邊框（規則裡棋盤外緣本身就算一道牆）。
  牆的位移一律 `calc(var(--board-gap) * -0.5)` —— 對齊的是格線中心而不是格子邊，
  兩者差半個格縫，寫死會漂掉。
- **字型子集**由 `scripts/build-font-subset.mjs` 從原始碼推導（註解會先剝掉）。
  改文案後要跑 `npm run font:subset`，否則新字會**安靜地**掉到系統備援字體；
  CI 有 `font:check` 擋著。
- **Modal** 共用 `app/components/Modal.tsx`。關閉時務必保留 `inert` ——
  只用 `opacity-0` 不會把內容移出無障礙樹。

## 單人對戰

`app/game/ai.ts` 是純函式，跑在 `app/workers/ai.worker.ts` 裡（困難每手約 1.2 秒，
放主執行緒會凍住畫面）。難度存在 `GameContext.aiDifficulty`，
設定後除了 A 以外都交給 AI；連線模式沒有 AI。

AI 的一個回合是**單一 reducer 轉換**（`type: 'aiTurn'`）。分三次 dispatch 會讓
中間狀態存在於 React 裡，而驅動 AI 的 effect 依賴 state —— 它會在同一回合內
重複去問 Worker，最後那次的回覆可能在回合已交出去之後才套用。

疊代加深**只能採用完整跑完的那一層**。逾時就用殘缺的深搜結果，會比完整的
淺搜還弱（實測困難對普通 0 勝 8 敗）。`ai.test.ts` 有測試鎖住這個回歸。

## 主要慣例

- **遊戲規則**：一律寫在 `app/game/`（純函式、無 React、無副作用），元件只負責 UI 與同步。規則變更必須同時補 `tests/game/*.test.ts`。
- **狀態變更**：engine 的每個操作都回傳全新 state，禁止就地修改傳入的物件。（已移除 lodash-es，不再使用 `cloneDeep()`。）
- **型別定義**：統一放 `app/types/`；`app/utils/` 只放邏輯函式。
- **玩家顏色**：定義為 CSS 變數 `--player-A/B/C`，位於 `app/globals.css` 第 5–45 行；透過 Tailwind 自訂色彩 `player-A`、`player-B`、`player-C` 引用。
- **響應式斷點**：`portrait`、`landscape`、`md`、`lg`（見 `tailwind.config.ts`）。
- **數據分析**：使用者觸發的操作請以 `trackButtonClick()` 包裹，來源為 `app/utils/analytics.ts`。
- **Import 別名**：使用 `@/*` 代表 `app/*`（例如 `@/components/Button`）。
- **Context hooks**：在 Provider 外使用時必須拋出錯誤（參考 `GameContext.tsx` 中的模式）。

## 打版（`npm run release`）

**`main` 的形狀是刻意的**：`git log --first-parent main` 只會看到一排版本，每個版本就是一次 `--no-ff` merge，點開才是那個章節的 commit。歷史（`v25.6.1` 起）也全部重整成這個樣子，所以**不要再直接 commit 到 `main`** —— 那會在版本線裡插一顆裸 commit。

版號規則：**年份後兩碼.月份.該月第幾次** —— 2026 年 9 月第一次就是 `v26.9.1`。月份不補零（`26.09.1` 不是合法 semver，前導零會被拒），`26.9.1` 是合法的，所以 `package.json` 的 `version` 與 git tag 可以是同一個值（tag 多一個 `v`）。序號從既有的 git tag 掃出來，同月再打就 +1。

**一個用途一個 script，不要把行為埋在 flag 裡**（埋了沒人記得）：

| 指令 | 做什麼 |
|---|---|
| `npm run release:preview` | 先看會打成什麼版號、併哪條分支、包含幾個 commit |
| `npm run release -- "版本標題"` | 併進 `main`、打 tag、推出去（標題省略就用分支名） |
| `npm run release:local -- "標題"` | 同上但不推，自己決定何時 push |
| `npm run release:wrap -- "標題"` | 不小心直接 commit 到 `main` 時用：把那些 commit 收進一條分支再併回來 |

`scripts/release.mjs` 做的事：算版號 → `git merge --no-ff` 把分支併進 `main` → **版號寫進那個 merge commit 本身**（分支上不留 `chore(release)`）→ 開同名 annotated tag → `git push --follow-tags`。merge commit 的訊息是 `v26.9.1 <標題>`，內文列出這個章節的每一個 commit。

前置檢查：工作區必須乾淨（打版要能重現）、tag 不能重複、分支必須真的有 `main` 沒有的 commit；`preview` 刻意不擋髒工作區（就是要能在動手前先看一眼）。

推出去之後 `.github/workflows/deploy.yml` 會建置並 `aws s3 sync` 到 S3。

## 錯誤監控（Sentry）

- `instrumentation-client.ts` — 唯一會執行的 Sentry 設定。靜態匯出沒有 server / edge runtime，故 `sentry.server.config.ts`、`sentry.edge.config.ts`、`instrumentation.ts` 皆已移除
- SDK 以動態 import 延後到瀏覽器閒置後才載入；載入前由原生 error / unhandledrejection 監聽器暫存錯誤，就緒後補送
- **release ＝ `package.json` 的版號**（由 `npm run release` 維護）。`next.config.ts` 讀出來後透過 `env.NEXT_PUBLIC_SENTRY_RELEASE` **同時**餵給建置期（上傳 source map）與 runtime（事件帶上同一個值）—— 只有一個來源，就不會有「兩邊對不上」這種問題。CI 因此不需要也不應該再設 `SENTRY_RELEASE`（設了會覆蓋，僅供臨時除錯）
- **source map 的比對不靠 release 名稱**：上傳時每個檔案都帶 debug id，Sentry 用 debug id 配對，所以同一個版號部署好幾次也不會對錯堆疊。release 真正影響的是 **crash-free** —— Release Health 是「按 release 統計 session」，沒有 release 就算不出來
- `finalize: true` 補上 `dateReleased`（Releases 頁才不會一直顯示「(unreleased)」）；`setCommits: { auto: true, ignoreMissing: true, ignoreEmpty: true }` 關聯 git commit，Sentry 才指得出 suspect commits。**兩個 ignore 旗標是必要的** —— 第一次打版（找不到上一個 release 的 commit）與同一個 commit 重複 build（沒有新 commit）都會讓 setCommits 失敗，進而讓 build 失敗。CI 的 checkout 也必須 `fetch-depth: 0`，淺層 clone 沒有歷史可關聯
- **`SENTRY_ORG` 必須跟 auth token 綁定的組織一致**：`sntrys_` token 把組織寫死在自己裡面，CLI 會拿它覆蓋設定值，不一致就是 `error: Project not found`
- **上傳失敗會安靜地發生**：`silent: !process.env.CI` 把訊息吃掉，而且上傳失敗**不會讓 build 失敗**。要驗證就跑 `CI=1 npm run build`，看到 `Uploaded files to Sentry` 才算成功
- `deleteSourcemapsAfterUpload` 必開 —— `out/` 會整包 `aws s3 sync` 上去，`.map` 殘留就是把原始碼公開
- `ignoreErrors` 濾掉環境雜訊。本站特別需要 **動態 import 失敗**那組：Firebase 與 Sentry 自己（含 Replay）都是動態載入，行動網路不穩或瀏覽器快取到舊 chunk 清單時一定會冒，但那是環境問題不是程式錯誤。不濾掉的話 crash-free 率會被壓低到失去意義
- 已知限制：`tunnelRoute` 需要 server route，靜態匯出無法使用，故廣告阻擋器使用者的錯誤不會回報

## 部署

GitHub Actions（`.github/workflows/`）負責建置並將 `/out` 同步至 AWS S3。設定 `SITE_URL` 環境變數可覆蓋預設的 `https://quoridorgame.com` 以產生 sitemap。

## 其他規範

每次對話結尾都要說：Zach + 隨機稱讚語

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
