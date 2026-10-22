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

zh-TW 不加前綴（`app/(default)/`），en / ja / ko / zh-Hans / th 加前綴（`app/(intl)/[locale]/`）。
簡中的代號是 `zh-Hans` 不是 `zh-CN`（主要讀者在新馬，不該標成中國）；hreflang 用文字系統 `zh-Hant`／`zh-Hans`，不用地區。
新增語系：`locales.ts` 加一行，`messages/` 一份，`content/` 三份檔各一個區塊，術語先寫進 `glossary.md`，再跑 `font:subset` 與 `og:build`。
兩邊的 page 都是薄殼，畫面實作在 `app/views/`。

**2026-10 平台化**：`/` 是《魔鬼的計謀》遊戲平台的首頁，Wall Go 全部搬進 `/wall-go/`（一款遊戲一個資料夾）。
路徑集中在 `app/i18n/routes.ts`（`wallGo('/rules')`），**不要在元件裡寫死路徑字串**。平台名是 `app/brand.ts` 的 `BRAND`，**還沒定案，佔位字不能上線**。

| 路由 | 說明 |
|---|---|
| `/` | 平台首頁（`PlatformView`）— Netflix 式深色外殼＋紅（`--brand-red`），推薦作品大區塊＋依季橫向捲動的遊戲卡；遊戲清單在 `app/games/catalog.ts`（英文官方名，譯名查證後才補） |
| `/wall-go` | Wall Go 首頁（`HomeView` → `HomeClient`）— 選模式、建立連線房間 |
| `/wall-go/rules` | 規則頁，SEO 主力落地頁 |
| `/wall-go/solo#easy\|normal\|hard` | 單人對戰。難度放 hash，由 `SoloClient` 以 prop 交給 `PlayClient` |
| `/wall-go/local`、`/wall-go/local/3` | 本機對戰，人數走路由（建置時就定了）。noindex |
| `/wall-go/online#roomId=…` | 連線對戰（`OnlineClient` → `PlayClient`，帶 `roomId`）。roomId 放 hash 而非 query。noindex |
| `/wall-go/online#new=2\|3` | Wall Go 首頁連線磁磚的目的地：連線頁自己開房，開好後 `replaceState` 換成 `#roomId=…` |
| `/wall-go/replay#wgf=…` | 棋譜回放。**開發者工具，不是給玩家的功能** —— 見下 |
| `/bagh-chal` | Bagh Chal 首頁（`BaghChalView` → `BaghHub`）。2026-10-20 起是自己的識別（試做中），**不沿用 Wall Go 的元件與視覺**：每一頁的背景是米提拉圖騰滿版鋪（`BaghFrame`＋`globals.css` 的 `.bagh-bg`：一塊用 image quilting 縫成上下左右無縫的圖塊 `pattern.avif／webp`，手機 520px、桌機 720px 重複鋪；先前四條飾帶拼的畫框接縫太明顯、一整幅 cover 虎羊太大），紙色面板浮在上面，面板頂列放平台 logo 與聯絡／語言（`BaghHeader`，不疊在背景上）；首頁是天城體字標＋四個按鈕（老虎、羊、本機對戰、連線對戰）；彈窗用 `Modal` 的 `skin="bagh"`（上方一條飾帶、標題在紙色上，不要色帶）、按鈕是淡沙色實心沒有外框線、按鈕樣式在 `bagh-chal/styles.ts`（不能放進 `'use client'` 檔：伺服器元件匯入會變成 client reference，className 會變成一段錯誤文字）、難度在 `BaghUi`；棋子與圖示是 AI 畫的米提拉圓牌（`bagh-chal/tokens.tsx`，用背景圖畫，不用 `<img>`＋filter —— iPhone 會漏畫）。木窗門轉場（`WipeOverlay` 的 `DOORS`）只留在從平台卡片進來的那一下；虎羊棋裡面換頁（首頁、規則、對局之間）不播轉場、直接換頁（2026-10-22 Zach）。配色在 `bagh-chal/palette.ts`。程式在 `app/games/bagh-chal/`（規則與電腦對手）、`app/components/bagh-chal/`（畫面） |
| `/bagh-chal/rules` | 規則頁，每步一張小棋盤（`BaghRulesSteps`，對局中的說明彈窗共用） |
| `/bagh-chal/solo#tiger-normal`、`/bagh-chal/local` | 跟電腦下（hash 是邊＋難度，沒帶就在頁面上選）、兩人同一台。noindex |
| `/bagh-chal/online#new=tiger\|goat`、`#roomId=…` | 邀請朋友。房間在 RTDB `baghRooms/`（跟 Wall Go 的 `rooms/` 分開，結構見 `types/baghRoom.ts`），存走法字串（`encodeMoves`），只有輪到的人能寫。noindex |
| `/time-auction`、`/nine-mens-morris`、`/blind-gomoku`、`/balance-mancala`、`/knights-tour` | 第二批五款**試做**（2026-10-20）：每款一頁、選模式與對局都在那一頁（騎士巡邏的模式放 hash：`#show`、`#practice-N`）。規則在 `app/games/<id>/`、畫面在 `app/components/<id>/`、六語系文案在各自的 `app/games/<id>/text.ts`（不進 `messages/`，key 的縮排與順序見 `i18n/gameText.ts`）。metadata 用 `trialGameMetadata`：noindex、不進 sitemap、分享圖暫用平台首頁那張。沒有連線、沒有 GA 事件。**平台上一款一款開**（2026-10-22 Zach）：`feat/platform-bagh` 只上平台＋虎羊棋＋Wall Go，五款的卡片照「還沒做」的樣子；每款的視覺在自己的 `feat/game-<id>` 分支，那條分支把 `catalog.ts` 裡自己那一行換回 playable＋look |
| 舊網址 `/rules`、`/solo`、`/local`、`/online`、`/replay`、`/match`（各語系） | CloudFront 301 到 `/wall-go/…`（`infra/cloudfront-redirects.js`，表要跟 `routes.ts` 的 `MOVED` 一致，`tests/infra/redirects.test.ts` 會比對）；舊路徑上另有瀏覽器端轉址當備援（`components/LegacyRedirect.tsx`），noindex、不進 sitemap |

**`/replay` 是用來看玩家回饋的。** 每則回饋都附帶那一局的 WGF（`feedback/*/wgf`），
在 Firebase Console 讀到回饋時，把棋譜貼到 `/wall-go/replay#wgf=…` 就能一手一手重看玩家遇到的狀況。
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
被圍死的棋子跳過。中央那顆一律是**這台裝置上的人自己的顏色**（連線是自己的座位、跟 AI 下是 A；本機對戰才是輪到的人），還沒輪到自己就淡下去 —— 先前畫輪到的人，藍方在等紅方時控制盤中央是紅色（2026-10-22 Zach 回報）。
**手機開局擺子**：盤面中央先放一顆虛的自己色棋子（半透明＋虛線框），控制盤方向鍵一次跳到那個方向的下一個空格、✓ 放下去；直接點格子照舊會放（2026-10-22 Zach 要的；規則在 `components/boardCursor.ts`）。
連線與跟 AI 下時，**比分上自己那塊多一圈自己顏色的框**（中間留一道縫）、等人畫面自己的座位也一樣，電腦版輪到自己時提示寫「輪到你了」、開場那一下寫「你是藍方」。不在畫面上寫「你」—— 試過，太直白，這是 Zach 10/22 從六種做法裡挑的（另有「只在開場講一次」、短底線、棋子白點、左上角頭像）。左上角首頁是 Lucide 的線條房子 `LuHouse`（同一天從 18 個候選挑的；之前是茅屋 `GiHut`），首頁與遊玩方式在電腦版 hover 會浮出名稱（`IconButton` 的 `HOVER_TIP`）。

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
- `HomeClient.tsx` — 連線磁磚**按下去立刻**跳轉 `/wall-go/online#new=2|3`，不在首頁等建房（手機沒有滑過磁磚的預熱，先前會有 2 秒多畫面不動）。滑過或 focus 磁磚時仍呼叫 `ensureUser()` 預熱登入
- `app/(default)/wall-go/online/OnlineClient.tsx` — 解析 hash（`parseOnlineHash`）：`#roomId=` 進房；`#new=` 就地開房（初始棋譜用 `toWgf(createGame(n))`），開好後 `replaceState` 換網址 —— 重新整理才不會再開一間；都不是就顯示「連結不完整」，不會退化成本機對戰

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
- **貼紙風（粗黑框＋硬影子）試過、不用**：2026-10-20 先放在 Wall Go 首頁磁磚、再試在對局頁的按鈕與牆（磚牆），
  Zach 都要復原（「Wall Go 決定不改」）。不要再加回來。
- **這套視覺只管 Wall Go 與平台**：虎羊棋是印刷棋盤＋米提拉的自己一套（見路由表）。平台標誌是長角的藍骰子（`public/brand/die-mark.svg`，試套）。
- **第二批五款各有自己的世界**（2026-10-21）：找法跟虎羊棋一樣 —— 先找原件（公有領域／CC0 的館藏），
  **顏色從原件取樣、不要自己調**（各自的 `palette.ts`／`theme.ts` 寫了出處與對比），**裝飾只有最外緣一圈**
  （`.<縮寫>-frame`，border-image，彈窗裡不放花紋），按鈕照全站（主要深墨、次要淡墨、沒有框線），彈窗用 `panelClassName` 換成那款的紙色。
  主視覺與平台卡片都是原件本身。每款在自己的 `feat/game-<id>` 分支（一款一款上線）；下面每款一段，**段與段之間留空行**，
  各分支改的是自己那一段，依序合併才不會衝突（globals.css 底部的五個標記、catalog.ts 的寫法也是同一個道理）。

  - 九子棋（`feat/game-nine-mens-morris`）：原件是《遊戲之書》（1283）的插圖；最外緣朱紅框、四角小方塊裡一朵四瓣小花（`.nmm-frame`；原本畫叉，右上角像關閉鈕，換掉了），群青底撒白點（`.nmm-field`）；主視覺是插圖 `libro.webp`、Grenze Gotisch 字標。

  - 盲眼五子棋：試做中，視覺在 `feat/game-blind-gomoku`。

  - 騎士巡邏：試做中，視覺在 `feat/game-knights-tour`。

  - 時間拍賣：試做中，視覺在 `feat/game-time-auction`。

  - 均衡曼卡拉：試做中，視覺在 `feat/game-balance-mancala`。

- **棋盤**：外圍那圈 9px 是「牆」不是裝飾邊框（規則裡棋盤外緣本身就算一道牆）。
  牆的位移一律 `calc(var(--board-gap) * -0.5)` —— 對齊的是格線中心而不是格子邊，
  兩者差半個格縫，寫死會漂掉。
- **字型子集**由 `scripts/build-font-subset.mjs` 從原始碼推導（註解會先剝掉），**在本機用 harfbuzz（subset-font）切**：
  繁中（zh-TW、en）、簡中、泰文各一份，依語系區塊分開收字；日文、韓文刻意用系統字型（用繁中字型顯示日文漢字字形不對）。
  CSS 依 `<html lang>` 換 `--font-app`（`:root:lang(...)`），沒用到的 @font-face 不會下載。
  **不要改回 Google Fonts 的 `text=` 子集**：字一多網址過長，Google 會默默忽略 text= 回傳整套切片，
  先前腳本只抓到第一片（emoji），線上的中文字一直是系統字型而沒人發現（2026-09）。
  改文案後要跑 `npm run font:subset`（會下載原始字型到 `node_modules/.cache`），否則新字會**安靜地**掉到系統備援字體；
  CI 有 `font:check` 擋著。
- **蓋滿畫面的東西不要剛好等於畫面高度**。手機工具列會隨捲動展開／收起，`inset:0`、`100lvh`、`100dvh` 各在某個瀏覽器／狀態下露底（Safari 與 iPhone 上的 Chrome 各被咬過）。
  Modal 遮罩（`.cover-viewport`）上下各往外多蓋 `max(25vh, 12rem)`，fixed 超出畫面會被裁掉、不產生捲軸；手機控制盤用 `::after` 往下延伸同色底；
  換頁轉場是 absolute（多蓋會撐長頁面），改由 JS 量 `innerHeight`／`visualViewport` 設高度。模擬器裡沒辦法用手指把工具列收起來，這類問題以「不依賴任何單位」的寫法處理，不要再換單位。
- **iOS 26 Safari 的工具列顏色**取自「貼著畫面上下緣的 fixed 元素」（不看 theme-color、不管祖先的 opacity），而且反應慢半秒。
  所以關著的 Modal 遮罩要 `display:none`；換頁轉場（`WipeOverlay`）的根節點用 `absolute` 定位在目前的捲動位置而不是 `fixed` ——
  fixed 的話工具列會慢一拍染成磁磚色，畫面都換好了才變回來。上下各內縮 1px 沒有用，實測過。
- **各款的進場**（從平台卡片點進去的那一下）：Wall Go 是磁磚脹開、虎羊棋是木窗門（`WipeOverlay` 的 doors）；其他有自己識別的遊戲各自一個（2026-10-22 Zach：「為啥每一個進場都跟 Wall Go 一樣」）。做法：在那款的資料夾放 `Entrance.tsx`（`Scene`＋`play`），在 `components/entrances.ts` 的表打開自己那一行，catalog 的 `look.entrance` 帶同一個 id。平台卡片閒置時先載好，沒載好就退回擴散色塊。進場一樣只動 transform／opacity。
- **換頁轉場用瀏覽器原生的 Web Animations API**（`element.animate()`），不用 JS 每格寫 style。transform 由合成執行緒（GPU）跑，換頁時 React 佔住主執行緒也不會凍住動畫 —— 先前用 anime.js，主執行緒卡住的 400ms 內畫面 0 格，手機上一直卡。圖示的反向縮放（色塊 s、圖示 1/s）事先取樣成關鍵影格（`components/wipeKeyframes.ts`，自適應取樣、誤差 <1% 由測試鎖住）。**不要再加回每格由 JS 驅動的動畫。**
- **站內換頁的歷史紀錄要在點擊當下建立**（`TransitionContext.navigate` 先 `pushState` 複製目前紀錄，動畫播完才 `router.replace`）。WebKit（Safari 與 iPhone 上的 Chrome）會把「沒有使用者手勢時 JS 新增過紀錄」的那一頁在返回時跳過；動畫播完才 push 就沒有手勢了，從規則頁按返回會越過首頁。沒有手勢的 `replaceState` 不受影響（實測）。**驗證這類問題要用瀏覽器真正的返回（WebDriver `/back`），`history.back()` 不會跳過，測不出來。**
- **換語言是整頁跳轉**，瀏覽器的 back-forward cache 會把離開時的畫面凍結起來；會在整頁跳轉前打開的東西（語言選單）要在點下去時關掉，並在 `pageshow`（persisted）時再關一次。
- **Modal** 共用 `app/components/Modal.tsx`，掛載後一律用 portal 渲染到 `<body>`，層級固定 `z-[55]`（頁面元件最高 z-50、換頁轉場 z-[60]；不能與頁面同層級，站內換頁後新頁面會排到 portal 後面蓋過 Modal）：祖先只要有 `backdrop-filter`／`filter`／`transform`，裡面的 `fixed` 就會改成相對那個祖先（規則頁毛玻璃頂部列裡的語言選單就這樣被壓成一條）。關閉時務必保留 `inert` ——
  只用 `opacity-0` 不會把內容移出無障礙樹。
- **分享圖**（og:image）**每頁每語系各一張**，共 36 張，由
  `scripts/build-og-images.mjs` 產生到 `public/og/{page}-{locale}.png`，
  版面在 `scripts/og-design.mjs`。圖上只有節目名與標題、**不放描述句**（Zach 拔掉的）。
  改了標題相關文案（`metaTitle`、`titleLine1/2`、`showName`）要跑 `npm run og:build`，
  CI 有 `og:check` 擋著。
  **不要改用 Next 的 `opengraph-image.tsx`** —— 那個慣例產出的檔案沒有副檔名
  （`out/rules/opengraph-image-1mfdno`），`aws s3 sync` 推不出 Content-Type，
  抓取器拿到 `binary/octet-stream` 就不顯示圖。實測確認過。
  字型必須是 TTF/OTF/WOFF，satori 不吃 woff2；Google Fonts 只有在
  **不送 User-Agent** 時才回 TrueType。
  **泰文標題由無頭 Chrome 畫**（`scripts/lib/chrome-text.mjs`）再以圖片放進 satori：satori 不做複雜排版，
  「上標母音＋聲調」疊在一起時聲調會被蓋掉（เครื่อง 的 รื่）。截圖時上下要多留空間，否則疊高的聲調被裁掉。
  所以 `og:build` 需要本機有 Chrome（可用 `CHROME_PATH` 指定）與先跑過 `font:subset`。
  盤面上不放任何灰點 —— 那不代表任何規則，只會讓人以為那些格子有什麼特別。

### 離開前確認與重整接回

- **瀏覽器自己的「確定要離開嗎？」（`beforeunload`）只在電腦版有用**：它只管整頁跳轉，站內換頁不觸發；iPhone 的 Safari 與 Chrome 完全不顯示。保留它給電腦版，但不能只靠它。
- **房子鈕**：對局還沒結束就先開 `LeaveConfirmModal`。
- **瀏覽器返回鍵**：對局頁第一次點擊時，在歷史紀錄最上面放一筆同網址的「守門」（`__wallgoGuard`）。按返回只是從守門退回真正那筆、頁面不換，`popstate` 裡攔下來問；離開就再退一步，不離開就把守門放回去。沒東西會丟（還沒下、已下完、連線還在等人）就自動替使用者再退一步。守門**必須在點擊當下 push**（WebKit 規則，見上方〈站內換頁〉那條），所以不等「有進度」才放。確認視窗開著時的點擊不放守門；重整後若停在守門上要先認出來。從房子鈕離開時用 `navigate(..., { replace: true })` 取代守門。
- **重整接回**（本機、單人）：每一步把 WGF 寫進 sessionStorage（`utils/savedGame.ts`，只活在這個分頁），掛載時 `replay` 回來；分出勝負、重新開始、確認離開就清掉。從首頁磁磚或 `/solo` 選難度進來是新的一局（會清）。進行到一半的那一手不會保留。連線局本來就從 Firebase 接回。接回的那一下不送 GA 的 `game_start`。

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
| `online_error` | 連線失敗 | reason、fail_step |
| `share_room_link` | 分享房間連結 | method |
| `tutorial_close` | 關掉遊玩方式 | step、steps、finished |
| `locale_switch` | 切語系 | from、to |
| `contact_open` / `feedback_send` | 聯絡我們、送出回饋 | source、rating |

- `game_start` / `game_end` 看**狀態轉變**而不是按鈕；第一次觀察到的狀態不送（重整後從棋譜重建的「已開始／已結束」不是這次發生的），連線另用 sessionStorage 去重。連線局每位玩家各送一次，所以是「人次」不是「局數」。投降不另外送，會以 `game_end` 的 `ended: 'resign'` 出現。
- **`page_view` 交給 GA 自己算**（首次載入由 config、站內換頁由加強型評估的「依瀏覽器記錄事件」）。不要再手動送 —— 以前的 `AnalyticsProvider` 就是這樣讓每次瀏覽都算兩次。
- 參數要在 GA 後台「管理 → 自訂定義」註冊才看得到：維度 `mode`、`players`、`difficulty`、`source`、`result`、`winner`、`ended`、`reason`、`fail_step`、`method`、`from`、`to`、`finished`；指標 `turns`、`duration_sec`、`step`、`rating`。
- **參數名稱在維度與指標之間不能重複**：`step` 已經是 `tutorial_close` 的指標，所以連線失敗的步驟叫 `fail_step`。新增參數前先看這份清單。

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
- **release ＝ `quoridor@` ＋ `package.json` 的版號**（例如 `quoridor@v26.9.13`；版號由 `npm run release` 維護）。**前綴不能拿掉**：Sentry 的 release 是整個組織共用的，同組織的 corn-stock 也用 `vYY.M.N`，沒前綴時 v26.9.5～v26.9.13 兩邊撞成同一個 release、commit 互相覆蓋。規則頁顯示的版號另走 `NEXT_PUBLIC_APP_VERSION`（`v26.9.13`）。dev 分支的部署不用版號、改用 commit SHA（`quoridor@961c2de3`），還沒打版的程式不該算進正式版號。
- **部署紀錄**（`release.deploy`）：CI 建置時記一筆，環境名跟事件的 `NEXT_PUBLIC_SENTRY_ENVIRONMENT` 同一個字（main → `production`、dev → `development`），Releases 頁的卡片才會寫「| production」。本機 build 不記
- release 由 `next.config.ts` 讀出來後透過 `env.NEXT_PUBLIC_SENTRY_RELEASE` **同時**餵給建置期（上傳 source map）與 runtime（事件帶上同一個值）—— 只有一個來源，就不會有「兩邊對不上」這種問題。CI 因此不需要也不應該再設 `SENTRY_RELEASE`（設了會覆蓋，僅供臨時除錯）
- **source map 的比對不靠 release 名稱**：上傳時每個檔案都帶 debug id，Sentry 用 debug id 配對，所以同一個版號部署好幾次也不會對錯堆疊。release 真正影響的是 **crash-free** —— Release Health 是「按 release 統計 session」，沒有 release 就算不出來
- `finalize: true` 補上 `dateReleased`（Releases 頁才不會一直顯示「(unreleased)」）；`setCommits: { auto: true, ignoreMissing: true, ignoreEmpty: true }` 關聯 git commit，Sentry 才指得出 suspect commits。**兩個 ignore 旗標是必要的** —— 第一次打版（找不到上一個 release 的 commit）與同一個 commit 重複 build（沒有新 commit）都會讓 setCommits 失敗，進而讓 build 失敗。CI 的 checkout 也必須 `fetch-depth: 0`，淺層 clone 沒有歷史可關聯
- **`SENTRY_ORG` 必須跟 auth token 綁定的組織一致**：`sntrys_` token 把組織寫死在自己裡面，CLI 會拿它覆蓋設定值，不一致就是 `error: Project not found`
- **上傳失敗會安靜地發生**：`silent: !process.env.CI` 把訊息吃掉，而且上傳失敗**不會讓 build 失敗**。要驗證就跑 `CI=1 npm run build`，看到 `Uploaded files to Sentry` 才算成功
- `deleteSourcemapsAfterUpload` 必開 —— `out/` 會整包 `aws s3 sync` 上去，`.map` 殘留就是把原始碼公開
- `ignoreErrors` 濾掉環境雜訊。本站特別需要 **動態 import 失敗**那組：Firebase 與 Sentry 自己（含 Replay）都是動態載入，行動網路不穩或瀏覽器快取到舊 chunk 清單時一定會冒，但那是環境問題不是程式錯誤。不濾掉的話 crash-free 率會被壓低到失去意義
- **連線失敗會送 Sentry**（`utils/onlineError.ts`）：每個碰 Firebase 的 await 都包 `atStep(step, …)`，失敗時 tag 帶 `reason`（connectFail／createFail）、`step`（auth／getRoom／join／create）、`timeout`（`withTimeout` 丟 `TimeoutError`）；按這三個分組。網址 hash 裡的房號送出前會剝掉，不帶 uid。noRoom、roomFull 是正常流程，不送。起因是 2026-10-03 一天 17 次 connectFail 卻查不到原因（`docs/online-error-reporting.md`）
- 已知限制：`tunnelRoute` 需要 server route，靜態匯出無法使用，故廣告阻擋器使用者的錯誤不會回報

## 部署

GitHub Actions（`.github/workflows/`）負責建置並將 `/out` 同步至 AWS S3。
`aws s3 sync` 依副檔名猜 Content-Type：虎羊棋的背景是 `.avif`、各遊戲圖是 `.webp`，**第一次上線後要用 `curl -I` 確認 S3 回的是 `image/avif`／`image/webp`**（猜錯成 `binary/octet-stream` 時，帶 `nosniff` 的情況下瀏覽器不會畫；本機預覽的 `serve` 也不認得 `.avif`，要用 `--config` 加標頭）。設定 `SITE_URL` 環境變數可覆蓋預設的 `https://quoridorgame.com` 以產生 sitemap。

## 數據中心

數據追蹤、方向與驗收由 `~/Desktop/projects/sites-data` 的對話（目前叫「大腦」）負責。分工與回報方式：

@~/Desktop/projects/sites-data/protocol.md

## 其他規範

每次對話結尾都要說：Zach + 隨機稱讚語

<!-- BEGIN:nextjs-agent-rules -->

# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
