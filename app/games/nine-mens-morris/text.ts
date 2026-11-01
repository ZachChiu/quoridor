import type { TextTable } from '@/i18n/gameText';

/**
 * 九子棋的文案（六個語系）。寫法照 app/i18n/gameText.ts 的規定：
 * 語系 key 在兩格縮排、依 'zh-TW' → en → ja → ko → 'zh-Hans' → th 排（字型子集靠這個切字）。
 *
 * 名稱：繁簡中文「九子棋」、日文「ナイン・メンズ・モリス」、韓文「나인 멘스 모리스」（維基百科各語言條目、
 * 節目 RULE 卡）。泰文查不到通行的叫法（泰文維基沒有條目），照 Bagh Chal 的前例保留英文名、
 * 副名「หมากเก้าตัว」只是描述（九顆子的棋），不是官方譯名。
 *
 * 「成三」在說明裡一律寫成「連成一線」：第一次玩的人看得懂，不必先學術語。
 * {side} 一律代入黑方／白方（不代入「你」：英文的動詞變化、韓文的助詞都會跟著錯）。
 */
export type MorrisText = {
  title: string;
  /** 標題下面那一行：中日韓是英文名，英文是別名，泰文是描述性的副名 */
  subtitle: string;
  metaTitle: string;
  metaDescription: string;
  /** 一句話講玩法 */
  tagline: string;
  /** 海報頭上方的小標籤：人數、時間、節目出處 */
  tags: string;
  vsAi: string;
  vsAiNote: string;
  first: string;
  second: string;
  local: string;
  localNote: string;
  /** 首頁的「邀請朋友」（連線對戰）：按下去先選自己下哪一邊（pickSide），再開房 */
  invite: string;
  inviteNote: string;
  pickSide: string;
  showRules: string;
  showRulesNote: string;
  howTo: string;
  black: string;
  white: string;
  you: string;
  computer: string;
  inHand: string;
  onBoard: string;
  phase: { place: string; move: string; fly: string; remove: string };
  turnOf: string;
  yourTurn: string;
  thinking: string;
  /** 連線：對局標題下面那一行。畫面上不寫「你／對方」（狀態卡、提示、結算都寫黑方／白方，自己那張卡多一圈拱框） */
  online: string;
  hint: {
    place: string;
    move: string;
    moveSelected: string;
    fly: string;
    remove: string;
    /** 對方的子全在線上（傳統規則：這次可以拿線上的） */
    removeAny: string;
    /** 成三了但沒得拿（節目規則：對方的子全在線上） */
    noRemoval: string;
    aiRemoving: string;
    /** 連線：對方連成一線、正在挑（{side} 代入黑方／白方） */
    sideRemoving: string;
  };
  undo: string;
  restart: string;
  menu: string;
  /** 對局左上角房子鈕的說明：回九子棋首頁（選模式的畫面），不是平台首頁 */
  home: string;
  youWin: string;
  aiWins: string;
  win: string;
  draw: string;
  reason: { pieces: string; blocked: string; repetition: string; quiet: string; standoff: string; standoffDraw: string };
  again: string;
  /** 說明彈窗的標題 */
  rulesHeading: string;
  /**
   * 規則的每一步：一步一張小圖（圖在 components/nine-mens-morris/MorrisRules.tsx 的 STEPS，順序要跟這裡一樣）。
   * 規則頁全部攤開、對局中的說明彈窗一次一步。最後一步是節目規則的差別。
   * 說明對著圖講，寫黑方／白方，不寫「你／對方」。
   */
  steps: { title: string; body: string }[];
  /** 規則頁（/nine-mens-morris/rules）：大標、分享與搜尋的標題與描述、最後那顆回首頁的按鈕 */
  rulesTitle: string;
  rulesMetaTitle: string;
  rulesMetaDescription: string;
  rulesCta: string;
  /** 讀屏念的空點 */
  empty: string;
  /** 規則頁最後一段：名字的由來（Zach 10/24：遊戲命名用 Netflix 版本，在規則裡介紹） */
  nameNote: string;
  /** 結算分享圖：這款出自第 1 季，「靈感來自《…》」寫第 1 季的節目名（共用的 showName 是第 2 季的） */
  show: string;
  /** 結算分享圖：走了幾手 */
  cardMoves: string;
  /** 連線等對方加入的畫面：標題、說明（{me}、{them} 代入黑方／白方）、對方那格寫的字、兩顆棋子中間的「對」 */
  inviteHeading: string;
  inviteBody: string;
  waitingOpponent: string;
  versus: string;
  /** 系統分享面板裡跟著連結的那句話 */
  shareText: string;
};

export const TEXT = {
  'zh-TW': {
    title: '九子棋',
    subtitle: "Nine Men's Morris",
    metaTitle: "九子棋 Nine Men's Morris 線上免費玩",
    metaDescription: "Netflix《魔鬼的計謀》第 1 季決賽第一戰的九子棋（Nine Men's Morris）。雙方各 9 顆子，在 24 個點上輪流放子、走子，連成一線就拿掉對方一顆。可以跟 AI 下或兩人同一台玩，免下載、免註冊。",
    tagline: '連成一線，就拿掉對方一顆子',
    tags: '2 人 · 約 10 分鐘 · 第 1 季決賽',
    vsAi: '跟 AI 下',
    vsAiNote: '選先後手，再選難度',
    first: '先手（黑）',
    second: '後手（白）',
    local: '本機對戰',
    localNote: '輪流在同一台裝置上下',
    invite: '邀請朋友',
    inviteNote: '開一間房，把連結傳給朋友',
    pickSide: '你要下哪一邊？',
    showRules: '節目規則',
    showRulesNote: '照節目的 RULE 卡下',
    howTo: '怎麼玩？',
    black: '黑方',
    white: '白方',
    you: '你',
    computer: 'AI',
    inHand: '手上 {n}',
    onBoard: '盤上 {n}',
    phase: { place: '放子', move: '走子', fly: '飛子', remove: '拿子' },
    turnOf: '輪到{side}',
    yourTurn: '輪到你',
    thinking: 'AI 思考中…',
    online: '連線對戰',
    hint: {
      place: '點一個空點，把子放上去',
      move: '選一顆子，沿線走到相鄰的空點',
      moveSelected: '點標出來的點，把子走過去',
      fly: '只剩 3 顆：選一顆子，可以飛到任何空點',
      remove: '連成一線！點一顆搖搖晃晃的對方棋子拿掉',
      removeAny: '對方的子都在線上，這次可以拿線上的子',
      noRemoval: '連成一線，但對方的子都在線上，這次不能拿',
      aiRemoving: 'AI 連成一線，正在挑要拿哪一顆',
      sideRemoving: '{side}連成一線，正在挑要拿哪一顆',
    },
    undo: '悔棋',
    restart: '重來',
    menu: '換模式',
    home: '回九子棋首頁',
    youWin: '你贏了',
    aiWins: 'AI 贏了',
    win: '{side}贏了',
    draw: '和局',
    reason: {
      pieces: '{side}只剩 2 顆子。',
      blocked: '{side}被困住，沒有子可以動。',
      repetition: '同一個局面出現了三次。',
      quiet: '連續 50 手沒有人被拿子。',
      standoff: '有人只剩 3 顆之後僵持了 10 回合，子比較少的{side}輸。',
      standoffDraw: '有人只剩 3 顆之後僵持了 10 回合，雙方子數一樣。',
    },
    again: '再來一局',
    rulesHeading: '怎麼玩',
    steps: [
      { title: '棋盤', body: '棋盤有 24 個點。雙方各 9 顆子，黑先。' },
      { title: '放子', body: '輪流把手上的子放到空點。雙方 9 顆都放完之前，盤上的子不能動。' },
      { title: '連成一線', body: '黑方 3 顆子連在同一條線上（連成一線），就拿掉白方 1 顆子。白方連成一線的子不能拿，除非白方的子全都在線上。' },
      { title: '走子', body: '放完之後，每回合沿線把一顆子移到相鄰的空點。' },
      { title: '飛子', body: '只剩 3 顆子時可以飛：移到任何空點，不必沿線。' },
      { title: '輸贏', body: '白方只剩 2 顆，或輪到白方時沒有子可以動，黑方就贏了。同一局面出現 3 次，或連續 50 手沒有人被拿子，就是和局。' },
      { title: '節目規則', body: '在首頁打開「節目規則」，就照節目的 RULE 卡下：連成一線的子一律不能拿（白方的子全都在線上時，黑方這次就沒得拿）；有人剩 3 顆之後，雙方各走 10 手都沒有人被拿子，子少的一方輸（一樣多就和局）。' },
    ],
    rulesTitle: '九子棋怎麼玩',
    rulesMetaTitle: "九子棋規則圖解：Nine Men's Morris 怎麼玩",
    rulesMetaDescription: "九子棋（Nine Men's Morris）的規則，一步一張圖：放子、連成一線拿子、走子、飛子、輸贏，還有《魔鬼的計謀》節目規則的差別。看完就能跟 AI 或朋友下一局。",
    rulesCta: '回首頁開一局',
    empty: '空點',
    nameNote: '名字：節目裡的中文就叫「九子棋」（中文維基寫「直棋」）。英文 Nine Men\'s Morris 的 morris，一般認為是從拉丁文 merellus（棋子）訛變來的。首頁那幅插圖出自 1283 年西班牙阿方索十世的《遊戲之書》。',
    show: '魔鬼的計謀',
    cardMoves: '共 {n} 手',
    inviteHeading: '把連結傳給朋友',
    inviteBody: '朋友打開連結就會加入。你是{me}，對方是{them}，黑方先走。',
    waitingOpponent: '等對方加入…',
    versus: '對',
    shareText: '來跟我下九子棋',
  },
  en: {
    title: "Nine Men's Morris",
    subtitle: 'The mill game',
    metaTitle: "Nine Men's Morris — Play Free Online",
    metaDescription: "Nine Men's Morris, game one of the Season 1 final of Netflix's The Devil's Plan. Each side has 9 pieces on a 24-point board: place them, move them, and line up three in a row to remove an opponent's piece. Play the AI or two players on one device. No download, no sign-up.",
    tagline: 'Line up three to take a piece',
    tags: '2 players · about 10 min · Season 1 final',
    vsAi: 'Play the AI',
    vsAiNote: 'Pick a side, then a level',
    first: 'First (Black)',
    second: 'Second (White)',
    local: 'Local play',
    localNote: 'Take turns on one device',
    invite: 'Invite a friend',
    inviteNote: 'Open a room and send them the link',
    pickSide: 'Which side do you want?',
    showRules: 'Show rules',
    showRulesNote: "Play by the show's rule card",
    howTo: 'How to play?',
    black: 'Black',
    white: 'White',
    you: 'You',
    computer: 'AI',
    inHand: 'In hand {n}',
    onBoard: 'On board {n}',
    phase: { place: 'Place', move: 'Move', fly: 'Fly', remove: 'Remove' },
    turnOf: "{side}'s turn",
    yourTurn: 'Your turn',
    thinking: 'AI is thinking…',
    online: 'Online',
    hint: {
      place: 'Tap an empty point to place a piece',
      move: 'Pick a piece and slide it along a line to an empty neighbor',
      moveSelected: 'Tap a marked point to move there',
      fly: 'Down to 3 pieces: pick one and fly it to any empty point',
      remove: 'Mill! Tap a wobbling opponent piece to remove it',
      removeAny: 'All their pieces are in mills, so you may take one from a mill',
      noRemoval: 'A mill, but all their pieces are in mills, so nothing can be taken',
      aiRemoving: 'The AI made a mill and is choosing a piece to take',
      sideRemoving: '{side} made a mill and is choosing a piece to take',
    },
    undo: 'Undo',
    restart: 'Restart',
    menu: 'Change mode',
    home: "Back to Nine Men's Morris",
    youWin: 'You win',
    aiWins: 'The AI wins',
    win: '{side} wins',
    draw: 'Draw',
    reason: {
      pieces: '{side} is down to 2 pieces.',
      blocked: '{side} is blocked and has no move.',
      repetition: 'The same position came up three times.',
      quiet: '50 moves in a row without a capture.',
      standoff: 'After someone was down to 3 pieces, 10 rounds passed without a capture. {side} had fewer pieces and loses.',
      standoffDraw: 'After someone was down to 3 pieces, 10 rounds passed without a capture, with equal pieces on both sides.',
    },
    again: 'Play again',
    rulesHeading: 'How to play',
    steps: [
      { title: 'The board', body: 'The board has 24 points. Each player has 9 pieces, and Black goes first.' },
      { title: 'Placing', body: "Players take turns putting a piece from their hand on an empty point. Pieces on the board can't move until both players have placed all nine." },
      { title: 'Mills', body: "Three Black pieces on one line make a mill: Black removes one of White's pieces. White's pieces in a mill are safe, unless all of White's pieces are in mills." },
      { title: 'Moving', body: 'Once all pieces are placed, each turn slide one piece along a line to an adjacent empty point.' },
      { title: 'Flying', body: 'With only 3 pieces left, a player can fly: move to any empty point.' },
      { title: 'Winning', body: "Black wins when White is down to 2 pieces, or has no move on White's turn. It's a draw if the same position comes up 3 times, or 50 moves pass without a capture." },
      { title: 'Show rules', body: "Turn on “Show rules” on the home page to play by the show's rule card: pieces in a mill can never be taken (when all of White's pieces are in mills, Black takes nothing this time). Once someone is down to 3 pieces, if 10 rounds pass without a capture, the side with fewer pieces loses (equal pieces is a draw)." },
    ],
    rulesTitle: "How to Play Nine Men's Morris",
    rulesMetaTitle: "Nine Men's Morris Rules, Step by Step",
    rulesMetaDescription: "The rules of Nine Men's Morris with a picture for each step: placing, making mills to take pieces, moving, flying and winning, plus how the rules differ on The Devil's Plan. Then play the AI or a friend.",
    rulesCta: 'Start a game',
    empty: 'empty point',
    nameNote: 'The name: the Chinese subtitles call it 九子棋, “nine-piece chess”. The “morris” in Nine Men\'s Morris is usually traced to the Latin merellus, a gaming piece. The picture on the home page comes from Alfonso X\'s Book of Games (1283).',
    show: 'The Devil\'s Plan',
    cardMoves: '{n} moves',
    inviteHeading: 'Send your friend the link',
    inviteBody: 'They join as soon as they open it. You play {me}, they play {them}. Black moves first.',
    waitingOpponent: 'Waiting for your friend…',
    versus: 'vs',
    shareText: "Play Nine Men's Morris with me",
  },
  ja: {
    title: 'ナイン・メンズ・モリス',
    subtitle: "Nine Men's Morris",
    metaTitle: 'ナイン・メンズ・モリス 無料オンライン対戦',
    metaDescription: "Netflix『悪魔の計略 ～デビルズ・プラン～』シーズン1決勝の第1戦、ナイン・メンズ・モリス（Nine Men's Morris）。24の点にお互い9個の駒を置いて動かし、3つ並べると相手の駒を1つ取れます。AIと対戦、または1台で2人で遊べます。ダウンロード・登録不要。",
    tagline: '3つ並べたら相手の駒を1つ取る',
    tags: '2人 · 約10分 · シーズン1決勝',
    vsAi: 'AIと',
    vsAiNote: '先手か後手を選んでからレベルを選ぶ',
    first: '先手（黒）',
    second: '後手（白）',
    local: 'ローカル対戦',
    localNote: '1台の端末で交互に指す',
    invite: '友だちを招待',
    inviteNote: '部屋を作ってリンクを送る',
    pickSide: 'どちらで指しますか？',
    showRules: '番組ルール',
    showRulesNote: '番組のルールカードどおりに遊ぶ',
    howTo: '遊び方は？',
    black: '黒',
    white: '白',
    you: 'あなた',
    computer: 'AI',
    inHand: '手持ち {n}',
    onBoard: '盤上 {n}',
    phase: { place: '配置', move: '移動', fly: '飛び', remove: '取る' },
    turnOf: '{side}の番',
    yourTurn: 'あなたの番',
    thinking: 'AIが考え中…',
    online: 'オンライン対戦',
    hint: {
      place: '空いている点をタップして駒を置く',
      move: '駒を選んで、線に沿って隣の空いている点へ動かす',
      moveSelected: '印のついた点をタップして動かす',
      fly: '残り3個：駒を選んで、どの空いている点へも飛べる',
      remove: '3つ並んだ！ぐらぐら揺れている相手の駒をタップして取る',
      removeAny: '相手の駒がすべて並んでいるので、並んでいる駒も取れる',
      noRemoval: '3つ並んだが、相手の駒がすべて並んでいるので取れない',
      aiRemoving: 'AIが3つ並べて、取る駒を選んでいます',
      sideRemoving: '{side}が3つ並べて、取る駒を選んでいます',
    },
    undo: '待った',
    restart: 'やり直す',
    menu: 'モード変更',
    home: 'ナイン・メンズ・モリスのトップへ',
    youWin: 'あなたの勝ち',
    aiWins: 'AIの勝ち',
    win: '{side}の勝ち',
    draw: '引き分け',
    reason: {
      pieces: '{side}の駒が残り2個になりました。',
      blocked: '{side}は動かせる駒がありません。',
      repetition: '同じ局面が3回現れました。',
      quiet: '50手続けて駒が取られませんでした。',
      standoff: '誰かが残り3個になってから10ラウンド駒が取られず、駒の少ない{side}の負けです。',
      standoffDraw: '誰かが残り3個になってから10ラウンド駒が取られず、駒の数は同じでした。',
    },
    again: 'もう一局',
    rulesHeading: '遊び方',
    steps: [
      { title: '盤', body: '盤には24の点があります。お互いに駒は9個、黒が先手です。' },
      { title: '配置', body: '交互に手持ちの駒を空いている点に置きます。両者が9個とも置き終わるまで、盤上の駒は動かせません。' },
      { title: '3つ並べる', body: '1本の線に黒の駒が3つ並んだら、白の駒を1つ取ります。並んでいる白の駒は取れません（白の駒がすべて並んでいるときを除く）。' },
      { title: '移動', body: '置き終わったら、毎ターン駒を1つ、線に沿って隣の空いている点へ動かします。' },
      { title: '飛び', body: '残り3個になったら飛べます：どの空いている点へも動かせます。' },
      { title: '勝ち負け', body: '白の駒が残り2個になるか、白の番に動かせる駒がなくなれば黒の勝ちです。同じ局面が3回現れるか、50手続けて駒が取られなければ引き分けです。' },
      { title: '番組ルール', body: 'トップで「番組ルール」をオンにすると、番組のルールカードどおりに遊べます：並んでいる駒は決して取れません（白の駒がすべて並んでいれば、黒は今回何も取れません）。誰かが残り3個になってから、10ラウンド（お互い10手）駒が取られなければ、駒の少ない方の負けです（同数なら引き分け）。' },
    ],
    rulesTitle: 'ナイン・メンズ・モリスの遊び方',
    rulesMetaTitle: 'ナイン・メンズ・モリスのルール（図解）',
    rulesMetaDescription: "ナイン・メンズ・モリス（Nine Men's Morris）のルールを1ステップ1枚の図で：配置、3つ並べて駒を取る、移動、飛び、勝ち負け、そして『悪魔の計略 ～デビルズ・プラン～』の番組ルールとの違い。読んだらAIや友だちと一局どうぞ。",
    rulesCta: 'トップで対局を始める',
    empty: '空き',
    nameNote: '名前：英語名 Nine Men\'s Morris の「モリス」は、ラテン語の merellus（駒）がなまったものとされています。トップページの絵はアルフォンソ10世の『遊戯の書』（1283年）から。',
    show: '悪魔の計略 ～デビルズ・プラン～',
    cardMoves: '{n} 手',
    inviteHeading: 'リンクを友だちに送る',
    inviteBody: '相手がリンクを開くと参加します。あなたが{me}、相手が{them}で、黒が先手です。',
    waitingOpponent: '相手の参加を待っています…',
    versus: '対',
    shareText: 'ナイン・メンズ・モリスで対戦しよう',
  },
  ko: {
    title: '나인 멘스 모리스',
    subtitle: "Nine Men's Morris",
    metaTitle: '나인 멘스 모리스 무료 온라인 게임',
    metaDescription: "넷플릭스 『데블스 플랜』 시즌 1 결승 1차전의 나인 멘스 모리스(Nine Men's Morris). 24개의 점 위에 각자 말 9개를 놓고 움직여, 한 줄에 3개를 만들면 상대 말 1개를 가져옵니다. AI와 두거나 한 기기에서 둘이 즐길 수 있습니다. 설치도 가입도 필요 없습니다.",
    tagline: '한 줄에 3개면 상대 말 하나를 가져온다',
    tags: '2인 · 약 10분 · 시즌 1 결승',
    vsAi: 'AI와',
    vsAiNote: '선공·후공을 고른 뒤 난이도 선택',
    first: '선공 (흑)',
    second: '후공 (백)',
    local: '로컬 대전',
    localNote: '한 기기에서 번갈아 두기',
    invite: '친구 초대',
    inviteNote: '방을 만들고 링크를 보내기',
    pickSide: '어느 쪽을 할까요?',
    showRules: '방송 규칙',
    showRulesNote: '방송의 RULE 카드대로 하기',
    howTo: '게임 방법은?',
    black: '흑',
    white: '백',
    you: '나',
    computer: 'AI',
    inHand: '손에 {n}',
    onBoard: '판 위 {n}',
    phase: { place: '놓기', move: '이동', fly: '날기', remove: '가져오기' },
    turnOf: '{side} 차례',
    yourTurn: '내 차례',
    thinking: 'AI가 생각 중…',
    online: '온라인 대전',
    hint: {
      place: '빈 점을 눌러 말을 놓으세요',
      move: '말을 골라 선을 따라 옆의 빈 점으로 옮기세요',
      moveSelected: '표시된 점을 눌러 옮기세요',
      fly: '말이 3개 남았어요: 말을 골라 아무 빈 점으로나 날아갈 수 있어요',
      remove: '한 줄 완성! 흔들리는 상대 말을 눌러 가져오세요',
      removeAny: '상대 말이 모두 줄에 있어서 줄에 있는 말도 가져올 수 있어요',
      noRemoval: '한 줄을 만들었지만 상대 말이 모두 줄에 있어서 가져올 수 없어요',
      aiRemoving: 'AI가 한 줄을 만들어 가져올 말을 고르는 중이에요',
      sideRemoving: '{side}이 한 줄을 만들어 가져올 말을 고르는 중이에요',
    },
    undo: '무르기',
    restart: '다시 하기',
    menu: '모드 변경',
    home: '나인 멘스 모리스 첫 화면으로',
    youWin: '내가 이겼어요',
    aiWins: 'AI 승리',
    win: '{side} 승리',
    draw: '무승부',
    reason: {
      pieces: '{side}의 말이 2개만 남았습니다.',
      blocked: '{side}의 말이 모두 막혀 움직일 수 없습니다.',
      repetition: '같은 국면이 세 번 나왔습니다.',
      quiet: '50수 연속으로 아무도 말을 잃지 않았습니다.',
      standoff: '누군가 3개가 된 뒤 10라운드 동안 아무도 말을 잃지 않아, 말이 더 적은 {side}의 패배입니다.',
      standoffDraw: '누군가 3개가 된 뒤 10라운드 동안 아무도 말을 잃지 않았고, 말의 수가 같았습니다.',
    },
    again: '한 판 더',
    rulesHeading: '게임 방법',
    steps: [
      { title: '판', body: '판에는 24개의 점이 있습니다. 각자 말 9개를 가지고, 흑이 먼저 둡니다.' },
      { title: '놓기', body: '번갈아 가며 손에 든 말을 빈 점에 놓습니다. 둘 다 9개를 모두 놓기 전에는 판 위의 말을 움직일 수 없습니다.' },
      { title: '한 줄 만들기', body: '한 줄에 흑의 말 3개가 놓이면 백의 말 1개를 가져옵니다. 한 줄로 이어진 백의 말은 가져올 수 없습니다(백의 말이 모두 줄에 있을 때는 예외).' },
      { title: '이동', body: '다 놓은 뒤에는 차례마다 말 하나를 선을 따라 옆의 빈 점으로 옮깁니다.' },
      { title: '날기', body: '말이 3개만 남으면 날 수 있습니다: 아무 빈 점으로나 옮길 수 있어요.' },
      { title: '승패', body: '백의 말이 2개만 남거나, 백의 차례에 움직일 말이 없으면 흑이 이깁니다. 같은 국면이 3번 나오거나 50수 연속으로 아무도 말을 잃지 않으면 무승부입니다.' },
      { title: '방송 규칙', body: '첫 화면에서 ‘방송 규칙’을 켜면 방송의 RULE 카드대로 둡니다: 한 줄로 이어진 말은 절대 가져올 수 없습니다(백의 말이 모두 줄에 있으면 흑은 이번에 가져올 말이 없습니다). 누군가 3개가 된 뒤 양쪽이 10수씩 두는 동안 아무도 말을 잃지 않으면 말이 적은 쪽이 집니다(같으면 무승부).' },
    ],
    rulesTitle: '나인 멘스 모리스 게임 방법',
    rulesMetaTitle: '나인 멘스 모리스 규칙 그림 설명',
    rulesMetaDescription: "나인 멘스 모리스(Nine Men's Morris) 규칙을 단계마다 그림 한 장으로: 놓기, 한 줄을 만들어 말 가져오기, 이동, 날기, 승패, 그리고 『데블스 플랜』 방송 규칙과의 차이. 다 읽으면 AI나 친구와 한 판 두어 보세요.",
    rulesCta: '첫 화면에서 한 판 시작',
    empty: '빈 점',
    nameNote: '이름: 영어 이름 Nine Men\'s Morris의 ‘모리스’는 라틴어 merellus(말)가 변한 것으로 알려져 있습니다. 첫 화면의 그림은 알폰소 10세의 『놀이의 책』(1283)에서 가져왔습니다.',
    show: '데블스 플랜',
    cardMoves: '{n}수',
    inviteHeading: '친구에게 링크 보내기',
    inviteBody: '친구가 링크를 열면 바로 참가합니다. 나는 {me}, 친구는 {them}이고 흑이 먼저 둡니다.',
    waitingOpponent: '친구를 기다리는 중…',
    versus: '대',
    shareText: '나인 멘스 모리스 같이 해요',
  },
  'zh-Hans': {
    title: '九子棋',
    subtitle: "Nine Men's Morris",
    metaTitle: "九子棋 Nine Men's Morris 在线免费玩",
    metaDescription: "Netflix《魔鬼的计谋》第 1 季决赛第一战的九子棋（Nine Men's Morris）。双方各 9 枚棋子，在 24 个点上轮流落子、走子，连成一线就拿掉对方一枚。可以跟 AI 下，也可以两人同一台玩，免下载、免注册。",
    tagline: '连成一线，就拿掉对方一枚棋子',
    tags: '2 人 · 约 10 分钟 · 第 1 季决赛',
    vsAi: '跟 AI 下',
    vsAiNote: '选先后手，再选难度',
    first: '先手（黑）',
    second: '后手（白）',
    local: '本机对战',
    localNote: '轮流在同一台设备上下',
    invite: '邀请朋友',
    inviteNote: '开一个房间，把链接发给朋友',
    pickSide: '你要下哪一边？',
    showRules: '节目规则',
    showRulesNote: '按节目的 RULE 卡下',
    howTo: '怎么玩？',
    black: '黑方',
    white: '白方',
    you: '你',
    computer: 'AI',
    inHand: '手上 {n}',
    onBoard: '盘上 {n}',
    phase: { place: '落子', move: '走子', fly: '飞子', remove: '拿子' },
    turnOf: '轮到{side}',
    yourTurn: '轮到你',
    thinking: 'AI 思考中…',
    online: '联机对战',
    hint: {
      place: '点一个空点，把棋子放上去',
      move: '选一枚棋子，沿线走到相邻的空点',
      moveSelected: '点标出来的点，把棋子走过去',
      fly: '只剩 3 枚：选一枚棋子，可以飞到任何空点',
      remove: '连成一线！点一枚摇摇晃晃的对方棋子拿掉',
      removeAny: '对方的棋子都在线上，这次可以拿线上的棋子',
      noRemoval: '连成一线，但对方的棋子都在线上，这次不能拿',
      aiRemoving: 'AI 连成一线，正在挑要拿哪一枚',
      sideRemoving: '{side}连成一线，正在挑要拿哪一枚',
    },
    undo: '悔棋',
    restart: '重来',
    menu: '换模式',
    home: '回九子棋首页',
    youWin: '你赢了',
    aiWins: 'AI 赢了',
    win: '{side}赢了',
    draw: '和局',
    reason: {
      pieces: '{side}只剩 2 枚棋子。',
      blocked: '{side}被困住，没有棋子可以动。',
      repetition: '同一个局面出现了三次。',
      quiet: '连续 50 步没有人被拿子。',
      standoff: '有人只剩 3 枚之后僵持了 10 回合，棋子较少的{side}输。',
      standoffDraw: '有人只剩 3 枚之后僵持了 10 回合，双方棋子一样多。',
    },
    again: '再来一局',
    rulesHeading: '怎么玩',
    steps: [
      { title: '棋盘', body: '棋盘有 24 个点。双方各 9 枚棋子，黑先。' },
      { title: '落子', body: '轮流把手上的棋子放到空点。双方 9 枚都放完之前，盘上的棋子不能动。' },
      { title: '连成一线', body: '黑方 3 枚棋子连在同一条线上（连成一线），就拿掉白方 1 枚棋子。白方连成一线的棋子不能拿，除非白方的棋子全都在线上。' },
      { title: '走子', body: '放完之后，每回合沿线把一枚棋子移到相邻的空点。' },
      { title: '飞子', body: '只剩 3 枚棋子时可以飞：移到任何空点，不必沿线。' },
      { title: '输赢', body: '白方只剩 2 枚，或轮到白方时没有棋子可以动，黑方就赢了。同一局面出现 3 次，或连续 50 步没有人被拿子，就是和局。' },
      { title: '节目规则', body: '在首页打开“节目规则”，就按节目的 RULE 卡下：连成一线的棋子一律不能拿（白方的棋子全都在线上时，黑方这次就没得拿）；有人剩 3 枚之后，双方各走 10 步都没有人被拿子，棋子少的一方输（一样多就和局）。' },
    ],
    rulesTitle: '九子棋怎么玩',
    rulesMetaTitle: "九子棋规则图解：Nine Men's Morris 怎么玩",
    rulesMetaDescription: "九子棋（Nine Men's Morris）的规则，一步一张图：落子、连成一线拿子、走子、飞子、输赢，还有《魔鬼的计谋》节目规则的差别。看完就能跟 AI 或朋友下一局。",
    rulesCta: '回首页开一局',
    empty: '空点',
    nameNote: '名字：节目里的中文就叫“九子棋”（中文维基写“直棋”）。英文 Nine Men\'s Morris 的 morris，一般认为是从拉丁文 merellus（棋子）讹变来的。首页那幅插图出自 1283 年西班牙阿方索十世的《游戏之书》。',
    show: '魔鬼的计谋',
    cardMoves: '共 {n} 步',
    inviteHeading: '把链接发给朋友',
    inviteBody: '朋友打开链接就会加入。你是{me}，对方是{them}，黑方先走。',
    waitingOpponent: '等对方加入…',
    versus: '对',
    shareText: '来跟我下九子棋',
  },
  th: {
    title: "Nine Men's Morris",
    subtitle: 'หมากเก้าตัว',
    metaTitle: "Nine Men's Morris หมากเก้าตัว เล่นฟรีออนไลน์",
    metaDescription: "Nine Men's Morris เกมแรกในรอบชิงชนะเลิศซีซัน 1 ของ The Devil's Plan บน Netflix แต่ละฝ่ายมีหมาก 9 ตัวบนกระดาน 24 จุด ผลัดกันวางและเดินหมาก เรียงครบ 3 ตัวในแนวเดียวเมื่อไหร่ก็หยิบหมากของอีกฝ่ายออกได้ 1 ตัว เล่นกับ AI หรือเล่นสองคนบนเครื่องเดียวได้ ไม่ต้องดาวน์โหลด",
    tagline: 'เรียงครบ 3 ตัว หยิบหมากอีกฝ่ายออก 1 ตัว',
    tags: '2 คน · ประมาณ 10 นาที · รอบชิงซีซัน 1',
    vsAi: 'เล่นกับ AI',
    vsAiNote: 'เลือกเดินก่อนหรือหลัง แล้วเลือกระดับ',
    first: 'เดินก่อน (ดำ)',
    second: 'เดินหลัง (ขาว)',
    local: 'เล่นในเครื่อง',
    localNote: 'ผลัดกันเล่นบนเครื่องเดียว',
    invite: 'ชวนเพื่อน',
    inviteNote: 'เปิดห้องแล้วส่งลิงก์ให้เพื่อน',
    pickSide: 'อยากเล่นฝั่งไหน',
    showRules: 'กติกาในรายการ',
    showRulesNote: 'เล่นตามการ์ดกติกาในรายการ',
    howTo: 'เล่นยังไง?',
    black: 'ฝ่ายดำ',
    white: 'ฝ่ายขาว',
    you: 'คุณ',
    computer: 'AI',
    inHand: 'ในมือ {n}',
    onBoard: 'บนกระดาน {n}',
    phase: { place: 'วางหมาก', move: 'เดินหมาก', fly: 'บิน', remove: 'หยิบออก' },
    turnOf: 'ตาของ{side}',
    yourTurn: 'ตาของคุณ',
    thinking: 'AI กำลังคิด…',
    online: 'เล่นออนไลน์',
    hint: {
      place: 'แตะจุดว่างเพื่อวางหมาก',
      move: 'เลือกหมาก แล้วเดินตามเส้นไปยังจุดว่างที่อยู่ติดกัน',
      moveSelected: 'แตะจุดที่มีเครื่องหมายเพื่อเดินไปที่นั่น',
      fly: 'เหลือ 3 ตัว: เลือกหมากแล้วบินไปจุดว่างไหนก็ได้',
      remove: 'เรียงครบ 3 ตัวแล้ว! แตะหมากของอีกฝ่ายที่กำลังโยกเยกเพื่อหยิบออก',
      removeAny: 'หมากของอีกฝ่ายเรียงอยู่ทุกตัว ครั้งนี้หยิบตัวที่เรียงอยู่ได้',
      noRemoval: 'เรียงครบ 3 ตัว แต่หมากของอีกฝ่ายเรียงอยู่ทุกตัว จึงหยิบไม่ได้',
      aiRemoving: 'AI เรียงครบ 3 ตัว กำลังเลือกหมากที่จะหยิบ',
      sideRemoving: '{side}เรียงครบ 3 ตัว กำลังเลือกหมากที่จะหยิบ',
    },
    undo: 'ย้อนตา',
    restart: 'เริ่มใหม่',
    menu: 'เปลี่ยนโหมด',
    home: "กลับหน้าแรก Nine Men's Morris",
    youWin: 'คุณชนะ',
    aiWins: 'AI ชนะ',
    win: '{side}ชนะ',
    draw: 'เสมอ',
    reason: {
      pieces: '{side}เหลือหมากแค่ 2 ตัว',
      blocked: '{side}ถูกล้อมจนไม่มีหมากที่เดินได้',
      repetition: 'ตำแหน่งเดิมเกิดซ้ำครบ 3 ครั้ง',
      quiet: 'เดินติดกัน 50 ตาโดยไม่มีใครเสียหมาก',
      standoff: 'หลังจากมีฝ่ายเหลือ 3 ตัว ผ่านไป 10 รอบโดยไม่มีใครเสียหมาก {side}มีหมากน้อยกว่าจึงแพ้',
      standoffDraw: 'หลังจากมีฝ่ายเหลือ 3 ตัว ผ่านไป 10 รอบโดยไม่มีใครเสียหมาก และหมากเท่ากัน',
    },
    again: 'เล่นอีกรอบ',
    rulesHeading: 'วิธีเล่น',
    steps: [
      { title: 'กระดาน', body: 'กระดานมี 24 จุด แต่ละฝ่ายมีหมาก 9 ตัว ฝ่ายดำเดินก่อน' },
      { title: 'วางหมาก', body: 'ผลัดกันวางหมากจากในมือลงบนจุดว่าง ระหว่างที่ทั้งสองฝ่ายยังวางไม่ครบ 9 ตัว หมากบนกระดานยังเดินไม่ได้' },
      { title: 'เรียงครบ 3 ตัว', body: 'ถ้าหมากของฝ่ายดำ 3 ตัวเรียงอยู่บนเส้นเดียวกัน ฝ่ายดำหยิบหมากของฝ่ายขาวออก 1 ตัว หมากของฝ่ายขาวที่เรียงครบ 3 ตัวอยู่หยิบไม่ได้ ยกเว้นเมื่อหมากของฝ่ายขาวเรียงอยู่ทุกตัว' },
      { title: 'เดินหมาก', body: 'เมื่อวางครบแล้ว ในแต่ละตาให้เดินหมาก 1 ตัวตามเส้นไปยังจุดว่างที่อยู่ติดกัน' },
      { title: 'บิน', body: 'เมื่อเหลือหมาก 3 ตัว จะบินได้: เดินไปจุดว่างไหนก็ได้' },
      { title: 'แพ้ชนะ', body: 'ฝ่ายดำชนะเมื่อฝ่ายขาวเหลือหมาก 2 ตัว หรือถึงตาของฝ่ายขาวแล้วไม่มีหมากที่เดินได้ เสมอเมื่อตำแหน่งเดิมเกิดซ้ำ 3 ครั้ง หรือเดินติดกัน 50 ตาโดยไม่มีใครเสียหมาก' },
      { title: 'กติกาในรายการ', body: 'เปิด “กติกาในรายการ” ที่หน้าแรกเพื่อเล่นตามการ์ดกติกาในรายการ: หมากที่เรียงครบ 3 ตัวหยิบไม่ได้เลย (ถ้าหมากของฝ่ายขาวเรียงอยู่ทุกตัว ครั้งนี้ฝ่ายดำก็หยิบอะไรไม่ได้) เมื่อมีฝ่ายใดเหลือ 3 ตัว ถ้าทั้งสองฝ่ายเดินคนละ 10 ตาโดยไม่มีใครเสียหมาก ฝ่ายที่มีหมากน้อยกว่าจะแพ้ (ถ้าเท่ากันถือว่าเสมอ)' },
    ],
    rulesTitle: "วิธีเล่น Nine Men's Morris",
    rulesMetaTitle: "กติกา Nine Men's Morris แบบมีภาพประกอบ",
    rulesMetaDescription: "กติกาของ Nine Men's Morris ทีละขั้นพร้อมภาพ: วางหมาก เรียงครบ 3 ตัวเพื่อหยิบหมาก เดินหมาก บิน แพ้ชนะ และกติกาในรายการ The Devil's Plan ต่างกันอย่างไร อ่านจบแล้วเล่นกับ AI หรือเพื่อนได้เลย",
    rulesCta: 'กลับหน้าแรกเพื่อเริ่มเล่น',
    empty: 'จุดว่าง',
    nameNote: 'ชื่อ: คำว่า morris ใน Nine Men\'s Morris เชื่อกันว่าเพี้ยนมาจากคำละติน merellus (ตัวหมาก) ภาพที่หน้าแรกมาจาก “หนังสือแห่งเกม” ของพระเจ้าอัลฟองโซที่ 10 (ค.ศ. 1283)',
    show: 'The Devil\'s Plan',
    cardMoves: '{n} ตา',
    inviteHeading: 'ส่งลิงก์ให้เพื่อน',
    inviteBody: 'เพื่อนเปิดลิงก์แล้วจะเข้าร่วมทันที คุณเล่น{me} เพื่อนเล่น{them} ฝ่ายดำเดินก่อน',
    waitingOpponent: 'กำลังรอเพื่อน…',
    versus: 'ปะทะ',
    shareText: "มาเล่น Nine Men's Morris กัน",
  },
} satisfies TextTable<MorrisText>;
