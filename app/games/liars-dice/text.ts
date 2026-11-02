import type { TextTable } from '@/i18n/gameText';
import type { Level } from './ai';

/**
 * 大話骰的文案（六個語系）。寫法照 i18n/gameText.ts 的規定：
 * 語系的 key 在兩格縮排、依 'zh-TW' → en → ja → ko → 'zh-Hans' → th 排，字型子集靠這個切字。
 *
 * 遊戲名：大話骰／Liar's Dice／ライアーズダイス／라이어스 다이스／大话骰／ลูกเต๋าโกหก（各地搜尋的叫法，見 glossary 與 docs/next-games-research.md）。
 * 這款是《魔鬼的計謀2》第 6 天 Doubt and Bet（疑心下注）的原型，副標寫出處。
 * 不用 Perudo／Bluff 這兩個名字（商標），也不寫任何喝酒的字眼（docs/liars-dice.md）。
 * 英文、泰文的撇號用直的 '：整頁的字是 Noto Serif TC（scripts/game-fonts/liars-dice.mjs），彎的 ’ 在中文字型裡是全形，會寫成「Liar’ s」。
 * 畫面上不寫「你」：自己那一方用記號標（自己那排骰子一圈框），`mine` 只給讀屏。
 */
export type LiarsDiceText = {
  metaTitle: string;
  metaDescription: string;
  title: string;
  subtitle: string;
  tagline: string;
  vsAi: string;
  vsAiDesc: string;
  local: string;
  localDesc: string;
  howTo: string;
  home: string;
  /** 開局設定（對電腦、同一台都用這個彈窗） */
  setupKicker: string;
  players: string;
  level: string;
  levels: Record<Level, { name: string; desc: string }>;
  rulesLabel: string;
  wild: string;
  wildDesc: string;
  exact: string;
  exactDesc: string;
  start: string;
  /** 六個座位的名字（紅、黃、藍、綠、粉、白） */
  seats: string[];
  /** 只給讀屏：自己那一方 */
  mine: string;
  roundInfo: string;
  wildOn: string;
  zhaiOn: string;
  wildOff: string;
  diceLeft: string;
  out: string;
  bidBy: string;
  opens: string;
  thinking: string;
  turnOf: string;
  count: string;
  face: string;
  bid: string;
  challenge: string;
  callExact: string;
  /** 一口的念法：{n} 個數、{f} 點數 */
  bidText: string;
  revealChallenge: string;
  revealExact: string;
  revealBody: string;
  loses: string;
  gains: string;
  knockedOut: string;
  nextRound: string;
  winTitle: string;
  winBody: string;
  playAgain: string;
  backMenu: string;
  /** 同一台輪流：交給下一個人 */
  passTitle: string;
  passBody: string;
  peek: string;
  steps: { title: string; body: string }[];
  credit: string;
};

export const TEXT = {
  'zh-TW': {
    metaTitle: '大話骰線上玩：跟電腦或朋友吹牛喊骰',
    metaDescription: '大話骰（Liar’s Dice）線上版：每人五顆骰子藏在骰盅裡，輪流喊「全桌至少有幾個幾」，不信就開。1 點萬用、喊 1 變齋。2–6 人，可以跟電腦玩或同一台輪流，免下載。',
    title: '大話骰',
    subtitle: '《魔鬼的計謀2》Doubt and Bet 的原型',
    tagline: '每人五顆骰子藏在骰盅裡，輪流喊「全桌至少有幾個幾」，不信就開。',
    vsAi: '對電腦',
    vsAiDesc: '2–6 人，空位由電腦補',
    local: '同一台輪流',
    localDesc: '輪到誰，誰才看自己的骰子',
    howTo: '怎麼玩',
    home: '回首頁',
    setupKicker: '開一桌',
    players: '幾個人',
    level: '電腦的強度',
    levels: {
      easy: { name: '新手', desc: '常常看錯，很少騙人' },
      normal: { name: '普通', desc: '會算機率，偶爾虛張' },
      hard: { name: '老手', desc: '會從別人喊的點數猜手牌' },
    },
    rulesLabel: '規則',
    wild: '1 點萬用',
    wildDesc: '1 可以當任何點數；有人喊了 1 就變齋，這一輪 1 只算 1',
    exact: '可以喊「剛好」',
    exactDesc: '剛好那麼多就拿回一顆，不是就少一顆',
    start: '開始',
    seats: ['紅方', '黃方', '藍方', '綠方', '粉方', '白方'],
    mine: '（你）',
    roundInfo: '第 {n} 輪 · 全桌 {dice} 顆',
    wildOn: '1 點萬用',
    zhaiOn: '齋：1 只算 1',
    wildOff: '1 不萬用',
    diceLeft: '{n} 顆',
    out: '出局',
    bidBy: '{side}喊',
    opens: '{side}先喊',
    thinking: '{side}想一想…',
    turnOf: '輪到{side}',
    count: '個數',
    face: '點數',
    bid: '喊',
    challenge: '開！',
    callExact: '剛好',
    bidText: '{n} 個 {f}',
    revealChallenge: '{side}開了',
    revealExact: '{side}喊剛好',
    revealBody: '喊的是 {bid}，掀開有 {n} 個',
    loses: '{side}少一顆',
    gains: '{side}拿回一顆',
    knockedOut: '{side}出局',
    nextRound: '下一輪',
    winTitle: '{side}贏了',
    winBody: '撐了 {n} 輪，最後只剩這一方還有骰子。',
    playAgain: '再來一局',
    backMenu: '回選單',
    passTitle: '交給{side}',
    passBody: '其他人別看畫面，{side}按下去才會看到自己的骰子。',
    peek: '看骰子',
    steps: [
      { title: '搖骰子', body: '每人五顆骰子，搖完只看自己的。' },
      { title: '輪流喊', body: '喊「全桌至少有幾個幾」。下一個人要喊得更大：個數更多，或個數一樣、點數更大（2 < 3 < 4 < 5 < 6 < 1）。' },
      { title: '1 點萬用', body: '數的時候 1 也算進去。有人喊了 1 就變「齋」，這一輪 1 只算 1。' },
      { title: '不信就開', body: '掀開來數。真的有那麼多，開的人少一顆；沒有，喊的人少一顆。少一顆的人先喊下一輪。' },
      { title: '最後還有骰子的人贏', body: '骰子輸光就出局。開局時也可以打開「剛好」：剛好那麼多就拿回一顆。' },
    ],
    credit: '主視覺：秘魯的安地斯小披風（uncu），17–18 世紀，大都會藝術博物館，公有領域。',
  },
  en: {
    metaTitle: 'Play Liar\'s Dice Online — vs Computer or Friends',
    metaDescription: 'Liar\'s Dice online: everyone hides five dice under a cup and takes turns claiming “at least N of a face on the table” — or calls the bluff. Ones are wild until someone bids ones. 2–6 players, against the computer or pass-and-play, no download.',
    title: 'Liar\'s Dice',
    subtitle: 'The classic behind Doubt and Bet in The Devil\'s Plan 2',
    tagline: 'Five dice under every cup. Claim how many of a face are on the table — or call the bluff.',
    vsAi: 'Vs computer',
    vsAiDesc: '2–6 players, the computer fills empty seats',
    local: 'Pass and play',
    localDesc: 'Each player peeks only on their own turn',
    howTo: 'How to play',
    home: 'Home',
    setupKicker: 'New table',
    players: 'Players',
    level: 'Computer strength',
    levels: {
      easy: { name: 'Beginner', desc: 'Misjudges often, rarely bluffs' },
      normal: { name: 'Regular', desc: 'Counts the odds, bluffs now and then' },
      hard: { name: 'Veteran', desc: 'Reads hands from what others bid' },
    },
    rulesLabel: 'Rules',
    wild: 'Ones are wild',
    wildDesc: 'A one counts as any face — until someone bids ones, then ones are just ones this round',
    exact: 'Allow “exact”',
    exactDesc: 'Exactly that many wins a die back; otherwise lose one',
    start: 'Start',
    seats: ['Red', 'Yellow', 'Blue', 'Green', 'Pink', 'White'],
    mine: ' (you)',
    roundInfo: 'Round {n} · {dice} dice on the table',
    wildOn: 'Ones are wild',
    zhaiOn: 'Ones bid: no wilds',
    wildOff: 'No wilds',
    diceLeft: '{n} dice',
    out: 'Out',
    bidBy: '{side} bids',
    opens: '{side} opens',
    thinking: '{side} is thinking…',
    turnOf: '{side} to bid',
    count: 'How many',
    face: 'Face',
    bid: 'Bid',
    challenge: 'Liar!',
    callExact: 'Exact',
    bidText: '{n} × {f}',
    revealChallenge: '{side} calls it',
    revealExact: '{side} calls exact',
    revealBody: 'The bid was {bid}; the table has {n}',
    loses: '{side} loses a die',
    gains: '{side} wins a die back',
    knockedOut: '{side} is out',
    nextRound: 'Next round',
    winTitle: '{side} wins',
    winBody: 'Last one holding dice after {n} rounds.',
    playAgain: 'Play again',
    backMenu: 'Back to menu',
    passTitle: 'Pass to {side}',
    passBody: 'Everyone else look away — {side} taps to see their dice.',
    peek: 'Show my dice',
    steps: [
      { title: 'Roll', body: 'Everyone has five dice and sees only their own.' },
      { title: 'Bid in turn', body: 'Claim “at least N of a face on the table”. The next bid must be higher: more dice, or the same number of a higher face (2 < 3 < 4 < 5 < 6 < 1).' },
      { title: 'Ones are wild', body: 'Ones count toward every face. Once someone bids ones, they are just ones for the rest of the round.' },
      { title: 'Call the bluff', body: 'Lift the cups and count. If the bid holds, the caller loses a die; if not, the bidder does. Whoever lost a die opens the next round.' },
      { title: 'Last dice standing', body: 'Lose all your dice and you are out. You can also turn on “exact”: hit the number exactly and win a die back.' },
    ],
    credit: 'Key art: Andean child\'s tunic (uncu), Peru, 17th–18th century. The Metropolitan Museum of Art, public domain.',
  },
  ja: {
    metaTitle: 'ライアーズダイスをオンラインで — コンピューターや友だちと',
    metaDescription: 'ライアーズダイスのオンライン版。全員5個のサイコロをカップに隠し、「場に少なくとも○の目が△個」と順に宣言、疑うなら開ける。1はワイルド、1を宣言したら以後ワイルドなし。2〜6人、コンピューター相手や1台で回して遊べます。インストール不要。',
    title: 'ライアーズダイス',
    subtitle: '『デビルズプラン2』Doubt and Bet の原型',
    tagline: '全員5個のサイコロをカップに隠し、場にある目の数を宣言。疑うなら開ける。',
    vsAi: 'コンピューターと',
    vsAiDesc: '2〜6人、空席はコンピューター',
    local: '1台で回す',
    localDesc: '自分の番だけ自分のサイコロを見る',
    howTo: '遊び方',
    home: 'ホーム',
    setupKicker: '新しい卓',
    players: '人数',
    level: 'コンピューターの強さ',
    levels: {
      easy: { name: '初心者', desc: 'よく読み違え、あまりはったりしない' },
      normal: { name: 'ふつう', desc: '確率を数え、ときどきはったり' },
      hard: { name: '熟練', desc: '他人の宣言から手を読む' },
    },
    rulesLabel: 'ルール',
    wild: '1はワイルド',
    wildDesc: '1はどの目にも数える。誰かが1を宣言したら、その回は1は1だけ',
    exact: '「ぴったり」あり',
    exactDesc: 'ぴったりなら1個取り戻し、外れたら1個失う',
    start: 'はじめる',
    seats: ['赤', '黄', '青', '緑', '桃', '白'],
    mine: '（あなた）',
    roundInfo: '第{n}回 · 場に{dice}個',
    wildOn: '1はワイルド',
    zhaiOn: '1宣言済み：ワイルドなし',
    wildOff: 'ワイルドなし',
    diceLeft: '{n}個',
    out: '脱落',
    bidBy: '{side}の宣言',
    opens: '{side}から宣言',
    thinking: '{side}が考え中…',
    turnOf: '{side}の番',
    count: '個数',
    face: '目',
    bid: '宣言',
    challenge: 'ダウト！',
    callExact: 'ぴったり',
    bidText: '{f}が{n}個',
    revealChallenge: '{side}がダウト',
    revealExact: '{side}がぴったり',
    revealBody: '宣言は{bid}、開けたら{n}個',
    loses: '{side}が1個失う',
    gains: '{side}が1個取り戻す',
    knockedOut: '{side}が脱落',
    nextRound: '次の回',
    winTitle: '{side}の勝ち',
    winBody: '{n}回を戦い、最後までサイコロが残った。',
    playAgain: 'もう一度',
    backMenu: 'メニューへ',
    passTitle: '{side}に渡す',
    passBody: 'ほかの人は画面を見ないで。{side}が押すと自分のサイコロが見えます。',
    peek: 'サイコロを見る',
    steps: [
      { title: 'サイコロを振る', body: '全員5個。振ったら自分のだけ見る。' },
      { title: '順に宣言', body: '「場に少なくとも○の目が△個」。次の人はもっと大きく：個数を増やすか、同じ個数で大きい目（2 < 3 < 4 < 5 < 6 < 1）。' },
      { title: '1はワイルド', body: '数えるとき1も入れる。誰かが1を宣言したら、その回は1は1だけ。' },
      { title: '疑うなら開ける', body: 'カップを開けて数える。本当なら開けた人が1個失い、うそなら宣言した人が1個失う。失った人から次の回。' },
      { title: '最後まで残った人の勝ち', body: 'サイコロがなくなったら脱落。「ぴったり」をオンにもできる：ちょうどなら1個取り戻す。' },
    ],
    credit: 'メインビジュアル：アンデスの子ども用チュニック（ウンク）、ペルー、17〜18世紀。メトロポリタン美術館、パブリックドメイン。',
  },
  ko: {
    metaTitle: '라이어스 다이스 온라인 — 컴퓨터나 친구와',
    metaDescription: '라이어스 다이스 온라인. 모두 주사위 다섯 개를 컵에 숨기고 “판에 적어도 ○이 △개”를 차례로 외치고, 못 믿겠으면 연다. 1은 와일드, 누가 1을 외치면 그 판은 와일드 없음. 2~6인, 컴퓨터와 또는 한 대로 돌려 가며. 설치 없음.',
    title: '라이어스 다이스',
    subtitle: '〈데블스 플랜 2〉 Doubt and Bet의 원형',
    tagline: '모두 주사위 다섯 개를 컵에 숨기고, 판에 있는 눈의 수를 외친다. 못 믿겠으면 연다.',
    vsAi: '컴퓨터와',
    vsAiDesc: '2~6인, 빈자리는 컴퓨터가',
    local: '한 대로 돌려 가며',
    localDesc: '자기 차례에만 자기 주사위를 본다',
    howTo: '하는 법',
    home: '홈',
    setupKicker: '새 판',
    players: '인원',
    level: '컴퓨터 실력',
    levels: {
      easy: { name: '초보', desc: '자주 잘못 읽고, 거의 속이지 않음' },
      normal: { name: '보통', desc: '확률을 세고, 가끔 허세' },
      hard: { name: '고수', desc: '남이 외친 눈으로 손패를 읽음' },
    },
    rulesLabel: '규칙',
    wild: '1은 와일드',
    wildDesc: '1은 어떤 눈으로도 센다. 누가 1을 외치면 그 판은 1은 1로만',
    exact: '“딱 맞아” 허용',
    exactDesc: '딱 그만큼이면 하나 되찾고, 아니면 하나 잃는다',
    start: '시작',
    seats: ['빨강', '노랑', '파랑', '초록', '분홍', '하양'],
    mine: '(나)',
    roundInfo: '{n}판 · 판에 {dice}개',
    wildOn: '1은 와일드',
    zhaiOn: '1 외침: 와일드 없음',
    wildOff: '와일드 없음',
    diceLeft: '{n}개',
    out: '탈락',
    bidBy: '{side}의 외침',
    opens: '{side}부터 외침',
    thinking: '{side} 생각 중…',
    turnOf: '{side} 차례',
    count: '개수',
    face: '눈',
    bid: '외치기',
    challenge: '열어!',
    callExact: '딱 맞아',
    bidText: '{f} {n}개',
    revealChallenge: '{side}이(가) 열었다',
    revealExact: '{side}: 딱 맞아',
    revealBody: '외친 것은 {bid}, 열어 보니 {n}개',
    loses: '{side} 하나 잃음',
    gains: '{side} 하나 되찾음',
    knockedOut: '{side} 탈락',
    nextRound: '다음 판',
    winTitle: '{side} 승리',
    winBody: '{n}판 끝에 마지막까지 주사위가 남았다.',
    playAgain: '한 판 더',
    backMenu: '메뉴로',
    passTitle: '{side}에게 넘기기',
    passBody: '다른 사람은 화면을 보지 마세요. {side}이(가) 누르면 자기 주사위가 보입니다.',
    peek: '주사위 보기',
    steps: [
      { title: '주사위 굴리기', body: '모두 다섯 개. 굴리고 나서 자기 것만 본다.' },
      { title: '차례로 외치기', body: '“판에 적어도 ○이 △개”. 다음 사람은 더 크게: 개수를 늘리거나, 같은 개수에 더 큰 눈(2 < 3 < 4 < 5 < 6 < 1).' },
      { title: '1은 와일드', body: '셀 때 1도 넣는다. 누가 1을 외치면 그 판은 1은 1로만.' },
      { title: '못 믿겠으면 연다', body: '컵을 열고 센다. 정말이면 연 사람이, 거짓이면 외친 사람이 하나 잃는다. 잃은 사람부터 다음 판.' },
      { title: '마지막까지 남으면 승리', body: '주사위를 다 잃으면 탈락. “딱 맞아”를 켤 수도 있다: 딱 그만큼이면 하나 되찾는다.' },
    ],
    credit: '메인 이미지: 안데스 어린이 튜닉(운쿠), 페루, 17~18세기. 메트로폴리탄 미술관, 퍼블릭 도메인.',
  },
  'zh-Hans': {
    metaTitle: '大话骰在线玩：跟电脑或朋友吹牛喊骰',
    metaDescription: '大话骰（Liar’s Dice）在线版：每人五颗骰子藏在骰盅里，轮流喊“全桌至少有几个几”，不信就开。1 点万用、喊 1 变斋。2–6 人，可以跟电脑玩或同一台轮流，免下载。',
    title: '大话骰',
    subtitle: '《魔鬼的计谋2》Doubt and Bet 的原型',
    tagline: '每人五颗骰子藏在骰盅里，轮流喊“全桌至少有几个几”，不信就开。',
    vsAi: '对电脑',
    vsAiDesc: '2–6 人，空位由电脑补',
    local: '同一台轮流',
    localDesc: '轮到谁，谁才看自己的骰子',
    howTo: '怎么玩',
    home: '回首页',
    setupKicker: '开一桌',
    players: '几个人',
    level: '电脑的强度',
    levels: {
      easy: { name: '新手', desc: '常常看错，很少骗人' },
      normal: { name: '普通', desc: '会算概率，偶尔虚张' },
      hard: { name: '老手', desc: '会从别人喊的点数猜手牌' },
    },
    rulesLabel: '规则',
    wild: '1 点万用',
    wildDesc: '1 可以当任何点数；有人喊了 1 就变斋，这一轮 1 只算 1',
    exact: '可以喊“刚好”',
    exactDesc: '刚好那么多就拿回一颗，不是就少一颗',
    start: '开始',
    seats: ['红方', '黄方', '蓝方', '绿方', '粉方', '白方'],
    mine: '（你）',
    roundInfo: '第 {n} 轮 · 全桌 {dice} 颗',
    wildOn: '1 点万用',
    zhaiOn: '斋：1 只算 1',
    wildOff: '1 不万用',
    diceLeft: '{n} 颗',
    out: '出局',
    bidBy: '{side}喊',
    opens: '{side}先喊',
    thinking: '{side}想一想…',
    turnOf: '轮到{side}',
    count: '个数',
    face: '点数',
    bid: '喊',
    challenge: '开！',
    callExact: '刚好',
    bidText: '{n} 个 {f}',
    revealChallenge: '{side}开了',
    revealExact: '{side}喊刚好',
    revealBody: '喊的是 {bid}，掀开有 {n} 个',
    loses: '{side}少一颗',
    gains: '{side}拿回一颗',
    knockedOut: '{side}出局',
    nextRound: '下一轮',
    winTitle: '{side}赢了',
    winBody: '撑了 {n} 轮，最后只剩这一方还有骰子。',
    playAgain: '再来一局',
    backMenu: '回菜单',
    passTitle: '交给{side}',
    passBody: '其他人别看画面，{side}按下去才会看到自己的骰子。',
    peek: '看骰子',
    steps: [
      { title: '摇骰子', body: '每人五颗骰子，摇完只看自己的。' },
      { title: '轮流喊', body: '喊“全桌至少有几个几”。下一个人要喊得更大：个数更多，或个数一样、点数更大（2 < 3 < 4 < 5 < 6 < 1）。' },
      { title: '1 点万用', body: '数的时候 1 也算进去。有人喊了 1 就变“斋”，这一轮 1 只算 1。' },
      { title: '不信就开', body: '掀开来数。真的有那么多，开的人少一颗；没有，喊的人少一颗。少一颗的人先喊下一轮。' },
      { title: '最后还有骰子的人赢', body: '骰子输光就出局。开局时也可以打开“刚好”：刚好那么多就拿回一颗。' },
    ],
    credit: '主视觉：秘鲁的安第斯小披风（uncu），17–18 世纪，大都会艺术博物馆，公有领域。',
  },
  th: {
    metaTitle: 'เล่น Liar\'s Dice ออนไลน์ — กับคอมพิวเตอร์หรือเพื่อน',
    metaDescription: 'Liar\'s Dice ออนไลน์: ทุกคนซ่อนลูกเต๋าห้าลูกไว้ใต้ถ้วย ผลัดกันบอกว่า “บนโต๊ะมีหน้านี้อย่างน้อยกี่ลูก” ถ้าไม่เชื่อก็เปิด หน้า 1 เป็นไวลด์จนกว่าจะมีคนบอกหน้า 1 เล่นได้ 2–6 คน กับคอมพิวเตอร์หรือผลัดกันในเครื่องเดียว ไม่ต้องดาวน์โหลด',
    title: 'ลูกเต๋าโกหก',
    subtitle: 'ต้นแบบของ Doubt and Bet ใน The Devil\'s Plan 2',
    tagline: 'ทุกคนซ่อนลูกเต๋าห้าลูกไว้ใต้ถ้วย บอกว่าบนโต๊ะมีหน้านี้กี่ลูก ถ้าไม่เชื่อก็เปิด',
    vsAi: 'เล่นกับคอมพิวเตอร์',
    vsAiDesc: '2–6 คน ที่ว่างให้คอมพิวเตอร์เล่น',
    local: 'ผลัดกันในเครื่องเดียว',
    localDesc: 'ดูลูกเต๋าของตัวเองเฉพาะตาตัวเอง',
    howTo: 'วิธีเล่น',
    home: 'หน้าแรก',
    setupKicker: 'โต๊ะใหม่',
    players: 'จำนวนผู้เล่น',
    level: 'ฝีมือคอมพิวเตอร์',
    levels: {
      easy: { name: 'มือใหม่', desc: 'อ่านพลาดบ่อย แทบไม่หลอก' },
      normal: { name: 'ปกติ', desc: 'คิดความน่าจะเป็น หลอกบ้างบางที' },
      hard: { name: 'มือเก๋า', desc: 'เดาลูกเต๋าจากหน้าที่คนอื่นบอก' },
    },
    rulesLabel: 'กติกา',
    wild: 'หน้า 1 เป็นไวลด์',
    wildDesc: 'หน้า 1 นับเป็นหน้าไหนก็ได้ ถ้ามีคนบอกหน้า 1 รอบนั้นหน้า 1 นับเป็น 1 อย่างเดียว',
    exact: 'บอก “พอดี” ได้',
    exactDesc: 'ถ้าพอดีได้ลูกเต๋าคืนหนึ่งลูก ถ้าไม่ใช่เสียหนึ่งลูก',
    start: 'เริ่ม',
    seats: ['แดง', 'เหลือง', 'น้ำเงิน', 'เขียว', 'ชมพู', 'ขาว'],
    mine: ' (คุณ)',
    roundInfo: 'รอบที่ {n} · บนโต๊ะ {dice} ลูก',
    wildOn: 'หน้า 1 เป็นไวลด์',
    zhaiOn: 'บอกหน้า 1 แล้ว: ไม่มีไวลด์',
    wildOff: 'ไม่มีไวลด์',
    diceLeft: '{n} ลูก',
    out: 'ตกรอบ',
    bidBy: '{side} บอก',
    opens: '{side} เริ่มบอก',
    thinking: '{side} กำลังคิด…',
    turnOf: 'ตาของ{side}',
    count: 'กี่ลูก',
    face: 'หน้า',
    bid: 'บอก',
    challenge: 'เปิด!',
    callExact: 'พอดี',
    bidText: 'หน้า {f} {n} ลูก',
    revealChallenge: '{side} เปิด',
    revealExact: '{side} บอกพอดี',
    revealBody: 'ที่บอกคือ {bid} เปิดแล้วมี {n} ลูก',
    loses: '{side} เสียหนึ่งลูก',
    gains: '{side} ได้คืนหนึ่งลูก',
    knockedOut: '{side} ตกรอบ',
    nextRound: 'รอบต่อไป',
    winTitle: '{side} ชนะ',
    winBody: 'ผ่านไป {n} รอบ เหลือลูกเต๋าอยู่คนสุดท้าย',
    playAgain: 'เล่นอีกครั้ง',
    backMenu: 'กลับเมนู',
    passTitle: 'ส่งให้{side}',
    passBody: 'คนอื่นอย่ามองจอ {side} แตะเพื่อดูลูกเต๋าของตัวเอง',
    peek: 'ดูลูกเต๋า',
    steps: [
      { title: 'ทอยลูกเต๋า', body: 'ทุกคนมีห้าลูก ทอยแล้วดูได้แค่ของตัวเอง' },
      { title: 'ผลัดกันบอก', body: 'บอกว่า “บนโต๊ะมีหน้านี้อย่างน้อยกี่ลูก” คนต่อไปต้องบอกให้มากกว่า: จำนวนมากขึ้น หรือจำนวนเท่ากันแต่หน้าสูงกว่า (2 < 3 < 4 < 5 < 6 < 1)' },
      { title: 'หน้า 1 เป็นไวลด์', body: 'ตอนนับให้นับหน้า 1 ด้วย ถ้ามีคนบอกหน้า 1 รอบนั้นหน้า 1 นับเป็น 1 อย่างเดียว' },
      { title: 'ไม่เชื่อก็เปิด', body: 'เปิดถ้วยแล้วนับ ถ้ามีจริงคนเปิดเสียหนึ่งลูก ถ้าไม่มีคนบอกเสียหนึ่งลูก คนที่เสียเริ่มรอบต่อไป' },
      { title: 'คนสุดท้ายที่ยังมีลูกเต๋าชนะ', body: 'ลูกเต๋าหมดก็ตกรอบ เปิดตัวเลือก “พอดี” ได้ด้วย: ถ้าพอดีได้คืนหนึ่งลูก' },
    ],
    credit: 'ภาพหลัก: เสื้อคลุมเด็กแอนดีส (uncu) เปรู ศตวรรษที่ 17–18 พิพิธภัณฑ์ศิลปะเมโทรโพลิแทน สาธารณสมบัติ',
  },
} satisfies TextTable<LiarsDiceText>;
