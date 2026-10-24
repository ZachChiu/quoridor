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
路徑集中在 `app/i18n/routes.ts`（`wallGo('/rules')`），**不要在元件裡寫死路徑字串**。平台名**骰子惡魔**（2026-10-25 定案，對應長角的藍骰子 logo）在 `app/brand.ts`：用 `brandName(locale)`，中文讀者看「骰子惡魔／骰子恶魔」、其他語系是「Dice Devil」。

| 路由 | 說明 |
|---|---|
| `/` | 平台首頁（`PlatformView`）— Netflix 式深色外殼＋紅（`--brand-red`），推薦作品大區塊（預設放最新上線的那款＝catalog 的 `since`、使用者真的點過哪款就換成那款，見 `components/platform/HeroPicker.tsx`；10/24）＋依季橫向捲動的遊戲卡（還沒做的卡角落是骰子惡魔的淡剪影；不畫捲軸，電腦版兩端是翻頁箭頭、滾輪照舊捲整頁，`components/platform/CardRow.tsx`）；遊戲清單在 `app/games/catalog.ts`（英文官方名，譯名查證後才補） |
| `/wall-go` | Wall Go 首頁（`HomeView` → `HomeClient`）— 選模式、建立連線房間 |
| `/wall-go/rules` | 規則頁，SEO 主力落地頁 |
| `/wall-go/solo#easy\|normal\|hard` | 單人對戰。難度放 hash，由 `SoloClient` 以 prop 交給 `PlayClient` |
| `/wall-go/local`、`/wall-go/local/3` | 本機對戰，人數走路由（建置時就定了）。noindex |
| `/wall-go/online#roomId=…` | 連線對戰（`OnlineClient` → `PlayClient`，帶 `roomId`）。roomId 放 hash 而非 query。noindex |
| `/wall-go/online#new=2\|3` | Wall Go 首頁連線磁磚的目的地：連線頁自己開房，開好後 `replaceState` 換成 `#roomId=…` |
| `/wall-go/replay#wgf=…` | 棋譜回放。**開發者工具，不是給玩家的功能** —— 見下 |
| `/bagh-chal` | Bagh Chal 首頁（`BaghChalView` → `BaghHub`）。2026-10-20 起是自己的識別（試做中），**不沿用 Wall Go 的元件與視覺**：每一頁的背景是米提拉圖騰滿版鋪（`BaghFrame`＋`globals.css` 的 `.bagh-bg`：一塊用 image quilting 縫成上下左右無縫的圖塊 `pattern.avif／webp`，手機 520px、桌機 720px 重複鋪；先前四條飾帶拼的畫框接縫太明顯、一整幅 cover 虎羊太大），紙色面板浮在上面，面板頂列放平台 logo 與聯絡／語言（`BaghHeader`，不疊在背景上）；首頁是天城體字標＋四個按鈕（老虎、羊、本機對戰、連線對戰）；彈窗用 `Modal` 的 `skin="bagh"`（上方一條飾帶、標題在紙色上，不要色帶）、按鈕是米提拉畫的畫框（10/24 Zach：「虎羊棋明明是圖騰風，按鈕也要那樣」—— 一律兩條線 `.bagh-line`（橄欖綠底上是 `.bagh-line-on`）、圓鈕是雙圈小圓牌 `.bagh-medal`，一律直角；兩條線中間夾一排三角的鋸齒框做過，同一天 Zach 說「按鈕不要有那個菱形外框」）、主要鈕與選中的選項是橄欖綠（黑色按鈕是 Wall Go 的風格）、按鈕樣式在 `bagh-chal/styles.ts`（不能放進 `'use client'` 檔：伺服器元件匯入會變成 client reference，className 會變成一段錯誤文字）、難度在 `BaghUi`；棋子與圖示是 AI 畫的米提拉圓牌（`bagh-chal/tokens.tsx`，用背景圖畫，不用 `<img>`＋filter —— iPhone 會漏畫）。木窗門轉場（`WipeOverlay` 的 `DOORS`）只留在從平台卡片進來的那一下；虎羊棋裡面換頁（首頁、規則、對局之間）不播轉場、直接換頁（2026-10-22 Zach）。盤面（10/24 Zach）：一開始只有線、沒有任何符號，選了棋子才在可以去的點開出米字小花；**老虎可以吃羊時不給任何提示**（不閃、不加框、不寫字，做過都被拿掉）；棋子有落下／滑過去／一口吞下的動畫與閒置互動（老虎逗羊，不是羊頂老虎），見 `bagh-chal/idleMotion.ts`。結算就是分享圖（`bagh-chal/shareCard.ts`，番紅花圖騰底＋紙色面板＋鋸齒框；共用的殼是 `components/ShareResultModal.tsx`）。中文名用節目的「尼泊爾虎棋」（10/24，見 glossary）；桌機首頁左邊是老虎追羊的概念圖 `chase.webp`（10/24 Zach：「只是個概念圖、它不是棋盤本身」—— 之前是 AI 畫的整面棋盤 `board-art.webp`，飾帶與米字小花的顏色仍以它為準，檔案留著）。平台上的圖（大卡片 `hero.webp`、手機方圖 `hero-square.webp`、小卡片 `key-art.webp`）反過來是**遊戲裡真的棋盤與圓牌**擺一盤電腦對下出來的局面、放在圖騰底上（同一天 Zach：平台那張老虎追羊好看，但跟點進去看到的不一樣）。配色在 `bagh-chal/palette.ts`。程式在 `app/games/bagh-chal/`（規則與電腦對手）、`app/components/bagh-chal/`（畫面） |
| `/bagh-chal/rules` | 規則頁，每步一張小棋盤（`BaghRulesSteps`，對局中的說明彈窗共用） |
| `/bagh-chal/solo#tiger-normal`、`/bagh-chal/local` | 跟電腦下（hash 是邊＋難度，沒帶就在頁面上選）、兩人同一台。noindex |
| `/bagh-chal/online#new=tiger\|goat`、`#roomId=…` | 邀請朋友。房間在 RTDB `baghRooms/`（跟 Wall Go 的 `rooms/` 分開，結構見 `types/baghRoom.ts`），存走法字串（`encodeMoves`），只有輪到的人能寫。noindex |
| `/time-auction`、`/nine-mens-morris`、`/blind-gomoku`、`/balance-mancala`、`/knights-tour` | 第二批五款**試做**（2026-10-20）：每款一頁、選模式與對局都在那一頁（騎士巡邏的模式放 hash：`#show`、`#practice-N`）。規則在 `app/games/<id>/`、畫面在 `app/components/<id>/`、六語系文案在各自的 `app/games/<id>/text.ts`（不進 `messages/`，key 的縮排與順序見 `i18n/gameText.ts`）。metadata 用 `trialGameMetadata`：noindex、不進 sitemap、分享圖暫用平台首頁那張。沒有 GA 事件。**連線版**（10/24 Zach：有兩方互動的都補，騎士巡遊不用）各自在自己的分支上做：九子棋、盲眼五子棋、均衡曼卡拉共用 `turnRooms`（`hook/useTurnRoom.ts`，結構見 `types/turnRoom.ts`），時間拍賣是同時出價、另有自己的房間；網址 `<遊戲>/online#new=…`／`#roomId=…`（`routes.ts` 的 `trialOnline`）。**平台上一款一款開**（2026-10-22 Zach）：`feat/platform-bagh` 只上平台＋虎羊棋＋Wall Go，五款的卡片照「還沒做」的樣子；每款的視覺在自己的 `feat/game-<id>` 分支，那條分支把 `catalog.ts` 裡自己那一行換回 playable＋look |
| 舊網址 `/rules`、`/solo`、`/local`、`/online`、`/replay`、`/match`（各語系） | CloudFront 301 到 `/wall-go/…`（`infra/cloudfront-redirects.js`，表要跟 `routes.ts` 的 `MOVED` 一致，`tests/infra/redirects.test.ts` 會比對）；舊路徑上另有瀏覽器端轉址當備援（`components/LegacyRedirect.tsx`），noindex、不進 sitemap |

**`/replay` 是用來看玩家回饋的。** 每則回饋都附帶那一局的 WGF（`feedback/*/wgf`），
在 Firebase Console 讀到回饋時，把棋譜貼到 `/wall-go/replay#wgf=…` 就能一手一手重看玩家遇到的狀況。
首頁右上角的「聯絡我們」也寫進同一個 `feedback/`，但 `mode: 'contact'`、**沒有 WGF**（不在對局裡）；
它必填的是 `message`，評分選填。規則在 `database.rules.json` 依 `mode` 分流驗證，改表單欄位時兩邊要一起動。
**每一則（回饋與聯絡我們）都帶 `page`**＝從哪一頁送的網址路徑（`gameService` 自動加，10/25 Zach 問「聯絡我們分得出是哪個來源嗎」）；
其他遊戲的對局回饋沒有 WGF，走法放 `record`（尼泊爾虎棋是 `encodeMoves`，結算圖下面的「給點意見」，`ShareResultModal` 的 `onFeedback`）。
這兩個欄位的規則**要先在正式資料庫發布、程式後上線**：多的欄位一律拒絕，順序反過來新程式的回饋會整筆送不出去。
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
- **凍結區域**（不同人的棋子關在一起、誰都動不了，也不能原地蓋牆切開）：每顆棋子算自己站的那一格（`TerritoryResult.frozen`，2026-10-24 Zach 遇到紅藍各一顆封在同一個兩格口袋，選了「只改計分」而不是「允許原地蓋牆」）。走法、跳過、終局判定都沒變 —— `shouldSkipTurn` 刻意仍把那一格當成不是自己的地，改了會讓舊棋譜重播出來的輪次跟舊版客戶端對不上（改版時用 1500 局隨機對局比對過新舊引擎的輪次、跳過、終局、合法手完全一致）
- `skipUnplayable()` 自動跳過已無法影響結果的玩家。跳過不寫入棋譜，完全由盤面推導，故各客戶端結果一致；`replay()` 結尾也必須套用它
- `replay(wgf, upToTurn?)` 從空棋盤重建，`upToTurn` 供悔棋與逐步回放使用
- 三人模式破牆機制：`breakWallCount`，每位玩家最多 1 次；確認 UI 使用 `app/hook/useConfirm.tsx`

**`app/components/PlayClient.tsx`** — 唯一的遊戲元件，只持有一個不可變的 `GameState`、處理 UI 與 Firebase 同步，不含規則邏輯。靠 `roomId?: string` prop 區分本機與連線模式，連線模式顯示 `initializing / waiting / playing / error` 四個 phase。

棋盤渲染：`app/components/Chessboard.tsx`（2D，目前使用中）。

手機（`coarse`）底部是 `WallDirectionPad` 控制盤：內圈箭頭移動、外圈長條蓋牆、四角是投降／破牆／重來／完成。
**外圈長條按下去就直接蓋**（2026-10-23 Zach 選的 A），不必再按 ✓；盤面上 9px 的牆邊照舊先預覽、再按長條或 ✓ 送出（那裡才是真的會點錯的地方）。
電腦版左下角投降旁邊有「重來這一步」（只移動了、還沒蓋牆時才出現；手機在控制盤左下角）。
**中央那顆棋子可以按**：按一下選第一顆，再按依棋子編號換下一顆（engine 的 `nextSelectablePiece`），
整個回合不必點盤面；點盤面的方式照舊保留。規則同 `selectPiece`：走過就不能換（要換請按重來）、
被圍死的棋子跳過。中央那顆一律是**這台裝置上的人自己的顏色**（連線是自己的座位、跟 AI 下是 A；本機對戰才是輪到的人），還沒輪到自己就淡下去 —— 先前畫輪到的人，藍方在等紅方時控制盤中央是紅色（2026-10-22 Zach 回報）。
**手機開局擺子**：盤面中央先放一顆虛的自己色棋子（半透明＋虛線框），控制盤方向鍵一次跳到那個方向的下一個空格、✓ 放下去；直接點格子照舊會放（2026-10-22 Zach 要的；規則在 `components/boardCursor.ts`）。
連線與跟 AI 下時，**比分上自己那塊多一圈自己顏色的框**（中間留一道縫）、等人畫面自己的座位也一樣，電腦版輪到自己時提示寫「輪到你了」、開場那一下寫「你是藍方」。不在畫面上寫「你」—— 試過，太直白，這是 Zach 10/22 從六種做法裡挑的（另有「只在開場講一次」、短底線、棋子白點、左上角頭像）。左上角首頁是 Lucide 的線條房子 `LuHouse`（同一天從 18 個候選挑的；之前是茅屋 `GiHut`），首頁與遊玩方式在電腦版 hover 會浮出名稱（`IconButton` 的 `HOVER_TIP`）。**左上三顆（房子、遊玩方式、喇叭）都用 Lucide 線條**：遊玩方式是問號 `LuCircleHelp`、喇叭是 `LuVolume2`／`LuVolumeX`（10/23 Zach 從四種做法挑的：統一線條留書本、問號、加字、合成兩顆）。先前的實心書本骰子在 24px 認不出是什麼；首頁「遊戲規則」磁磚照舊是實心書本（大色塊用實心剪影，去的是規則頁，跟對局中的說明是兩件事）。

### 連線對戰（Firebase）

**Firebase RTDB 路徑：`rooms/{roomId}/`**

```
id, playersNum, status, createdAt, currentPlayer, wgf, winners?
players/{ A?, B?, C? }/{ uid, displayName, joinedAt }
presence/{ A?, B?, C? }   true＝連著、number＝斷線的時間；沒有＝不知道（舊版程式），不能當成斷線
clock/{ A?, B?, C? }      各方累計的思考時間（毫秒），下完一手的人自己加上去
turnAt                    輪到現在這個人的時間（伺服器時間）
nudge { by, at }          最近一次「催一下」
```

`status` 生命週期：`waiting` → `opening` → `playing` → `finished`

- `app/utils/firebase.ts` — Firebase **惰性**初始化。匯出 `getFirebaseAuth()` / `getFirebaseDb()` 兩個 async 函式，內部以動態 import 載入 SDK 並用 Promise 記憶化。首頁與 `/local` 不會下載 Firebase（約 75 KB gzip）
- `app/utils/gameService.ts` — `createRoom`, `joinRoom`, `getRoom`, `subscribeRoom`, `updateGameState`, `setRoomWinner`
- `app/types/room.ts` — `Room`, `RoomPlayer`, `RoomStatus` 型別
- **在線狀態**（2026-10-23）：`gameService.trackPresence` 照 Firebase 官方的做法 —— 先登記 `onDisconnect` 寫斷線時間、伺服器收下才標成 `true`；關分頁、手機收到背景、網路斷掉時由伺服器寫斷線。畫面在 `hook/useRoomPresence.ts`：**斷線滿 3 秒才顯示**（有人重新整理時不閃）、回來立刻拿掉；斷線的對手在比分那塊掛一顆拔插頭的小圓（`GameStatus`），輪到他時提示句寫「藍方暫時離線」，自己斷線寫「連線中斷，正在重新連線…」。從等人開始回報，結束後停（結算會 `releaseConnection`）。規則要 Zach 先在 Console 發布；沒發布時寫入被拒、什麼都不顯示，不會出錯
- **分頁標題提醒**：`hook/useTitleAlert.ts`，連線時輪到自己、分頁在背景，標題輪流換成「● 輪到你了」。只有電腦版看得到；手機切到別的 App 時網頁沒有任何辦法提醒（推播要 Service Worker＋能發送的後端，靜態站做不到）
- **輪到誰**（2026-10-23，Zach 的提議）：棋盤外圈一層輪到那一方顏色的**淡陰影**（`.board-turn`；先前多一圈 5px 實色框，Zach 要只留淡淡的陰影），輪到這台裝置上的人時用 `element.animate()` 讓陰影濃一下再退回。**這是全站唯一的陰影**，不是在模擬光源，是「現在是誰」的訊號。連線時還有提示音（見下）
- **催一下**（同日）：連線時還沒輪到的人可以催輪到的人 —— 對方棋盤抖一下（只動 transform，不會推開旁邊的東西）、敲門聲、手機震一下（跟著音效開關走）、提示列寫「紅方在催你」。15 秒冷卻由資料庫規則擋。電腦版按鈕在右下提示塊裡，手機在棋盤下方取代步驟標
- **看不到對手在想什麼**：10/23 做過「輪到的人選棋、走一步、預覽牆時寫 `draft`，其他人看得到那顆移過去、在原地擠」，10/24 Zach 要拔掉（對手選哪顆、走到哪不該被看到）。程式不再寫也不讀；`updateGameState` 仍順手清 `draft`（v26.10.7 的客戶端可能還會寫），`database.rules.json` 裡 `draft` 那段規則留著無害，下次改規則時再一起拿掉。**不要再加回來**
- **閒置棋子會跟牆互動**（同日，Zach 的提議）：旁邊有玩家蓋的牆的棋子，每 2.5–5.5 秒挑一顆，隨機推牆、撞一下、敲敲、想跳過去、探頭；兩邊都是牆的會被夾扁，牆也跟著被推出去一點（`components/idleMotion.ts`）。所有模式都有，各台裝置自己隨機、不同步。只動 `translate`／`scale` 獨立屬性，不蓋掉牆與棋子本來的 transform；**輪到的那一方的棋子不動，只有等待的一方會**（Zach 10/23：「我正在下時，我的棋子不要有撞牆那些效果，是對方的才能有」；換人那一下把還在晃的停掉）；減少動態效果時關掉。棋盤外圈不算（推不動，看起來像卡住）
- **不同顏色的棋子挨著會對打**（10/24，Zach 的提議）：上下左右相鄰、中間沒有牆的兩顆，等待那一方的會出手（連打、衝撞、頂牛、挑釁、假動作，`idleMotion.ts` 的 `FIGHTS`），旁邊同時有牆時六成先打架。**被打的那顆一定有反應**，就算是輪到的人的棋子 —— 「輪到的人的棋子不動」的第二個例外（Zach 從「被打的不動」與「被打的有反應」兩支錄影裡選了後者：對打要有來有往）。輪到的人選了棋子就把還在播的停掉，要走之前先站好
- **蓋牆是「壓進去」**（10/24，Zach：「放牆的特效可以做」）：新的那道牆先浮在上面、稍大一點，按下去卡上，碰到的那一下沿著整道牆擴出一圈、整個棋盤往下震一下（圈原本在牆的兩端，端點沒接到牆時懸在空格上，Zach 嫌位置怪，從五種裡選了整道牆一圈），牆的音效也改在那一下響（`boardMotion.ts` 的 `WALL_PRESS`，PlayClient 用 `contact` 對時；對手的牆聲之後才響「輪到你」）。先前是從中間往兩端長出來。同時試過「牆跟牆接起來像鋼彈骨架、一凸一凹的卡榫」五種接法，Zach 說沒看到好看的、**先不做**
- **被關在一格裡的棋子一直想出去**（同日，Zach：「他可以隨時都在動嗎，想要出去的那種狀態」）：四面都是牆（外框也算）的棋子無限循環地四個方向各撞一次、其中一邊連撞兩下、一邊伸長探縫，撞到的玩家牆跟著被撞出去一點（`idleMotion.ts` 的 `syncTrapped`，動畫 id `cage:r,c`）。**不管輪到誰都動** —— 那顆本來就不能選、不能走，是「輪到的人的棋子不動」的唯一例外；減少動態效果時關掉
- **累計思考時間**（同日，Zach：「不做限制時間，記他整場總共耗時多久」）：連線記在 `clock/`，起點 `turnAt` 是伺服器時間、減的時候用 `serverNow()`（加上 `.info/serverTimeOffset`），兩台裝置的時鐘差多少都不影響；本機／單人由這台裝置記、存 sessionStorage。對局中也看得到、輪到的人在走秒（10/23 Zach：「桌機版沒看到下棋時間的計時」）：桌機寫在「已佔領」底下、整排最下面是**對局時長**（各方加起來，輪到誰誰就在走秒，沒有空檔），手機掛在每塊比分外面（直式下方、橫式右邊），手機不寫整局；只有 `GameStatus` 每秒重畫（`utils/clock.ts` 的 `LiveClock`）。桌機那行寫「對局時長」（Zach 從「總時長／共／碼錶圖示／對局時長」挑的）。時間只在對局中看，結算圖上一個都不寫
- **`clock`／`turnAt` 跟棋譜分開寫、而且先寫**：規則看的是「寫入前輪到誰」，棋譜一寫輪到的人就換了；分開寫是因為規則還沒發布時整包會被拒，那樣棋譜也送不出去
- **本機測連線**：`NEXT_PUBLIC_FIREBASE_EMULATOR=1` 時 `firebase.ts` 改連 Firebase 模擬器（auth 9099、database 9000，要裝 Java）。在線狀態、斷線、規則只能真的開兩個瀏覽器（兩個身分）連一次才驗得到，不要拿正式資料庫試
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
  **favicon 每款一組**（2026-10-24）：全站預設 `/favicon.*`、`/icon-*.png` 是平台的骰子惡魔平面版（16px 下立體版糊掉），Wall Go 那兩個人搬到 `public/icons/wall-go.*`、尼泊爾虎棋是老虎圓牌 `public/icons/bagh-chal*`，由 `i18n/metadata.ts` 的 `GAME_ICONS` 依路徑指定；結算分享圖站名前那顆也用那款自己的。第二批五款還沒有自己的，沿用平台的。
- **第二批五款各有自己的世界**（2026-10-21）：找法跟虎羊棋一樣 —— 先找原件（公有領域／CC0 的館藏），
  **顏色從原件取樣、不要自己調**（各自的 `palette.ts`／`theme.ts` 寫了出處與對比），**裝飾只有最外緣一圈**
  （`.<縮寫>-frame`，border-image，彈窗裡不放花紋），按鈕照全站（主要深墨、次要淡墨、沒有框線），彈窗用 `panelClassName` 換成那款的紙色。
  主視覺與平台卡片都是原件本身。每款在自己的 `feat/game-<id>` 分支（一款一款上線）；下面每款一段，**段與段之間留空行**，
  各分支改的是自己那一段，依序合併才不會衝突（globals.css 底部的五個標記、catalog.ts 的寫法也是同一個道理）。

  - 九子棋：試做中，視覺在 `feat/game-nine-mens-morris`。

  - 盲五子棋（`feat/game-blind-gomoku`，10/24 照節目從「盲眼五子棋」改名）：原件是朝鮮拼布包袱巾 조각보；最外緣布條拼的寬邊（`.gmk-frame`）；主視覺是包袱巾 `pojagi.webp`，七色棋子是一塊塊布；按鈕與彈窗（含右上角聯絡／語言的 `GMK_CORNER`）都是 `.gmk-*` 的布。favicon 是一角包袱巾（七色布塊＋白絲縫線，`public/icons/blind-gomoku.*`）。
    聲音（`sounds.ts`）：子落在布上悶的一聲＋每個顏色一根伽倻琴的弦（AI 跟色就彈你那一根，音高只看顏色、聽不出黑白），翻開時刮過整排弦。結算就是分享圖（`shareCard.ts`：同一圈布條外框、翻開的終局盤面、連成的五子一道青綠線）。
    動作（`idleMotion.ts`）：落子壓一下布、旁邊的子跟著滑；閒置動作只在一般模式、只動等待那一方 —— **盲棋沒有閒置動作**（只動一方就等於告訴你哪些是對方的子）。
    邀請朋友（10/24）：共用的 `turnRooms`，`s0` 黑、`s1` 白，setup 是 `blind`／`classic`，moves 是 engine 的 `encodeMoves`（`games/blind-gomoku/online.ts`）；首頁的彈窗選玩法與自己執黑或執白 → `/blind-gomoku/online#new=blind-black`。對局沿用 `GomokuPlay`（只有輪到自己能下、沒有悔棋與重來、再來一局＝開新房）；盲棋兩邊都只畫顏色、各自選色（沒有 AI 的跟色）；畫面上寫黑方／白方、不寫「你」「對方」，自己那方是狀態底下實線縫邊的那塊小布。連線中、等人、失敗是 `GomokuOnline` 裡自己的一小塊包袱巾（縫線往前縫、兩塊布縫在一起、一角脫線）。這款裡面換頁都不播轉場；結算只留 9:16。

  - 騎士巡邏：試做中，視覺在 `feat/game-knights-tour`。

  - 時間拍賣：試做中，視覺在 `feat/game-time-auction`。

  - 均衡曼卡拉：試做中，視覺在 `feat/game-balance-mancala`。

- **棋盤**：外圍那圈 9px 是「牆」不是裝飾邊框（規則裡棋盤外緣本身就算一道牆）。
  牆的位移一律 `calc(var(--board-gap) * -0.5)` —— 對齊的是格線中心而不是格子邊，
  兩者差半個格縫，寫死會漂掉。
  **中立區鋪頁面底色**（被牆圍住、裡面沒有棋子、永遠不計分的格子）：`#e8e1d7`＝`--background`，像棋盤上被挖掉的洞（`components/neutralZone.ts`）。
  2026-10-23 試過長草、反灰（`#ccc9c3`），Zach 說反灰讓版面亂、配色太多；三種並排後選頁面底色 —— 不多加一個顏色。分享圖用同一個值。
- **聲音**（`utils/sound.ts`，2026-10-23）：**全部用 Web Audio 當場合成，沒有音檔**（節目配樂一律不能用；出處見 `docs/sound.md`）。
  只有音效、**沒有背景音樂**（10/23 Zach：「音樂功能拔掉，留下棋的聲音就好」；合成的被嫌難聽、Pixabay 的鋼琴與益智曲也不合）。
  預設開，對局左上角的喇叭一按就開／關（存 localStorage）。使用者點過頁面之前不出聲（瀏覽器規定）。
  響的時機：牆蓋下去、開局擺子、連線輪到自己（分頁在背景也會響）、被催、分出勝負。
  **輪到自己超過 1 分鐘沒碰畫面**（沒點、沒按鍵）再小聲叮咚一次、外圈再脹一次，一個回合只一次（連線限定，10/23 Zach 說好）。
  手機切到別的 App／鎖螢幕時網頁被暫停，什麼都響不了；推播要後端，靜態站做不到。
  手指裝置上左上角三顆縮成 44px、間距 8px：三人局在 375 寬的手機上第三顆會壓到比分。
- **結算畫面就是分享圖**（`ChampionModal` 用 `ResultCard.tsx` 的 `useResultCard`＋`RatioToggle`＋`CardImage`，圖在 `utils/resultCard.ts`，2026-10-23）：
  原本結算是一排名次＋「分享戰績」另開一個視窗；Zach 想「直接顯示這個分享畫面、結合成一個」，「看看棋盤」也拿掉（圖上就是終局盤面，要看真的棋盤按右上角關掉）。
  **圖本身就是對話框**（Zach：「有可能讓結尾 Modal 直接變成是圖片本身嗎，目前感覺像是長在 Modal 內」，從兩種裡挑了 A「圖比較好」）：
  `Modal` 的 `bare` 模式（沒有色帶、紙色底、內距），遮罩加深＋模糊（`bg-black/85 backdrop-blur-sm`），圖是圓角卡片、關閉鈕小小地疊在圖的右上角；
  比例切換在圖上方、一排兩顆按鈕（分享、再來一局；連線只有分享）在下方，最底一行小字「也可以長按圖片儲存」＋「給點意見」連結。
  按鈕列寬度跟著圖走（`w-0 min-w-full`），小手機上不會把整塊撐寬。暗底上的按鈕顏色反過來：主要米白、次要 `bg-white/15`。
  沒選的 B 是「圖下面接一塊紙色托盤放按鈕」。**手機橫放（`short`）圖在左、切換與按鈕疊在右邊 13rem 一欄**。
  320×568 到 390×700 的直式、568×320 到 932×430 的橫式、桌機三種比例都整塊塞得下、不用捲（同日實測）。
  名次另外放一份 sr-only 給螢幕報讀。在瀏覽器裡用 Canvas 畫（9:16 預設／4:5／1:1），**三種比例都整張勝方色**（平局、多人同勝是深墨；10/24 Zach 要 4:5、1:1 也跟 9:16 一樣），品牌與 QR 在最下面一塊紙色上，
  盤面、比分、站名、網址（**時間都不寫在圖上**，Zach：「結果畫面不用有個人花多久下棋」「對局時間都不用到結尾」），加一個掃了到首頁的 QR（`uqr`，帶 `utm_source=result_card&utm_medium=share`）。**不寫「掃碼來跟我下一局」這類邀請句**（Zach 拿掉的）。
  出處寫「靈感來自《節目名》」，**不寫 Netflix、不放節目的 logo／主視覺／截圖**（看起來像官方合作，大腦 10/23）。
  能分享檔案就叫系統分享面板，不行就存檔；App 內建瀏覽器兩個都可能不給，預覽本身是一張 `<img>`，長按可以存。
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
- **轉場播放中擋住捲動**（`TransitionContext`：touchmove、wheel、捲動鍵）：遮罩是 absolute、定在點下去那一刻的捲動位置，一滑就露出底下的頁面（10/24 Zach）。不用 `useScrollLock` 的 fixed body —— 解鎖時會把舊頁的捲動位置還原到新頁上。
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
| `mode_select` | 首頁磁磚或 `/solo` 頁選了模式（想玩） | mode、players、difficulty、entry |
| `room_created` | 連線房開好 | players |
| `game_start` | 本機／單人擺下第一顆棋；連線人到齊開始擺棋 | mode、players、difficulty |
| `game_end` | 分出勝負 | mode、players、difficulty、result、winner、ended、turns、duration_sec |
| `game_restart` | 結算按再來一局 | mode、players、difficulty |
| `online_error` | 連線失敗 | reason、fail_step |
| `share_room_link` | 分享房間連結 | method |
| `share` | 結算的分享圖（GA4 建議事件） | method（native／download）、content_type（result_card）、item_id（poster／square／story） |
| `nudge_send` | 連線時催輪到的人 | players |
| `tutorial_close` | 關掉遊玩方式 | step、steps、finished |
| `locale_switch` | 切語系 | from、to |
| `contact_open` / `feedback_send` | 聯絡我們、送出回饋 | entry、rating |

- `game_start` / `game_end` 看**狀態轉變**而不是按鈕；第一次觀察到的狀態不送（重整後從棋譜重建的「已開始／已結束」不是這次發生的），連線另用 sessionStorage 去重。連線局每位玩家各送一次，所以是「人次」不是「局數」。投降不另外送，會以 `game_end` 的 `ended: 'resign'` 出現。
- **`page_view` 交給 GA 自己算**（首次載入由 config、站內換頁由加強型評估的「依瀏覽器記錄事件」）。不要再手動送 —— 以前的 `AnalyticsProvider` 就是這樣讓每次瀏覽都算兩次。
- 參數要在 GA 後台「管理 → 自訂定義」註冊才看得到：維度 `mode`、`players`、`difficulty`、`entry`、`result`、`winner`、`ended`、`reason`、`fail_step`、`method`、`from`、`to`、`finished`；指標 `turns`、`duration_sec`、`step`、`rating`。
  `share` 的 `content_type`、`item_id` 是 GA4 建議事件的標準參數，後台有沒有內建維度要上線後確認，沒有再註冊。
- **參數名稱在維度與指標之間不能重複**：`step` 已經是 `tutorial_close` 的指標，所以連線失敗的步驟叫 `fail_step`。新增參數前先看這份清單。
- **不能用 GA 保留給流量來源的名稱**：`source`、`medium`、`campaign`、`term`、`content`（還有 `gclid`、`utm_*` 這類）。GA4 會把它們當成這個工作階段的來源 —— 2026-10 `mode_select` 帶 `source=home`，Google 搜尋進來的工作階段被記成來源「home」（大腦從 BigQuery 查到：10/22 的 22 個工作階段有 8 個），所以改名 `entry`。`from` 也不要拿來當入口：它已經是 `locale_switch` 的「從哪個語系」。

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
