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
    tagline: '圍出最大的地盤 · 2–3 人對戰',
    localKicker: '本機',
    onlineKicker: '連線',
    twoPlayers: '雙人',
    threePlayers: '三人',
    solo: '單人對戰',
    rules: '遊戲規則',
  },
  rules: {
    kicker: '遊玩方式',
    heading: '牆壁圍棋 Wall Go 規則',
    intro:
      '牆壁圍棋出自 Netflix《魔鬼的計謀：死亡密室》。規則只有三句話：移動、築牆、圈地。但因為每一道牆同時幫自己也幫對手，變化很深。下面一步一圖走完整套規則。',
    metaTitle: '遊戲規則',
    metaDescription:
      '牆壁圍棋（Wall Go）完整規則：開局擺子、每回合走 0 到 2 格後必須築一道牆、封閉區域計算地盤、三人局的破牆機制與勝負判定。出自 Netflix《魔鬼的計謀：死亡密室》。',
    ogTitle: '牆壁圍棋 Wall Go 規則說明',
    ogDescription: '一步一圖看懂牆壁圍棋怎麼玩：擺子、移動、築牆、圈地、計分。',
    faqHeading: '常見問題',
    ctaPlay: '開始遊戲',
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
  ui: { next: '下一步', prev: '上一步', startGame: '開始遊戲', close: '關閉', pickLevel: '選擇難度' },
  nav: { language: '語言', backHome: '回首頁' },
  credits: { prefix: '圖示來自', middle: '（CC BY 3.0）與', suffix: '（ISC）' },
} as const;

/**
 * 由 zh-TW 推導出來的形狀。字串一律放寬成 string（不然其他語系會被
 * 逼著寫出一模一樣的中文字面值），陣列保持 readonly ——
 * 一般陣列可以指派給 readonly 陣列，反過來不行。
 */
export type Messages = {
  [K in keyof typeof zhTW]: {
    [P in keyof (typeof zhTW)[K]]: (typeof zhTW)[K][P] extends readonly string[]
      ? readonly string[]
      : string;
  };
};

export default zhTW;
