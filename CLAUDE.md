# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## 指令

```bash
npm run dev             # 啟動開發伺服器 (http://localhost:3000)，Next 16 預設使用 Turbopack
npm run build           # 產生靜態輸出至 /out（同時執行 next-sitemap postbuild）
npm run lint            # 執行 ESLint（Next 16 已移除 next lint，改用 ESLint CLI）
npm run typecheck       # tsc --noEmit
npm test                # 執行 Vitest（app/game 的規則與 AI 測試）
npm run font:subset     # 依原始碼實際用字重建字型子集
npm run font:check      # 只檢查子集有沒有落後（CI 用）
npm run og:build        # 重建每頁每語系的分享圖至 public/og/（要連網）
npm run og:check        # 只檢查文案有沒有落後（CI 用）
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

zh-TW 不加前綴（`app/(default)/`），en / ja / ko 加前綴（`app/(intl)/[locale]/`）。
兩邊的 page 都是薄殼，畫面實作在 `app/views/`。

| 路由 | 說明 |
|---|---|
| `/` | 首頁（`HomeView` → `HomeClient`）— 選模式、建立連線房間 |
| `/rules` | 規則頁，SEO 主力落地頁 |
| `/solo#easy\|normal\|hard` | 單人對戰。難度放 hash，由 `SoloClient` 以 prop 交給 `PlayClient` |
| `/local`、`/local/3` | 本機對戰，人數走路由（建置時就定了）。noindex |
| `/online#roomId=…` | 連線對戰（`OnlineClient` → `PlayClient`，帶 `roomId`）。roomId 放 hash 而非 query。noindex |
| `/online#new=2\|3` | 首頁連線磁磚的目的地：連線頁自己開房，開好後 `replaceState` 換成 `#roomId=…` |
| `/match#roomId=…` | 舊網址，只做 client 端轉址到 `/online`（保留 hash）。只有 zh-TW 有 |
| `/replay#wgf=…` | 棋譜回放。**開發者工具，不是給玩家的功能** —— 見下 |

**`/replay` 是用來看玩家回饋的。** 每則回饋都附帶那一局的 WGF（`feedback/*/wgf`），
在 Firebase Console 讀到回饋時，把棋譜貼到 `/replay#wgf=…` 就能一手一手重看玩家遇到的狀況。
首頁右上角的「聯絡我們」也寫進同一個 `feedback/`，但 `mode: 'contact'`、**沒有 WGF**（不在對局裡）；
它必填的是 `message`，評分選填。規則在 `database.rules.json` 依 `mode` 分流驗證，改表單欄位時兩邊要一起動。
刻意**沒有任何 UI 入口**、不進 sitemap、noindex —— 這個站不做「個人棋譜」。
不要替它補分享按鈕或入口；它沒被連到不是漏做，是設計。

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

手機（`coarse`）底部是 `WallDirectionPad` 控制盤：內圈箭頭移動、外圈長條蓋牆、四角是投降／破牆／重來／完成。
**中央那顆棋子可以按**：按一下選第一顆，再按依棋子編號換下一顆（engine 的 `nextSelectablePiece`），
整個回合不必點盤面；點盤面的方式照舊保留。規則同 `selectPiece`：走過就不能換（要換請按重來）、
被圍死的棋子跳過。開局擺子時中央不畫任何東西 —— 淡色棋子會被讀成「放這裡」的提示。

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
- 首頁右上角水平並排「聯絡我們」與語言切換（40px、離邊 10px）。標題上方有一塊直式才有、可收縮（flex-shrink）的留白：畫面夠高時把標題推到圓鈕下面，不夠高時自己縮掉，不會多出捲軸；640–680 高的舊手機再把標題縮到 6.5dvh。直排、拆到左上都試過，Zach 覺得不好看
- `HomeClient.tsx` — 連線磁磚**按下去立刻**跳轉 `/online#new=2|3`，不在首頁等建房（手機沒有滑過磁磚的預熱，先前會有 2 秒多畫面不動）。滑過或 focus 磁磚時仍呼叫 `ensureUser()` 預熱登入
- `app/(default)/online/OnlineClient.tsx` — 解析 hash（`parseOnlineHash`）：`#roomId=` 進房；`#new=` 就地開房（初始棋譜用 `toWgf(createGame(n))`），開好後 `replaceState` 換網址 —— 重新整理才不會再開一間；都不是就顯示「連結不完整」，不會退化成本機對戰

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
  規則森綠、連線靛藍、邀請朋友紫（Zach 指定）、破牆磚紅、單人陶橘、
  結算用勝方的顏色、投降用投降那一方的顏色。
- **按鈕只有兩種：主要深墨、次要中性灰**（`bg-tile-ink/[0.07]`）。不用琥珀、
  不用森綠當按鈕色 —— 黃配黑、黃配綠並排都很難看（Zach 明確說過）。
  一組並列的選項也不要各帶一個色相（單人難度、回饋表情原本是紅黃綠），
  差異用別的方式講：點數、表情、文字。首頁磁磚是模式的識別色，不在此限。
- **結算的勝方永遠排最上面**，就算是投降（投降的人地可能比較多，但他輸了）。
  勝方滿色放大；輸家淡灰底、淡灰字，只留一顆淡掉的色點。
- **玩家色：紅、藍、綠**（`--player-A/B/C`）。受兩個對比限制：棋子與牆疊在
  `#faf7f0` 上需 ≥3:1（WCAG 圖形元件），三塊比分上的米白字需 ≥4.5:1。
  第三方原本是黃（`#a06400`），被 Zach 嫌「屎黃」而換掉：黃本質上亮，要過米白字
  4.5 就得壓成土黃，彩度還過不了 0.125；在紅／綠色盲眼裡也跟紅方幾乎同色。
  現在是綠 `#0e8142`（L 0.53、彩度 0.135、米白字 4.63:1），理由與數據見 globals.css。
  **紅綠在紅／綠色盲下仍然會混**：網站偵測不到色盲（沒有對應的 media feature），
  解法是之後讓每方的棋子用不同圖示，而不是再換顏色。四方對戰也要靠圖示。
  首頁「遊戲規則」磁磚的森綠 `#006944` 跟玩家綠不同色，是刻意的（2026-09 看過
  B：玩家改用森綠、C：磁磚改用玩家綠，Zach 選維持兩種綠）。
  已知例外：森綠磁磚彩度 0.103，低於 0.125 下限。
- **圖示**用 game-icons.net 的實心剪影（`react-icons/gi` 已內建，CC BY 3.0）。
  線條圖示在大尺寸色塊上會顯得單薄。署名放在遊玩方式 Modal 裡。
- **棋盤**：外圍那圈 9px 是「牆」不是裝飾邊框（規則裡棋盤外緣本身就算一道牆）。
  牆的位移一律 `calc(var(--board-gap) * -0.5)` —— 對齊的是格線中心而不是格子邊，
  兩者差半個格縫，寫死會漂掉。
- **字型子集**由 `scripts/build-font-subset.mjs` 從原始碼推導（註解會先剝掉）。
  改文案後要跑 `npm run font:subset`，否則新字會**安靜地**掉到系統備援字體；
  CI 有 `font:check` 擋著。
- **iOS 26 Safari 的工具列顏色**取自「貼著畫面上下緣的 fixed 元素」（不看 theme-color、不管祖先的 opacity），而且反應慢半秒。
  所以關著的 Modal 遮罩要 `display:none`；換頁轉場（`WipeOverlay`）的根節點用 `absolute` 定位在目前的捲動位置而不是 `fixed` ——
  fixed 的話工具列會慢一拍染成磁磚色，畫面都換好了才變回來。上下各內縮 1px 沒有用，實測過。
- **換語言是整頁跳轉**，瀏覽器的 back-forward cache 會把離開時的畫面凍結起來；會在整頁跳轉前打開的東西（語言選單）要在點下去時關掉，並在 `pageshow`（persisted）時再關一次。
- **Modal** 共用 `app/components/Modal.tsx`。關閉時務必保留 `inert` ——
  只用 `opacity-0` 不會把內容移出無障礙樹。
- **分享圖**（og:image）**每頁每語系各一張**，共 24 張，由
  `scripts/build-og-images.mjs` 產生到 `public/og/{page}-{locale}.png`，
  版面在 `scripts/og-design.mjs`。圖上只有節目名與標題、**不放描述句**（Zach 拔掉的）。
  改了標題相關文案（`metaTitle`、`titleLine1/2`、`showName`）要跑 `npm run og:build`，
  CI 有 `og:check` 擋著。
  **不要改用 Next 的 `opengraph-image.tsx`** —— 那個慣例產出的檔案沒有副檔名
  （`out/rules/opengraph-image-1mfdno`），`aws s3 sync` 推不出 Content-Type，
  抓取器拿到 `binary/octet-stream` 就不顯示圖。實測確認過。
  字型必須是 TTF/OTF/WOFF，satori 不吃 woff2；Google Fonts 只有在
  **不送 User-Agent** 時才回 TrueType。
  盤面上不放任何灰點 —— 那不代表任何規則，只會讓人以為那些格子有什麼特別。

## 單人對戰

`app/game/ai.ts` 是純函式，跑在 `app/workers/ai.worker.ts` 裡（困難每手約 1.2 秒，
放主執行緒會凍住畫面）。難度存在 `GameContext.aiDifficulty`，但**只由 `/solo` 以 prop
交給 `PlayClient`** —— 直接讀 context 的話，玩過單人後的殘留難度會讓 `/local` 變成 AI 局。
設定後除了 A 以外都交給 AI；連線模式沒有 AI。

重整 `/solo#easy` 不能先閃出難度選單：靜態 HTML 裡本來就有選單，layout effect 擋不住
（那時 JS 都還沒下載）。`SoloClient` 在選單裡放一段內嵌 script，解析到就讀 hash、
往 `<head>` 塞一段把 `.solo-picker` 設成隱形的樣式；hydrate 後由 layout effect 移除。
難度鈕是 `components/DifficultyButtons.tsx`，首頁的難度 Modal 與 `/solo` 共用。

AI 的一個回合是**單一 reducer 轉換**（`type: 'aiTurn'`）。分三次 dispatch 會讓
中間狀態存在於 React 裡，而驅動 AI 的 effect 依賴 state —— 它會在同一回合內
重複去問 Worker，最後那次的回覆可能在回合已交出去之後才套用。

疊代加深**只能採用完整跑完的那一層**。逾時就用殘缺的深搜結果，會比完整的
淺搜還弱（實測困難對普通 0 勝 8 敗）。原本鎖住這個回歸的對戰測試（`RUN_AI_BENCH`）
已在 `e802f28` 移除，目前 `ai.test.ts` 只有「對隨機走子 10 局全勝」與每手時間上限。

## 主要慣例

- **遊戲規則**：一律寫在 `app/game/`（純函式、無 React、無副作用），元件只負責 UI 與同步。規則變更必須同時補 `tests/game/*.test.ts`。
- **狀態變更**：engine 的每個操作都回傳全新 state，禁止就地修改傳入的物件。（已移除 lodash-es，不再使用 `cloneDeep()`。）
- **型別定義**：統一放 `app/types/`；`app/utils/` 只放邏輯函式。
- **玩家顏色**：定義為 CSS 變數 `--player-A/B/C`，位於 `app/globals.css` 第 5–45 行；透過 Tailwind 自訂色彩 `player-A`、`player-B`、`player-C` 引用。
- **響應式斷點**：`portrait`、`landscape`、`coarse`／`fine`（手指／滑鼠）、`short`（矮的橫向畫面，手機橫放）、`md`、`lg`（見 `tailwind.config.ts`）。觸控裝置沒有真的 hover，點過的元素會一直停在 `:hover` —— 只該給滑鼠看的 hover 效果用 `fine:group-hover:`。
- **數據分析**：一律用 `app/utils/analytics.ts` 的 `track(事件, 參數)`，事件與參數由那裡的型別表鎖住。詳見〈數據分析〉。
- **Import 別名**：使用 `@/*` 代表 `app/*`（例如 `@/components/Button`）。
- **Context hooks**：在 Provider 外使用時必須拋出錯誤（參考 `GameContext.tsx` 中的模式）。

## 數據分析（GA4）

GA 由 `app/shell.tsx` 的 `<GoogleAnalytics>` 載入（只有 `NEXT_PUBLIC_APP_ENV=production` 才載），
事件由 `track()` 送。**一件事一個事件名稱，差異放參數** —— 不要再把變數塞進事件名稱
（舊的 `start_local_game_2p` 那種），GA 的事件名稱有 500 種上限，而且報表無法加總。

| 事件 | 什麼時候 | 參數 |
|---|---|---|
| `mode_select` | 首頁磁磚或 `/solo` 頁選了模式（想玩） | mode、players、difficulty、source |
| `room_created` | 連線房開好 | players |
| `game_start` | 本機／單人擺下第一顆棋；連線人到齊開始擺棋 | mode、players、difficulty |
| `game_end` | 分出勝負 | mode、players、difficulty、result、winner、ended、turns、duration_sec |
| `game_restart` | 結算按再來一局 | mode、players、difficulty |
| `online_error` | 連線失敗 | reason |
| `share_room_link` | 分享房間連結 | method |
| `tutorial_close` | 關掉遊玩方式 | step、steps、finished |
| `locale_switch` | 切語系 | from、to |
| `contact_open` / `feedback_send` | 聯絡我們、送出回饋 | source、rating |

- `game_start` / `game_end` 看**狀態轉變**而不是按鈕；第一次觀察到的狀態不送（重整後從棋譜重建的「已開始／已結束」不是這次發生的），連線另用 sessionStorage 去重。連線局每位玩家各送一次，所以是「人次」不是「局數」。投降不另外送，會以 `game_end` 的 `ended: 'resign'` 出現。
- **`page_view` 交給 GA 自己算**（首次載入由 config、站內換頁由加強型評估的「依瀏覽器記錄事件」）。不要再手動送 —— 以前的 `AnalyticsProvider` 就是這樣讓每次瀏覽都算兩次。
- 參數要在 GA 後台「管理 → 自訂定義」註冊才看得到：維度 `mode`、`players`、`difficulty`、`source`、`result`、`winner`、`ended`、`reason`、`method`、`from`、`to`、`finished`；指標 `turns`、`duration_sec`、`step`、`rating`。

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
