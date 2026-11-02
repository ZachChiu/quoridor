# 交接：2026-10-25 本機 → Claude Code 雲端

> 10/25 雲端那段對話已照下面做過一輪，改過的地方直接寫進各節（§2 能傳訊息給大腦筋、§5 已決定的打勾、§7 雲端實測）。
> 研究與成長規劃的現況也在 10/25 補上了：做了哪些、下一批是哪些見 `docs/games-research.md`〈目前進度〉，平台規劃見 `docs/growth-plan.md`〈0. 現況〉。

本機那段對話（10/17–10/25）搬不上雲端，這份是它的交接。**先整份讀完再動手。** CLAUDE.md 照舊是主要規範，這裡只補 CLAUDE.md 沒寫、但本機對話裡一直在遵守的事，以及做到哪、還在等什麼。

## 1. 一定要遵守的（本機的記憶檔，雲端讀不到）

- **永遠用繁體中文回覆**，包括工作中的一兩句進度。Zach 說過很多次「中文回覆」。程式碼、指令、檔名照原樣。每次回覆結尾照 CLAUDE.md 說「Zach + 隨機稱讚語」。
- **不准自己併進 `main`、不准打版**。Zach 說「打版」才打。不要直接 commit 到 `main`，也不要從 `beta` 打版。
  - **打版要回本機做**：`npm run release` 會推 tag，雲端的 GitHub proxy 會擋 tag。
- **平台版等 AdSense 審查過才上**（大腦筋：估 11/16 之後），上線時只放能玩的卡片。在那之前不要提議把平台併進 main。beta 與正式站都**先別載 AdSense 的程式碼**（`ads.txt` 留著沒關係）。
- **改動先進分支**：一款一條 `feat/game-<id>`，平台＋虎棋在 `feat/platform-bagh`，`beta` 是把它們合在一起測的地方（見 §3）。
- **不要拿正式 Firebase 資料庫測試**。連線功能拿 beta 站（獨立的 Firebase 專案 `quoridor-beta`）測。正式資料庫的規則由 Zach 自己在 Console 發布；beta 專案的規則可以由我們發布（Zach 說過「直做吧」）。
- **視覺規則**：
  - 每款各有自己的世界，按鈕、彈窗、進場都從原件找做法，**不要一款做好推到其他款一模一樣**。
  - 顏色從原件取樣、不自己調；裝飾只有最外緣一圈；裝飾不能像 ×、⌘、+ 這類操作符號。
  - 盤面提示不加新顏色。尼泊爾虎棋**老虎可以吃羊時不給任何提示**。
  - 閒置動畫只給等待的一方。連線時不同步對手正在選哪顆、走到哪。
  - 不用「你／對方」這種字，用記號（例如自己那塊多一圈框）。
  - Wall Go 的視覺已定案（平塗撞色），不要提整體改風格；Wall Go 重新設計已廢掉。Wall Go 的平台卡片不准用 AI 生圖。
  - 音效一律 Web Audio 當場合成；節目配樂、Netflix 的 logo 與主視覺都不能用。
  - 平衡播棋：Bowdich 1817 的 adinkra 圖版不能放；Rattray 的 #11、#12、#3／#16 避開。
- **設計問題做出來給他挑**：有幾種做法就做實際截圖並排，讓 Zach 選（他常選跟推薦不同的）。別只用文字描述。
- **動工前先查證**：官方文件、現成套件、會不會影響靜態匯出（S3）。遊戲名、譯名一定要查證（兩個以上獨立來源）才寫，見 `app/i18n/glossary.md`。
- **驗證要像真實使用者**：iPhone＝WebKit；返回鍵要用瀏覽器真的返回，不要用 `history.back()`。
- **對外的動作先問**：推分支、發布規則、改外部後台都要 Zach 點頭。推 `beta` 部署是說好的流程，可以直接做。
- **祕密**：AI 產圖金鑰、Sentry token 都不在雲端，也不要放進 repo。`SENTRY_AUTH_TOKEN` 有值時 build 會改到正式站的 Sentry release（10/21 出過事），雲端不要設。

## 2. 跟大腦筋（數據中心）的分工

CLAUDE.md 用 `@~/Desktop/projects/sites-data/protocol.md` 引用分工規則，雲端沒有這個檔。重點：

- 大腦筋是 `~/Desktop/projects/sites-data` 的另一段對話，負責 GA4、Search Console、Sentry 判讀、寫計畫、到期驗收。它只寫 docs，不碰程式。
- 每次打版都要報 **【上線】**（版號、上線日、一句話、影響的頁面或事件）。GA 事件、Sentry、網址或轉址有變動要報 **【追蹤變更】**。派工做完報 **【完成】**，推翻計畫前提的研究結果報 **【結論】**。
- **雲端可以直接傳訊息給大腦筋**（10/25 實測：它是 `claude remote-control` 開的，`list_sessions` 查得到、開放其他對話傳訊息）。用 claude-code-remote 的 `send_message`，對象是標題「大腦筋」那個 session。它收到時知道是另一段對話傳的。它要有傳訊息的工具才回得了；回不了就用 `list_events` 讀它的對話。傳之前先問 Zach（會讓它跑一輪）。
- **10/25 大腦筋也搬上雲端了**：新的 session 標題「大腦筋雲端」（`session_01FH2oZtnsn1WsFitX7sP5g1`，掛 `sites-data` repo）。它主動傳訊息來，說之後【上線】【追蹤變更】都傳到這個 session，並問我們是不是接手 Mac 上〈魔鬼的計謀遊戲〉那段牆壁圍棋對話、請回一句確認雙向通。10/25 Zach 要我回、跟它合作，已回：確認接手（我們的 session 是 `session_01EqQDVyvUi4wL1aNNbw3Nm1`），預告平台上線時的【追蹤變更】（網址搬家與 301、新語系、會被索引的新頁、`feedback_send` 多 `platform`、回饋的 `page`／`record`），並問它平台要追哪些 GA 事件（提議沿用 `game_start`／`game_end` 加 `game` 參數，由它定規格）、Search Console 搬家要準備什麼、有沒有派工。**等它回**；它定了 GA 規格就在分支上做。
- **10/25 大腦筋回了三則**（已回覆收到）：
  - GA 先這樣定：沿用 `game_start`／`game_end` 加 `game`（網址的 slug），平台點卡片是新事件 `select_game`（`game`、`link_location`）；Wall Go 舊事件與參數不改名。正式規格它會寫成 `docs/platform-tracking.md` 再派過來，**還沒來**。
  - 搬家要的「舊→新對照表＋新 sitemap 清單」已做好：`docs/platform-launch/`。
  - 加到主畫面的 start_url 帶 `?utm_source=pwa&utm_medium=homescreen`（已做，canonical 不帶）；上正式站那天的【追蹤變更】要寫進去。
  - 它轉達的方向更新：AdSense 審查結果一出來，不管過或沒過，就上平台版＋尼泊爾虎棋（不再固定 11/16）；平台分支要隨時可上、跟 main 同步，回饋規則上線前提醒 Zach 先發布。**這是大腦筋轉述的，還沒跟 Zach 本人確認過**。
- **10/25 07:34 Zach 在大腦筋那邊說「聽你的建議／推上去」**（我們用 `list_events` 讀過原話與前一則問句才動手）：平台首頁大卡片預設先放 Wall Go（`catalog.ts` 的 `HERO_DEFAULT`，上線 4 週大腦驗收後再定何時換回最新的）、`feat/platform-bagh` 推上 GitHub。五條遊戲分支不在那句話裡，沒推。

## 3. 分支與 beta 站

| 分支 | 內容 |
|---|---|
| `main` | 正式站（目前是 Wall Go，最新版 v26.10.9） |
| `feat/platform-bagh` | 平台（骰子惡魔）＋尼泊爾虎棋＋Wall Go 搬進 `/wall-go/`。**上線用這條** |
| `feat/game-nine-mens-morris`、`feat/game-blind-gomoku`、`feat/game-knights-tour`、`feat/game-time-auction`、`feat/game-balance-mancala` | 第二批五款，各疊在 `feat/platform-bagh` 上，各自把 catalog 裡自己那一行換成 playable |
| `beta` | 上面六條合在一起，推上去就部署到 https://beta.quoridorgame.com |
| `fix/thai-sara-am` | 泰文 ำ 的修正（71f58e4），**還沒打版**，等 Zach 說 |
| `feat/games-batch2` | 尼泊爾虎棋定案版（3ac1099）的出處，已併進 `feat/platform-bagh`，留作參考 |
| `feat/bagh-frame`、`feat/wallgo-territory-look` | 舊的試做，不用管 |

**改東西的流程**：在對的分支改 → 跑檢查 → 併進 `beta` → 推 `beta` → 到 beta 站實際看。

- 平台或虎棋的改動放 `feat/platform-bagh`，之後再併進各款分支（`git merge feat/platform-bagh`）。
- 某一款的改動放它自己的分支。
- **合併時一定只會衝突字型檔**（每條分支各自重切過子集）：`git checkout --ours public/fonts/`、add、commit，全部併完再 `npm run font:subset` 重切一次、單獨 commit。CLAUDE.md 也是各段分開寫的，依序合併不會衝突。
- catalog.ts：五款能玩的那幾行只在各自分支改。日文、韓文的譯名集中在檔尾的 `LOCAL_NAMES`，平台分支改那裡就不會衝突。

**檢查**：`npm run typecheck`、`npm run lint`、`npx vitest run`、`npm run font:check`、`npm run og:check`。合完 beta 是 534 個測試全過。

## 4. 現在做到哪（10/25）

都已經在 beta 上，實際點過：

- 平台名定案「骰子惡魔」，外語都用 Dice Devil（`app/brand.ts`；日韓泰不另取，理由在 glossary）。五款各自的 favicon 做好了。
- 五款各有規則頁 `/<id>/rules`（每步一張圖配一段字）、對局中的說明彈窗可以左右滑（共用 `app/hook/useSwipePager.ts`）、各自的分享圖（`scripts/og-games/<id>.mjs`）。
- 平台分享圖是七款卡片斜排的牆（`scripts/og-art/collage.mjs`），大標兩行「《魔鬼的計謀》／遊戲線上玩」（六語各一句）。尼泊爾虎棋分享圖的棋盤擺正了。
- 平台大卡片每款有介紹（`app/games/<id>/blurb.ts`）。
- 平台卡片的日文、韓文遊戲名換成查證過的（`catalog.ts` 的 `LOCAL_NAMES`，來源在 glossary）。
- 10/25 雲端這段另外做了：
  - 404 改成平台的樣子（深色＋紅、回首頁、三季目錄；`app/not-found.tsx`），原本是 Wall Go 的奶油底、還連到搬家前的 `/rules`。
  - 季目錄頁上方切換各季只寫「第 N 季」、排一排（Zach 從三種排法挑了 A），能玩的遊戲排前面。
  - 遊戲卡的名字跟著卡片寬度縮（container query），320 寬手機的窄格子裡不會疊到「可以玩」；首頁 240px 的卡片照舊 22px。
  - 換頁轉場上下各多蓋一截：iOS 26 Safari 狀態列、工具列底下原本會露出舊頁面（Zach 截圖：木窗門關好了，上面還看得到季標題）。五款的進場在各自分支補了接出去的底。
  - PWA：可以加到主畫面，不管在哪一款加，打開都是那個語系的平台首頁；主畫面圖示一律是平台的。沒有 service worker。**還沒在 iPhone 真機上確認**「加到主畫面」打開是不是首頁（iOS 照不照 start_url 網路上說法不一）。

## 5. 等 Zach 決定的事（不要自己選）

1. ✅ **10/25 決定：回到第一版的整面印刷棋盤 `board-art.webp`**（Zach：「虎羊圖回到第一版」）。`chase.webp` 刪掉，`docs/handoff/bagh-left/` 的候選圖也一起刪了。以下是當時的候選，留作紀錄：
   **尼泊爾虎棋桌機首頁左邊的圖**（`app/views/BaghChalView.tsx` 的 `chase.webp`，目前是 AI 畫的老虎追羊）。Zach 要「跟其他棋一樣從網路找視覺圖」。找不到「老虎和羊同框、南亞傳統、授權乾淨」的原件，候選都是印度拉賈斯坦 Kota 派的老虎畫（CC0，沒有羊）：
   - A（推薦）Cleveland Museum of Art 1991.168《Tiger Hunt of Ram Singh II》約 1830–40：紫色懸崖上的大老虎
   - B Cleveland 1985.64《Tiger Hunt》約 1800：老虎躍出綠林，下緣有獵人
   - C Met 2019.445.4《Study for a Tiger Hunt》1780：淡彩習作，最融合但縮小偏弱
   - 另一個選項：老虎原件＋芝加哥藝術博物館 1919.944 蒙兀兒的山羊畫（約 1600，CC0）並排
   - 不能用：Met 2008.359.50（捐贈者是被定罪的文物走私者 Subhash Kapoor）；大英博物館的 Gazi 卷軸（CC BY-NC-SA）
   - （比較圖與裁切腳本原本在 `docs/handoff/bagh-left/`，已刪，要看去 git 歷史 `3c39555`）
2. **骰子惡魔 logo 收到角落**（Zach 嫌它在各遊戲首頁太搶眼）：A＝28px、換成那款自己的墨色（用 `public/brand/die-mark-mono.svg` 當遮罩）；B＝28px、原本的藍淡到 45%。比較圖 `docs/handoff/logo-corner/options-phone.jpg`，做法在 `opts.mjs`（是注入 CSS 的示意，還沒改程式）。
3. **泰文的遊戲名**（10/25 網路查證：泰國媒體寫節目名一律用英文 The Devil's Plan，遊戲名沒有找到通行的泰文寫法；`ประมูลเวลา` 這類自己翻的沒有人在用。Netflix 有泰語配音，正式泰文名要在泰國區看才知道。搜尋可以補的泰文詞：`เดอะเดวิลส์แพลน`、傳統遊戲名 `หมากขุม`（泰國本土的播棋）、`แมนคาลา`。還是等 Zach 選 A／B）：泰國那邊講這些遊戲都用英文名，平台卡片維持英文。但五款遊戲裡的泰文標題是當初自己翻的（例如時間拍賣 ประมูลเวลา），沒人這樣叫，跟卡片也對不上。A（推薦）改成「英文名＋泰文說明副名」，跟尼泊爾虎棋泰文頁一樣；B 保留泰文標題，但要找泰文母語者確認。
4. **日文中等信心的三個名字**（10/25 網路查證：現在用的寫法都跟日本觀眾的部落格、note 一致，意譯派的「均衡のマンカラ」「目隠し五目並べ」找不到實際用例，「時間オークション」只有一篇。節目名要同時打「悪魔の計略」與「デビルズプラン」兩個關鍵字。搜傳統遊戲的人會打 五目並べ、騎士巡回問題／騎士の巡歴、マンカラ。Netflix 字幕仍沒看到）：タイムオークション、バランスマンカラ、ブラインド五目並べ。日本粉絲另有照韓文意譯的寫法（時間オークション、均衡のマンカラ、目隠し五目並べ）。有 Netflix 日本帳號的話，看第 2 集與第 9、10 集的字幕就能確定。
5. ✅ **「每一季一個目錄頁」10/25 做了**：`/season/1`、`/season/2`、`/season/3`（`app/views/SeasonView.tsx`），平台首頁每一季的標題連過去（多一個「看全部 ›」）。排成格子（能玩的排前面、其他照播出順序）、上方一排「第 N 季」切換各季、會被索引（標題與描述列出那一季的遊戲名），分享圖先共用平台那張。卡片抽成 `components/platform/GameCard.tsx` 兩邊共用。
6. ✅ **平台分享圖的拼貼 10/25 決定都留著**，只把棋盤類（Wall Go、尼泊爾虎棋、騎士巡遊）重做：拼貼原本直接拿平台小卡片的圖，那幾張是要配字的（棋盤斜放、偏右），放進拼貼就是歪的、靠邊的。改成擺正的盤面放在卡片正中間、底色用那款自己分享圖的底色（`scripts/og-art/collage.mjs` 的 `BOARDS`）。整面牆照舊斜 12°；`DEG=0` 可以出整面牆也擺正的版本。
7. **要不要推 `feat/platform-bagh`，再併進五條 `feat/game-*`**（10/25 問了還沒回）。這條分支在雲端有十幾個 commit 沒推，但內容全部已經在 `origin/beta` 裡，不會丟。這條分支上的 deploy.yml 只在 `main`、`dev` 有推送時才跑，推了不會部署。
8. ✅ **回大腦筋雲端**：10/25 Zach 說要回、要跟它合作，已回（內容見 §2），等它回 GA 規格。

## 6. 更早的待辦

- **下一款做什麼**：研究推薦、還沒做的是六角數字盤（Hexagon）、方程式金字塔、三顆骰子相同點數、提問與真相、移除一個／大或小、托盤天平，理由與順序見 `docs/games-research.md`〈目前進度〉。第 3 季 11/10 播出後再研究。
- 平衡播棋：AI 補位、再來一局。
- 九子棋：拿子提示的文字。
- 平台正式上線前，Zach 要在正式 Firebase 發布規則：`feedback` 的 `page`／`record` 欄位、`baghRooms`、`turnRooms`、`auctionRooms`。**規則先發布、程式後上線**（順序反過來，新程式的回饋會整筆送不出去）。beta 專案也要貼同一份。
- 設計總表（artifact）：https://claude.ai/artifact/Ky3S2VeCc5CXidHTYfzCtA ——「全部改完在總表放上更新版桌機手機樣式」是 Zach 要的，五款規則頁那批還沒放進去。

## 7. 雲端環境要知道的

- **截圖驗證**：雲端容器**已經內建 Chromium 與 Playwright**（`require('playwright')` 直接能用），**不要** `npx playwright install`（裝了別的版本反而找不到瀏覽器）。`npx next dev` 開起來後用 Playwright 截圖就行（10/25 實測）。要模擬 iPhone 可以用 `webkit`，但驗證 WebKit 專屬問題還是以真機為準。
- **`npm run og:build`**：`CHROME_PATH=/opt/pw-browsers/chromium-1243/chrome-linux64/chrome npm run og:build`（版本號以 `ls /opt/pw-browsers` 為準）。容器是 root，`chrome-text.mjs` 會自動加 `--no-sandbox`。**注意**：Linux 的 Chrome 畫出來的泰文標題跟本機 Mac 的有細微差別，整批重跑會讓所有 `*-th.png`（還有個別幾張）跟著變；只 commit 真的要改的那幾張，其他 `git checkout` 還原。
- **`npm run font:subset`**：原始字型從 `raw.githubusercontent.com` 下載，雲端連得到（10/25 實測）。
- **lint**：交接文件附的 `crop.cjs` 會讓 `npm run lint` 報錯（`require()`），已經隨 bagh-left 一起刪掉。
- **AI 產圖**（OpenAI／Gemini）：金鑰不在雲端。要在雲端用，Zach 在雲端環境的設定（對話標題列的環境選單 → Edit）的 Network secrets（沒有這區就用環境變數）加 `OPENAI_API_KEY`／`GEMINI_API_KEY`，**新開的對話**才讀得到；金鑰不要貼進對話。網路權限也要允許 `api.openai.com`／`generativelanguage.googleapis.com`。不設的話，Zach 在 ChatGPT／Gemini 網頁版畫好、把圖傳進對話，雲端這邊負責裁切、轉 webp、放進專案。
- **環境變數**：開發只需要 `NEXT_PUBLIC_FIREBASE_*`，而且要用 **beta 專案 `quoridor-beta`** 的值（`.github/workflows/deploy.yml` 的 `BETA_FIREBASE_*`；API key 在 Firebase Console）。本機 `.env` 那份是正式資料庫，不要貼。
