# 單款遊戲的第一視覺：參考研究與提案

> **狀態（2026-10-19）**：研究完成、等 Zach 決定。推薦 B「海報頭＋單色清單」當所有遊戲的模板，虎羊棋用 D 的選邊主圖。

研究日期：2026-10-19
範圍：玩家從平台首頁點進某一款遊戲後，第一個看到的畫面（標題／選模式那一頁）。不含棋盤本身，也不含平台首頁。
比較頁（含截圖與手機、桌機示意）：https://claude.ai/artifact/64Z1sKXCz1NvZR4dHAggMh 。下文的截圖檔名對應比較頁裡的參考圖。

---

## 一句話結論

現在的遊戲首頁之所以像「一排按鈕」，是因為**顏色全花在模式上，遊戲本身沒有顏色也沒有圖**。
五個磁磚各一個色相，每款遊戲都會長成同一片彩虹，30 款排下去就分不出誰是誰。

建議改成：**上半是遊戲自己的「海報頭」（遊戲主色＋大圖＋標題＋一句話），下半是單色的模式清單**（主要按鈕深墨、其餘中性灰）。
Bagh Chal 可以更進一步，讓海報本身就是選邊的按鈕：左邊老虎、右邊羊。
這個版型做得到一個畫面不捲動，所有遊戲共用；換遊戲只要換主色、主圖、標題、一句話和模式清單。

---

## 現況（對照用）

- `00-ours-current-wallgo-hub.jpg`：quoridorgame.com 正式站目前的 Wall Go 首頁（Bagh Chal 分支版型相同）。
- 標題是純文字，下面是 2×2 四色磁磚加兩條寬磁磚，共六個色相。
- 好處：一眼看得到所有選項、一下就能開始。
- 問題：
  - 整頁沒有任何一個元素在講「這是什麼遊戲」，只有副標一句話。
  - 顏色用來區分模式，所以遊戲本身沒有顏色。從平台首頁的橘色 Bagh Chal 磁磚點進來，看到的是一片彩虹，色彩上接不起來。
  - 30 款遊戲共用這個版型的話，每一款的首頁都長一樣。

---

## 參考逐一整理

### 1. NYT Games 各遊戲的開場畫面（Wordle、Connections、Spelling Bee、Strands、Pips）

| 遊戲 | 網址 | 截圖 |
|---|---|---|
| Wordle | https://www.nytimes.com/games/wordle/index.html | `01-nyt-wordle-desktop.png` |
| Connections | https://www.nytimes.com/games/connections | `02-nyt-connections.png` |
| Spelling Bee | https://www.nytimes.com/puzzles/spelling-bee | `03-nyt-spelling-bee.png` |
| Strands | https://www.nytimes.com/games/strands | `04-nyt-strands.png` |
| Pips | https://www.nytimes.com/games/pips | `05-nyt-pips-segmented.png` |

- **版面**：整頁鋪滿一個顏色，置中一欄。由上而下是小圖示、遊戲名（粗襯線）、一句話玩法、黑色藥丸「Play」、外框的次要按鈕（登入／訂閱）、日期與編者。
- **遊戲身分怎麼表達**：一款一個底色（Connections 紫、Spelling Bee 黃、Strands 淺青綠、Pips 粉紫、Wordle 淺灰）加一個小圖示，圖示幾乎都是「縮小的棋盤」（Wordle 是 3×3 格、Connections 是四色條、Pips 是骨牌）。一句話講的是玩法或承諾，不是形容詞。
- **模式怎麼選**：只有一顆主要按鈕。**Pips 是唯一有選項的**：在 Play 上面放一條「簡單／中等／困難」分段切換，選好再按一顆 Play。
- **規則入口**：開場畫面上沒有，進遊戲後才有「?」。
- **適合我們的地方**：這是跟我們最像的語彙：平塗、深墨主要按鈕、粗字、不靠陰影。同一個模板套在所有遊戲上，靠底色＋小圖示分辨，非常一致。缺點是只有一個 Play，對「要先選對手」的我們不夠。Pips 的分段切換可以借來處理難度或人數。

### 2. Netflix Puzzled 各遊戲卡（Neon、Wordsmith）

- 網址：https://www.netflix.com/tudum/puzzled/neon/daily 、 https://www.netflix.com/tudum/puzzled/wordsmith/daily
- 截圖：`08-netflix-puzzled-neon-card.png`、`09-netflix-puzzled-wordsmith-card.png`
- **版面**：桌機上也是一張手機比例的直卡置中。卡片上半是遊戲主色的漸層加一張「這一題的棋盤插圖」，下半是黑底：小字標籤（遊戲名＋日期）、大標題、作者、一句話、白色大 Play。右上角兩顆小圓鈕：「?」和回首頁。
- **遊戲身分**：主色（Neon 青綠、Wordsmith 墨綠）＋棋盤插圖，兩者都放在卡片上半，佔大約四成高度。
- **模式怎麼選**：只有 Play。
- **規則入口**：右上角「?」。
- **適合我們的地方**：「上半主色＋主圖、下半文字與按鈕」這個上下分工，跟我們的平台首頁（Puzzled 式 bento）一脈相承。右上角「?」是很省空間的規則入口。漸層和黑底不適合我們（我們是平塗、奶油底）。

### 3. Puzzmo

- 網址：https://www.puzzmo.com/today/ 、 https://www.puzzmo.com/puzzle/2026-10-19/ribbit
- 截圖：`06-puzzmo-today-live-previews.png`、`07-puzzmo-ribbit-no-splash.jpg`
- **版面**：首頁每款遊戲直接畫出今天那一題的盤面（縮圖就是真實的盤）。點進去**沒有開場畫面**，直接進遊戲、計時就開始，說明收在右側欄。
- **遊戲身分**：完全靠盤面本身的樣子。
- **適合我們的地方**：證明「棋盤就是最強的識別」。但 Puzzmo 是單人每日題，沒有「對手是誰」要選；我們每款都要先選對電腦／同機／連線，所以還是需要一頁。可以借的是：主圖用「活的盤面」，例如輕輕循環播一步棋。

### 4. lichess 首頁

- 網址：https://lichess.org/
- 截圖：`10-lichess-quick-pairing.png`
- **版面**：中間 3×4 的快速配對格（每格一個時間制），右邊三顆直排按鈕：建立遊戲、挑戰朋友、與電腦對下。
- **遊戲身分**：幾乎沒有，因為整個網站只有西洋棋，不需要再講。
- **模式怎麼選**：最常用的動作（快速配對）攤開成大格子；比較少用的（朋友、電腦）收在旁邊的直排按鈕。
- **適合我們的地方**：這就是我們現況的樣子：全部是選項、沒有身分。lichess 可以這樣做是因為它只有一款遊戲，我們有 30 款，必須補上身分。可以借的是「常用的大、少用的小」，不必每個模式一樣大。

### 5. Chess.com「Play」頁

- 網址：https://www.chess.com/play
- 截圖：`11-chesscom-play-board-plus-list.png`
- **版面**：左邊一整塊開局狀態的棋盤當主視覺，右邊一欄直排的模式清單：線上對戰、對電腦、教練、找朋友、錦標賽、變體。每列是圖示＋粗體名稱＋一行小字說明。
- **遊戲身分**：棋盤本身。
- **模式怎麼選**：直排清單，每列一樣大，第一列是最常用的。
- **規則入口**：不在這頁。
- **適合我們的地方**：「主圖在一邊、模式清單在另一邊」是桌機版最直接的參考；手機直式就是把左右改成上下。清單每列有一行小字說明，比磁磚更能講清楚「對電腦」跟「邀請朋友」的差別。

### 6. Board Game Arena 單款遊戲頁（Azul）

- 網址：https://boardgamearena.com/gamepanel?game=azul
- 截圖：`12-bga-azul-hero-learn-or-play.png`（Cookie 橫幅沒有按，截在橫幅上方）
- **版面**：整條寬幅主視覺，用遊戲本身的磁磚花紋當背景，左上是大 logo，旁邊是分類標籤、人數、時間、簡介、盒子圖、試玩影片。主視覺底部兩顆一樣大的藍色按鈕：「學習」、中間一個「或」、「進行遊戲」。
- **遊戲身分**：logo＋美術背景＋盒子圖，資訊量很大。
- **模式怎麼選**：只有「學習／開始」二選一，進去才選人數與規則。
- **規則入口**：「學習」跟「開始」同樣大。
- **適合我們的地方**：對沒聽過這款遊戲的人，「先學」跟「開始」同等重要，這點很適合 Bagh Chal（多數人沒聽過）。人數、時間做成小標籤，一眼就知道要準備幾個人、玩多久，值得借。整體太擠、太多字，不適合手機一頁。

### 7. Nintendo《世界遊戲大全 51》（Clubhouse Games）

- 網址：https://www.nintendo.com/us/store/products/clubhouse-games-51-worldwide-classics-switch/ （官方商店圖庫）
  、https://interfaceingame.com/screenshots/clubhouse-games-51-worldwide-classics-game-selection/
  、https://interfaceingame.com/screenshots/clubhouse-games-51-worldwide-classics-choose-player/
- 截圖：`13-clubhouse-object-per-game-grid.png`、`14-clubhouse-game-select-card.png`、`15-clubhouse-title-choose-players.png`
- **版面**：選遊戲時，每款遊戲是一個實體小物件（曼卡拉是幾顆玻璃珠、點格棋是一支鉛筆、骰子遊戲是一疊骰子）排在米白桌面上。游標停在哪個物件，上方就跳出一張卡：照片縮圖＋編號＋遊戲名＋一句話介紹＋玩過幾次。標題畫面右側是一欄直排選項（單機／1 人／2 人）。
- **遊戲身分**：**一款遊戲濃縮成一個物件**，加上編號與一句話。
- **模式怎麼選**：選人數在標題畫面就先決定，選好遊戲後直接開始。
- **適合我們的地方**：跟我們的「實心剪影圖示」想法相同：每款遊戲只要一個最能代表它的形狀。米白桌面配鮮豔物件，跟我們的奶油底配實色很接近。編號＋一句話的語氣（短、像說明書）也適合我們的副標。可以借成「第 2 季・第 X 集」這種出處小標，呼應節目。

### 8. 現有的 Bagh Chal App（Google Play）

| App | 網址 | 截圖 |
|---|---|---|
| 搜尋結果總覽（6 款） | https://play.google.com/store/search?q=bagh%20chal&c=apps | `16-baghchal-playstore-overview.png` |
| Bagh Chal（Gamapi Studio） | https://play.google.com/store/apps/details?id=com.GamapiStudio.BaghChal | `17-baghchal-gamapi-flat-title.png` |
| BaghChal - Tigers and Goats（TechnoGuff，50 萬下載） | https://play.google.com/store/apps/details?id=com.sudarshanz | `18-baghchal-technoguff-title.png`、`19-baghchal-technoguff-mode-list.png` |
| Goats and Tigers（Alignit，100 萬下載） | https://play.google.com/store/apps/details?id=com.alignit.tigerandgoats | `20-baghchal-alignit-modes-config.png` |

- **大家都在做的事**：虎與羊面對面。不論寫實（TechnoGuff 的真實老虎與羚羊照片風）、木雕棋子（MD Sohrab Alam）、卡通 VS 對決（Bagh Chal Battle）、金色皇家風（Baghchal Royale）、還是幾何平面（Gamapi），主視覺都是「一隻虎一隻羊」對峙。
- **Gamapi（`17`）**：最接近我們：平面、幾何化的虎頭與羊頭並排、墨綠底、下方是尼泊爾山形與經幡。但整頁沒有按鈕（點任何地方開始），網頁上沒人會知道要點哪裡。
- **TechnoGuff（`18`、`19`）**：第一頁只有一顆「PLAY」，按了才跳出模式清單：當老虎、當羊、雙人、線上、私人房、排行榜，直排、分兩組。選項內容跟我們幾乎一樣，但要兩頁才選得到，還夾著金幣、鑽石。
- **Alignit（`20`）**：首頁是兩張大卡（對電腦／線上），進去是一頁設定：選棋盤、選邊（虎／羊）、選難度，再按開始。資訊清楚但像表單。
- **這個市場失敗的地方（我們避開）**：
  - 寫實或 3D 的老虎配木紋、金邊，跟我們的平塗完全不搭，也很難做成 30 款一致。
  - 開場只有一顆 PLAY，真正的選擇藏在第二頁。
  - 虎羊一比一對峙其實沒講到這個遊戲最特別的地方：**4 隻對 20 隻**的不對等。只有 TechnoGuff 的商店宣傳圖把「4 TIGERS VS 20 GOATS」寫出來，App 裡反而沒有。

### 9. 休閒棋盤 App 的標題畫面（Mancala）

- 網址：https://play.google.com/store/search?q=mancala&c=apps
- 截圖：`22-mancala-playstore-skeuo-titles.png`
- **版面**：幾乎每一款都是「立體大字標題壓在一張寫實棋盤上，下面一顆 START」。
- **遊戲身分**：棋盤本身。
- **適合我們的地方**：再次證明抽象棋類最容易辨識的就是棋盤。但寫實木紋、立體字、光暈正是我們要避開的；我們要的是把棋盤簡化成平面的形狀。

### 10. Dribbble：模式選擇的 bento 版面

- 網址：https://dribbble.com/shots/27638111-eFootball-Concept-Dream-Team-Hub-Events-UI
- 截圖：`21-dribbble-flatstudio-mode-bento.png`
- **版面**：大標題下一排大小不一的模式卡：一張高的、一張螢光黃的、右邊兩張扁的。每張卡都是粗體大寫名稱＋一行說明＋一張角色插圖。
- **適合我們的地方**：讓模式卡本身帶插圖，確實比純圖示的磁磚有份量；大小不一也比 2×2 平均分割更有層次。但每款遊戲每個模式都要一張插圖，30 款 × 4 個模式就是 120 張，做不完；而且顏色還是花在模式上。只借「大小不一」這一點。

（Dribbble 另外搜過 board game start screen、puzzle game start screen、board game app home，結果多半是深色、光澤、3D 的手遊介面，跟我們的方向差太遠，沒有收錄。）

---

## 從參考歸納出的共通做法

1. **一款遊戲一個主色，整個開場畫面都用它**（NYT、Puzzled）。這也剛好接得上我們平台首頁的磁磚色與換頁轉場的色塊（`catalog.ts` 的 `look.card`、`look.wipe`）：點橘色磁磚，轉場是橘色，落地也是橘色，就像磁磚「打開了」。
2. **主圖幾乎都是縮小的棋盤或一個代表物件**（NYT 圖示、Puzzled 插圖、Clubhouse 物件、Puzzmo 真實盤面）。很少用人物或寫實插畫。
3. **一句話講玩法，不講形容詞**。好的一句話讓人看完就知道要做什麼。
4. **常用的大、少用的小**（lichess、NYT、Chess.com 第一列）。沒有人把所有模式做成一樣大的磁磚。
5. **規則是小入口**：「?」圓鈕（Puzzled）或跟開始並列的「學習」（BGA）。不會佔一塊跟模式一樣的磁磚。
6. **按鈕單色**：NYT 全部是黑色藥丸＋外框藥丸，Chess.com 全部是同色的列。顏色留給遊戲，不給按鈕。這跟 CLAUDE.md 的「一個面板一個色相＋中性」「按鈕只有深墨與中性灰」完全一致。

---

## 四個候選版型

以下尺寸以 390×844（iPhone 14）為準；Safari 實際可見高度大約只有 660–750，所以每個版型都要有一個「會自己縮」的元素，比照現在首頁用 dvh 與 flex-shrink 的做法。

### A. 全幅海報（NYT／Puzzled 式）

```
┌──────────────────────────┐
│ ◀平台          ?  💬 🌐  │
│                          │  ← 整頁鋪遊戲主色
│        [ 主圖 ]           │
│        虎羊棋             │
│       Bagh Chal          │
│   4 隻虎抓羊，20 隻羊圍虎   │
│                          │
│   ┌──────────────────┐   │
│   │      開始玩       │   │  ← 唯一的深墨大按鈕
│   └──────────────────┘   │
│   同機雙人 · 邀請朋友 · 規則  │  ← 一排小字連結
└──────────────────────────┘
```

- 優點：身分最強、最簡潔，30 款共用毫無困難；與換頁轉場的色塊完全接得上。
- 缺點：「開始玩」到底是對電腦還是什麼，不夠明確，按下去還得再選一次（跟 TechnoGuff 一樣多一頁）。Wall Go 有 2 人／3 人、本機／連線，塞成一排小字會很擠。整頁鮮豔的橘色或藍色，份量比 NYT 的淡色重很多，看久會累。
- 適合：只有一種玩法的單人解謎（Knight's Tour、Equation Pyramid）。

### B. 海報頭＋單色模式清單（Chess.com／Puzzled 卡／Clubhouse 卡）——建議的基本版型

```
┌──────────────────────────┐
│ ◀平台             💬 🌐  │
│┌────────────────────────┐│
││ 第2季 · 2人 · 約10分  ? ││  ← 遊戲主色的色塊（圓角）
││ 牆壁圍棋                ││
││ Wall Go                ││  ← 900 字重
││ 圍出最大的地盤           ││
││        [ 主圖 ]         ││  ← 會自己縮的元素
│└────────────────────────┘│
│ ┌──────────────────────┐ │
│ │ ▶ 對電腦          ›   │ │  ← 深墨（推薦的那一個）
│ └──────────────────────┘ │
│ ┌──────────────────────┐ │
│ │ 同機對戰   [2人][3人]  │ │  ← 中性灰
│ └──────────────────────┘ │
│ ┌──────────────────────┐ │
│ │ 邀請朋友   [2人][3人]  │ │  ← 中性灰
│ └──────────────────────┘ │
│        怎麼玩？看規則 ›     │
└──────────────────────────┘
```

- 優點：
  - 身分（色塊＋主圖＋標題）和選擇（清單）都在同一頁，不用多按一次。
  - 顏色只有遊戲主色＋深墨＋中性灰，符合「一個面板一個色相」；30 款遊戲的首頁會長得「同一個家族、不同顏色」。
  - 清單可以裝 1 到 5 個模式：1 個就是一顆大按鈕（退化成 A），3 到 4 個是直排。人數這種第二層選擇放在列尾的小按鈕，不必拆成四格。
  - 每列可以加一行小字說明（Chess.com），把「對電腦／同機／邀請」講清楚。
  - 桌機與橫向畫面直接改成左右兩欄：左邊色塊、右邊清單（Chess.com）。
- 缺點：比 A 平淡一點；清單如果做得太細，會像設定頁。所以列要夠高（至少 56px）、字要夠粗、主要那一列要深墨滿版。
- 適合：所有遊戲的預設。

### C. 選好再按一顆開始（NYT Pips／Alignit 式）

```
┌──────────────────────────┐
│        （海報頭同 B）       │
│                          │
│  對手  [ 電腦 | 同機 | 朋友 ] │  ← 分段切換
│  你當  [  老虎  |  羊  ]    │  ← 分段切換
│   ┌──────────────────┐   │
│   │      開始         │   │  ← 唯一的深墨按鈕
│   └──────────────────┘   │
└──────────────────────────┘
```

- 優點：按鈕最少、最整齊；一個「開始」很好辨認；分段切換可以記住上次的選擇。
- 缺點：要先讀懂兩排切換才能開始，比「點一下就走」慢。「邀請朋友」要開房間，跟另外兩種流程不同，硬塞進同一組切換會很怪。三人遊戲還要再多一排人數。
- 適合：不當整頁版型，當作 B 裡面的小元件。例如單人解謎的「難度」、或 B 清單裡「對電腦」那一列展開後選難度。

### D. 主視覺就是選擇（陣營對決）——B 的 Bagh Chal 變體

```
┌──────────────────────────┐
│ ◀平台             💬 🌐  │
│┌────────────────────────┐│
││ 第2季 · 2人 · 約10分  ? ││
││ 虎羊棋  Bagh Chal       ││
││ 4 隻虎抓羊，20 隻羊圍虎   ││
││┌──────────╲───────────┐││
│││  🐯       ╲  🐐🐐🐐🐐  │││  ← 斜切兩半：
│││   4        ╲    20    │││     左＝橘底墨色老虎
│││ 當老虎      ╲   當羊   │││     右＝深墨底米色羊群
│││ 對電腦 ›     ╲ 對電腦 › │││  ← 兩半本身就是按鈕
││└──────────────╲───────┘││
│└────────────────────────┘│
│ ┌──────────┐┌──────────┐ │
│ │ 同機雙人  ││ 邀請朋友  │ │  ← 中性灰
│ └──────────┘└──────────┘ │
│        怎麼玩？看規則 ›     │
└──────────────────────────┘
```

- 優點：最強的一眼識別，而且主圖不是裝飾，是真的可以按。把「4 對 20」的不對等直接畫出來（一隻大虎對一群小羊），這是競品都沒做到的。只用橘＋深墨＋米色，仍然是一個色相。
- 缺點：只適用「雙方不對等」的遊戲（Bagh Chal；之後也許有其他）。不能當所有遊戲的版型，只能當 B 的一種主圖選項。
- 適合：Bagh Chal。

---

## 建議

**以 B 為所有遊戲共用的模板，主圖區留兩種寫法：「圖」（一般遊戲）和「選邊」（D，不對等遊戲）。** C 的分段切換只當 B 裡的小元件（難度、人數）。A 留給只有一種玩法的單人解謎，在模板裡就是「清單只有一列」的情況，不必另做。

### 模板規格（每款遊戲要提供的東西）

| 欄位 | 說明 | Bagh Chal | Wall Go |
|---|---|---|---|
| 主色 | 從磁磚色挑一個，沿用 `catalog.ts` 的 `look` | 橘 `#df6c3f`，墨字 | 藍 `#2478b7`，米白字 |
| 主圖 | 單色 SVG：只用深墨＋米白畫在主色上，不帶玩家色 | 選邊（D） | 棋盤局部＋牆 |
| 標題／副標 | 在地名＋英文官方名 | 虎羊棋／Bagh Chal | 牆壁圍棋／Wall Go |
| 一句話 | 16 字以內，講玩法 | 4 隻虎抓羊，20 隻羊圍虎 | 走棋、蓋牆，圍出最大的地盤 |
| 小標籤 | 人數、時間、節目出處 | 2 人・約 10 分・第 2 季 | 2–3 人・約 10 分・第 2 季 |
| 模式清單 | 每列：圖示、名稱、一行說明、目的地；可帶第二層小按鈕 | 見下 | 見下 |
| 推薦模式 | 清單裡用深墨的那一列 | （選邊已在主圖） | 對電腦 |

（一句話與時間只是草稿，上線前要對過規則頁與 glossary。）

### Bagh Chal 長這樣

- **主色塊（橘）**：上排小標籤與右上「?」；標題「虎羊棋」大字、「Bagh Chal」小一號；一句話。
- **主圖＝選邊**：色塊下半斜切成兩半。左半橘底，一隻大的深墨色老虎剪影（`GiTigerHead`）配一個大大的「4」；右半深墨底，一群米色小羊剪影（`GiGoat` 排成一群）配「20」。兩半各自是一顆按鈕，寫「當老虎／當羊」與「對電腦」。按下去照現在的流程開難度選單。
- **色塊下方（奶油底）**：「同機雙人」「邀請朋友」兩顆中性灰按鈕並排；最下面一行「怎麼玩？看規則」文字連結。原本那條森綠規則磁磚拿掉，也就少掉一個色相。
- **為什麼這樣**：競品全都是一虎一羊對峙；「一隻大虎對一群小羊」加上 4 與 20 兩個數字，不用讀規則就知道這是不對等的狩獵遊戲。

### Wall Go 長這樣

- **主色塊（藍）**：小標籤＋「?」；「牆壁圍棋／Wall Go」；一句話。
- **主圖**：7×7 棋盤的一角，米白格線、深墨的牆圍出一塊封閉的地，地塗成米白；一顆棋子站在裡面。可以用 Web Animations API 輕輕循環播「最後一道牆落下、那塊地亮起來」（CLAUDE.md 規定不要用 JS 每格驅動的動畫；`prefers-reduced-motion` 時只放靜態圖）。主圖用米白＋深墨，不放紅藍綠玩家色，避免色塊裡出現第二、三個色相。
- **清單**：
  - 「對電腦」深墨滿版，小字「選難度後開始」（單人模式固定 2 人）。
  - 「同機對戰」中性灰，列尾兩顆小按鈕「2 人」「3 人」。
  - 「邀請朋友」中性灰，列尾「2 人」「3 人」，按下直接走現有的 `#new=2|3`。
  - 最下面「怎麼玩？看規則」。
- 這樣把現在的六塊磁磚收成三列，一個色相。

### 一頁放得下嗎（390 寬，可見高度 660–750）

| 區塊 | 高度 |
|---|---|
| 頂部平台列（現有 `PlatformCorner`） | 約 52 |
| 色塊：小標籤 28＋標題兩行 90＋一句話 24＋上下留白 32 | 約 174 |
| 色塊：主圖（會縮） | 120–260 |
| 清單：3 列 × 56＋間距 2 × 10 | 約 188 |
| 規則連結＋區塊間距 | 約 64 |
| **合計** | **約 600–740** |

- 主圖是唯一會縮的東西，用 `flex-shrink` 加 `min-height`，比照現在首頁標題上方那塊留白的做法。
- 高度低於大約 680 時先藏小標籤，再把標題字級用 dvh 收小（現在首頁對 640–680 高的舊手機就是這樣處理）。
- Bagh Chal 的選邊兩半至少要有 120 高，才放得下剪影、數字和兩行字；所以 Bagh Chal 的清單只有兩顆並排按鈕，高度比 Wall Go 省。

### 桌機與橫向

- 改成左右兩欄（Chess.com）：左邊色塊佔約 55%，滿高；右邊清單垂直置中，寬度上限約 420。
- 手機橫放（`short`）：同樣左右兩欄，色塊裡藏一句話與小標籤，只留標題與主圖。

### 實作時要守的規則（來自 CLAUDE.md）

- 一個面板一個色相：色塊用遊戲主色，裡面只放深墨與米白；按鈕只有深墨與中性灰（`bg-tile-ink/[0.07]`）。
- 新顏色（例如之後 30 款遊戲需要更多主色）要先量：OKLCH 彩度至少 0.125；米白字疊在主色上要 4.5:1 以上，不夠就改用墨字（Bagh Chal 的橘已經是墨字）。
- 主圖用 game-icons.net 的實心剪影或自繪的平面棋盤，不用線條圖示，不用陰影。
- 一頁不捲動：沿用現在首頁的 dvh 與 flex-shrink 寫法；蓋滿畫面的東西不要剛好等於畫面高度。
- 動畫用 WAAPI 或 CSS，不用 JS 每格寫 style。
- 規則頁是 SEO 主力，所以「看規則」要是真的 `<a href>` 連結，不能只是開 Modal 的按鈕。

### 不建議的方向

- 寫實、3D、木紋、金邊的主視覺（Bagh Chal 與 Mancala 市場的主流）：跟我們的平塗衝突，30 款也做不出一致。
- 開場只有一顆「開始」，真正的選擇藏在第二頁（TechnoGuff）：多一頁，網頁使用者容易流失。
- 每個模式卡各配一張插圖（Dribbble bento）：美術量是遊戲數 × 模式數，做不完。
- 繼續讓模式各帶一個色相：這正是現在「像選單」的原因。

---

## 截圖清單

| 檔名 | 來源 |
|---|---|
| `00-ours-current-wallgo-hub.jpg` | https://quoridorgame.com/ （現況對照） |
| `01-nyt-wordle-desktop.png` | https://www.nytimes.com/games/wordle/index.html |
| `02-nyt-connections.png` | https://www.nytimes.com/games/connections |
| `03-nyt-spelling-bee.png` | https://www.nytimes.com/puzzles/spelling-bee |
| `04-nyt-strands.png` | https://www.nytimes.com/games/strands |
| `05-nyt-pips-segmented.png` | https://www.nytimes.com/games/pips |
| `06-puzzmo-today-live-previews.png` | https://www.puzzmo.com/today/ |
| `07-puzzmo-ribbit-no-splash.jpg` | https://www.puzzmo.com/puzzle/2026-10-19/ribbit |
| `08-netflix-puzzled-neon-card.png` | https://www.netflix.com/tudum/puzzled/neon/daily |
| `09-netflix-puzzled-wordsmith-card.png` | https://www.netflix.com/tudum/puzzled/wordsmith/daily |
| `10-lichess-quick-pairing.png` | https://lichess.org/ |
| `11-chesscom-play-board-plus-list.png` | https://www.chess.com/play |
| `12-bga-azul-hero-learn-or-play.png` | https://boardgamearena.com/gamepanel?game=azul |
| `13-clubhouse-object-per-game-grid.png` | https://www.nintendo.com/us/store/products/clubhouse-games-51-worldwide-classics-switch/ |
| `14-clubhouse-game-select-card.png` | https://interfaceingame.com/screenshots/clubhouse-games-51-worldwide-classics-game-selection/ |
| `15-clubhouse-title-choose-players.png` | https://interfaceingame.com/screenshots/clubhouse-games-51-worldwide-classics-choose-player/ |
| `16-baghchal-playstore-overview.png` | https://play.google.com/store/search?q=bagh%20chal&c=apps |
| `17-baghchal-gamapi-flat-title.png` | https://play.google.com/store/apps/details?id=com.GamapiStudio.BaghChal |
| `18-baghchal-technoguff-title.png` | https://play.google.com/store/apps/details?id=com.sudarshanz |
| `19-baghchal-technoguff-mode-list.png` | https://play.google.com/store/apps/details?id=com.sudarshanz |
| `20-baghchal-alignit-modes-config.png` | https://play.google.com/store/apps/details?id=com.alignit.tigerandgoats |
| `21-dribbble-flatstudio-mode-bento.png` | https://dribbble.com/shots/27638111-eFootball-Concept-Dream-Team-Hub-Events-UI |
| `22-mancala-playstore-skeuo-titles.png` | https://play.google.com/store/search?q=mancala&c=apps |

備註：
- 瀏覽器視窗沒辦法縮成手機寬度，所以 NYT 等頁面截的是桌機版，再放大中間那一欄；它們的手機版也是同一欄。
- NYT 的 Strands 與 Pips 截圖前，用 JS 在本機把廣告欄藏起來，不影響網站。
- Cookie 橫幅一律沒有按。
