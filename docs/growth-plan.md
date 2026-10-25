# 成長規劃：從 Wall Go 到《魔鬼的計謀》遊戲平台

2026-10-17 整理，2026-10-18 補充平台架構、名稱與第 1、2 季遊戲。關鍵字量級來自 Ahrefs 免費版（Keyword Generator，同日實查），只有級距、沒有精確數字。
關鍵字與策略的即時版本在追蹤頁：<https://claude.ai/artifact/6Ras5qijwYKkhce8nGJMck>（站別選「牆壁圍棋」）。

## 0. 現況（2026-10-25）

下面第 1–3 節是 10/17–10/18 的規劃，沒有改寫；跟現況不同的地方在各節開頭標了一行。

- **已經不只兩款**：7 款可以玩（Wall Go、尼泊爾虎棋，加上第二批五款），都在 beta（<https://beta.quoridorgame.com>）。各款進度與下一批見 [games-research.md](games-research.md)〈目前進度〉。
- **平台名定案「骰子惡魔」**（外語 Dice Devil，`app/brand.ts`），長角的藍骰子 logo。**網域還沒換**，照舊 quoridorgame.com。
- **網址已改成一款一個資料夾**（`/wall-go/`、`/bagh-chal/`…），舊網址由 CloudFront 301（`infra/cloudfront-redirects.js`）。這些都在 `feat/platform-bagh`，**還沒上正式站**。
- **原本的 `/games` 遊戲整理頁，變成平台首頁 `/`（依季一排一排）＋季目錄頁 `/season/1`–`/season/3`**。還不能玩的遊戲目前只有名字與「規則整理中」，規則重點、誰贏了還沒寫。
- **上線時機**：平台等 AdSense 審查過（約 11/16 之後）才併進正式站，所以第 3 季（11/10）開播時正式站還是 Wall Go。
- **沒動的**：搬 Cloudflare、換網域（照原計畫等第 3 季播完）、規則頁的李世石對局、PWA。

## 1. 方向

**目標是做成 Netflix 韓綜《魔鬼的計謀》（The Devil's Plan／데블스플랜）的遊戲平台。** 目前只有牆壁圍棋 Wall Go，所以先以它為主。

- **現在不換網域、不改網址。** Wall Go 的流量還小，等有第二款遊戲時再搬，搬家成本最低。
- **有第二款遊戲時，兩件事一次做完**，不要分兩次搬：
  1. 換成中性網域：不放 Netflix、Devil's Plan、魔鬼的計謀等商標。
  2. 網址改成一款遊戲一個資料夾（`/wall-go/`、`/wall-go/rules`、`/<第二款>/`…）。
  - 舊網址全部 301 到新網址，再用 Search Console 的「網址變更」工具通知 Google。
- **在那之前**，新功能不要把 Wall Go 專屬的東西寫死在根網址或共用元件裡，之後拆資料夾才好搬。
- 頁尾註明「非官方粉絲作品，與 Netflix 及節目製作方無關」。

### 2026-10-18 補充決定

- **網址用資料夾，不用子網域**：`新網域/` 是平台首頁，`新網域/wall-go/` 是 Wall Go。
  - 子網域（`wall-go.新網域`）會把排名拆散。
  - 跨子網域換頁是整頁重新載入，換頁轉場會沒有。
  - Firebase UID 的 cookie 要另外改成全網域共用。
  - 「每款遊戲有自己的設計」用資料夾一樣做得到：Next 每個資料夾可以有自己的版面。
- **一款遊戲一個網址，永遠不搬**：不能玩的遊戲也先有頁面（規則、誰贏），做成線上版時在同一個網址加上「開始玩」。
- **做在這個專案裡，不另開新專案**：
  - 沿用 6 語系、字型子集、分享圖、Sentry、打版腳本、GA、Firebase。
  - 開長期分支 `feat/platform`；網域定案後把 GitHub repo 改名。
  - 程式要先整理：`app/game/` 搬到 `app/games/wall-go/`。
- **搬到 Cloudflare**：
  - 同一個網域先搬，SEO 不受影響。
  - 301 改寫在 `_redirects`（固定規則上限 2,000 條，萬用規則 100 條），取代 CloudFront Function。
  - DNS 從 Route 53 移過去。
  - 要關掉 Rocket Loader 與 Email Obfuscation，它們會弄壞 Next 的 hydration。
- **時機**：
  - 第 3 季《The Devil's Plan: Dead Again》**2026-11-10** 上線。
  - 換網域會讓排名波動好幾週，不要撞在播出期間。
  - 11/10 前只做「搬 Cloudflare（同網域）、遊戲整理頁、標題文案」，換網域與改網址等第 3 季播完再做。
- **換網域時的 Search Console**：
  - 新網域另外建「網域」類型的資源。
  - 舊資源保留，301 上線後從舊資源用「網址變更」工具通知 Google。
  - 新網域另外提交 sitemap。
  - BigQuery 匯出開新的資料集。
- **風險**：Firebase 免費方案同時只能有 100 條連線，第 3 季的流量可能撞到上限，到時候要觀察連線數。

### 平台名稱與網域（未定案）

> 10/25：名稱定案「骰子惡魔」（Dice Devil），沒有用下面的候選；網域還沒換。

- 候選 **MOU（謀）**：
  - 中、日、韓都能從「謀」聯想到計謀。
  - 可註冊：`mou.gg`、`mouroom.com`、`mougames.com`、`playmou.com`（2026-10-18 查 whois）。
  - 決定前要查商標（智慧局、WIPO）。
- 其他可註冊的：
  - `nimroom.com`／`.gg`（Nim 是經典的數學策略遊戲）
  - `nemesisroom.com`、`mischiefroom.com`、`mindplot.gg`
  - `gambitroom.com`／`.gg`、`thinkduel.com`／`.gg`
- 選 M 不選 N：紅黑配色再配 N 開頭的單字母 logo，會太像 Netflix。

### 平台首頁的視覺

- 設計稿：<https://claude.ai/artifact/R9ABBvxrS7yGXSbvfb8jbu>（桌機、手機）。
- 平台外殼：
  - Netflix 式的深色底（網站墨色 `#141010`）。
  - 上方是推薦作品的大區塊，下面依季一排一排橫向捲動，播出中的那一季排最上面。
- 強調色是 Netflix 式的紅（`#e21f26`）：
  - 紅字只用在大字（深色底上約 3.9:1），小字一律紅底白字。
  - 不用 Netflix 的「N」標誌、字標與專屬字型。
- 各遊戲保留自己的設計：Wall Go 的主視覺是它自己的藍底與棋盤。
- 影像素材：
  - 節目劇照、官方海報不能用（版權）。
  - 能玩的遊戲用自己的遊戲畫面當主視覺（Wall Go 已經這樣做）。
  - 還不能玩的遊戲用大字標題卡。

## 2. 關鍵字現況

### Wall Go 本身：量小，但幾乎沒有對手

每個詞的月量都不到 100。不過台灣光「牆壁圍棋」就有約 28 種搜法，前幾名幾乎都是節目介紹文，沒有能玩的遊戲站。

**目標：各語系的每一種搜法都排第一，而不是追大量。**

| 語系 | 關鍵字 | 月量 | 落地頁 | 狀態 |
|---|---|---|---|---|
| 繁中 | 牆壁圍棋、牆壁圍棋 線上、魔鬼的計謀 牆壁圍棋 | 各 <100 | `/` | 已上線 |
| 繁中 | 牆壁圍棋 規則、牆壁圍棋 玩法 | 各 <100 | `/rules` | 已上線 |
| 繁中 | 牆壁圍棋 app | <100 | `/` | 待做（PWA） |
| 繁中 | 牆壁圍棋 李世石 | <100 | `/rules` | 待做（李世石段落） |
| 繁中 | 牆壁圍棋 桌遊 | <100 | — | 後做（想買實體棋盤） |
| 英文 | wall go、wall go game、wall go online | 各 <100 | `/en` | 已上線 |
| 英文 | wall go board game | <100 | — | 後做 |
| 韓文 | 벽바둑、벽바둑 온라인 | 各 <100 | `/ko` | 已上線 |
| 韓文 | 이세돌 벽바둑 | <100 | `/ko/rules` | 待做 |
| 韓文 | 벽바둑 구매 | <100 | — | 後做（想買實體棋盤） |
| 日文 | 壁囲碁 | 未查 | `/ja` | 已上線 |

### 節目名：量大很多，而且都標 Easy

| 市場 | 關鍵字 | 月量 | 難度 |
|---|---|---|---|
| 台灣 | **魔鬼的計謀** | **>1,000** | Easy |
| 台灣 | 魔鬼的計謀2、魔鬼的計謀 第二季、第一季 | 各 >100 | Easy |
| 台灣 | 魔鬼的計謀 遊戲、魔鬼的計謀第三季 | 各 <100 | — |
| 美國 | devils plan、the devils plan、devils plan season 3 | 各 >100 | Easy |
| 美國 | devils plan season 2 | >100 | Medium |
| 日本 | デビルズプラン、デビルズプラン シーズン3 | 各 >100 | Easy |
| 韓國 | 데블스플랜、데블스플랜3 | 各 >100 | Easy |
| 韓國 | 데블스플랜 게임 정리、데블스플랜 게임 종류 | 各 <100 | — |

**判讀**

- **第 3 季的詞已經在各國冒出來。** 美、日、韓都有人在搜，台灣也開始有。播出前後量會暴增，這是最大的時事機會。
- **只搜節目名的人多半在找演員、冠軍、線上看。** 首頁很難只靠遊戲排上去，但標題寫進節目名仍然有機會被點。
- **「遊戲整理」才是對得上的意圖。** 韓國已經有人搜「데블스플랜 게임 정리」（遊戲整理）。

## 3. 要做的事

### 現在

> 10/25 進度：第 1 項做了（六個語系的 Wall Go 標題都帶節目名，例如 `牆壁圍棋 Wall Go 線上免費玩 | 魔鬼的計謀：死亡密室`）；第 2 項變成平台首頁＋季目錄頁（見第 0 節）；第 3、4 項還沒做。

1. **標題與說明補上節目名與各種搜法**（改 `app/i18n/messages/*.ts` 的 `titleDefault`、`metaTitle`、`keywords`）
   - 首頁標題寫法，例如：`牆壁圍棋 Wall Go 線上免費玩｜Netflix《魔鬼的計謀》遊戲`。
   - 說明與內文補上「線上」「規則」「玩法」「app」與「Netflix 韓綜」。
   - 各語系用當地的節目名：
     - 英文 The Devil's Plan
     - 日文 デビルズプラン
     - 韓文 데블스플랜
     - 簡中跟泰文依 `glossary.md`
   - 改完記得跑 `og:build`。
2. **新頁：節目裡的遊戲整理**（暫定路由 `/games`，各語系都要有）
   - 一季一段，每款遊戲寫：
     - 規則重點
     - 誰贏了
     - 能不能在站上玩（目前只有 Wall Go 能玩，其他標「還沒做」）
   - 標題放各語系的節目名，再加「遊戲、規則」。例如：`魔鬼的計謀 遊戲整理：第 1、2 季每款遊戲規則`。
   - 這頁同時是將來平台首頁的雛形，換網域時直接搬成新站的首頁。
   - 第 1、2 季的遊戲資料先上網整理一份，由 Zach 核對後再寫進頁面。
3. **規則頁加一段節目裡李世石（이세돌）的對局**，接住「牆壁圍棋 李世石」「이세돌 벽바둑」。
4. **做成可加到主畫面的 PWA**
   - 補 manifest，離線也能單人玩。
   - 規則頁寫怎麼加到主畫面，接住「牆壁圍棋 app」。

### 第 1、2 季的遊戲與搜尋訊號（2026-10-18）

> 每款遊戲的完整規則、源自哪款桌遊、能不能做原版、可行性與推薦順序，見 [games-research.md](games-research.md)（2026-10-19）。

遊戲清單取自 Wikipedia。訊號用 Google 自動完成查：Google 只會建議有一定搜尋量的詞，所以只能看出「有沒有人搜」，**不是搜尋量**；確切數字要再用 Ahrefs 查。

**整體需求：遊戲清單、規則、線上玩**

| 語系 | 自動完成出現的詞 |
|---|---|
| 英文 | `the devil's plan games list`、`games list pdf`、`game rules pdf`、`the devil's plan games online` |
| 韓文 | `데블스플랜 게임 정리`、`게임 종류`、`바이러스 게임` |
| 繁中 | `魔鬼的計謀 遊戲規則`、`遊戲介紹`、`第二季 遊戲` |
| 日文 | `デビルズプラン ゲーム 一覧`、`ゲーム アプリ`（想找可以玩的） |

→ 遊戲整理頁各語系都有需求；有人搜 pdf，代表也想要可以列印的規則。

**第 1 季（2023，冠軍：河錫辰）**

- 主賽：Virus Game、Rules Race、Secret Number、Zoo、Laying Grass、Equation High-Low
- 獎金賽：Cooperative Puzzle、Fragments of Memory、Word Tower、Scale Game、Montage、Four Player Three in a Row
- 監獄：Blind Gomoku
- 決賽：Nine Men's Morris、Hexagon

**第 2 季《死亡密室》（2025，冠軍：鄭賢圭）**

- 主賽：Crooked Cops、Unknown、Halloween Monster、Treasure Island、Balance Mancala、Doubt and Bet
- 監獄：Remove One、Time Auction、Sniper Hold'em、Triple Dice、**Wall Go**、Equation Pyramid
- 決賽：Big Small、Bagh Chal、Question and Truth
- 隱藏關卡：Knight's Tour

**單款訊號（★ 越多越強）**

| 遊戲 | 季 | 英 | 韓 | 繁中 | 有人搜「X game online」 | 做成線上版 |
|---|---|---|---|---|---|---|
| Balance Mancala | 2 | ★★★ | — | — | — | 中：抽象棋類，可以做 AI |
| **Time Auction** | 2 | ★★★ | 시간경매 | 時間拍賣 | ✓ | **低**：兩人、規則簡單 |
| Sniper Hold'em | 2 | ★★ | 저격홀덤 | 狙擊撲克 | — | 中：多人撲克 |
| **Equation Pyramid／High-Low** | 2／1 | ★★ | — | — | ✓ | **低**：一個人就能玩的數學謎題 |
| Secret Number、Virus Game | 1 | ★★ | 바이러스 게임 | ✓ | — | 高：需要很多人 |
| Halloween Monster、Question and Truth | 2 | ★★ | ✓ | 萬聖節怪物 | — | 高 |
| Laying Grass | 1 | ★ | — | — | ✓ | 中：類似 Blokus |
| Unknown、Remove One、Triple Dice、Treasure Island | 2 | ★ | 언노운、하나빼기 | — | — | 低～中 |
| Nine Men's Morris、Hexagon、Bagh Chal | 決賽 | 傳統棋本身的量 | — | — | 很多 | 不做：已經有大量網站 |

- **競爭者**：只找到 Time Auction 的策略模擬器（GitHub 上的程式，不是可以玩的網站）和論壇上的文字版粉絲遊戲，還沒有人做成可以直接玩的網站。
- **第二款可玩遊戲的候選**：
  - **Time Auction**：三語都有訊號、最簡單，可沿用連線房間。
  - **Equation Pyramid**：適合做成每日謎題，拉回訪。
  - **Balance Mancala**：英文訊號最強，但工作量大。
  - 第 3 季播出後看哪款紅，再決定第三款。

### 時事：第 3 季

> 10/25：平台首頁與 `/season/3` 已經有第 3 季的段落（「11/10 上線」標籤、播出後每週更新的說明），等播出再補遊戲。「做第二款」那條已經不適用（現在是 7 款）。

- 播出前先把遊戲整理頁準備好第 3 季的段落（標題寫「第三季」「season 3」「シーズン3」「데블스플랜3」）。
- 播出當週更新每款遊戲。
- 如果第 3 季有適合做成線上版的棋類遊戲，就做第二款，同時啟動第 1 節的換網域＋改網址。

### 流量：主要靠社群，不靠搜尋

搜尋量有限，房間連結的分享本身就是拉新。在下面這些地方放可以直接開打的連結：

- PTT 桌遊板
- Dcard
- Threads
- 韓國 데블스플랜 갤러리

### 追蹤

- Search Console 已匯出到 BigQuery：專案 `sites-data-511904`，資料集 `searchconsole_quoridorgame`（asia-east1），2026-10-17 開通，不回溯。
- **GA4 也要開每日匯出到同一個專案**（位置選 asia-east1）。要追的數字：
  - `mode_select` → `game_start` → `game_end` 的完成率
  - 各難度的勝率
- GSC 資料進來後，追蹤頁的排名、曝光、點擊欄位改成直接查 BigQuery。另外列出「有曝光但不在清單裡」的詞，當作下一批要補的內容。

### 變現

> 10/25：平台要等 AdSense 審查過才上線（大腦筋估 11/16 之後）。在那之前 beta 與正式站都不載廣告程式碼，`ads.txt` 留著。

- 廣告只放在結算畫面。對局中不放，會誤點，也會擋到棋盤。
- 有桌遊意圖的詞（牆壁圍棋 桌遊、wall go board game、벽바둑 구매），之後可以接可列印棋盤，或實體桌遊的聯盟連結。
