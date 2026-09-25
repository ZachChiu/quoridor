import playerTemplates from '@/config/playerTemplates';
import {
  buildPieceIndex,
  getPieceNumber,
  parseWGF,
  serializeWGF,
  updatePieceIndex,
} from '@/utils/wgf';
import { canBuildWall, cellKey, cloneGrid, DIRECTIONS, emptyGrid, inBounds, isBlocked } from './board';
import { computeTerritories, playerKeys } from './territory';
import {
  BOARD_SIZE,
  type GameAction,
  type GameState,
  type Move,
  type PieceIndex,
  type PiecePlacement,
  type PlayerKey,
  type WallDir,
  type WallSlot,
} from './types';

/** 該人數的回合輪替順序。 */
export const turnOrder = (playersNum: number): PlayerKey[] =>
  playersNum === 3
    ? [...(playerTemplates.turnOrderThree as PlayerKey[])]
    : [...(playerTemplates.turnOrderTwo as PlayerKey[])];

/** 該人數的完整開局擺放順序。 */
export const openingOrder = (playersNum: number): PlayerKey[] =>
  playersNum === 3
    ? [...(playerTemplates.openingStepThree as PlayerKey[])]
    : [...(playerTemplates.openingStepTwo as PlayerKey[])];

/** 是否仍在開局擺放階段。 */
export const isPlacingPhase = (state: GameState) => state.openingStep.length > 0;

/** 三人模式才有破牆機制。 */
export const isBreakWallAvailable = (state: GameState) => state.playersNum > 2;

// ─── 建立新局 ─────────────────────────────────────────────────────────────────

/**
 * 建立一局新遊戲。
 *
 * 兩人模式依節目原版預置 4 顆棋（A 於 (1,1)、(5,5)，B 於 (1,5)、(5,1)），
 * 其餘各 2 顆於開局階段以蛇形順序擺放；三人模式無預置棋子，各 2 顆全部手動擺放。
 */
export function createGame(playersNum: 2 | 3): GameState {
  const isThree = playersNum === 3;
  const board = cloneGrid(
    isThree ? playerTemplates.templateBoardThree : playerTemplates.templateBoardTwo
  );
  const openingStep = openingOrder(playersNum);

  let pieceIndex: PieceIndex = { A: [], B: [], C: [] };
  let initPositions: PiecePlacement[] = [];

  if (!isThree) {
    pieceIndex = buildPieceIndex(board);
    initPositions = (['A', 'B', 'C'] as const).flatMap((p) =>
      pieceIndex[p].map(({ row, col }, i) => ({ player: p, piece: i + 1, row, col }))
    );
  }

  return {
    playersNum,
    board,
    horizontalWalls: emptyGrid(),
    verticalWalls: emptyGrid(),
    currentPlayer: openingStep[0] ?? 'A',
    openingStep,
    breakWallCount: { A: 1, B: 1, C: 1 },
    pieceIndex,
    selected: null,
    remainSteps: 2,
    currentTurnActions: [],
    initPositions,
    openingPlacements: [],
    turns: [],
  };
}

// ─── 合法手 ───────────────────────────────────────────────────────────────────

/**
 * 目前選取棋子在剩餘步數內可移動到的位置。
 *
 * 逐步展開正交相鄰格，牆會阻擋、已有棋子的格子不可停留。
 * 因為最多兩步，L 形路徑自然涵蓋在內（與節目原版一致）。
 */
export function legalMoves(state: GameState): Move[] {
  if (!state.selected || state.remainSteps <= 0) return [];

  const found = new Map<string, Move>();

  const walk = (row: number, col: number, steps: number, visited: Set<string>) => {
    if (steps <= 0) return;
    const key = cellKey(row, col);
    if (visited.has(key)) return;

    const nextVisited = new Set(visited).add(key);

    for (const { dr, dc } of DIRECTIONS) {
      const r = row + dr;
      const c = col + dc;
      if (!inBounds(r, c)) continue;
      if (isBlocked(state, row, col, dr, dc)) continue;
      if (state.board[r][c]) continue;

      found.set(cellKey(r, c), { row: r, col: c });
      if (steps > 1) walk(r, c, steps - 1, nextVisited);
    }
  };

  walk(state.selected.row, state.selected.col, state.remainSteps, new Set());
  return [...found.values()];
}

/** 目前選取棋子四周可蓋牆的位置。牆必須相鄰於棋子的所在格。 */
export function legalWalls(state: GameState): WallSlot[] {
  return canPlaceWallNow(state) ? wallSlotsAround(state) : [];
}

/** 選中棋子四周還空著的牆位，不檢查這一刻准不准蓋（呼叫端已確認過）。 */
function wallSlotsAround(state: GameState): WallSlot[] {
  if (!state.selected) return [];
  const { row, col } = state.selected;

  const candidates: WallSlot[] = [
    { row: row - 1, col, dir: 'H' }, // 上
    { row, col, dir: 'H' },          // 下
    { row, col: col - 1, dir: 'V' }, // 左
    { row, col, dir: 'V' },          // 右
  ];

  return candidates.filter(
    (slot) => inBounds(slot.row, slot.col) && canBuildWall(state, slot.row, slot.col, slot.dir)
  );
}

/** 目前選取棋子四周、可被破壞的既有牆（三人模式且尚有次數時）。 */
export function legalBreaks(state: GameState): WallSlot[] {
  if (!state.selected) return [];
  if (!isBreakWallAvailable(state)) return [];
  if (state.breakWallCount[state.currentPlayer] <= 0) return [];

  const { row, col } = state.selected;
  const candidates: WallSlot[] = [
    { row: row - 1, col, dir: 'H' },
    { row, col, dir: 'H' },
    { row, col: col - 1, dir: 'V' },
    { row, col, dir: 'V' },
  ];

  const existing = candidates.filter((slot) => {
    if (!inBounds(slot.row, slot.col)) return false;
    const grid = slot.dir === 'H' ? state.horizontalWalls : state.verticalWalls;
    return !!grid[slot.row][slot.col];
  });

  /*
    還沒移動、又一步都走不了的棋子（被圍死，靠破牆脫困），只能破「破了之後
    走得出去」的牆。

    否則會走進死路：破掉的牆後面若站著別的棋子，破完照樣走不動 ——
    而沒移動過的棋子不准原地蓋牆（canPlaceWallNow），這一手就結束不了，
    破牆次數卻已經扣掉了。玩家只剩「重來這一步」一條路，而且看不出為什麼。
    （自動對局實測撞到過。）

    走得動的棋子不受這條限制：破一道牆打開地盤本身就是一種策略。
  */
  if (state.remainSteps < 2 || legalMoves(state).length > 0) return existing;
  return existing.filter(
    (slot) => legalMoves(breakWall(state, slot.row, slot.col, slot.dir)).length > 0
  );
}

// ─── 操作 ─────────────────────────────────────────────────────────────────────

/** 開局階段放置一顆棋子。 */
export function placeOpeningPiece(state: GameState, row: number, col: number): GameState {
  if (!isPlacingPhase(state)) return state;
  if (state.board[row][col]) return state;

  const player = state.currentPlayer;
  const board = cloneGrid(state.board);
  board[row][col] = player;

  const remaining = state.openingStep.slice(1);
  const piece = state.pieceIndex[player].length + 1;

  return {
    ...state,
    board,
    openingStep: remaining,
    currentPlayer: remaining[0] ?? 'A',
    pieceIndex: {
      ...state.pieceIndex,
      [player]: [...state.pieceIndex[player], { row, col }],
    },
    openingPlacements: [...state.openingPlacements, { player, piece, row, col }],
  };
}

/**
 * 現在這顆選中的棋子能不能蓋牆結束回合。
 *
 * 規則（節目原版）：零步移動 —— 原地蓋牆 —— 只在這顆棋子「能離開再回來」時
 * 才合法。所以還沒移動（remainSteps 仍是 2）而且一步都走不了的棋子，不能蓋牆。
 *
 * 這條先前只寫在 legalTurns 裡，於是**只約束了 AI**：UI 走的是
 * selectPiece → placeWall，完全不經過 legalTurns。真人可以選一顆被困住的
 * 棋子直接在旁邊蓋牆 —— 例如 A、B 各一顆困在同一個兩格區域，
 * 真人把它從中間切開，變成兩塊各一格的領地，比分就被改了；
 * 而 computeTerritories 早已把那塊判成凍結定局。
 *
 * 破牆之後再判斷：破牆不扣步數，但會打開一條路，所以用的是破完的盤面。
 */
export function canPlaceWallNow(state: GameState): boolean {
  if (!state.selected) return false;
  return state.remainSteps < 2 || legalMoves(state).length > 0;
}

/**
 * 這顆棋子這回合能不能被選。
 *
 * 能走就能選；走不了但旁邊有牆可破（三人局、還有次數）也能選 ——
 * 破牆脫困正是破牆規則存在的理由。兩者皆否就是完全被封死，
 * 選了什麼都做不了，不讓它被選。
 */
export function canSelectPiece(state: GameState, row: number, col: number): boolean {
  if (state.board[row][col] !== state.currentPlayer) return false;
  const candidate = { ...state, selected: { row, col }, remainSteps: 2 };
  return legalMoves(candidate).length > 0 || legalBreaks(candidate).length > 0;
}

/** 這回合可以選的所有己方棋子。 */
export function selectablePieces(state: GameState): Move[] {
  return (state.pieceIndex[state.currentPlayer] ?? []).filter(({ row, col }) =>
    canSelectPiece(state, row, col)
  );
}

/**
 * 「換一顆」要換到哪一顆：目前選的那顆的下一顆（依棋子編號、繞回開頭），
 * 沒選的話就是第一顆。
 *
 * 手機控制盤中央那顆棋子按下去用的 —— 讓人不必點盤面就能輪流挑棋子。
 * 規則跟點盤面完全一樣：已經走過就不能換（`selectPiece` 也擋這個）、
 * 不能選的棋子跳過。沒有別顆可換（已經走了、或只剩目前這一顆）時回傳 null。
 */
export function nextSelectablePiece(state: GameState): Move | null {
  if (state.remainSteps < 2) return null;
  const list = selectablePieces(state);
  if (list.length === 0) return null;
  const cur = state.selected;
  if (!cur) return list[0];
  const at = list.findIndex(({ row, col }) => row === cur.row && col === cur.col);
  const next = list[(at + 1) % list.length];
  return next.row === cur.row && next.col === cur.col ? null : next;
}

/**
 * 當前玩家這回合還有沒有事可做：有合法的完整回合，或能靠破牆脫困。
 *
 * 跳過與終局都要用這個，不能只看 legalTurns —— legalTurns 不展開破牆，
 * 一顆被圍死但手上還有破牆的棋子在它眼裡「沒有手」，會被永遠跳過，
 * 偏偏那正是破牆要救的局面。
 */
export function canAct(state: GameState): boolean {
  // 只問「有沒有」，找到一個就停。這裡在 AI 搜尋的每個節點都會跑
  // （commitWall → skipUnplayable → shouldSkipTurn），把所有回合列舉出來
  // 再數長度，等於每個節點多做一次完整的走法產生。
  const fresh = { ...state, selected: null, remainSteps: 2 };
  const hasWallAfterMoving = (s: GameState) => {
    const moves = legalMoves(s);
    if (moves.length === 0) return false;
    if (wallSlotsAround(s).length > 0) return true; // 原地蓋牆
    return moves.some((m) => wallSlotsAround(movePiece(s, m.row, m.col)).length > 0);
  };

  for (const { row, col } of state.pieceIndex[state.currentPlayer] ?? []) {
    if (hasWallAfterMoving({ ...fresh, selected: { row, col } })) return true;
  }
  if (!isBreakWallAvailable(state) || state.breakWallCount[state.currentPlayer] <= 0) return false;
  for (const { row, col } of state.pieceIndex[state.currentPlayer] ?? []) {
    const selected = { ...fresh, selected: { row, col } };
    for (const slot of legalBreaks(selected)) {
      if (hasWallAfterMoving(breakWall(selected, slot.row, slot.col, slot.dir))) return true;
    }
  }
  return false;
}

/** 選取（或取消選取）一顆己方棋子。僅在尚未移動時允許更換。 */
export function selectPiece(state: GameState, row: number, col: number): GameState {
  if (state.remainSteps < 2) return state;

  const isSame = state.selected?.row === row && state.selected?.col === col;
  if (isSame) return { ...state, selected: null };
  if (!canSelectPiece(state, row, col)) return state;
  return { ...state, selected: { row, col } };
}

/** 將選取的棋子移動到目標格。 */
export function movePiece(state: GameState, row: number, col: number): GameState {
  const from = state.selected;
  if (!from) return state;

  const player = state.currentPlayer;
  const board = cloneGrid(state.board);
  board[from.row][from.col] = null;
  board[row][col] = player;

  // 合法手皆在剩餘步數內，其曼哈頓距離即等於實際步數
  const cost = Math.abs(from.row - row) + Math.abs(from.col - col);
  const piece = getPieceNumber(state.pieceIndex, player, from.row, from.col);

  return {
    ...state,
    board,
    selected: { row, col },
    remainSteps: state.remainSteps - cost,
    pieceIndex: updatePieceIndex(state.pieceIndex, player, from.row, from.col, row, col),
    currentTurnActions: [
      ...state.currentTurnActions,
      { type: 'move', player, piece, row, col },
    ],
  };
}

/** 破壞一面牆。不結束回合，玩家仍可繼續移動與蓋牆。 */
export function breakWall(
  state: GameState,
  row: number,
  col: number,
  dir: WallDir
): GameState {
  const player = state.currentPlayer;
  if (state.breakWallCount[player] <= 0) return state;

  const grids = {
    horizontalWalls: dir === 'H' ? cloneGrid(state.horizontalWalls) : state.horizontalWalls,
    verticalWalls: dir === 'V' ? cloneGrid(state.verticalWalls) : state.verticalWalls,
  };
  (dir === 'H' ? grids.horizontalWalls : grids.verticalWalls)[row][col] = null;

  const piece = state.selected
    ? getPieceNumber(state.pieceIndex, player, state.selected.row, state.selected.col)
    : 1;

  return {
    ...state,
    ...grids,
    breakWallCount: { ...state.breakWallCount, [player]: state.breakWallCount[player] - 1 },
    currentTurnActions: [
      ...state.currentTurnActions,
      { type: 'breakWall', player, piece, dir, row, col },
    ],
  };
}

/** 蓋牆並結束回合，輪到下一位玩家。 */
export function placeWall(
  state: GameState,
  row: number,
  col: number,
  dir: WallDir
): GameState {
  if (!canPlaceWallNow(state)) return state;
  return commitWall(state, row, col, dir);
}

/**
 * placeWall 去掉合法性檢查的本體。
 *
 * AI 搜尋每個節點都要套一次回合，而那些回合全出自 legalTurns，早就驗過了 ——
 * 再驗一次等於每個節點多算一次 legalMoves，困難難度實測會超出時間預算。
 */
function commitWall(state: GameState, row: number, col: number, dir: WallDir): GameState {
  const player = state.currentPlayer;

  const grids = {
    horizontalWalls: dir === 'H' ? cloneGrid(state.horizontalWalls) : state.horizontalWalls,
    verticalWalls: dir === 'V' ? cloneGrid(state.verticalWalls) : state.verticalWalls,
  };
  (dir === 'H' ? grids.horizontalWalls : grids.verticalWalls)[row][col] = player;

  const piece = state.selected
    ? getPieceNumber(state.pieceIndex, player, state.selected.row, state.selected.col)
    : 1;

  const wallAction: GameAction = { type: 'placeWall', player, piece, dir, row, col };
  const order = turnOrder(state.playersNum);
  const nextPlayer = order[(order.indexOf(player) + 1) % order.length];

  return skipUnplayable({
    ...state,
    ...grids,
    turns: [...state.turns, [...state.currentTurnActions, wallAction]],
    currentTurnActions: [],
    currentPlayer: nextPlayer,
    remainSteps: 2,
    selected: null,
  });
}

// ─── 完整回合（供 AI 搜尋使用）──────────────────────────────────────────────

/**
 * 一個完整回合：選一顆棋子、移動 0–2 步、蓋一道牆。
 *
 * UI 是分步操作的，但 AI 搜尋需要以「整個回合」為單位展開，
 * 否則同一回合的中間狀態會被當成獨立節點，搜尋深度失去意義。
 */
export type Turn = {
  /** 起始位置。 */
  from: Move;
  /** 移動後位置；與 from 相同代表零步移動。 */
  to: Move;
  /** 回合結束時蓋的牆。 */
  wall: WallSlot;
  /** 移動前先破掉的牆（三人局的破牆脫困）。 */
  break?: WallSlot;
};

/** 列舉當前玩家所有合法的完整回合。 */
export function legalTurns(state: GameState): Turn[] {
  const turns: Turn[] = [];
  const pieces = state.pieceIndex[state.currentPlayer] ?? [];

  for (const from of pieces) {
    // 直接從乾淨的回合狀態選起；不走 selectPiece —— 它的可選檢查
    // 就是下面這行 legalMoves，搜尋熱點上不值得算兩次。
    const selected = { ...state, selected: { row: from.row, col: from.col }, remainSteps: 2 };

    const moves = legalMoves(selected);

    // 零步移動（原地蓋牆）只在「能離開再回來」時才合法 —— 依節目原版規則。
    // legalMoves 非空即代表至少有一格相鄰空位可去可回。
    // 完全被封死的棋子不能被選取，因此不貢獻任何回合。
    const canStay = moves.length > 0;
    const destinations: Move[] = canStay
      ? [{ row: from.row, col: from.col }, ...moves]
      : [];

    for (const to of destinations) {
      const isStay = to.row === from.row && to.col === from.col;
      const moved = isStay ? selected : movePiece(selected, to.row, to.col);

      for (const wall of wallSlotsAround(moved)) {
        turns.push({ from: { row: from.row, col: from.col }, to, wall });
      }
    }
  }

  return turns;
}

/** 套用一個完整回合，回傳輪到下一位玩家的新狀態。 */
export function applyTurn(state: GameState, turn: Turn): GameState {
  // 回合出自 legalTurns / breakOutTurns，已經驗過 —— 直接選、直接蓋
  const selected = { ...state, selected: { row: turn.from.row, col: turn.from.col }, remainSteps: 2 };
  const broken = turn.break
    ? breakWall(selected, turn.break.row, turn.break.col, turn.break.dir)
    : selected;
  const isStay = turn.to.row === turn.from.row && turn.to.col === turn.from.col;
  const moved = isStay ? broken : movePiece(broken, turn.to.row, turn.to.col);
  return commitWall(moved, turn.wall.row, turn.wall.col, turn.wall.dir);
}

/**
 * 先破牆才走得動的回合：棋子被圍死，靠破一道相鄰的牆脫困。
 *
 * 不併進 legalTurns：三人局每一步都展開破牆，AI 的分支數會翻好幾倍，
 * 而破牆一局只有一次，絕大多數時候不是好選擇。真人隨時都能破牆（UI 不受影響），
 * 這裡只補上「不破就無事可做」的那一種 —— 見 playableTurns。
 */
export function breakOutTurns(state: GameState): Turn[] {
  if (!isBreakWallAvailable(state) || state.breakWallCount[state.currentPlayer] <= 0) return [];
  const fresh = { ...state, selected: null, remainSteps: 2 };
  const turns: Turn[] = [];

  for (const from of state.pieceIndex[state.currentPlayer] ?? []) {
    const selected = { ...fresh, selected: { row: from.row, col: from.col } };
    for (const slot of legalBreaks(selected)) {
      const broken = breakWall(selected, slot.row, slot.col, slot.dir);
      const moves = legalMoves(broken);
      if (moves.length === 0) continue;
      for (const to of [{ row: from.row, col: from.col }, ...moves]) {
        const isStay = to.row === from.row && to.col === from.col;
        const moved = isStay ? broken : movePiece(broken, to.row, to.col);
        for (const wall of legalWalls(moved)) {
          turns.push({ from: { row: from.row, col: from.col }, to, wall, break: slot });
        }
      }
    }
  }
  return turns;
}

/**
 * 輪到的人真正能下的回合：平常就是 legalTurns，
 * 全部走不動時退而展開破牆脫困。AI 與測試的隨機玩家都用這個。
 */
export function playableTurns(state: GameState): Turn[] {
  const turns = legalTurns(state);
  return turns.length > 0 ? turns : breakOutTurns(state);
}

// ─── 回合推進 ─────────────────────────────────────────────────────────────────

/**
 * 判斷當前玩家是否該被自動跳過。
 *
 * 條件：所有己方棋子都已被封閉在自己獨佔的區域中，且已無破牆機會 ——
 * 此時該玩家做任何事都無法改變結果。
 *
 * 各客戶端從相同的 WGF 算出相同結果，因此連線模式無需為此寫入 Firebase。
 */
export function shouldSkipTurn(state: GameState): boolean {
  if (isPlacingPhase(state)) return false;

  // 完全無事可做就一定要跳過，否則遊戲會卡死。
  //
  // 這在導入「零步移動需能離開再回來」之後才可能發生：例如兩顆敵方棋子被封在
  // 同一個兩格區域內，雙方都沒有相鄰空位，於是誰都無法選取棋子。
  // 舊規則下還能靠原地蓋牆把區域切開，新規則下不行。
  //
  // 「無事可做」要算進破牆脫困（見 canAct）。只看 legalTurns 的話，
  // 三人局裡被圍死、手上還有一次破牆的玩家會被永遠跳過。
  if (!canAct(state)) return true;

  if (isBreakWallAvailable(state) && state.breakWallCount[state.currentPlayer] > 0) {
    return false;
  }

  const pieces = state.pieceIndex[state.currentPlayer];
  if (!pieces || pieces.length === 0) return false;

  const { ownerByCell } = computeTerritories(state);
  return pieces.every(
    ({ row, col }) => ownerByCell[cellKey(row, col)] === state.currentPlayer
  );
}

/** 推進到下一位玩家。 */
export function advancePlayer(state: GameState): GameState {
  const order = turnOrder(state.playersNum);
  const next = order[(order.indexOf(state.currentPlayer) + 1) % order.length];
  return { ...state, currentPlayer: next, selected: null, remainSteps: 2 };
}

/**
 * 連續跳過所有已無法影響結果的玩家，回傳真正輪到的人。
 *
 * 跳過不寫入棋譜 —— 它完全由盤面推導，因此每個客戶端從相同的 WGF
 * 會算出相同結果，連線模式無需為此額外同步。
 *
 * 這也是 replay() 必須在最後呼叫本函式的原因：WGF 只記錄實際發生的回合，
 * 若單以 `turns.length % order.length` 推算，跳過之後就會算錯輪到誰。
 *
 * 以 seen 集合防止全員皆已定局時無限迴圈。
 */
export function skipUnplayable(state: GameState): GameState {
  let next = state;
  const seen = new Set<PlayerKey>();

  while (shouldSkipTurn(next) && !seen.has(next.currentPlayer)) {
    seen.add(next.currentPlayer);
    next = advancePlayer(next);
  }

  return next;
}

/**
 * 回退一個回合。
 *
 * 直接由棋譜重播 —— 不需另存任何快照，因為 WGF 已完整記錄每一步。
 *
 * @param untilPlayer - 指定時會持續回退，直到輪到該玩家為止。
 *   單人模式用它一次退掉「我的一手 + AI 的一手」，否則按一次悔棋只會
 *   退回 AI 剛走完的局面，玩家仍然不能動。
 */
export function undoTurn(state: GameState, untilPlayer?: PlayerKey): GameState {
  if (state.turns.length === 0) return state;

  const wgf = toWgf(state);
  let target = state.turns.length - 1;
  let result = replay(wgf, target);

  if (untilPlayer) {
    while (target > 0 && result.currentPlayer !== untilPlayer) {
      target -= 1;
      result = replay(wgf, target);
    }
  }

  return result;
}

/**
 * 取消進行中的這一回合，回到回合開始時的盤面。
 *
 * 實作就是重播自己的棋譜 —— `toWgf()` 只序列化**已完成**的回合
 * （`state.turns`），進行中的 `currentTurnActions` 不在裡面。
 * 所以 `replay(toWgf(state))` 得到的正是這一回合開始前的狀態。
 *
 * 不另外寫一套回溯邏輯的理由：回溯要處理移動、破牆、步數、pieceIndex、
 * 選取狀態…每一項都要跟正向操作保持一致，而重播本來就走同一條路徑，
 * 不可能算出跟正常對局不同的結果。
 *
 * 連線模式也安全：WGF 字串沒變，同步用的 effect 不會被觸發。
 */
export function cancelTurn(state: GameState): GameState {
  if (state.currentTurnActions.length === 0 && state.remainSteps === 2 && !state.selected) {
    return state;
  }
  return replay(toWgf(state));
}

/**
 * 這一局有沒有動過。
 *
 * 「動過」＝開局擺過子、收束過回合、或這一手正在進行中。
 * 三者都沒有就是一個剛建好、還沒有人碰過的盤面。
 *
 * 給「離開前要不要攔人」用：什麼都還沒做就跳確認只是擋路，
 * 而使用者被沒有意義的確認擋過幾次之後，真正該停下來的那次也會直接按掉。
 * 放在這裡而不是元件裡，是因為它問的是 GameState 的性質，不是畫面的。
 */
export function hasStarted(state: GameState): boolean {
  return state.openingPlacements.length > 0
    || state.turns.length > 0
    || state.currentTurnActions.length > 0;
}

/**
 * 遊戲是否已結束。
 *
 * 兩種情況：
 * 1. 所有棋子都被封閉在只有自己陣營的區域中（正常終局）
 * 2. 所有玩家都沒有合法手 —— 局面已不可能再改變，等同結束
 *
 * 第 2 點是「零步移動需能離開再回來」帶來的新情況：可能出現雙方棋子
 * 互相卡死、但區域仍被判定為爭奪中的盤面。若不視為終局，遊戲會永遠停住。
 */
export function isGameOver(state: GameState): boolean {
  if (isPlacingPhase(state)) return false;
  if (computeTerritories(state).settled) return true;

  return playerKeys(state.playersNum).every(
    (player) => !canAct({ ...state, currentPlayer: player })
  );
}

// ─── WGF ──────────────────────────────────────────────────────────────────────

/** 序列化為 WGF 棋譜字串。 */
export function toWgf(state: GameState): string {
  return serializeWGF({
    playersNum: state.playersNum,
    initPositions: state.initPositions,
    openingPlacements: state.openingPlacements,
    turns: state.turns,
  });
}

/**
 * 從 WGF 棋譜重建完整盤面。
 *
 * 由空棋盤出發依序套用 init → opening → turns，因此結果只取決於棋譜本身，
 * 不受當前狀態影響。連線模式的讀路徑與回放功能皆以此為準。
 *
 * @param upToTurn - 只重播到第 N 個回合（供悔棋與逐步回放使用）；省略則全部套用。
 */
export function replay(wgf: string, upToTurn?: number): GameState {
  const record = parseWGF(wgf);
  const playersNum = record.playersNum;

  const board = emptyGrid();
  const horizontalWalls = emptyGrid();
  const verticalWalls = emptyGrid();
  const pieceIndex: PieceIndex = { A: [], B: [], C: [] };
  const breakWallCount: Record<PlayerKey, number> = { A: 1, B: 1, C: 1 };

  for (const pos of [...record.initPositions, ...record.openingPlacements]) {
    board[pos.row][pos.col] = pos.player;
    pieceIndex[pos.player][pos.piece - 1] = { row: pos.row, col: pos.col };
  }

  const turns = upToTurn === undefined ? record.turns : record.turns.slice(0, upToTurn);

  for (const turn of turns) {
    for (const action of turn) {
      if (action.type === 'move') {
        const prev = pieceIndex[action.player][action.piece - 1];
        if (prev) board[prev.row][prev.col] = null;
        board[action.row][action.col] = action.player;
        pieceIndex[action.player][action.piece - 1] = { row: action.row, col: action.col };
      } else if (action.type === 'placeWall') {
        const grid = action.dir === 'H' ? horizontalWalls : verticalWalls;
        grid[action.row][action.col] = action.player;
      } else {
        const grid = action.dir === 'H' ? horizontalWalls : verticalWalls;
        grid[action.row][action.col] = null;
        breakWallCount[action.player] -= 1;
      }
    }
  }

  const fullOpening = openingOrder(playersNum);
  const openingStep = fullOpening.slice(record.openingPlacements.length);
  const order = turnOrder(playersNum);

  /*
    輪到誰，要從「上一回合是誰下的」往後推，不能用 turns.length % 人數。

    取模那種算法假設每個人都輪過每一輪。但 skipUnplayable 會跳過已經
    無法影響結果的玩家，而跳過刻意不寫進棋譜 —— 於是只要中途發生過一次
    跳過，回合索引就永久錯開一位，之後每一次重播都算錯人。
    結尾的 skipUnplayable() 只救得了「結束時剛好還該被跳」的情形。

    這在三人局特別容易發生（隨機對局 400 場撞到 178 場），而且症狀很惡劣：
    連線時寫入方靠 lastAppliedWgf 擋掉自己的重播、保有正確的本地狀態，
    其他人卻是從棋譜重建 —— 雙方對「現在輪到誰」的認知就此分岔。

    每個 action 本來就帶 player，而一個回合必定至少有一次築牆，
    所以 turn[0].player 一定取得到，不需要改棋譜格式。
  */
  const lastPlayer = turns.length > 0 ? turns[turns.length - 1][0]?.player : undefined;
  const currentPlayer: PlayerKey =
    openingStep.length > 0
      ? openingStep[0]
      : lastPlayer
        ? order[(order.indexOf(lastPlayer) + 1) % order.length]
        : order[0];

  return skipUnplayable({
    playersNum,
    board,
    horizontalWalls,
    verticalWalls,
    currentPlayer,
    openingStep,
    breakWallCount,
    pieceIndex,
    selected: null,
    remainSteps: 2,
    currentTurnActions: [],
    initPositions: record.initPositions,
    openingPlacements: record.openingPlacements,
    turns,
  });
}

export { BOARD_SIZE, cellKey, computeTerritories, playerKeys };
