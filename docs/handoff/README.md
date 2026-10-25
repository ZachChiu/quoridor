# 交接：2026-10-25 本機 → Claude Code 雲端

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
- **雲端收不到也回不了大腦筋的訊息**：要報的事寫成一段文字給 Zach，請他轉貼。

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

## 5. 等 Zach 決定的事（不要自己選）

1. **尼泊爾虎棋桌機首頁左邊的圖**（`app/views/BaghChalView.tsx` 的 `chase.webp`，目前是 AI 畫的老虎追羊）。Zach 要「跟其他棋一樣從網路找視覺圖」。找不到「老虎和羊同框、南亞傳統、授權乾淨」的原件，候選都是印度拉賈斯坦 Kota 派的老虎畫（CC0，沒有羊）：
   - A（推薦）Cleveland Museum of Art 1991.168《Tiger Hunt of Ram Singh II》約 1830–40：紫色懸崖上的大老虎
   - B Cleveland 1985.64《Tiger Hunt》約 1800：老虎躍出綠林，下緣有獵人
   - C Met 2019.445.4《Study for a Tiger Hunt》1780：淡彩習作，最融合但縮小偏弱
   - 另一個選項：老虎原件＋芝加哥藝術博物館 1919.944 蒙兀兒的山羊畫（約 1600，CC0）並排
   - 不能用：Met 2008.359.50（捐贈者是被定罪的文物走私者 Subhash Kapoor）；大英博物館的 Gazi 卷軸（CC BY-NC-SA）
   - 裁好的方圖與換上去的比較圖在 `docs/handoff/bagh-left/`（`compare.jpg`；裁切參數在 `crop.cjs`，原圖要從博物館 Open Access 重新下載）。選定後還要補出處說明（規則頁的出處段）。
2. **骰子惡魔 logo 收到角落**（Zach 嫌它在各遊戲首頁太搶眼）：A＝28px、換成那款自己的墨色（用 `public/brand/die-mark-mono.svg` 當遮罩）；B＝28px、原本的藍淡到 45%。比較圖 `docs/handoff/logo-corner/options-phone.jpg`，做法在 `opts.mjs`（是注入 CSS 的示意，還沒改程式）。
3. **泰文的遊戲名**：泰國那邊講這些遊戲都用英文名，平台卡片維持英文。但五款遊戲裡的泰文標題是當初自己翻的（例如時間拍賣 ประมูลเวลา），沒人這樣叫，跟卡片也對不上。A（推薦）改成「英文名＋泰文說明副名」，跟尼泊爾虎棋泰文頁一樣；B 保留泰文標題，但要找泰文母語者確認。
4. **日文中等信心的三個名字**：タイムオークション、バランスマンカラ、ブラインド五目並べ。日本粉絲另有照韓文意譯的寫法（時間オークション、均衡のマンカラ、目隠し五目並べ）。有 Netflix 日本帳號的話，看第 2 集與第 9、10 集的字幕就能確定。
5. **「每一季一個目錄頁」**：Zach 問過「點進每一季可以看遊戲的第二季目錄如何（分類頁的概念）」，我說了看法、提議做示意，他還沒回。
6. **平台分享圖的拼貼含了還沒在平台上開的五款**：等平台正式上線時，看要不要只留能玩的。

## 6. 更早的待辦

- 平衡播棋：AI 補位、再來一局。
- 九子棋：拿子提示的文字。
- 平台正式上線前，Zach 要在正式 Firebase 發布規則：`feedback` 的 `page`／`record` 欄位、`baghRooms`、`turnRooms`、`auctionRooms`。**規則先發布、程式後上線**（順序反過來，新程式的回饋會整筆送不出去）。beta 專案也要貼同一份。
- 可以順便跟大腦筋說平台名定案了（骰子惡魔／Dice Devil）。
- 設計總表（artifact）：https://claude.ai/artifact/Ky3S2VeCc5CXidHTYfzCtA ——「全部改完在總表放上更新版桌機手機樣式」是 Zach 要的，五款規則頁那批還沒放進去。

## 7. 雲端環境要知道的

- **截圖驗證**：本機用的是別的專案裡的 playwright-core，雲端沒有。要截圖就 `npx playwright install chromium`（網路權限要 Full，或自訂允許 Playwright 的下載網域）。
- **`npm run og:build`**：泰文標題由 Chrome 畫（`scripts/lib/chrome-text.mjs`），要設 `CHROME_PATH` 指到雲端的 Chromium。字型從 `fonts.googleapis.com` 抓。
- **`npm run font:subset`**：原始字型從 `raw.githubusercontent.com` 下載。
- **AI 產圖**（OpenAI／Gemini）：金鑰不在雲端，要用請 Zach 決定怎麼給（文件建議用 network secret）。
- **環境變數**：開發只需要 `NEXT_PUBLIC_FIREBASE_*`，而且要用 **beta 專案 `quoridor-beta`** 的值（`.github/workflows/deploy.yml` 的 `BETA_FIREBASE_*`；API key 在 Firebase Console）。本機 `.env` 那份是正式資料庫，不要貼。
