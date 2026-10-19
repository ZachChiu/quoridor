/**
 * 盲眼五子棋（Blind Gomoku）的規則。純函式、零 React、零副作用 —— 跟 Bagh Chal 的 engine 同一個原則：
 * UI、電腦對手、之後的連線與回放都共用這一份。
 *
 * 規則照《魔鬼的計謀》第一季監獄密室的 RULE 卡（docs/games-deep-s1.md §3）：
 * - 自由五子棋：沒有三三、四四、長連禁手；連成 5 顆以上（6 顆以上也算）就贏
 * - 玩家先手（黑），電腦後手（白）
 * - 子除了底面以外全是同一個顏色，只有底面看得出黑白；電腦用「跟玩家上一手同色」的子回應
 *
 * RULE 卡沒寫、這裡做的決定：
 * - 棋盤 15×15：節目只寫「圍棋盤」查不到大小，15×15 是現代五子棋的標準，手機上格子也比較大
 * - 每手從 7 色裡自由選一色；每個顏色固定配一個形狀（色盲也分得出來）。顏色與形狀只是外觀，不影響勝負
 * - 225 格下滿還沒有人連成五子：和局
 *
 * 每顆子同時記「真正是哪一方」與「顯示的顏色」—— 盲棋模式畫顏色，一般模式與結算畫黑白。
 */

export type Side = 'black' | 'white';
/** 交叉點編號 0..224，r * 15 + c；r = 0 是最上面一列 */
export type Point = number;

export const SIZE = 15;
export const POINTS = SIZE * SIZE;
/** 天元（h8） */
export const CENTER: Point = (SIZE * SIZE - 1) / 2;

/** 七種顏色，順序就是選色盤的順序。色值在 UI（components/blind-gomoku/palette.ts），這裡只管身分 */
export const COLORS = ['red', 'orange', 'yellow', 'green', 'blue', 'purple', 'pink'] as const;
export type StoneColor = (typeof COLORS)[number];

export type Shape = 'circle' | 'triangle' | 'square' | 'diamond' | 'star' | 'heart' | 'cross';

/**
 * 每個顏色固定配一個形狀（●▲■◆★♥✚）。只靠顏色的話紅綠色盲分不出紅、綠、橙 ——
 * 形狀才是真正的身分，顏色是輔助。電腦跟色時形狀也跟著一樣。
 */
export const SHAPE_OF: Record<StoneColor, Shape> = {
  red: 'circle',
  orange: 'triangle',
  yellow: 'square',
  green: 'diamond',
  blue: 'star',
  purple: 'heart',
  pink: 'cross',
};

/** 棋譜裡的顏色代碼（一個字母） */
export const COLOR_CODE: Record<StoneColor, string> = {
  red: 'r', orange: 'o', yellow: 'y', green: 'g', blue: 'b', purple: 'p', pink: 'k',
};

export type Stone = { side: Side; color: StoneColor };
export type Move = { at: Point; color: StoneColor };

export type GomokuState = {
  board: (Stone | null)[];
  turn: Side;
  /** 下過的每一手（黑白交替，第 0 手是黑），回放、電腦對手、結算翻子的順序都用它 */
  moves: Move[];
  winner: Side | 'draw' | null;
  /** 連成的那一排（5 顆以上、依棋盤順序），結算畫線用 */
  line: Point[] | null;
};

export const DIRECTIONS: readonly (readonly [number, number])[] = [[0, 1], [1, 0], [1, 1], [1, -1]];

export const rowOf = (p: Point) => Math.floor(p / SIZE);
export const colOf = (p: Point) => p % SIZE;
export const pointAt = (r: number, c: number): Point => r * SIZE + c;
export const inside = (r: number, c: number) => r >= 0 && r < SIZE && c >= 0 && c < SIZE;
export const other = (s: Side): Side => (s === 'black' ? 'white' : 'black');
/** 第 n 手（從 0 起算）是哪一方：黑先 */
export const sideOfPly = (ply: number): Side => (ply % 2 === 0 ? 'black' : 'white');

export function createGame(): GomokuState {
  return { board: Array(POINTS).fill(null), turn: 'black', moves: [], winner: null, line: null };
}

export const isColor = (c: unknown): c is StoneColor => (COLORS as readonly unknown[]).includes(c);

/**
 * 最後一顆子的顏色（盤上還沒有子就是 fallback）。
 * 電腦用它決定自己這一手的顏色（跟玩家上一手同色），選色盤的預設值也是它。
 */
export function lastColor(s: GomokuState, fallback: StoneColor = COLORS[0]): StoneColor {
  return s.moves.length ? s.moves[s.moves.length - 1].color : fallback;
}

export function isLegal(s: GomokuState, at: Point): boolean {
  return !s.winner && Number.isInteger(at) && at >= 0 && at < POINTS && s.board[at] === null;
}

/**
 * 經過 at、跟 at 同一方的連線（5 顆以上）。沒有就是 null。
 * 自由五子棋：長連也算，所以只看「至少 5」。同時連成兩條（極少見）時回傳先找到的那條。
 */
export function lineThrough(board: (Stone | null)[], at: Point): Point[] | null {
  const stone = board[at];
  if (!stone) return null;
  const r0 = rowOf(at);
  const c0 = colOf(at);
  for (const [dr, dc] of DIRECTIONS) {
    const run: Point[] = [at];
    for (const sign of [-1, 1]) {
      let r = r0 + dr * sign;
      let c = c0 + dc * sign;
      while (inside(r, c) && board[pointAt(r, c)]?.side === stone.side) {
        if (sign < 0) run.unshift(pointAt(r, c));
        else run.push(pointAt(r, c));
        r += dr * sign;
        c += dc * sign;
      }
    }
    if (run.length >= 5) return run;
  }
  return null;
}

/** 下一手，回傳全新的局面（不改傳入的物件）。不合法的走法會丟錯 */
export function applyMove(s: GomokuState, m: Move): GomokuState {
  if (!isLegal(s, m.at)) throw new Error(`不合法的走法：${JSON.stringify(m)}`);
  if (!isColor(m.color)) throw new Error(`沒有這個顏色：${String(m.color)}`);
  return play(s, m);
}

/**
 * 下一手但不驗證。只給「走法本來就合法」的呼叫端用（電腦對手）。
 */
export function play(s: GomokuState, m: Move): GomokuState {
  const board = s.board.slice();
  board[m.at] = { side: s.turn, color: m.color };
  const moves = [...s.moves, m];
  const line = lineThrough(board, m.at);
  const winner: GomokuState['winner'] = line ? s.turn : moves.length === POINTS ? 'draw' : null;
  return { board, turn: other(s.turn), moves, winner, line };
}

/** 從空棋盤重走一串走法（回放、悔棋用）。中間有不合法的一手就丟錯 */
export function replay(moves: Move[]): GomokuState {
  return moves.reduce(applyMove, createGame());
}

/** 悔棋：退回 n 手（只有一般模式可以悔棋；盲棋不行，見 UI） */
export function undo(s: GomokuState, n = 1): GomokuState {
  return replay(s.moves.slice(0, Math.max(0, s.moves.length - n)));
}

const COLS = 'abcdefghijklmno';

/**
 * 交叉點的名字，照五子棋（連珠）棋譜的寫法：直行 a–o（左到右）、橫列 1–15（下到上），天元是 h8。
 * 讀屏與棋譜都用這個。
 */
export function pointName(p: Point): string {
  return `${COLS[colOf(p)]}${SIZE - rowOf(p)}`;
}

export function parsePoint(name: string): Point | null {
  const m = /^([a-o])(\d{1,2})$/.exec(name.trim().toLowerCase());
  if (!m) return null;
  const row = Number(m[2]);
  if (row < 1 || row > SIZE) return null;
  return pointAt(SIZE - row, COLS.indexOf(m[1]));
}

const CODE_TO_COLOR = Object.fromEntries(COLORS.map((c) => [COLOR_CODE[c], c])) as Record<string, StoneColor>;

/**
 * 走法 ↔ 字串，之後的回放與連線房間存的就是這串：每手「位置＋顏色代碼」，空白分隔，
 * 例如 `h8r i9r h9y`。黑白不寫 —— 第幾手就決定是誰的子（黑先）。
 */
export function encodeMoves(moves: Move[]): string {
  return moves.map((m) => pointName(m.at) + COLOR_CODE[m.color]).join(' ');
}

/** 解不出來就丟錯（被竄改、半截）。合不合法交給 replay 判斷 */
export function decodeMoves(text: string): Move[] {
  if (!text.trim()) return [];
  return text.trim().split(/\s+/).map((tok) => {
    const m = /^([a-o]\d{1,2})([a-z])$/.exec(tok);
    const at = m ? parsePoint(m[1]) : null;
    const color = m ? CODE_TO_COLOR[m[2]] : undefined;
    if (at === null || !color) throw new Error(`bad move: ${tok}`);
    return { at, color };
  });
}
