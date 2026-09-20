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

  return candidates.filter((slot) => {
    if (!inBounds(slot.row, slot.col)) return false;
    const grid = slot.dir === 'H' ? state.horizontalWalls : state.verticalWalls;
    return !!grid[slot.row][slot.col];
  });
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

/** 選取（或取消選取）一顆己方棋子。僅在尚未移動時允許更換。 */
export function selectPiece(state: GameState, row: number, col: number): GameState {
  if (state.remainSteps < 2) return state;

  const isSame = state.selected?.row === row && state.selected?.col === col;
  return { ...state, selected: isSame ? null : { row, col } };
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
};

/** 列舉當前玩家所有合法的完整回合。 */
export function legalTurns(state: GameState): Turn[] {
  const turns: Turn[] = [];
  const pieces = state.pieceIndex[state.currentPlayer] ?? [];

  for (const from of pieces) {
    // 確保從乾淨的回合狀態出發（selectPiece 對同一格會取消選取）
    const selected = selectPiece(
      { ...state, selected: null, remainSteps: 2 },
      from.row,
      from.col
    );

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

      for (const wall of legalWalls(moved)) {
        turns.push({ from: { row: from.row, col: from.col }, to, wall });
      }
    }
  }

  return turns;
}

/** 套用一個完整回合，回傳輪到下一位玩家的新狀態。 */
export function applyTurn(state: GameState, turn: Turn): GameState {
  const selected = selectPiece(
    { ...state, selected: null, remainSteps: 2 },
    turn.from.row,
    turn.from.col
  );
  const isStay = turn.to.row === turn.from.row && turn.to.col === turn.from.col;
  const moved = isStay ? selected : movePiece(selected, turn.to.row, turn.to.col);
  return placeWall(moved, turn.wall.row, turn.wall.col, turn.wall.dir);
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

  // 完全沒有合法手就一定要跳過，否則遊戲會卡死。
  //
  // 這在導入「零步移動需能離開再回來」之後才可能發生：例如兩顆敵方棋子被封在
  // 同一個兩格區域內，雙方都沒有相鄰空位，於是誰都無法選取棋子。
  // 舊規則下還能靠原地蓋牆把區域切開，新規則下不行。
  if (legalTurns(state).length === 0) return true;

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
    (player) =>
      legalTurns({ ...state, currentPlayer: player, selected: null, remainSteps: 2 }).length === 0
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
  const currentPlayer: PlayerKey =
    openingStep.length > 0 ? openingStep[0] : order[turns.length % order.length];

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
