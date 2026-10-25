/**
 * 《魔鬼的計謀》各季的遊戲清單，給平台首頁用。純資料，零 React。
 *
 * 遊戲名用 Netflix 的英文官方名稱（來源：Wikipedia〈The Devil's Plan〉，2026-10-18 查）。
 * 繁中、簡中是節目播出時媒體一致的寫法（2026-10-23 查證，來源與可信度見 app/i18n/glossary.md 的〈遊戲名〉）；
 * 其他語系沒查證過的**不要自己翻**（韓文「벽바둑」那次的教訓）—— 查證後先寫進 glossary，再在這裡補 names。
 * 日文、韓文 2026-10-25 查證過的一批集中在檔尾的 LOCAL_NAMES（為什麼不寫在各行見那裡）；泰文照 glossary 保留英文。
 * 第 1 季的 Cooperative Puzzle 繁中說法分歧（拼圖遊戲／合作拼圖／七巧板拼圖），先留英文。
 *
 * playable：已經做成線上版的遊戲，值是站內路徑（常數在 i18n/routes.ts）；look 是它在平台上的卡片長相（各遊戲自己的識別）。
 * 第二批五款（時間拍賣、九子棋、盲眼五子棋、均衡曼卡拉、騎士巡邏）是 2026-10-20 的試做：
 * 程式與頁面都在（noindex），但平台上先不開 —— 卡片照「還沒做」的樣子（2026-10-22 Zach：一個遊戲一個遊戲上，
 * 先上平台＋虎羊棋）。各自的視覺在 feat/game-<id> 分支，那條分支把它的那一行換回 playable＋look。
 * 每一行之間至少隔一行（盲眼五子棋與九子棋中間那行註解就是為了這個）：分支依序合併時改的是不同行，git 才不會衝突。
 */
// 整包匯入：各遊戲的分支打開自己那一行時用 routes.XXX，不必改這一行（不然五條分支都改同一行，合併會衝突）
import * as routes from '@/i18n/routes';

export type GameLook = {
  /** 卡片底色與文字色（Tailwind class） */
  card: string;
  /** 從平台點進去時轉場擴散的顏色 */
  wipe: string;
  /** 卡片的主視覺（public/ 底下的圖） */
  art: string;
  /**
   * 主視覺鋪滿整張卡片，名字壓在底部的漸層上；沒有的話是斜擺在右上角的棋盤 SVG。
   * Wall Go 10/24 也換成鋪滿（Zach 從五種版型裡選了「跟其他款同一個模板」）。card.svg 是斜擺 -14° 的棋盤
   *（舊卡片的斜度，Zach 同一天要的），盤面是遊戲自己的 AI 對下出來的一局（雙方都有地、中間一排紅藍隔著牆對峙），
   * 底色 10/25 從藍改成 Wall Go 自己的頁面底色 #e8e1d7；大卡片的 hero.svg／hero-square.svg 是同一盤。
   */
  cover?: boolean;
  /** 平台首頁大卡片用的大圖（橫幅，寬 1600 左右）；沒有就用 art */
  hero?: string;
  /** 手機大卡片用的方圖：橫幅放在直的大卡片上只露得出一半（尼泊爾虎棋只剩老虎，10/24 Zach） */
  heroSquare?: string;
  /** 規則頁的站內路徑：有的話大卡片多一顆「規則與玩法」 */
  rules?: string;
  /** 點進去走木窗門轉場而不是擴散色塊（虎羊棋） */
  doors?: boolean;
  /**
   * 點進去播這款自己的進場（components/entrances.ts 的 id）；還沒載好就退回擴散 wipe 的顏色。
   * 2026-10-22 Zach：「為啥每一個進場都跟 Wall Go 一樣」—— 有自己識別的遊戲，進場也要有自己的樣子。
   */
  entrance?: string;
};

export type CatalogGame = {
  /** 英文官方名稱 */
  name: string;
  /** 各語系查證過的名字；沒有就顯示英文 */
  names?: Partial<Record<string, string>>;
  playable?: string;
  look?: GameLook;
  /**
   * 開放可以玩的那一天（YYYY-MM-DD，那一版上線的日期）。平台首頁的大卡片預設放最新上線的那一款。
   * 能玩但沒寫的，算「這一版才要上線」（最新）—— 打版上線後補上日期。
   */
  since?: string;
};

export type Season = {
  id: 's1' | 's2' | 's3';
  games: CatalogGame[];
};

export const SEASONS: Season[] = [
  // 第 3 季《Dead Again》2026-11-10 上線，遊戲播出後才知道
  { id: 's3', games: [] },
  {
    id: 's2',
    games: [
      // since 是 v25.6.1（第一版）上線那天
      { name: 'Wall Go', names: { 'zh-TW': '牆壁圍棋', 'zh-Hans': '墙壁围棋', ja: '壁囲碁', ko: '벽바둑' }, playable: routes.WALL_GO, since: '2025-06-02',
        // 底色是 Wall Go 自己的頁面底色 #e8e1d7（10/25 Zach：為什麼要用藍底）；轉場也擴散這個顏色，跟虎羊棋擴散它的紙色一樣
        look: { card: 'bg-[#e8e1d7] text-tile-ink', wipe: '#e8e1d7', art: '/games/wall-go/card.svg', hero: '/games/wall-go/hero.svg', heroSquare: '/games/wall-go/hero-square.svg', cover: true, rules: routes.wallGo('/rules') } },
      // 中文用節目的「尼泊爾虎棋」（Zach 10/24：命名用 Netflix 版本）、韓文「바그찰」是節目 RULE 卡上的寫法（見 glossary）
      { name: 'Bagh Chal', names: { 'zh-TW': '尼泊爾虎棋', 'zh-Hans': '尼泊尔虎棋', ko: '바그찰' }, playable: routes.BAGH_CHAL,
        look: { card: 'bg-[#e3a43c] text-tile-ink', wipe: '#f1e6cd', art: '/games/bagh-chal/key-art.webp', hero: '/games/bagh-chal/hero.webp', heroSquare: '/games/bagh-chal/hero-square.webp', cover: true, doors: true, rules: routes.baghChal('/rules') } },
      { name: 'Crooked Cops', names: { 'zh-TW': '腐敗警察', 'zh-Hans': '腐败警察' } },
      { name: 'Remove One', names: { 'zh-TW': '移除一個', 'zh-Hans': '移除一个' } },
      { name: 'Unknown', names: { 'zh-TW': '未知', 'zh-Hans': '未知' } },
      { name: 'Time Auction', names: { 'zh-TW': '時間拍賣', 'zh-Hans': '时间拍卖' } },
      { name: 'Halloween Monster', names: { 'zh-TW': '萬聖節怪物', 'zh-Hans': '万圣节怪物' } },
      { name: "Sniper Hold'em", names: { 'zh-TW': '撲克精準玩家', 'zh-Hans': '扑克精准玩家' } },
      { name: 'Treasure Island', names: { 'zh-TW': '寶藏島', 'zh-Hans': '宝藏岛' } },
      { name: 'Triple Dice', names: { 'zh-TW': '三顆骰子相同點數', 'zh-Hans': '三骰子' } },
      { name: 'Balance Mancala', names: { 'zh-TW': '平衡播棋', 'zh-Hans': '平衡播棋' } },
      { name: 'Doubt and Bet', names: { 'zh-TW': '疑心下注', 'zh-Hans': '疑心下注' } },
      { name: 'Equation Pyramid', names: { 'zh-TW': '方程式金字塔', 'zh-Hans': '方程式金字塔' } },
      { name: 'Big Small', names: { 'zh-TW': '大或小', 'zh-Hans': '大或小' } },
      { name: 'Question and Truth', names: { 'zh-TW': '提問與真相', 'zh-Hans': '提问与真相' } },
      { name: "Knight's Tour", names: { 'zh-TW': '騎士巡遊', 'zh-Hans': '骑士巡游' } },
    ],
  },
  {
    id: 's1',
    games: [
      { name: 'Virus Game', names: { 'zh-TW': '病毒遊戲', 'zh-Hans': '病毒游戏' } },
      { name: 'Rules Race', names: { 'zh-TW': '規則競賽', 'zh-Hans': '规则竞赛' } },
      { name: 'Secret Number', names: { 'zh-TW': '秘密數字', 'zh-Hans': '秘密数字' } },
      { name: 'Zoo', names: { 'zh-TW': '動物園', 'zh-Hans': '动物园' } },
      { name: 'Laying Grass', names: { 'zh-TW': '鋪草皮遊戲', 'zh-Hans': '铺草皮游戏' } },
      { name: 'Equation High-Low', names: { 'zh-TW': '數學式比大小', 'zh-Hans': '数学式比大小' } },
      { name: 'Cooperative Puzzle' },
      { name: 'Fragments of Memory', names: { 'zh-TW': '記憶碎片', 'zh-Hans': '记忆碎片' } },
      { name: 'Word Tower', names: { 'zh-TW': '單字塔', 'zh-Hans': '单字塔' } },
      { name: 'Scale Game', names: { 'zh-TW': '托盤天平', 'zh-Hans': '托盘天平' } },
      { name: 'Montage', names: { 'zh-TW': '蒙太奇', 'zh-Hans': '蒙太奇' } },
      { name: 'Four Player Three in a Row', names: { 'zh-TW': '四人三子棋', 'zh-Hans': '四人三子棋' } },
      { name: 'Blind Gomoku', names: { 'zh-TW': '盲五子棋', 'zh-Hans': '盲五子棋' } },
      // （盲眼五子棋與九子棋各自的分支會改上下這兩行，中間隔這一行，依序合併才不會衝突）
      { name: "Nine Men's Morris", names: { 'zh-TW': '九子棋', 'zh-Hans': '九子棋' }, playable: routes.NINE_MENS_MORRIS,
        look: { card: 'bg-[#4b4577] text-[#eee0c4]', wipe: '#4b4577', art: '/games/nine-mens-morris/libro.webp', cover: true, entrance: 'nine-mens-morris', rules: routes.trialRules(routes.NINE_MENS_MORRIS) } },
      { name: 'Hexagon', names: { 'zh-TW': '六角數字盤', 'zh-Hans': '六角数字盘' } },
    ],
  },
];

/**
 * 日文、韓文的遊戲名（2026-10-25 查證，來源與信心見 glossary〈遊戲名〉）。
 * 不寫進上面各款那一行的 names：五款能玩的那幾行由各自的 feat/game-<id> 分支改，旁邊的行一動，依序合併就會衝突。
 * 韓文是節目原名，只收兩個以上來源一致的；只有 namu 一個來源的（보물섬、第 1 季大部分）先留英文。
 * （日文寫在這裡還有一個原因：字型腳本把各行的字算進繁中字型，這裡的 ja／ko 區塊會被認成日韓、不切進去 —— 日韓用系統字型。）
 * 日文 Netflix 字幕看不到，收的是日本觀眾一致的寫法；タイムオークション、バランスマンカラ、ブラインド五目並べ 是中等信心（粉絲另有意譯派）。
 */
const LOCAL_NAMES: Partial<Record<string, Record<string, string>>> = {
  ja: {
    'Bagh Chal': 'バグチャル',
    'Time Auction': 'タイムオークション',
    'Balance Mancala': 'バランスマンカラ',
    "Knight's Tour": 'ナイトツアー',
    'Blind Gomoku': 'ブラインド五目並べ',
    "Nine Men's Morris": 'ナイン・メンズ・モリス',
  },
  ko: {
    'Crooked Cops': '부패 경찰',
    'Remove One': '하나 빼기',
    Unknown: '언노운',
    'Time Auction': '시간 경매',
    'Halloween Monster': '핼러윈 몬스터',
    "Sniper Hold'em": '저격 홀덤',
    'Triple Dice': '트리플 다이스',
    'Balance Mancala': '균형의 만칼라',
    'Doubt and Bet': '의심 베팅',
    'Equation Pyramid': '수식 피라미드',
    'Big Small': '빅 스몰',
    'Question and Truth': '질문과 진실',
    "Knight's Tour": '기사의 여행',
    'Equation High-Low': '수식 하이 로우',
    'Four Player Three in a Row': '4인 3목',
    'Blind Gomoku': '블라인드 오목',
    "Nine Men's Morris": '나인 멘스 모리스',
    Hexagon: '헥사곤',
  },
};

export function gameName(game: CatalogGame, locale: string): string {
  return game.names?.[locale] ?? LOCAL_NAMES[locale]?.[game.name] ?? game.name;
}

/** 已經能玩的遊戲（平台首頁最上面那一排），新的一季排前面 */
export const PLAYABLE: CatalogGame[] = SEASONS.flatMap((s) => s.games).filter((g) => g.playable && g.look);

/**
 * 平台首頁大卡片預設放的那一款：最新上線的（10/24 Zach：哪一個最新上線就放那個）。
 * 沒寫 since 的算最新；一樣新的照 PLAYABLE 的順序（排序是穩定的）。使用者點過哪一款就換成那一款，在 components/platform/HeroPicker.tsx。
 */
export const NEWEST: CatalogGame | undefined = [...PLAYABLE].sort((a, b) => (b.since ?? '9999').localeCompare(a.since ?? '9999'))[0];

/** 一季裡能玩的排前面，其他照節目播出順序 */
export function playableFirst(games: CatalogGame[]): CatalogGame[] {
  return [...games].sort((a, b) => Number(!!b.playable) - Number(!!a.playable));
}

