/**
 * Nine Men's Morris（九子棋）的規則。純函式、零 React、零副作用 —— 跟 Bagh Chal 的 engine 同一個原則：
 * 畫面、電腦對手、之後的連線與回放都共用這一份。
 *
 * 規則照《魔鬼的計謀》第 1 季決賽第一戰的 RULE 卡，缺口照 docs/games-deep-s1.md §2 的建議補：
 * - 24 個點：三個同心正方形，四邊的中點用直線連起來。雙方各 9 顆，黑先
 * - 放子：輪流把手上的子放到空點。雙方放完之前，盤上的子不能動
 * - 走子：放完之後，每回合沿線把一顆子移到相鄰的空點
 * - 飛子：只剩 3 顆的那一方可以移到任何空點
 * - 一條線上 3 顆都是自己的子（成三）就拿掉對方 1 顆。同時成兩條線也只拿 1 顆（卡上只寫 1 顆）
 * - 對方連成一線的子不能拿
 * - 只剩 2 顆、或輪到自己時沒有任何走法，就輸
 *
 * RULE 卡沒寫死、這裡做的決定：
 * - 對方的子全部都在線上時：傳統規則可以拿線上的子（預設）。節目規則（showRules）照卡上不能拿，
 *   這一手成三就沒有收穫（研究文件的建議：預設傳統、另設節目規則開關）
 * - 雙方都多於 3 顆時可能無限繞圈：走子階段同一局面第 3 次出現判和、連續 50 手（雙方合計）沒有人被拿子判和
 * - 節目規則的「剩 3 顆後僵持 10 回合，子少的輸」：有人只剩 3 顆之後，雙方各走 10 手（20 手）都沒有人被拿子，
 *   子少的一方輸，一樣多就和局。這條生效時不判「同一局面三次」—— 它 20 手內一定會結束，
 *   而子少的一方不該靠來回重複局面換到和局
 *
 * 一個回合可能是兩個動作：放（或走）一手，成三的話再拿一顆。拿子是獨立的一手（`removing` 時輪到同一個人），
 * 這樣棋譜、悔棋、連線都只是一串動作，畫面上「先成三、再選一顆拿掉」的兩段式操作也直接對得上。
 */

export type Side = 'black' | 'white';
export type Cell = 'B' | 'W' | null;
/** 點的編號 0..23：由上而下、由左而右（a7 是 0、g1 是 23） */
export type Point = number;

export type Move =
  | { kind: 'place'; to: Point }
  /** 沿線走一步，或只剩 3 顆時飛到任何空點 */
  | { kind: 'move'; from: Point; to: Point }
  /** 成三之後拿掉對方的一顆 */
  | { kind: 'remove'; at: Point };

export type Rules = {
  /** 節目 RULE 卡：對方的子都在線上時不能拿；有人剩 3 顆後僵持 10 回合，子少的輸 */
  showRules: boolean;
};

export type EndReason =
  /** 只剩 2 顆 */
  | 'pieces'
  /** 輪到他時沒有任何走法 */
  | 'blocked'
  /** 同一局面出現第 3 次 */
  | 'repetition'
  /** 連續 50 手沒有人被拿子 */
  | 'quiet'
  /** 節目規則：有人剩 3 顆後僵持 10 回合 */
  | 'standoff';

export type MorrisState = {
  board: Cell[];
  turn: Side;
  /** 還沒放上盤的子 */
  inHand: Record<Side, number>;
  /** 剛成三，這一回合還要拿掉對方一顆（輪到的人不變） */
  removing: boolean;
  /** 走子階段連續幾手沒有人被拿子（雙方合計；放子階段不算） */
  quiet: number;
  /** 走子階段每個局面（含輪到誰）出現的次數。拿子之後清空：子變少了，之前的局面不可能再出現 */
  seen: Record<string, number>;
  winner: Side | 'draw' | null;
  reason: EndReason | null;
  /** 走過的每一個動作，給悔棋、回放、電腦對手用 */
  history: Move[];
  rules: Rules;
};

export const PIECES = 9;
/** 連續這麼多手（雙方合計）沒有人被拿子就和局 */
export const QUIET_LIMIT = 50;
/** 節目規則：有人剩 3 顆後，這麼多手（雙方各 10 手）沒有人被拿子就分勝負 */
export const STANDOFF_PLIES = 20;
/** 同一局面出現這麼多次就和局 */
export const REPEAT_LIMIT = 3;

/** 點的名字，跟西洋棋一樣是 a–g × 1–7（節目字幕的棋譜也是這樣記） */
export const POINT_NAMES = [
  'a7', 'd7', 'g7',
  'b6', 'd6', 'f6',
  'c5', 'd5', 'e5',
  'a4', 'b4', 'c4', 'e4', 'f4', 'g4',
  'c3', 'd3', 'e3',
  'b2', 'd2', 'f2',
  'a1', 'd1', 'g1',
] as const;

/** 畫棋盤用的座標：x 是 a..g → 0..6，y 是 7..1 → 0..6（上面是 0） */
export const COORDS = POINT_NAMES.map((n) => ({ x: n.charCodeAt(0) - 97, y: 7 - Number(n[1]) }));

/**
 * 16 條線，每條 3 個點。棋盤上的每一條直線剛好就是一條「成三」的線，
 * 所以相鄰關係也直接從這裡推：同一條線上相鄰的兩點相連。
 */
export const MILLS: readonly (readonly Point[])[] = [
  // 橫線
  [0, 1, 2], [3, 4, 5], [6, 7, 8], [9, 10, 11], [12, 13, 14], [15, 16, 17], [18, 19, 20], [21, 22, 23],
  // 直線
  [0, 9, 21], [3, 10, 18], [6, 11, 15], [1, 4, 7], [16, 19, 22], [8, 12, 17], [5, 13, 20], [2, 14, 23],
];

export const NEIGHBORS: readonly (readonly Point[])[] = POINT_NAMES.map((_, p) => {
  const out: Point[] = [];
  for (const [a, b, c] of MILLS) {
    if (p === a || p === c) out.push(b);
    if (p === b) out.push(a, c);
  }
  return out.sort((x, y) => x - y);
});

/** 每個點在哪幾條線上 */
const MILLS_AT: readonly (readonly (readonly Point[])[])[] = POINT_NAMES.map((_, p) => MILLS.filter((l) => l.includes(p)));

export const other = (s: Side): Side => (s === 'black' ? 'white' : 'black');
export const cellOf = (s: Side): Exclude<Cell, null> => (s === 'black' ? 'B' : 'W');
export const sideOf = (c: Exclude<Cell, null>): Side => (c === 'B' ? 'black' : 'white');

export function createGame(rules: Partial<Rules> = {}): MorrisState {
  return {
    board: Array(POINT_NAMES.length).fill(null),
    turn: 'black',
    inHand: { black: PIECES, white: PIECES },
    removing: false,
    quiet: 0,
    seen: {},
    winner: null,
    reason: null,
    history: [],
    rules: { showRules: false, ...rules },
  };
}

export function countOnBoard(board: Cell[], side: Side): number {
  const c = cellOf(side);
  let n = 0;
  for (const x of board) if (x === c) n++;
  return n;
}

/** 還剩幾顆（盤上＋手上）。少於 3 顆就輸 */
export function piecesLeft(s: MorrisState, side: Side): number {
  return countOnBoard(s.board, side) + s.inHand[side];
}

/** 經過 p、而且三點都是 p 那顆子的顏色的線（p 是空點就沒有） */
export function millsThrough(board: Cell[], p: Point): Point[][] {
  const c = board[p];
  if (!c) return [];
  return MILLS_AT[p].filter((l) => l.every((q) => board[q] === c)).map((l) => [...l]);
}

/** p 上的子是不是在一條連成的線上 */
export function inMill(board: Cell[], p: Point): boolean {
  const c = board[p];
  return !!c && MILLS_AT[p].some((l) => l.every((q) => board[q] === c));
}

export type Phase = 'place' | 'move' | 'fly';

/** 某一方現在是哪個階段。手上還有子就是放子；盤上只剩 3 顆就能飛 */
export function phaseOf(s: MorrisState, side: Side = s.turn): Phase {
  if (s.inHand[side] > 0) return 'place';
  return countOnBoard(s.board, side) === 3 ? 'fly' : 'move';
}

/** 成三之後可以拿掉的子：victim 不在線上的子；全部都在線上時，傳統規則可以拿任何一顆、節目規則一顆都不能拿 */
function removableFor(board: Cell[], victim: Side, rules: Rules): Point[] {
  const c = cellOf(victim);
  const pieces: Point[] = [];
  board.forEach((x, p) => { if (x === c) pieces.push(p); });
  const free = pieces.filter((p) => !inMill(board, p));
  if (free.length > 0) return free;
  return rules.showRules ? [] : pieces;
}

/** 現在可以拿掉的子（不在拿子步驟時是空的） */
export function removable(s: MorrisState): Point[] {
  return s.removing && !s.winner ? removableFor(s.board, other(s.turn), s.rules) : [];
}

/** 對方的子是不是全都在線上（拿子時給畫面提示「這次可以拿線上的子」） */
export function allInMills(board: Cell[], side: Side): boolean {
  const c = cellOf(side);
  let any = false;
  for (let p = 0; p < board.length; p++) {
    if (board[p] !== c) continue;
    any = true;
    if (!inMill(board, p)) return false;
  }
  return any;
}

export function legalMoves(s: MorrisState): Move[] {
  if (s.winner) return [];
  if (s.removing) return removable(s).map((at) => ({ kind: 'remove', at }));
  const out: Move[] = [];
  const empty: Point[] = [];
  s.board.forEach((x, p) => { if (x === null) empty.push(p); });
  if (s.inHand[s.turn] > 0) {
    for (const to of empty) out.push({ kind: 'place', to });
    return out;
  }
  const own = cellOf(s.turn);
  const fly = countOnBoard(s.board, s.turn) === 3;
  s.board.forEach((x, from) => {
    if (x !== own) return;
    for (const to of fly ? empty : NEIGHBORS[from]) if (s.board[to] === null) out.push({ kind: 'move', from, to });
  });
  return out;
}

export function sameMove(a: Move, b: Move): boolean {
  switch (a.kind) {
    case 'place': return b.kind === 'place' && a.to === b.to;
    case 'move': return b.kind === 'move' && a.from === b.from && a.to === b.to;
    case 'remove': return b.kind === 'remove' && a.at === b.at;
  }
}

/** 走一個動作，回傳全新的局面（不改傳入的物件）。不合法的動作會丟錯 */
export function applyMove(s: MorrisState, m: Move): MorrisState {
  if (!legalMoves(s).some((x) => sameMove(x, m))) throw new Error(`illegal move: ${encodeMove(m)}`);
  return play(s, m);
}

/**
 * 走一個動作但不驗證。只給「動作本來就取自 legalMoves」的呼叫端用（電腦對手的根節點）——
 * 每一步都重新驗證，搜尋會慢好幾倍。
 */
export function play(s: MorrisState, m: Move): MorrisState {
  const board = s.board.slice();
  const history = [...s.history, m];
  if (m.kind === 'remove') {
    board[m.at] = null;
    return finishTurn(s, board, s.inHand, history, true, false);
  }
  const inHand = { ...s.inHand };
  if (m.kind === 'place') {
    board[m.to] = cellOf(s.turn);
    inHand[s.turn]--;
  } else {
    board[m.to] = board[m.from];
    board[m.from] = null;
  }
  if (millsThrough(board, m.to).length > 0 && removableFor(board, other(s.turn), s.rules).length > 0) {
    return { ...s, board, inHand, history, removing: true };
  }
  return finishTurn(s, board, inHand, history, false, m.kind === 'move');
}

/** 一個回合結束：換人、更新「沒有人被拿子」的計數與局面紀錄，再看分出勝負沒有 */
function finishTurn(s: MorrisState, board: Cell[], inHand: Record<Side, number>, history: Move[], captured: boolean, stepped: boolean): MorrisState {
  const turn = other(s.turn);
  const quiet = captured ? 0 : stepped ? s.quiet + 1 : s.quiet;
  let seen = s.seen;
  if (inHand.black === 0 && inHand.white === 0) {
    const base = captured ? {} : s.seen;
    const key = positionKey(board, turn);
    seen = { ...base, [key]: (base[key] ?? 0) + 1 };
  }
  const next: MorrisState = { board, turn, inHand, removing: false, quiet, seen, winner: null, reason: null, history, rules: s.rules };
  const end = decide(next);
  return end ? { ...next, ...end } : next;
}

/** 輪到 s.turn 的時候，遊戲是不是已經結束 */
function decide(s: MorrisState): { winner: Side | 'draw'; reason: EndReason } | null {
  const mover = other(s.turn);
  if (piecesLeft(s, s.turn) < 3) return { winner: mover, reason: 'pieces' };
  if (legalMoves(s).length === 0) return { winner: mover, reason: 'blocked' };
  if (s.inHand.black > 0 || s.inHand.white > 0) return null;
  if (s.rules.showRules) {
    const b = countOnBoard(s.board, 'black');
    const w = countOnBoard(s.board, 'white');
    if (Math.min(b, w) === 3) {
      if (s.quiet < STANDOFF_PLIES) return null;
      if (b === w) return { winner: 'draw', reason: 'standoff' };
      return { winner: b > w ? 'black' : 'white', reason: 'standoff' };
    }
  }
  if ((s.seen[positionKey(s.board, s.turn)] ?? 0) >= REPEAT_LIMIT) return { winner: 'draw', reason: 'repetition' };
  if (s.quiet >= QUIET_LIMIT) return { winner: 'draw', reason: 'quiet' };
  return null;
}

/** 局面的鍵：盤面＋輪到誰。判同一局面用 */
export function positionKey(board: Cell[], turn: Side): string {
  return board.map((c) => c ?? '.').join('') + (turn === 'black' ? 'b' : 'w');
}

/** 從頭重走一串動作（悔棋、回放、接回對局用）。不合法就丟錯 */
export function replay(moves: Move[], rules: Partial<Rules> = {}): MorrisState {
  return moves.reduce(applyMove, createGame(rules));
}

/**
 * 悔棋退到哪裡（history 的長度）：side 上一次「輪到他、還沒動」的時候；不給 side 就是退一個回合。
 * 正在拿子的話，退回成三那一手之前（同一個人重下）。退不了（例如電腦先手、你還沒下過）回傳 -1。
 *
 * 一個回合從「放／走」開始，成三的話後面跟著一個拿子；黑先，之後輪流 —— 所以第 i 個回合輪到誰只看 i 的奇偶。
 */
export function undoPoint(s: MorrisState, side?: Side): number {
  const starts: number[] = [];
  s.history.forEach((m, i) => { if (m.kind !== 'remove') starts.push(i); });
  for (let i = starts.length - 1; i >= 0; i--) {
    const mover: Side = i % 2 === 0 ? 'black' : 'white';
    if (!side || mover === side) return starts[i];
  }
  return -1;
}

/** 悔棋（見 undoPoint）。退不了就回傳原本的局面 */
export function undoTurn(s: MorrisState, side?: Side): MorrisState {
  const at = undoPoint(s, side);
  return at < 0 ? s : replay(s.history.slice(0, at), s.rules);
}

/** 剛走的那一手連成的線（畫面要標出來）：拿子中，或這一回合剛拿完 */
export function lastMills(s: MorrisState): Point[][] {
  const h = s.history;
  const m = h[h.length - 1];
  if (!m) return [];
  const formed = m.kind === 'remove' ? h[h.length - 2] : m;
  if (!formed || formed.kind === 'remove') return [];
  return millsThrough(s.board, formed.to);
}

/**
 * 動作 ↔ 字串，之後連線房間與回放存的就是這串（空白分隔）：
 * 放子 `d2`、走子（含飛子）`a1-a4`、拿子 `xd7`。
 */
export function encodeMove(m: Move): string {
  if (m.kind === 'place') return POINT_NAMES[m.to];
  if (m.kind === 'move') return `${POINT_NAMES[m.from]}-${POINT_NAMES[m.to]}`;
  return `x${POINT_NAMES[m.at]}`;
}

export function encodeMoves(moves: Move[]): string {
  return moves.map(encodeMove).join(' ');
}

const POINT_OF = new Map<string, Point>(POINT_NAMES.map((n, i) => [n, i]));
function pointOf(name: string): Point {
  const p = POINT_OF.get(name);
  if (p === undefined) throw new Error(`bad point: ${name}`);
  return p;
}

export function decodeMove(tok: string): Move {
  const remove = /^x([a-g][1-7])$/.exec(tok);
  if (remove) return { kind: 'remove', at: pointOf(remove[1]) };
  const step = /^([a-g][1-7])-([a-g][1-7])$/.exec(tok);
  if (step) return { kind: 'move', from: pointOf(step[1]), to: pointOf(step[2]) };
  if (/^[a-g][1-7]$/.test(tok)) return { kind: 'place', to: pointOf(tok) };
  throw new Error(`bad move: ${tok}`);
}

/** 解不出來就丟錯（被竄改、半截）—— 呼叫端要接住，不要畫出一盤錯的棋。合不合法由 replay 擋 */
export function decodeMoves(text: string): Move[] {
  const t = text.trim();
  return t ? t.split(/\s+/).map(decodeMove) : [];
}
