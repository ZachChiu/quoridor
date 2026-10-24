/**
 * 繁體中文 —— 同時是**型別來源**。
 *
 * 其餘語系宣告成 `const en: Messages = {...}`，因此少一個 key、多一個 key、
 * 或型別對不上，都會在 build 時就擋下來。翻譯漏掉不該是上線之後才被使用者
 * 發現的事。
 *
 * 用詞一律照 app/i18n/glossary.md。
 */
const zhTW = {
  meta: {
    titleDefault: '牆壁圍棋 Wall Go 線上免費玩 | 魔鬼的計謀：死亡密室',
    titleTemplate: '%s | 牆壁圍棋 Wall Go',
    description:
      'Netflix 韓國實境節目《魔鬼的計謀：死亡密室》裡的牆壁圍棋，線上免費玩。7×7 棋盤上移動棋子、築牆圈地，地盤最大的人獲勝。支援 2-3 人對戰、單人挑戰電腦與連線對局，免下載免註冊。',
    keywords: ['牆壁圍棋', 'Wall Go', '魔鬼的計謀', '死亡密室', '圍棋變體', '圈地遊戲', '線上桌遊'],
    ogTitle: '牆壁圍棋 Wall Go 線上免費玩',
    ogDescription:
      '《魔鬼的計謀：死亡密室》裡的牆壁圍棋。7×7 棋盤、築牆圈地，地盤最大的人獲勝。免下載免註冊。',
    ogAlt: '牆壁圍棋 Wall Go —— 7×7 棋盤上紅藍雙方以牆圍出各自地盤',
    showName: '魔鬼的計謀：死亡密室',
  },
  home: {
    titleLine1: '牆壁圍棋',
    titleLine2: 'Wall Go',
    tagline: '圍出最大的地盤',
    localKicker: '本機',
    onlineKicker: '連線',
    twoPlayers: '雙人',
    threePlayers: '三人',
    solo: '單人對戰',
    rules: '遊戲規則',
  },
  /** 平台首頁（`/`）：《魔鬼的計謀》節目遊戲總覽。平台名不在這裡，見 app/brand.ts */
  platform: {
    metaTitle: '魔鬼的計謀 遊戲整理與線上玩',
    metaDescription: 'Netflix 韓綜《魔鬼的計謀》每一季的遊戲整理：第 1 季、第 2 季《死亡密室》與即將上線的第 3 季。能玩的直接在瀏覽器開打，免下載、免註冊，目前可以玩牆壁圍棋 Wall Go。',
    ogTitle: '魔鬼的計謀 遊戲整理與線上玩',
    ogDescription: '節目裡的每一款遊戲，能玩的直接開打。免下載、免註冊。',
    heading: '《魔鬼的計謀》遊戲',
    /** 分享圖上的大標，逐行指定 —— 自動斷行會把節目名從中間拆開 */
    ogLines: ['《魔鬼的計謀》', '遊戲'],
    heroBadge: '現在就能玩',
    heroMeta: '第 2 季《死亡密室》．2–3 人．免下載',
    heroBody: '7×7 的棋盤，每回合走一步、蓋一道牆，把地圍起來。可以跟電腦下，或開房間傳連結給朋友。',
    // 大卡片換成尼泊爾虎棋時（最新上線、或使用者點過）的說明；Wall Go 的是上面那兩行
    baghHeroMeta: '第 2 季決賽．2 人．免下載',
    baghHeroBody: '4 隻老虎對 20 隻羊：老虎吃掉 5 隻羊就贏，羊把老虎全部困住就贏。可以跟電腦下、兩人同一台玩，或傳連結給朋友。',
    play: '開始玩',
    rules: '規則與玩法',
    s3: '第 3 季《Dead Again》',
    s3Badge: '11/10 上線',
    s3Empty: '播出後每週更新這一季的遊戲',
    s2: '第 2 季《死亡密室》',
    s1: '第 1 季',
    playable: '可以玩',
    guide: '規則整理中',
    disclaimer: '非官方粉絲作品，與 Netflix 及節目製作方無關。',
  },
  /** Bagh Chal。中文名照節目用「尼泊爾虎棋」（Zach 10/24：遊戲命名用 Netflix 版本，見 glossary）；「虎羊棋」留在說明與規則頁的名字由來 */
  baghChal: {
    metaTitle: 'Bagh Chal 尼泊爾虎棋 線上免費玩',
    metaDescription: 'Netflix《魔鬼的計謀》第 2 季決賽的尼泊爾虎棋（Bagh Chal，也叫虎羊棋），尼泊爾的傳統棋。4 隻老虎對 20 隻羊：老虎吃掉 5 隻羊就贏，羊把老虎全部困住就贏。可以跟 AI 下或兩人同一台玩，免下載、免註冊。',
    ogTitle: 'Bagh Chal 尼泊爾虎棋 線上免費玩',
    ogDescription: '4 隻老虎對 20 隻羊的尼泊爾傳統棋，《魔鬼的計謀》第 2 季決賽。免下載、免註冊。',
    title: 'Bagh Chal',
    subtitle: '尼泊爾虎棋',
    /** 畫面上的名字：用讀者的文字寫一個就好（天城體字標是 logo、Bagh Chal 只留在網頁標題與名字由來，見 glossary） */
    name: '尼泊爾虎棋',
    tagline: '4 隻老虎對 20 隻羊',
    local: '本機對戰',
    vsAi: '跟 AI 下',
    playAs: '你要當',
    tiger: '老虎',
    goat: '羊',
    level: '難度',
    start: '開始',
    turnTiger: '輪到老虎',
    turnGoat: '輪到羊',
    yourTurn: '輪到你',
    hintPlace: '點空的交叉點放一隻羊',
    hintGoat: '羊不能吃，把老虎圍到動不了就贏',
    hintTiger: '老虎沿線走一步，或跳過羊把牠吃掉',
    thinking: 'AI 思考中…',
    goatsInHand: '還有 {n} 隻羊要放',
    captured: '吃掉 {n} / 5',
    /** 結算分享圖上的手數 */
    cardMoves: '共 {n} 手',
    undo: '悔棋',
    restart: '重來',
    menu: '換模式',
    winTiger: '老虎贏了',
    winGoat: '羊贏了',
    draw: '和局',
    winTigerBody: '老虎吃掉了 5 隻羊。',
    winGoatBody: '羊把老虎全部困住了。',
    drawBody: '走了太多步還分不出勝負。',
    again: '再來一局',
    /** 結算後「給點意見」的範例句（Wall Go 那句講的是三人局，放在這裡不通） */
    feedbackPlaceholder: '例如：老虎明明能跳卻點不下去、電腦太強或太弱',
    invite: '邀請朋友',
    inviteHeading: '把連結傳給朋友',
    inviteBody: '對方打開連結就會加入。你當{me}，對方當{them}。',
    waitingOpponent: '等對方加入…',
    shareText: '來跟我下尼泊爾虎棋 Bagh Chal',
    opponentTurn: '輪到對方',
    youAre: '你是{side}',
    pickSide: '你要當哪一邊？',
    versus: '對',
    goalTiger: '老虎吃掉 5 隻羊就贏',
    goalGoat: '羊把 4 隻老虎圍到動不了就贏',
    localSub: '一台手機輪流下',
    inviteSub: '傳連結，他當另一邊',
    rulesLink: '怎麼玩？看規則',
    rulesCta: '回首頁選玩法',
    onlineTitle: '連線對戰',
    rulesMetaTitle: '尼泊爾虎棋 Bagh Chal 規則與玩法',
    /** 規則頁畫面上的大標（網頁標題 rulesMetaTitle 照舊帶 Bagh Chal 給搜尋） */
    rulesTitle: '尼泊爾虎棋規則',
    rulesMetaDescription: '尼泊爾虎棋（Bagh Chal，也叫虎羊棋）完整規則：5×5 棋盤、4 隻老虎對 20 隻羊、放羊、老虎跳吃、羊把老虎困住。附圖一步一步說明，《魔鬼的計謀》第 2 季決賽的遊戲。',
    rulesHeading: '怎麼玩',
    rules: [
      '棋盤是 5×5 個交叉點，沿著線走。斜線只經過一部分的點。',
      '老虎一開始在四個角，羊在盤外。羊先走。',
      '羊每回合放一隻上盤，20 隻放完之後才能移動盤上的羊。',
      '老虎可以走到相鄰的空點，或沿直線跳過一隻羊落在後面的空點，把羊吃掉。一次只吃一隻。',
      '老虎吃掉 5 隻羊就贏；羊把所有老虎困到動不了就贏。',
    ],
    showNote: '《魔鬼的計謀》第 2 季決賽的第二戰就是 Bagh Chal：兩位決賽者在兩個棋盤上同時下，各當一邊的老虎與羊。',
    nameNote: '名字：節目裡的中文是「尼泊爾虎棋」。Bagh Chal 是尼泊爾語（बाघचाल），意思是「老虎的走法」；也有人照棋子叫它虎羊棋。',
  },
  rules: {
    kicker: '遊玩方式',
    heading: '牆壁圍棋 Wall Go 規則',
    intro:
      '牆壁圍棋出自 Netflix《魔鬼的計謀：死亡密室》，是圍棋的變體。7×7 棋盤，兩到三人。\n一個回合做兩件事：移動一顆棋子，然後蓋一道牆。下面一步一圖說明。',
    metaTitle: '遊戲規則',
    metaDescription:
      '牆壁圍棋（Wall Go）完整規則：開局擺子、每回合走 0 到 2 格後必須築一道牆、封閉區域計算地盤、三人局的破牆機制與勝負判定。出自 Netflix《魔鬼的計謀：死亡密室》。',
    ogTitle: '牆壁圍棋 Wall Go 規則說明',
    ogDescription: '一步一圖看懂牆壁圍棋怎麼玩：擺子、移動、築牆、圈地、計分。',
    faqHeading: '常見問題',
    ctaPlay: '開始遊戲',
    version: '版本',
    ctaSolo: '單人對戰',
  },
  solo: {
    metaTitle: '單人對戰',
    metaDescription:
      '一個人也能玩牆壁圍棋。電腦對手分三級，會評估每一格由誰先到得了來決定下法，不是隨機亂下。不用下載也不用註冊。',
    ogTitle: '牆壁圍棋 Wall Go 單人對戰',
    ogDescription: '一個人也能玩。電腦對手分三級，不用下載也不用註冊。',
    pickLevel: '選一個難度',
    level1: '一級',
    level2: '二級',
    level3: '三級',
    srHeading: '單人對戰 | 牆壁圍棋 Wall Go',
  },
  local: { metaTitle: '本機對戰', srHeading: '本機對戰 | 牆壁圍棋 Wall Go' },
  online: { metaTitle: '連線對戰', srHeading: '連線對戰 | 牆壁圍棋 Wall Go' },
  replay: { metaTitle: '棋譜回放', metaDescription: '一手一手重看整局牆壁圍棋，可前後跳轉。', srHeading: '棋譜回放 | 牆壁圍棋 Wall Go', empty: '這個連結沒有帶棋譜', emptyBody: '回放連結需要帶上棋譜。跟對方要一次完整的連結。', turn: '第 {n} / {total} 手', first: '回到開局', prev: '上一手', play: '播放', pause: '暫停', next: '下一手', last: '跳到最後' },
  /*
    分享圖上那一行字。與 ogDescription 分開是因為圖上放得下的字少得多 ——
    一句話超過十來個字，在 1200×630 上就得縮到看不清。
    改這裡要跑 npm run og:build 重建圖，CI 有 og:check 擋著。
  */

  ui: { next: '下一步', prev: '上一步', startGame: '開始遊戲', close: '關閉', pickLevel: '選擇難度' },
  error: { title: '出了點問題', body: '畫面執行時出錯了，重新整理通常就能恢復。連線對局的每一手都存在房間裡，重新整理後會接著下。', retry: '重新整理', home: '回首頁' },
  notFound: { title: '找不到這一頁', body: '這個網址可能打錯了，或是那一局已經結束了。', home: '回首頁', rules: '看看怎麼玩' },
  crumb: { home: '首頁' },
  nav: { language: '語言', backHome: '回首頁' },
  credits: { prefix: '圖示來自', middle: '（CC BY 3.0）與', suffix: '（ISC）' },
} as const;

/**
 * 由 zh-TW 推導出來的形狀。字串一律放寬成 string（不然其他語系會被
 * 逼著寫出一模一樣的中文字面值），陣列保持 readonly ——
 * 一般陣列可以指派給 readonly 陣列，反過來不行。
 */
type Mirror = {
  [K in keyof typeof zhTW]: {
    [P in keyof (typeof zhTW)[K]]: (typeof zhTW)[K][P] extends readonly string[]
      ? readonly string[]
      : string;
  };
};

/**
 * `home.titleLine2` 是「這個語言對這個遊戲的另一個叫法」——
 * 中文配 Wall Go、日文配 Wall Go、韓文配 Wall Go。英文沒有第二個叫法，
 * 所以它可以整個不給。
 *
 * 用「沒有這個 key」表示，而不是填空字串：空字串和「忘了翻」長得
 * 一模一樣，而 tests/i18n/content.test.ts 不准空字串，擋的正是後者。
 */
export type Messages = Omit<Mirror, 'home'> & {
  home: Omit<Mirror['home'], 'titleLine2'> & { titleLine2?: string };
};

export default zhTW;
