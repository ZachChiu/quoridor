# 下一批做哪幾款：第 1、2 季還沒做的遊戲＋關鍵字

> 2026-11-01 寫。接著 `games-research.md`（10/19 總覽）、`games-deep-s1.md`、`games-deep-s2.md`（10/20 細查）往下做。
> 規則細節、網頁版設計、連線做法那三份都寫過了，這份**不重寫**，只補兩件事：
> 1. 關鍵字（各語系有沒有人在搜、競品強不強），
> 2. 依這些重新排出下一批的順序。
>
> 第 3 季《Dead Again》11/10 才播，遊戲還不知道，不在這份裡。

## 先講結論

**建議順序**

| 名次 | 遊戲（節目名 → 網頁上做什麼） | 一句話理由 |
|---|---|---|
| 1 | **Doubt and Bet → 大話骰（Liar's Dice）**，節目的彩色牌版當變體 | 還沒做的遊戲裡**唯一有大量常年搜尋**的；六個語系都有人搜「線上／app／規則」；中文、韓文、泰文找不到網頁版；傳統遊戲；平台叫「骰子惡魔」，骰子遊戲正好 |
| 2 | **Hexagon（六角數字盤）** | S1 決賽第 2 戰，跟九子棋湊成完整的 S1 決賽；全網沒有網頁版（只有 iOS App）；單人、工作量小、可做每日一題 |
| 3 | **Triple Dice（三顆骰子相同點數）** | 跟大話骰共用「公平骰子」那套連線做法，做完第 1 名再做成本低；沒有競品；好玩（4/5） |
| 4 | **Question and Truth（提問與真相）**，先做單人推理模式 | S2 決賽第 3 戰；英文「break the code game online」有一定量的需求；沒有照節目規則做的網頁版 |
| 5 | **Equation Pyramid（方程式金字塔）** | 跟 Hexagon 共用骨架，順手做；繁中自動完成直接補成「魔鬼的計謀2 方程式金字塔」；英文粉絲版很多，但都只有英文 |

**關鍵字的關鍵發現**

- **「節目名＋遊戲名」的搜尋量都很小**。DataForSEO（大腦筋 11/1 查的）裡 `time auction devils plan`、`devils plan unknown rules`、`devils plan wall go game` 在美國都只有每月 10 次；`魔鬼的計謀 遊戲` 50、`데블스플랜 게임` 40。節目原創的那些遊戲（Hexagon、Equation Pyramid、Triple Dice、Remove One、Big Small…）**各自能帶來的搜尋量推估都在每月幾十次以內**，播出期間會衝高。
- **真正的量在「節目用到的傳統遊戲」**。已上線的虎棋、九子棋就是這樣（`bagh chal` 390、`ナインメンズモリス` 1,000）。還沒做的遊戲裡，只有 Doubt and Bet 背後的大話骰是這種情況。
- **大話骰的需求跨六個語系**：英文自動完成有 online free／ai／with friends／multiplayer；繁中 `大話骰線上`、`吹牛骰子線上`；簡中 `大话骰online`；日文 `ライアーズダイス アプリ`；韓文 `라이어스 다이스 룰`；泰文 `ลูกเต๋าโกหก` 一整串（เล่นยังไง、แอพ、กติกา）。中文維基「大話骰」每月 2,689 次瀏覽，比「五子棋」的 2,190 次還多。
- **競品**：英文 Liar's Dice 已經有 5、6 個小網站（funnode、liarsbar.io、liars-dice.net…），不好搶第一頁。**中文、韓文、泰文只找到 App，沒有網頁版**；Board Game Arena 有授權的 Perudo，但是英文介面、要註冊。
- 新冒出來的粉絲競品 **mindverse.games**（英、韓）：已經有 Big or Small、Tiger & Goat、Sniper Hold'em、Minus One（Remove One）。加上舊的 the-devils-plan.vercel.app（Remove One、Time Auction、Knight's Tour、Wall Baduk），**Remove One、Big Small 這兩款已經有人做了**，往後排。

**哪些是推估**：除了表上標「DataForSEO」的數字，**其他搜尋量都是推估**，依據是 Google 自動完成、維基百科瀏覽數、搜尋結果裡的競品。每一款的依據寫在〈各款評估〉裡，驗證方式見〈怎麼驗證〉。

---

## 範圍

**已上線**：Wall Go、尼泊爾虎棋、九子棋、騎士巡遊。

**已在做（有分支，不重做研究，排名時列為已在做）**：盲五子棋、時間拍賣、平衡播棋。

**這份評估的**：第 1、2 季其餘全部。下面分三層：

- 第一層：值得做，進排名（7 款）。
- 第二層：可以做但不划算（4 款）。
- 第三層：不建議做（理由沿用前三份研究，只列名字）。

---

## 怎麼查的、數字的可信度

| 來源 | 給什麼 | 可信度 |
|---|---|---|
| DataForSEO（大腦筋 11/1，`sites-data/research_notes/dataforseo/dd_*`） | 每月搜尋量、KD | **實測**。但只查過平台與已上線遊戲的詞，這份要的詞大多沒查 |
| Google 自動完成（11/1 用 suggestqueries 介面查，hl／gl 設成各語系） | 「有沒有人在搜」與搜什麼 | 有出現＝有一定量；**看不出多少** |
| 維基百科瀏覽數（Wikimedia API，2025-11～2026-10 月平均） | 主題本身的熱度 | 只能當相對比較；用虎棋、九子棋校正過（見下） |
| WebSearch（美國）＋WebFetch | 競品是誰、有沒有網頁版 | 韓文、日文、中文的搜尋結果**是美國的結果**，不代表當地排名 |

**校正**：已知 `bagh chal` 美國每月 390 次、英文維基 Bagh-chal 頁每月約 1,130 次瀏覽 → 大約 1 次搜尋對 3 次瀏覽。英文維基 Nine men's morris 每月 7,794 次，對應 Ahrefs 的 `nine men's morris` 超過 1,000、`nine mens morris online` 260。下面的英文推估用這兩組比例換算，**只能當量級**。

**維基瀏覽數（月平均，2025-11～2026-10）**

| 頁面 | 英文 | 其他語系 |
|---|---|---|
| The Devil's Plan（節目） | 17,527 | 韓 135 |
| Liar's dice（大話骰） | **7,235** | 中「大話骰」**2,689**；日「ブラフ (ゲーム)」204 |
| Gomoku（五子棋，盲五子棋已在做） | 7,041 | 中 2,190、日 2,270、韓 153、泰 31 |
| Mancala（播棋，平衡播棋已在做） | 16,227 | 日 1,012、中 290、韓 128 |
| Nine men's morris（已上線，校正用） | 7,794 | — |
| Bagh-chal（已上線，校正用） | 1,130 | — |
| Mastermind（猜密碼，Question and Truth 的近親） | 10,595 | — |
| Bulls and cows | 1,448 | — |
| Balance puzzle（天秤謎題，Scale Game 的近親） | 1,871 | — |
| 24 (puzzle)（算 24，Equation Pyramid 的近親） | 1,189 | — |
| Blokus（Laying Grass 的近親） | 2,135 | — |
| Gobblet（4人三子棋的近親） | 263 | — |
| Texas hold 'em（Sniper Hold'em 的底子） | 43,566 | — |

---

## 各款評估

欄位：
- **忠實度**：照節目規則能不能在純客戶端做出來（高／中／低）。
- **人數**：節目幾人 → 網頁建議。
- **版權**：🟢 傳統公有領域　🟡 像某款商業桌遊　⚪ 節目原創機制（機制本身一般不受著作權保護，但不用節目的名稱美術）。
- **工作量**：以 Bagh Chal（約 2,000 行、55 檔）為「小」。

### 第一層：進排名

#### 1. Doubt and Bet（의심 베팅，S2 第 6 天主賽）→ 大話骰

| 項目 | 判斷 |
|---|---|
| 忠實度 | 節目版是 60 張彩色牌、押片數，連線要「不重複發牌」很難；**改做傳統骰子版**就完全可做（`games-deep-s2.md` §9 已建議）。節目的彩色牌版可以當單人對電腦的變體 |
| 人數 | 5 → 2–6，電腦補位；單人對電腦是主力 |
| 版權 | 🟢 大話骰／Dudo 是傳統遊戲。**不要用「Perudo」「Bluff」**，那是商業名稱 |
| 工作量 | 中：機率型電腦（二項分布＋虛張）、骰子介面、連線的公平骰子（各人秘密＋公開亂數，`games-deep-s2.md`〈共用技術〉） |
| 好玩 | 4/5，經典派對遊戲 |

**搜尋（11/1 自動完成）**

| 語系 | 有出現的詞 |
|---|---|
| en | liar's dice online、online free、online ai、online with friends、online multiplayer、rules、rules pdf；doubt and bet devil's plan rules |
| zh-TW | 大話骰線上、大話骰玩法、規則、技巧、app；吹牛骰子線上、吹牛骰子規則、吹牛骰子遊戲 |
| zh-Hans | 大话骰online、大话骰怎么玩；吹牛骰子 线上 |
| ja | ライアーズダイス ルール、アプリ、ボードゲーム、ゲーム |
| ko | 라이어스 다이스 룰、규칙、보드게임；의심 베팅、데블스 플랜 의심 베팅 |
| th | ลูกเต๋าโกหก เล่นยังไง、เกม ลูกเต๋าโกหก、แอพ、กติกา |

- **量級推估**：英文 `liar's dice` 系列每月數千次、`liar's dice online` 系列每月數百次（依據：維基 7,235 次瀏覽，跟九子棋同級；自動完成的 online 延伸詞有 6 個）。中文推估跟五子棋同級（維基 2,689 vs 2,190）。泰文、韓文、日文只知道「有」，沒有量。
- **競品**：
  - 英文：[funnode](https://www.funnode.com/games/liars-dice)、[liarsbar.io](https://liarsbar.io/)、[liars-dice.net](https://liars-dice.net/)、[arcadiagames.io](https://arcadiagames.io/games/liars-dice)、[gameyantra](https://gameyantra.com/games/liarsdice/)、[boardgame.pp.ua](https://boardgame.pp.ua/en/liars-dice)。都是小站，但數量多，英文第一頁不好擠。
  - 中文：只找到 App（[大話骰(多人對戰)](https://apps.apple.com/hk/app/%E5%A4%A7%E8%A9%B1%E9%AA%B0-%E5%A4%9A%E4%BA%BA%E5%B0%8D%E6%88%B0/id773491532)、[大话骰-Online](https://apps.apple.com/us/app/id1462154611)、十八辣），**沒有網頁版**。BGA 有授權的「吹牛」（[Perudo](https://zh.boardgamearena.com/gamepanel?game=dudo)），要註冊。
  - 韓文、日文：BGA 的 [Mia](https://ko.boardgamearena.com/gamepanel?game=mia)（兩顆骰的近親，不是大話骰）。沒找到當地語系的網頁版。
- **跟節目的關係**：namu 明寫 Doubt and Bet 的原型是 Perudo。頁面可以寫「《魔鬼的計謀2》Doubt and Bet 的原型」，就像虎棋頁寫節目決賽。

**為什麼排第一**：還沒做的遊戲裡，只有它有虎棋、九子棋那種「傳統遊戲本身的常年搜尋」。節目原創的遊戲只在播出期間有人搜，量是每月幾十次的等級。「免下載、免註冊、手機跟朋友開房」正好是中文、韓文、泰文搜尋結果裡缺的東西。平台叫骰子惡魔、logo 是骰子，第一款骰子遊戲也順理成章。

**風險**：
- 港澳、兩廣是喝酒遊戲，要避免「喝酒」字眼；押的是骰子不是錢，AdSense 上算一般休閒遊戲。
- 規則各地不同（1 點算不算萬用、齋、飛）。預設用 Dudo 標準規則（1 點萬用、叫 1 之後變齋），其他做成開關。規則頁寫清楚，順便接「大話骰規則」「大話骰玩法」這些詞。

#### 2. Hexagon（헥사곤，S1 決賽第 2 戰）

| 項目 | 判斷 |
|---|---|
| 忠實度 | 高。規則與節目 10 盤的實際數字都有（`games-deep-s1.md` §1） |
| 人數 | 2 → 單人（每日一題），連線搶答之後再說 |
| 版權 | ⚪ 節目原創，機制是「記數字、找三格加總」，名稱是一般詞 |
| 工作量 | 小 |
| 好玩 | 3/5 |

- **搜尋**：en `devil's plan hexagon game`、`hexagon game devil's plan`；ko 只有 `데블스 플랜 헥사곤`；ja、zh-TW 沒有。**推估每月幾十次以內**。
- **競品**：只有 iOS App [Hexagon: The Devil's Plan](https://apps.apple.com/ag/app/hexagon/id6470591938)。英文搜尋 `hexagon` 被 Super Hexagon、Cool Math 佔滿，但加了 devil's plan 就沒有網頁版。
- **為什麼排第二**：搜尋量小，但工作量最小、沒人做網頁版，而且補齊 S1 決賽（九子棋＋Hexagon）。每日一題能讓人回來，對 AdSense 也是「有內容」的頁。

#### 3. Triple Dice（트리플 다이스，S2 第 4 天監獄賽）

| 項目 | 判斷 |
|---|---|
| 忠實度 | 高（RULE 卡完整，`games-deep-s2.md` §6） |
| 人數 | 4 → 固定 4 席，電腦補 |
| 版權 | 🟡 機制像 Skull King 的「預測自己得分」，但這是常見機制，名稱是一般詞 |
| 工作量 | 中。**做完大話骰之後變成中偏小**：公平骰子、隱藏骰、密封預測的連線做法共用 |
| 好玩 | 4/5 |

- **搜尋**：en `triple dice game devil's plan`、`devil's plan triple dice rules`、`devil's plan season 2 triple dice`；ko `데블스 플랜 트리플 다이스`。**推估每月幾十次以內**。
- **競品**：沒有網頁版（[scriptedmurder.com](https://www.scriptedmurder.com/devils-plan) 是線下粉絲活動，列了這款，但不是可玩的網頁）。

#### 4. Question and Truth（질문과 진실，S2 決賽第 3 戰）

| 項目 | 判斷 |
|---|---|
| 忠實度 | 高（`games-deep-s2.md` §5）；對戰版要 commit-reveal 藏牌 |
| 人數 | 2 → 先做單人（電腦藏牌、你來問、比題數），對戰之後 |
| 版權 | 🟡 Medium 說像 IELLO 的商業桌遊 Break the Code（倉橋良平）。**不用它的名字和問題卡原文**，照節目的 11 題自己寫 |
| 工作量 | 中（單人）～大（對戰） |
| 好玩 | 推理迷 4/5 |

- **搜尋**：en `question and truth devil's plan`、`question and truth game`；ko `데블스플랜 질문과 진실`。近親需求：en `break the code game online`、`… online free`（自動完成有），Mastermind 維基每月 10,595 次。
- **競品**：Break the Code 本身在 [BGA](https://en.boardgamearena.com/gamepanel?game=breakthecode) 有授權版；照節目規則的只有幾個 GitHub 專案，沒看到上線網址。
- **為什麼第四**：S2 三場決賽已經做了虎棋，這是第二場能做的（Big Small 有競品）。推理類有「猜密碼」這種大主題可以接，但標題不能用 Break the Code。

#### 5. Equation Pyramid（수식 피라미드，S2 第 6 天監獄賽）

| 項目 | 判斷 |
|---|---|
| 忠實度 | 高；解答器已經在 `docs/research/pyramid_solver.py`，10 回合跟節目一致 |
| 人數 | 2 → 單人每日一題＋本機搶答 |
| 版權 | ⚪ |
| 工作量 | 小（跟 Hexagon 共用「每日一題」的骨架） |
| 好玩 | 3/5 |

- **搜尋**：en `equation pyramid game online`、`equation pyramid game devil's plan`；**zh-TW 輸入「方程式金字塔」，自動完成直接補成「魔鬼的計謀2 方程式金字塔」**（10/20 查「算式金字塔」時沒有，站上用的名字才對）；ko `데블스플랜 수식피라미드`。推估每月幾十次。
- **競品最多**：[equation-pyramid.vercel.app](https://easonchang-9a3t42ds5-eason-changs-projects.vercel.app/posts/equation-pyramid)（開源）、[itch.io Adam Banks](https://adam-banks.itch.io)、iOS [EP: Equation Pyramid](https://apps.apple.com/app/id6747661805)（含繁中）、GitHub 十幾個粉絲版。**網頁版都只有英文**，繁中、韓文、日文還空著。

#### 6.（備選）Four Player Three in a Row（4인 3목，S1 第 6 天獎金賽）

- 忠實度高、輪流、全公開；但**要先做 4 人房**（平衡播棋的 4–7 人 `turnRooms` 已經有，可以參考）。工作量中。版權 ⚪（像 Gobblet）。
- 搜尋：en `4 player 3 in a row online`、`… board game`、`… korean game`。有人在 [MakerWorld](https://makerworld.com/en/models/66415) 放 3D 列印檔，代表有人想實際玩。沒有網頁版。
- 排第六：4 人才好玩，電腦補 3 席的 AI 要多人搜尋。

#### 7.（備選）Laying Grass（땅따먹기，S1 第 5 天主賽）

- 英文自動完成有 `laying grass game online`、`laying grass board game`，沒有網頁版。
- 但 96 塊拼圖的形狀只有截圖、手機上難操作、機制像 Blokus（🟡）。工作量大。

### 第二層：可以做但不划算

| 遊戲 | 為什麼往後排 |
|---|---|
| Remove One（S2 D1） | 已有 [the-devils-plan.vercel.app](https://the-devils-plan.vercel.app/) 連線版、[mindverse.games](https://mindverse.games/shows/the-devils-plan/) 的 Minus One；韓文「하나빼기」被《魷魚遊戲》佔走 |
| Big Small（S2 決賽①） | mindverse.games 已經有；自動完成只有 `devils plan big or small` |
| Scale Game（S1 D4） | 單人謎題、好做，但三個語系幾乎沒有自動完成；近親「balance puzzle」維基每月 1,871 次。可以當 Hexagon 之後的第二個每日題 |
| Sniper Hold'em（S2 D3） | 韓文 `저격 홀덤 룰／족보`、英文 `sniper holdem rules` 有人搜；但撲克有賭博觀感（AdSense 風險），mindverse 已經有 |

### 第三層：不建議做

理由見 `games-research.md`〈目前進度〉，這次沒有新證據推翻：病毒遊戲、規則競賽、腐敗警察（要很多人或主持）；合作拼圖、找鑰匙、蒙太奇、記憶碎片（靠實體道具或素材）；寶藏島、未知、萬聖節怪物（盤面不完整）；動物園、單字塔、秘密數字、數學式比大小（後者英文名已被商業桌遊用掉）。

---

## 已在做的三款：順手可以接的大詞

不是新遊戲，但這次查到的數字對它們有用，記在這裡給各自的分支：

- **盲五子棋 → 一般五子棋**：`gomoku online` 的自動完成有 10 個延伸（2 player、with friends、bot、ai…）；`五子棋 線上`（線上玩、雙人、對戰、電腦）、`오목 온라인`（사이트、2인、1대1、친구랑、ai）、`五目並べ オンライン`（友達、対戦、無料）都有。維基中、日各 2,000 多次。**盲五子棋頁加一個「一般五子棋」模式，或另開一頁**，接得到的量比盲五子棋本身大很多。
- **平衡播棋 → 傳統 Kalah**：`mancala online` Ahrefs 標 >1K（Hard，`sites-data/research/opportunities.json`）；`만칼라 온라인／게임하기／규칙`、`マンカラ 無料ゲーム／遊び方` 都有。英文競爭強，日、韓可以試。`games-research.md` 原本就建議同一頁順手做 Kalah。

---

## 建議的製作順序與理由

1. **大話骰**（中）——唯一有大量常年搜尋的；中、韓、泰沒有網頁版；做出來的公平骰子協定給第 3 名用。
2. **Hexagon**（小）——補齊 S1 決賽、沒有網頁版、每日一題。
3. **Triple Dice**（做完 1 之後中偏小）——共用骰子協定，沒有競品。
4. **Question and Truth 單人模式**（中）——S2 決賽，推理類有大主題可接。
5. **Equation Pyramid**（小）——跟 Hexagon 一起，搶繁中、韓、日。

**時間點**：第 3 季 11/10 開播，那幾週「魔鬼的計謀 遊戲」「devil's plan games online」這種平台詞會變多（自動完成英文、泰文都已經有 `devil's plan game(s) online`）。第 3 季的遊戲播出後，可能有比上面更好的候選，**第 3 季播完再排一次**。如果要在開播期間上一款，Hexagon 最快。

---

## 怎麼驗證

**動工前（花錢很少，建議先做）**

請大腦筋用 DataForSEO 查下面這些詞的月量與 KD，把這份裡的「推估」換成實數。量明顯低於推估，就把大話骰往後排。

- en（美國）：liar's dice、liar's dice online、liar's dice game、liars dice rules、equation pyramid game、break the code game online、gomoku online、mancala online
- zh-TW（台灣）：大話骰、大話骰線上、吹牛骰子、五子棋 線上、方程式金字塔
- ko（韓國）：라이어스 다이스、오목 온라인、만칼라 온라인
- ja（日本）：ライアーズダイス、五目並べ オンライン、マンカラ
- th（泰國）：ลูกเต๋าโกหก
- zh-Hans 讀者主要在新馬：大话骰（新加坡、馬來西亞）

**上線後 4 週**

- Search Console（依國家看）：
  - 大話骰頁：`大話骰`、`吹牛骰子`、`liar's dice online`、`ลูกเต๋าโกหก`、`라이어스 다이스` 的曝光與排名。目標：中文詞進前 10。
  - Hexagon、Equation Pyramid、Triple Dice：節目詞（`devil's plan hexagon` 等）有曝光、排前 5。量本來就小，看排名不看曝光。
- GA：`select_game` 各款的點擊、`game_start`／`game_end` 的人次；大話骰的 `game_start` 是否超過九子棋。
- 對照組：虎棋、九子棋同期的曝光（同樣是「傳統遊戲」的打法），看大話骰有沒有同等級的表現。

---

## 來源

- DataForSEO 原始資料：`~/Desktop/projects/sites-data/research_notes/dataforseo/dd_ov_*.json`、`dd_sg1.json`；整理：`sites-data/research/kw-dice-savetap.md`、`opportunities.json`
- Wikimedia Pageviews API（2025-11～2026-10，user agent，月平均）
- Google 自動完成：`suggestqueries.google.com/complete/search?client=firefox&hl=…&gl=…`（2026-11-01）
- 競品：
  - [mindverse.games/shows/the-devils-plan](https://mindverse.games/shows/the-devils-plan/)
  - [the-devils-plan.vercel.app](https://the-devils-plan.vercel.app/)
  - [scriptedmurder.com/devils-plan](https://www.scriptedmurder.com/devils-plan)
  - [Hexagon: The Devil's Plan（iOS）](https://apps.apple.com/ag/app/hexagon/id6470591938)
  - [EP: Equation Pyramid（iOS）](https://apps.apple.com/app/id6747661805)、[equation-pyramid 開源版](https://easonchang-9a3t42ds5-eason-changs-projects.vercel.app/posts/equation-pyramid)、[Adam Banks（itch.io）](https://adam-banks.itch.io)
  - Liar's Dice：[funnode](https://www.funnode.com/games/liars-dice)、[liarsbar.io](https://liarsbar.io/)、[liars-dice.net](https://liars-dice.net/)、[arcadiagames.io](https://arcadiagames.io/games/liars-dice)、[gameyantra](https://gameyantra.com/games/liarsdice/)、[BGA 吹牛](https://zh.boardgamearena.com/gamepanel?game=dudo)、[BGA Mia](https://ko.boardgamearena.com/gamepanel?game=mia)
  - [Break the Code（BGA）](https://en.boardgamearena.com/gamepanel?game=breakthecode)
  - [4 Player 3-in-a-Row（MakerWorld）](https://makerworld.com/en/models/66415)
  - [Devil's Gomoku（itch.io）](https://lio-lim.itch.io/devils-gomoku)
- 規則與設計：本 repo 的 `docs/games-research.md`、`docs/games-deep-s1.md`、`docs/games-deep-s2.md`
