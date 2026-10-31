/**
 * Bagh Chal（虎羊棋）的規則。純函式、零 React、零副作用 —— 跟 Wall Go 的 app/game/ 同一個原則：
 * UI、電腦對手、之後的連線與回放都共用這一份。
 *
 * 規則照尼泊爾傳統版（英文維基 Bagh-chal 條目；《魔鬼的計謀》第 2 季決賽也是這套，
 * 見 docs/games-research.md〈Bagh Chal 專章〉）：
 * - 5×5 共 25 個交叉點。直線、橫線處處相連；斜線只經過「列＋行為偶數」的點
 * - 4 隻老虎在四個角；20 隻羊在盤外，**羊先走**
 * - 放子階段：羊每回合放一隻，20 隻放完之前不能移動盤上的羊；老虎一開始就能走、能吃
 * - 走：沿線到相鄰的空點。吃：老虎沿直線跳過一隻相鄰的羊、落在後面的空點（一次只吃一隻，不連跳）
 * - 老虎吃 5 隻贏；羊把老虎全部困住贏
 *
 * 傳統規則沒寫死、這裡做的決定：
 * - 羊放完之後禁止走回出現過的局面（常見的禁重複規則，避免兩邊無限繞圈）
 * - 輪到羊卻沒有任何合法步：算老虎贏（羊等於被反困）
 * - 保險：總步數到 MAX_PLIES 算和局
 */

export type Side = 'tiger' | 'goat';
export type Cell = 'T' | 'G' | null;
/** 交叉點編號 0..24，r * 5 + c */
export type Point = number;

export type Move =
  | { kind: 'place'; to: Point }
  | { kind: 'move'; from: Point; to: Point }
  | { kind: 'jump'; from: Point; over: Point; to: Point };

export type BaghState = {
  board: Cell[];
  turn: Side;
  /** 還沒放上盤的羊 */
  goatsInHand: number;
  /** 被吃掉的羊 */
  captured: number;
  /** 出現過的局面（含輪到誰），禁重複用。只在羊放完之後記 */
  seen: string[];
  /** 已經走了幾手（雙方合計） */
  plies: number;
  winner: Side | 'draw' | null;
  /** 走過的每一手，給悔棋、回放、電腦對手用 */
  history: Move[];
};

export const SIZE = 5;
export const GOATS = 20;
export const CAPTURES_TO_WIN = 5;
export const MAX_PLIES = 300;
export const TIGER_START: Point[] = [0, 4, 20, 24];

const rc = (p: Point) => [Math.floor(p / SIZE), p % SIZE] as const;
const at = (r: number, c: number): Point => r * SIZE + c;
const inside = (r: number, c: number) => r >= 0 && r < SIZE && c >= 0 && c < SIZE;

/** 有斜線經過的點：列＋行為偶數（四角、中心與間隔分布的點） */
export const hasDiagonals = (p: Point) => { const [r, c] = rc(p); return (r + c) % 2 === 0; };

/** 每個點沿線相鄰的點。斜線只連「都有斜線」的點 —— 偶數點的斜鄰居一定也是偶數點 */
export const NEIGHBORS: Point[][] = Array.from({ length: SIZE * SIZE }, (_, p) => {
  const [r, c] = rc(p);
  const dirs: [number, number][] = [[-1, 0], [1, 0], [0, -1], [0, 1]];
  if (hasDiagonals(p)) dirs.push([-1, -1], [-1, 1], [1, -1], [1, 1]);
  return dirs.filter(([dr, dc]) => inside(r + dr, c + dc)).map(([dr, dc]) => at(r + dr, c + dc));
});

/** 從 p 經過 over 往同一方向再一格的點（跳吃的落點）；不在盤上或不沿線就是 null */
export function landing(p: Point, over: Point): Point | null {
  const [r1, c1] = rc(p);
  const [r2, c2] = rc(over);
  const r3 = 2 * r2 - r1;
  const c3 = 2 * c2 - c1;
  if (!inside(r3, c3)) return null;
  const to = at(r3, c3);
  return NEIGHBORS[over].includes(to) ? to : null;
}

export function createGame(): BaghState {
  const board: Cell[] = Array(SIZE * SIZE).fill(null);
  for (const p of TIGER_START) board[p] = 'T';
  return { board, turn: 'goat', goatsInHand: GOATS, captured: 0, seen: [], plies: 0, winner: null, history: [] };
}

/** 局面的鍵：盤面＋輪到誰。禁重複用 */
export function positionKey(board: Cell[], turn: Side): string {
  return board.map((c) => c ?? '.').join('') + (turn === 'tiger' ? 't' : 'g');
}

/** 不管禁重複的所有走法 */
function rawMoves(s: BaghState): Move[] {
  const out: Move[] = [];
  if (s.turn === 'goat') {
    if (s.goatsInHand > 0) {
      s.board.forEach((c, p) => { if (c === null) out.push({ kind: 'place', to: p }); });
    } else {
      s.board.forEach((c, p) => {
        if (c !== 'G') return;
        for (const n of NEIGHBORS[p]) if (s.board[n] === null) out.push({ kind: 'move', from: p, to: n });
      });
    }
  } else {
    s.board.forEach((c, p) => {
      if (c !== 'T') return;
      for (const n of NEIGHBORS[p]) {
        if (s.board[n] === null) out.push({ kind: 'move', from: p, to: n });
        else if (s.board[n] === 'G') {
          const to = landing(p, n);
          if (to !== null && s.board[to] === null) out.push({ kind: 'jump', from: p, over: n, to });
        }
      }
    });
  }
  return out;
}

function boardAfter(board: Cell[], m: Move): Cell[] {
  const b = board.slice();
  if (m.kind === 'place') b[m.to] = 'G';
  else {
    b[m.to] = b[m.from];
    b[m.from] = null;
    if (m.kind === 'jump') b[m.over] = null;
  }
  return b;
}

/** 合法走法。羊放完之後，走回出現過的局面不合法 */
export function legalMoves(s: BaghState): Move[] {
  if (s.winner) return [];
  const moves = rawMoves(s);
  if (s.goatsInHand > 0) return moves;
  const next: Side = s.turn === 'goat' ? 'tiger' : 'goat';
  return moves.filter((m) => !s.seen.includes(positionKey(boardAfter(s.board, m), next)));
}

export function sameMove(a: Move, b: Move): boolean {
  return a.kind === b.kind && a.to === b.to && (a.kind === 'place' || (b.kind !== 'place' && a.from === b.from));
}

/** 走一手，回傳全新的局面（不改傳入的物件）。不合法的走法會丟錯 */
export function applyMove(s: BaghState, m: Move): BaghState {
  if (!legalMoves(s).some((x) => sameMove(x, m))) throw new Error(`不合法的走法：${JSON.stringify(m)}`);
  return play(s, m);
}

/**
 * 走一手但不驗證。只給「走法本來就取自 legalMoves」的呼叫端用（電腦對手的搜尋）——
 * 每個節點都重新驗證一次，搜尋會慢好幾倍。
 */
export function play(s: BaghState, m: Move): BaghState {
  const board = boardAfter(s.board, m);
  const turn: Side = s.turn === 'goat' ? 'tiger' : 'goat';
  const goatsInHand = m.kind === 'place' ? s.goatsInHand - 1 : s.goatsInHand;
  const captured = m.kind === 'jump' ? s.captured + 1 : s.captured;
  const seen = goatsInHand === 0 ? [...s.seen, positionKey(board, turn)] : s.seen;
  const next: BaghState = { board, turn, goatsInHand, captured, seen, plies: s.plies + 1, winner: null, history: [...s.history, m] };
  return { ...next, winner: decideWinner(next) };
}

function decideWinner(s: BaghState): Side | 'draw' | null {
  if (s.captured >= CAPTURES_TO_WIN) return 'tiger';
  if (legalMoves({ ...s, winner: null }).length === 0) return s.turn === 'tiger' ? 'goat' : 'tiger';
  if (s.plies >= MAX_PLIES) return 'draw';
  return null;
}

/** 從頭重走一串走法（悔棋、回放用） */
export function replay(moves: Move[]): BaghState {
  return moves.reduce(applyMove, createGame());
}

/** 悔棋：退回 n 手 */
export function undo(s: BaghState, n = 1): BaghState {
  return replay(s.history.slice(0, Math.max(0, s.history.length - n)));
}

/** 被困住（沒有任何走法）的老虎數，給電腦對手評分與畫面提示用 */
export function trappedTigers(board: Cell[]): number {
  let n = 0;
  board.forEach((c, p) => {
    if (c !== 'T') return;
    const free = NEIGHBORS[p].some((q) => board[q] === null || (board[q] === 'G' && (() => { const to = landing(p, q); return to !== null && board[to] === null; })()));
    if (!free) n++;
  });
  return n;
}

/**
 * 走法 ↔ 字串，連線房間存的就是這串（`p12 m0-1 j0-12`，空白分隔）。
 * 跳吃不寫被吃的那一點：跳是沿線走兩格，中間那點就是 (from + to) / 2。
 */
export function encodeMoves(moves: Move[]): string {
  return moves.map((m) => (m.kind === 'place' ? `p${m.to}` : `${m.kind === 'move' ? 'm' : 'j'}${m.from}-${m.to}`)).join(' ');
}

/** 解不出來或不合法（被竄改、半截）就丟錯 —— 呼叫端要接住，不要畫出一盤錯的棋 */
export function decodeMoves(text: string): Move[] {
  if (!text.trim()) return [];
  return text.trim().split(/\s+/).map((tok) => {
    const place = /^p(\d+)$/.exec(tok);
    if (place) return { kind: 'place', to: Number(place[1]) } as Move;
    const step = /^([mj])(\d+)-(\d+)$/.exec(tok);
    if (!step) throw new Error(`bad move: ${tok}`);
    const from = Number(step[2]);
    const to = Number(step[3]);
    return step[1] === 'm' ? { kind: 'move', from, to } : { kind: 'jump', from, over: (from + to) / 2, to };
  });
}
