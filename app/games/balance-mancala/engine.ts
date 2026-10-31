/**
 * Balance Mancala（均衡曼卡拉）的規則。純函式、零 React、零副作用 ——
 * 跟 Wall Go（app/game/）、Bagh Chal 同一個原則：畫面、電腦對手、之後的連線與回放共用這一份。
 *
 * 規則照 namu《데블스 플랜: 데스룸》第 5 天的 RULE 卡（整理在 docs/games-deep-s2.md §2）：
 * - 14 格繞成一圈、順時針。頂端（0）是惡魔格，底端（7）是天使格，
 *   其餘 12 個盤子依序 紅 藍 綠 紅 藍 綠（右半圈 1–6，左半圈 8–13）
 * - 開局：依座位輪流每次放 1 顆自己的子，每格最多 2 顆（7 人 × 4 子剛好填滿 14 格）
 * - 輪到你：選一格「有你的子」的格子（惡魔、天使也可以），把那格**所有人的子**拿起來，
 *   從下一格開始順時針每格放 1 顆。**放的順序由動子的人決定**
 * - 最後一顆子的主人得分：那一格現在的子數（含剛放的），記在那格的顏色
 *   - 天使格：記到主人目前最低的顏色；惡魔格：記到最高的顏色。同分時由**動子的人**選
 * - 任何人任一色到 30 以上，遊戲立刻結束。最終分數 ＝ 2 × 最低色 − 最高色
 *
 * 卡上沒寫、這裡做的決定（同 docs〈規則缺口與建議〉）：
 * - 開局放子照座位 1→N 重複；可選蛇形（1→N、N→1…）降低先手優勢
 * - 放子結束後由座位 A（第 1 位）先動，之後照座位輪流
 * - 一次拿起 14 顆以上時不跳過原格（繞一圈會放回原格）
 * - 最終名次同分：最高色較低者（比較均衡）在前，再同就並列
 *
 * 子永遠不離開棋盤，所以每個人每一手一定有合法步；每一手至少有 1 分進帳，所以遊戲一定會結束。
 */

export const CELLS = 14;
export const DEVIL = 0;
export const ANGEL = 7;
/** 任一色到這個分數，遊戲立刻結束 */
export const END_SCORE = 30;
/** 開局放子時每格最多幾顆 */
export const SETUP_CAP = 2;
export const MIN_SEATS = 4;
export const MAX_SEATS = 7;
export const DEFAULT_PIECES = 4;
export const SEAT_LETTERS = ['A', 'B', 'C', 'D', 'E', 'F', 'G'] as const;

/** 0 紅、1 藍、2 綠 */
export type Colour = 0 | 1 | 2;
export const COLOURS: readonly Colour[] = [0, 1, 2];
export const COLOUR_KEYS = ['R', 'B', 'G'] as const;
/** 每一格的顏色；惡魔、天使是 null */
export const CELL_COLOUR: readonly (Colour | null)[] = [null, 0, 1, 2, 0, 1, 2, null, 0, 1, 2, 0, 1, 2];
/** 節目（namu）的盤子編號 01–12；惡魔、天使是 0 */
export const DISH_NUMBER: readonly number[] = [0, 1, 2, 3, 4, 5, 6, 0, 7, 8, 9, 10, 11, 12];

/** 座位編號 0..seats-1，畫面上是 A..G */
export type Seat = number;
/** 一個座位的紅、藍、綠分數 */
export type Scores = [number, number, number];

export type GameConfig = {
  /** 4–7 席 */
  seats: number;
  /** 每人幾顆子（預設 4）。seats × pieces 不能超過 14 × 2 */
  pieces: number;
  /** 開局放子用蛇形順序 */
  snake: boolean;
};

export const DEFAULT_CONFIG: GameConfig = { seats: 4, pieces: DEFAULT_PIECES, snake: false };

/**
 * 一手：從 `from` 拿起全部的子，依 `order`（子的主人，依落下順序）一格一格放。
 * `colour` 只在最後一顆落在天使／惡魔格時有意義（同分時由動子的人選）；
 * 走過的手（MancalaState.moves）落在天使／惡魔格時一律帶上實際記分的顏色。
 */
export type Move = { from: number; order: Seat[]; colour?: Colour };

/** 播一次的完整結果（預覽與真正走都用這個） */
export type Sow = {
  from: number;
  order: Seat[];
  /** 第 i 顆子落在哪一格（跟 order 同索引） */
  path: number[];
  /** 最後一顆落在哪一格 */
  cell: number;
  /** 最後一顆的主人（得分的人） */
  owner: Seat;
  /** 得幾分 ＝ 那一格現在的子數 */
  points: number;
  /** 可以記到哪些顏色：盤子只有一種；天使／惡魔是最低／最高色（同分就不只一個） */
  options: Colour[];
  /** 實際記到的顏色；同分又還沒選時是 null */
  colour: Colour | null;
  board: Seat[][];
  /** 記分後的分數（colour 是 null 時尚未記分） */
  scores: Scores[];
  /** 這一手讓某人某色到 30 以上 → 遊戲結束 */
  ends: boolean;
};

export type Phase = 'setup' | 'play' | 'over';

export type MancalaState = {
  config: GameConfig;
  /** 14 格，每格是裡面每顆子的主人（依放進去的先後） */
  board: Seat[][];
  /** 每個座位的紅藍綠分數 */
  scores: Scores[];
  /** 開局第 i 次放子輪到誰 */
  setupOrder: Seat[];
  /** 開局每一次放在哪一格 */
  placements: number[];
  /** 播種的每一手（已正規化：落在天使／惡魔格的手一律帶顏色） */
  moves: Move[];
  phase: Phase;
  /** 輪到誰（放子或播種）；遊戲結束後是最後動的那個人 */
  turn: Seat;
  /** 上一手播種的結果，畫面標示用 */
  last: Sow | null;
};

export const letterOf = (seat: Seat): string => SEAT_LETTERS[seat] ?? '?';
export const seatOfLetter = (letter: string): Seat => SEAT_LETTERS.indexOf(letter as (typeof SEAT_LETTERS)[number]);
export const isSpecial = (cell: number) => cell === DEVIL || cell === ANGEL;

export function validateConfig(c: GameConfig): void {
  if (!Number.isInteger(c.seats) || c.seats < MIN_SEATS || c.seats > MAX_SEATS) throw new Error(`seats must be ${MIN_SEATS}–${MAX_SEATS}`);
  if (!Number.isInteger(c.pieces) || c.pieces < 1 || c.seats * c.pieces > CELLS * SETUP_CAP) {
    throw new Error(`pieces must be 1–${Math.floor((CELLS * SETUP_CAP) / c.seats)} for ${c.seats} seats`);
  }
}

/** 開局放子的順序：1→N 重複；蛇形是 1→N、N→1 交替 */
export function setupOrderOf(c: GameConfig): Seat[] {
  const out: Seat[] = [];
  for (let round = 0; round < c.pieces; round++) {
    const seats = Array.from({ length: c.seats }, (_, i) => i);
    out.push(...(c.snake && round % 2 === 1 ? seats.reverse() : seats));
  }
  return out;
}

export function createGame(config: Partial<GameConfig> = {}): MancalaState {
  const c: GameConfig = { ...DEFAULT_CONFIG, ...config };
  validateConfig(c);
  const setupOrder = setupOrderOf(c);
  return {
    config: c,
    board: Array.from({ length: CELLS }, () => []),
    scores: Array.from({ length: c.seats }, () => [0, 0, 0] as Scores),
    setupOrder,
    placements: [],
    moves: [],
    phase: 'setup',
    turn: setupOrder[0],
    last: null,
  };
}

/** 開局還能放的格子（未滿 2 顆） */
export function legalPlacements(s: MancalaState): number[] {
  if (s.phase !== 'setup') return [];
  return s.board.flatMap((cell, i) => (cell.length < SETUP_CAP ? [i] : []));
}

/** 開局放一顆子（輪到的人），回傳全新的局面。不合法丟錯 */
export function place(s: MancalaState, cell: number): MancalaState {
  if (s.phase !== 'setup') throw new Error('not in setup');
  if (!Number.isInteger(cell) || cell < 0 || cell >= CELLS) throw new Error(`bad cell: ${cell}`);
  if (s.board[cell].length >= SETUP_CAP) throw new Error(`cell ${cell} is full`);
  const seat = s.setupOrder[s.placements.length];
  const board = s.board.map((c, i) => (i === cell ? [...c, seat] : c));
  const placements = [...s.placements, cell];
  const done = placements.length === s.setupOrder.length;
  return {
    ...s,
    board,
    placements,
    phase: done ? 'play' : 'setup',
    turn: done ? 0 : s.setupOrder[placements.length],
  };
}

/** 某人可以拿起來播的格子（裡面有他的子） */
export function sourcesOf(s: MancalaState, seat: Seat = s.turn): number[] {
  return s.board.flatMap((cell, i) => (cell.includes(seat) ? [i] : []));
}

/** 兩串主人是不是同一組子（順序不論） */
export function sameMultiset(a: readonly Seat[], b: readonly Seat[]): boolean {
  if (a.length !== b.length) return false;
  const x = [...a].sort((p, q) => p - q);
  const y = [...b].sort((p, q) => p - q);
  return x.every((v, i) => v === y[i]);
}

export const finalScore = (sc: Scores): number => 2 * Math.min(...sc) - Math.max(...sc);
export const reachedEnd = (scores: Scores[]): boolean => scores.some((sc) => sc.some((v) => v >= END_SCORE));

/** 最後一顆落在 cell 時，那位主人（分數 sc）可以記到哪些顏色 */
export function colourOptions(sc: Scores, cell: number): Colour[] {
  const c = CELL_COLOUR[cell];
  if (c !== null) return [c];
  const target = cell === ANGEL ? Math.min(...sc) : Math.max(...sc);
  return COLOURS.filter((k) => sc[k] === target);
}

/**
 * 播一次（不檢查輪到誰，只檢查 order 是不是那一格的子）。預覽與 applyMove 共用。
 * `colour` 只在天使／惡魔格同分時用到；給了不在選項裡的顏色就當沒給（預覽用，applyMove 會嚴格檢查）。
 */
export function sow(s: MancalaState, from: number, order: readonly Seat[], colour?: Colour): Sow {
  if (!Number.isInteger(from) || from < 0 || from >= CELLS) throw new Error(`bad cell: ${from}`);
  if (order.length === 0 || !sameMultiset(s.board[from], order)) throw new Error(`order does not match the pieces in cell ${from}`);
  const board = s.board.map((c) => c.slice());
  board[from] = [];
  const path: number[] = [];
  let pos = from;
  for (const owner of order) {
    pos = (pos + 1) % CELLS;
    board[pos].push(owner);
    path.push(pos);
  }
  const owner = order[order.length - 1];
  const points = board[pos].length;
  const options = colourOptions(s.scores[owner], pos);
  const chosen = options.length === 1 ? options[0] : colour !== undefined && options.includes(colour) ? colour : null;
  const scores = chosen === null
    ? s.scores
    : s.scores.map((sc, i) => (i === owner ? (sc.map((v, k) => (k === chosen ? v + points : v)) as Scores) : sc));
  return {
    from, order: order.slice(), path, cell: pos, owner, points, options, colour: chosen, board, scores,
    ends: chosen !== null && reachedEnd(scores),
  };
}

/** 檢查一手是否合法，合法就回傳播種結果，不合法丟錯（訊息說明原因） */
export function checkMove(s: MancalaState, m: Move): Sow {
  if (s.phase !== 'play') throw new Error('not in play');
  if (!s.board[m.from]?.includes(s.turn)) throw new Error(`seat ${letterOf(s.turn)} has no piece in cell ${m.from}`);
  const r = sow(s, m.from, m.order, m.colour);
  if (r.options.length > 1 && r.colour === null) throw new Error('colour required (tie on Angel/Devil)');
  if (m.colour !== undefined && !r.options.includes(m.colour)) throw new Error(`colour ${m.colour} is not allowed here`);
  return r;
}

export function isLegalMove(s: MancalaState, m: Move): boolean {
  try { checkMove(s, m); return true; } catch { return false; }
}

/** 走一手，回傳全新的局面（不改傳入的物件）。不合法丟錯 */
export function applyMove(s: MancalaState, m: Move): MancalaState {
  const r = checkMove(s, m);
  const move: Move = isSpecial(r.cell) ? { from: m.from, order: r.order, colour: r.colour as Colour } : { from: m.from, order: r.order };
  const moves = [...s.moves, move];
  return {
    ...s,
    board: r.board,
    scores: r.scores,
    moves,
    phase: r.ends ? 'over' : 'play',
    turn: r.ends ? s.turn : (s.turn + 1) % s.config.seats,
    last: r,
  };
}

export type Standing = { seat: Seat; scores: Scores; final: number; high: number; low: number; rank: number };

/**
 * 名次：最終分數高的在前；同分比最高色較低者（較均衡）；再同就並列（名次相同，1、1、3）。
 */
export function standings(s: Pick<MancalaState, 'scores'>): Standing[] {
  const rows = s.scores.map((sc, seat) => ({ seat, scores: sc, final: finalScore(sc), high: Math.max(...sc), low: Math.min(...sc) }));
  rows.sort((a, b) => b.final - a.final || a.high - b.high || a.seat - b.seat);
  let rank = 0;
  return rows.map((r, i) => {
    if (i === 0 || r.final !== rows[i - 1].final || r.high !== rows[i - 1].high) rank = i + 1;
    return { ...r, rank };
  });
}

export const winners = (s: Pick<MancalaState, 'scores'>): Seat[] => standings(s).filter((r) => r.rank === 1).map((r) => r.seat);

/**
 * 棋譜。一手寫成「起點格:落子主人的順序」，天使／惡魔格再加「/顏色」，例如 `12:C,A,E`、`6:B,A/G`。
 * 格子用 0–13（0 惡魔、7 天使），不是節目的盤子編號。
 *
 * 整局：`{席數}x{每人子數}{s＝蛇形}|{開局放的格子,…}|{每一手;…}`，例如
 * `4x4|3,5,0,…|12:C,A,E;7:A,B/G`。連線房間之後可以直接存這串，從頭重播就是整局。
 */
export function encodeMove(m: Move): string {
  return `${m.from}:${m.order.map(letterOf).join(',')}${m.colour !== undefined ? `/${COLOUR_KEYS[m.colour]}` : ''}`;
}

export function decodeMove(text: string): Move {
  const hit = /^(\d{1,2}):([A-G](?:,[A-G])*)(?:\/([RBG]))?$/.exec(text.trim());
  if (!hit) throw new Error(`bad move: ${text}`);
  const from = Number(hit[1]);
  if (from >= CELLS) throw new Error(`bad cell: ${from}`);
  const order = hit[2].split(',').map(seatOfLetter);
  return hit[3] ? { from, order, colour: COLOUR_KEYS.indexOf(hit[3] as 'R' | 'B' | 'G') as Colour } : { from, order };
}

export type GameRecord = { config: GameConfig; placements: number[]; moves: Move[] };

export function encodeGame(s: Pick<MancalaState, 'config' | 'placements' | 'moves'>): string {
  const { seats, pieces, snake } = s.config;
  return `${seats}x${pieces}${snake ? 's' : ''}|${s.placements.join(',')}|${s.moves.map(encodeMove).join(';')}`;
}

/** 解不出來就丟錯（被竄改、半截）。合不合法由 replay 檢查 */
export function decodeGame(text: string): GameRecord {
  const parts = text.trim().split('|');
  if (parts.length !== 3) throw new Error('bad record');
  const head = /^(\d)x(\d{1,2})(s?)$/.exec(parts[0]);
  if (!head) throw new Error(`bad header: ${parts[0]}`);
  const config: GameConfig = { seats: Number(head[1]), pieces: Number(head[2]), snake: head[3] === 's' };
  const placements = parts[1] ? parts[1].split(',').map((x) => {
    if (!/^\d{1,2}$/.test(x)) throw new Error(`bad placement: ${x}`);
    return Number(x);
  }) : [];
  const moves = parts[2] ? parts[2].split(';').map(decodeMove) : [];
  return { config, placements, moves };
}

/** 從頭重播一局（悔棋、回放、連線同步）。`upToMove` 只播到第幾手（開局放子一律全放）。不合法丟錯 */
export function replay(record: GameRecord | string, upToMove?: number): MancalaState {
  const r = typeof record === 'string' ? decodeGame(record) : record;
  let s = createGame(r.config);
  for (const cell of r.placements) s = place(s, cell);
  if (r.moves.length && s.phase !== 'play') throw new Error('moves before setup is complete');
  const moves = upToMove === undefined ? r.moves : r.moves.slice(0, Math.max(0, upToMove));
  for (const m of moves) {
    if (s.phase !== 'play') throw new Error('moves after the game is over');
    s = applyMove(s, m);
  }
  return s;
}
