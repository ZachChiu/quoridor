/**
 * 《魔鬼的計謀》各季的遊戲清單，給平台首頁用。純資料，零 React。
 *
 * 遊戲名先用 Netflix 的英文官方名稱（來源：Wikipedia〈The Devil's Plan〉，2026-10-18 查）。
 * 各語系的譯名還沒查證，**不要自己翻**（韓文「벽바둑」那次的教訓）——
 * 查證後加進 app/i18n/glossary.md，再在這裡補 names。
 *
 * playable：已經做成線上版的遊戲，值是站內路徑（常數在 i18n/routes.ts）；look 是它在平台上的卡片長相（各遊戲自己的識別）。
 * 第二批五款（時間拍賣、九子棋、盲眼五子棋、均衡曼卡拉、騎士巡邏）是 2026-10-20 的試做：
 * 頁面 noindex、主視覺是 AI 畫的，各自一種畫風（不沿用 Wall Go 的平塗或虎羊棋的米提拉）。
 */
import { BAGH_CHAL, BALANCE_MANCALA, BLIND_GOMOKU, KNIGHTS_TOUR, NINE_MENS_MORRIS, TIME_AUCTION, WALL_GO } from '@/i18n/routes';

export type GameLook = {
  /** 卡片底色與文字色（Tailwind class） */
  card: string;
  /** 從平台點進去時轉場擴散的顏色 */
  wipe: string;
  /** 主視覺（public/ 底下的圖） */
  art: string;
  /**
   * 主視覺鋪滿整張卡片（AI 畫的橫幅插畫）；沒有的話是 Wall Go 那種斜擺在右上角的棋盤 SVG。
   * 名字壓在底部的漸層上。
   */
  cover?: boolean;
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
      { name: 'Wall Go', names: { 'zh-TW': '牆壁圍棋', 'zh-Hans': '墙壁围棋', ja: '壁囲碁', ko: '벽바둑' }, playable: WALL_GO,
        look: { card: 'bg-tile-blue text-tile-cream', wipe: 'rgb(var(--tile-blue))', art: '/games/wall-go/key-art.svg' } },
      // 中文「虎羊棋」是描述性副名、韓文「바그찰」是節目 RULE 卡上的寫法（見 glossary）
      { name: 'Bagh Chal', names: { 'zh-TW': '虎羊棋', 'zh-Hans': '虎羊棋', ko: '바그찰' }, playable: BAGH_CHAL,
        look: { card: 'bg-[#e3a43c] text-tile-ink', wipe: '#f1e6cd', art: '/games/bagh-chal/key-art.webp', cover: true } },
      { name: 'Crooked Cops' },
      { name: 'Remove One' },
      { name: 'Unknown' },
      { name: 'Time Auction', playable: TIME_AUCTION,
        look: { card: 'bg-[#5a1422] text-white', wipe: '#5a1422', art: '/games/time-auction/key-art.webp', cover: true } },
      { name: 'Halloween Monster' },
      { name: "Sniper Hold'em" },
      { name: 'Treasure Island' },
      { name: 'Triple Dice' },
      { name: 'Balance Mancala', playable: BALANCE_MANCALA,
        look: { card: 'bg-[#141b3d] text-white', wipe: '#141b3d', art: '/games/balance-mancala/key-art.webp', cover: true } },
      { name: 'Doubt and Bet' },
      { name: 'Equation Pyramid' },
      { name: 'Big Small' },
      { name: 'Question and Truth' },
      { name: "Knight's Tour", playable: KNIGHTS_TOUR,
        look: { card: 'bg-[#f2c230] text-tile-ink', wipe: '#f2c230', art: '/games/knights-tour/key-art.webp', cover: true } },
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
      { name: 'Blind Gomoku', playable: BLIND_GOMOKU,
        look: { card: 'bg-[#e8457f] text-white', wipe: '#e8457f', art: '/games/blind-gomoku/key-art.webp', cover: true } },
      { name: "Nine Men's Morris", playable: NINE_MENS_MORRIS,
        look: { card: 'bg-[#1d3b8a] text-white', wipe: '#1d3b8a', art: '/games/nine-mens-morris/key-art.webp', cover: true } },
      { name: 'Hexagon' },
    ],
  },
];

export function gameName(game: CatalogGame, locale: string): string {
  return game.names?.[locale] ?? game.name;
}

/** 已經能玩的遊戲（平台首頁最上面那一排），新的一季排前面 */
export const PLAYABLE: CatalogGame[] = SEASONS.flatMap((s) => s.games).filter((g) => g.playable && g.look);

/** 一季裡能玩的排前面，其他照節目播出順序 */
export function playableFirst(games: CatalogGame[]): CatalogGame[] {
  return [...games].sort((a, b) => Number(!!b.playable) - Number(!!a.playable));
}

