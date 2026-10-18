/**
 * 《魔鬼的計謀》各季的遊戲清單，給平台首頁用。純資料，零 React。
 *
 * 遊戲名先用 Netflix 的英文官方名稱（來源：Wikipedia〈The Devil's Plan〉，2026-10-18 查）。
 * 各語系的譯名還沒查證，**不要自己翻**（韓文「벽바둑」那次的教訓）——
 * 查證後加進 app/i18n/glossary.md，再在這裡補 names。
 *
 * playable：已經做成線上版的遊戲，值是站內路徑；look 是它在平台上的卡片長相（各遊戲自己的識別）。
 */
export type GameLook = {
  /** 卡片底色與文字色（Tailwind class） */
  card: string;
  /** 從平台點進去時轉場擴散的顏色 */
  wipe: string;
  /** 主視覺（public/ 底下的 SVG） */
  art: string;
};

export type CatalogGame = {
  /** 英文官方名稱 */
  name: string;
  /** 各語系查證過的名字；沒有就顯示英文 */
  names?: Partial<Record<string, string>>;
  playable?: string;
  look?: GameLook;
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
      { name: 'Wall Go', names: { 'zh-TW': '牆壁圍棋', 'zh-Hans': '墙壁围棋', ja: '壁囲碁', ko: '벽바둑' }, playable: '/wall-go',
        look: { card: 'bg-tile-blue text-tile-cream', wipe: 'rgb(var(--tile-blue))', art: '/games/wall-go/key-art.svg' } },
      // 中文「虎羊棋」是描述性副名、韓文「바그찰」是節目 RULE 卡上的寫法（見 glossary）
      { name: 'Bagh Chal', names: { 'zh-TW': '虎羊棋', 'zh-Hans': '虎羊棋', ko: '바그찰' }, playable: '/bagh-chal',
        look: { card: 'bg-tile-orange text-tile-ink', wipe: 'rgb(var(--tile-orange))', art: '/games/bagh-chal/key-art.svg' } },
      { name: 'Crooked Cops' },
      { name: 'Remove One' },
      { name: 'Unknown' },
      { name: 'Time Auction' },
      { name: 'Halloween Monster' },
      { name: "Sniper Hold'em" },
      { name: 'Treasure Island' },
      { name: 'Triple Dice' },
      { name: 'Balance Mancala' },
      { name: 'Doubt and Bet' },
      { name: 'Equation Pyramid' },
      { name: 'Big Small' },
      { name: 'Question and Truth' },
      { name: "Knight's Tour" },
    ],
  },
  {
    id: 's1',
    games: [
      { name: 'Virus Game' },
      { name: 'Rules Race' },
      { name: 'Secret Number' },
      { name: 'Zoo' },
      { name: 'Laying Grass' },
      { name: 'Equation High-Low' },
      { name: 'Cooperative Puzzle' },
      { name: 'Fragments of Memory' },
      { name: 'Word Tower' },
      { name: 'Scale Game' },
      { name: 'Montage' },
      { name: 'Four Player Three in a Row' },
      { name: 'Blind Gomoku' },
      { name: "Nine Men's Morris" },
      { name: 'Hexagon' },
    ],
  },
];

export function gameName(game: CatalogGame, locale: string): string {
  return game.names?.[locale] ?? game.name;
}
