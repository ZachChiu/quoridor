"use client";

import type { Player, Move, Direction } from "@/types/chessboard.ts";
import { GiHammerBreak } from "react-icons/gi";

/**
 * 玩家色以 CSS 變數取用，而不是 `bg-player-${player}` 這種動態拼接的 class。
 * Tailwind 的靜態掃描看不到拼接出來的字串，safelist 又容易漏 ——
 * 走變數就完全沒有這個問題。
 */
const PLAYER_VAR: Record<string, string> = {
  A: 'var(--player-A)',
  B: 'var(--player-B)',
  C: 'var(--player-C)',
};
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import SectionShadow from "./SectionShadow";
import WallDirectionPad, { wallPadVisible } from "./WallDirectionPad";
import { useCoarsePointer } from "@/hook/useCoarsePointer";
import { boardSignature, diffBoard, territoryWave, newWall, pathBetween } from "./boardMotion";
import { useGameText } from '@/i18n/LocaleProvider';
import { fmt } from '@/i18n/content/game';

type Props = {
  size: number;
  board: Player[][];
  currentPlayer: Player;
  verticalWalls: Player[][];
  horizontalWalls: Player[][];
  selectedChess: Move | null;
  remainSteps: number;
  flattenTerritoriesObj: Record<string, Player>;
  isLock: boolean;
  isPlacingChess: boolean;
  breakWallCountObj: Record<Exclude<Player, null>, number>;
  isBreakWallAvailable: boolean;
  selectChess: (row: number, col: number) => void;
  selectWall: (row: number, col: number, direction: Direction) => void;
  selectCell: (row: number, col: number) => void;
  setChessPosition: (row: number, col: number) => void;
  onClickBreakWall: (row: number, col: number, direction: 'horizontal' | 'vertical') => void;
  /** 把進行中的回合倒回開始前（手機控制盤的「重來」） */
  cancelTurn?: () => void;
  /** 這一回合已經動過 */
  turnDirty?: boolean;
};

export default React.memo(function Chessboard({
  size,
  verticalWalls,
  horizontalWalls,
  board = [],
  currentPlayer,
  selectedChess,
  remainSteps,
  flattenTerritoriesObj,
  isLock,
  isPlacingChess,
  selectChess,
  selectWall,
  selectCell,
  setChessPosition,
  breakWallCountObj,
  isBreakWallAvailable,
  onClickBreakWall,
  cancelTurn,
  turnDirty = false,
}: Props) {
  // const letters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');

  const breakWallCount = breakWallCountObj?.[currentPlayer as Exclude<Player, null>];
  const g = useGameText();

  /*
    手指裝置上，築牆改成「先選方向、再確認」。

    盤面上的預覽只有 9px 厚，滑鼠點得到、手指點不到（實測 29x9 / 9x29，
    WCAG 2.5.8 的最低觸控目標是 24px）。但四個方向各要 44px 而格子只有 45px，
    放大熱區只會讓四邊互相蓋住 —— 所以改成大按鈕選方向、點錯不會直接送出。

    滑鼠維持原本的直接點擊，不多一步。
  */
  /*
    鍵盤操作棋盤。

    在此之前格子是純 div —— 不能 focus、不能按、讀屏也唸不出上面有什麼，
    等於沒有滑鼠就玩不了。牆的預覽本來就是 button（tab 得到），
    缺的一直是「移動到某一格」。

    用 roving tabindex：整個棋盤只佔一個 tab 停留點，進去之後用方向鍵
    在格子間移動、Enter/Space 啟動。這是複合元件的標準做法 ——
    49 個格子各佔一個 tab 停留點的話，光是穿過棋盤就要按 49 次。
  */
  const gridRef = useRef<HTMLDivElement>(null);
  const [cursor, setCursor] = useState({ row: Math.floor(size / 2), col: Math.floor(size / 2) });
  // 只有使用者真的開始用鍵盤之後才搶 focus，否則一進頁面焦點就被棋盤吃掉。
  const [kbActive, setKbActive] = useState(false);

  useEffect(() => {
    if (!kbActive) return;
    gridRef.current
      ?.querySelector<HTMLElement>(`[data-cell="${cursor.row},${cursor.col}"]`)
      ?.focus();
  }, [cursor, kbActive]);

  const onGridKeyDown = useCallback((e: React.KeyboardEvent<HTMLDivElement>) => {
    // 焦點在格子裡的牆按鈕上時，交給按鈕自己處理 —— 不然 Enter 會被按兩次。
    if (!(e.target instanceof HTMLElement) || !e.target.dataset.cell) return;

    const step: Record<string, [number, number]> = {
      ArrowUp: [-1, 0], ArrowDown: [1, 0], ArrowLeft: [0, -1], ArrowRight: [0, 1],
    };
    const d = step[e.key];
    if (d) {
      e.preventDefault();
      setKbActive(true);
      setCursor((c) => ({
        row: Math.min(size - 1, Math.max(0, c.row + d[0])),
        col: Math.min(size - 1, Math.max(0, c.col + d[1])),
      }));
      return;
    }
    if (e.key === 'Enter' || e.key === ' ') {
      e.preventDefault();
      // 直接觸發那一格的 click，與滑鼠走完全同一條路徑 ——
      // 另外寫一份鍵盤專用的處理遲早會跟滑鼠的行為分岔。
      e.target.click();
    }
  }, [size]);

  const isCoarse = useCoarsePointer();
  const [pendingWall, setPendingWall] = useState<Direction | null>(null);

  // 換一格、或換人下之後，還沒確認的方向就不再成立。
  const wallCtx = selectedChess ? `${selectedChess.row},${selectedChess.col},${currentPlayer}` : '';
  const [lastWallCtx, setLastWallCtx] = useState(wallCtx);
  if (lastWallCtx !== wallCtx) {
    setLastWallCtx(wallCtx);
    setPendingWall(null);
  }

  /** 四個方向各自送出時的座標換算（牆存在「某一格的下緣／右緣」）。 */
  const commitWall = useCallback((row: number, col: number, dir: Direction) => {
    if (dir === 'top') selectWall(row - 1, col, 'top');
    else if (dir === 'bottom') selectWall(row, col, 'bottom');
    else if (dir === 'left') selectWall(row, col - 1, 'left');
    else selectWall(row, col, 'right');
  }, [selectWall]);

  /** 盤面上按下某一邊：手指先預覽，滑鼠直接送出。 */
  const onWallEdge = useCallback((row: number, col: number, dir: Direction) => {
    if (isCoarse) setPendingWall(dir);
    else commitWall(row, col, dir);
  }, [isCoarse, commitWall]);

  const onClickSelectChess = (selectedPlayer: Player, row: number, col: number, isAvailableMove: boolean) => {
    if (!selectedPlayer && isPlacingChess) {
      setChessPosition(row, col);
    } else if (selectedPlayer === currentPlayer && !isPlacingChess) {
      selectChess(row, col);
    } else if (isAvailableMove && !isPlacingChess) {
      selectCell(row, col);
    }
  };

  const checkWallBuildable = useCallback((rowIndex: number, colIndex: number, direction: Direction): boolean => {
    switch (direction) {
      case 'top':
        return rowIndex > 0 && !horizontalWalls[rowIndex - 1][colIndex];
      case 'right':
        return !verticalWalls[rowIndex][colIndex] && colIndex < size - 1;
      case 'bottom':
        return !horizontalWalls[rowIndex][colIndex] && rowIndex < size - 1;
      case 'left':
        return colIndex > 0 && !verticalWalls[rowIndex][colIndex - 1];
      default:
        return false;
    }
  }, [size, horizontalWalls, verticalWalls]);

 /**
  * 計算可移動的位置
  * @param rowIndex - 行索引
  * @param colIndex - 列索引
  * @param steps - 剩餘步數
  * @param visited - 已訪問的位置
  * @returns {Move[]} 可移動的位置
  */
  const getAvailableMovesRecursive = useCallback((
    rowIndex: number,
    colIndex: number,
    steps: number,
    visited: Set<string> = new Set()
  ): Move[] => {
    // 如果步數為 0 或位置已訪問，返回空數組
    if (steps <= 0) return [];

    const posKey = `${rowIndex},${colIndex}`;
    if (visited.has(posKey)) return [];

    // 標記當前位置為已訪問
    const newVisited = new Set(visited);
    newVisited.add(posKey);

    const directions = [
      { dr: -1, dc: 0 }, // 上
      { dr: 0, dc: 1 },  // 右
      { dr: 1, dc: 0 },  // 下
      { dr: 0, dc: -1 }  // 左
    ];

    const currentMoves: Move[] = [];
    const nextMoves: Move[] = [];

    for (const { dr, dc } of directions) {
      // 計算相鄰位置
      const r1 = rowIndex + dr;
      const c1 = colIndex + dc;

      // 檢查是否在棋盤範圍內
      if (r1 >= 0 && r1 < size && c1 >= 0 && c1 < size) {
        // 檢查是否有牆擋住
        let hasWall = false;

        // 檢查水平牆
        if (dr === 1 && horizontalWalls[rowIndex][colIndex]) {
          hasWall = true;
        } else if (dr === -1 && rowIndex > 0 && horizontalWalls[rowIndex - 1][colIndex]) {
          hasWall = true;
        }

        // 檢查垂直牆
        if (dc === 1 && verticalWalls[rowIndex][colIndex]) {
          hasWall = true;
        } else if (dc === -1 && colIndex > 0 && verticalWalls[rowIndex][colIndex - 1]) {
          hasWall = true;
        }

        if (!hasWall) {
          // 如果相鄰位置沒有棋子，可以移動
          if (!board[r1][c1]) {
            const move = { row: r1, col: c1 };
            currentMoves.push(move);

            // 遞迴計算下一步可移動的位置
            if (steps > 1) {
              const furtherMoves = getAvailableMovesRecursive(r1, c1, steps - 1, newVisited);
              nextMoves.push(...furtherMoves);
            }
          }
        }
      }
    }

    // 合併當前步和下一步的所有可移動位置
    return [...currentMoves, ...nextMoves];
  }, [size, horizontalWalls, verticalWalls, board]);

 /**
  * 計算可移動的位置
  * @returns {Move[]} 可移動的位置
  */
  /**
   * 目前選中棋子的所有可移動位置。
   *
   * 原本是 useState + useEffect：除了每次多跑一輪 render，還會讓高亮慢一幀 ——
   * 點下棋子的那一幀會先畫出沒有落點的盤面，下一幀才補上。改成 useMemo 之後
   * 與選取同一幀完成。
   */
  const availableMoves = useMemo<Move[]>(() => {
    if (!selectedChess || remainSteps === 0) return [];
    return getAvailableMovesRecursive(selectedChess.row, selectedChess.col, remainSteps);
  }, [selectedChess, remainSteps, getAvailableMovesRecursive]);

  /**
   * 每個落點離棋子幾步。
   *
   * 只為了動畫：讓灰點由近而遠依序浮現，順手把「一次最多兩步」畫出來。
   * 上面那支遞迴走的是所有簡單路徑、會重複命中同一格，所以另外用 BFS
   * 取最短距離（可達集合兩者相同，這裡只多要一個層數）。
   */
  const moveDistance = useMemo<Record<string, number>>(() => {
    if (!selectedChess || remainSteps === 0) return {};
    const dist: Record<string, number> = {};
    let frontier = [[selectedChess.row, selectedChess.col] as [number, number]];
    const seen = new Set([`${selectedChess.row},${selectedChess.col}`]);
    for (let step = 1; step <= remainSteps && frontier.length; step++) {
      const next: [number, number][] = [];
      for (const [r, c] of frontier) {
        for (const [dr, dc] of [[-1, 0], [0, 1], [1, 0], [0, -1]] as const) {
          const nr = r + dr;
          const nc = c + dc;
          if (nr < 0 || nr >= size || nc < 0 || nc >= size) continue;
          if (dr === 1 && horizontalWalls[r][c]) continue;
          if (dr === -1 && r > 0 && horizontalWalls[r - 1][c]) continue;
          if (dc === 1 && verticalWalls[r][c]) continue;
          if (dc === -1 && c > 0 && verticalWalls[r][c - 1]) continue;
          if (board[nr][nc]) continue;
          const k = `${nr},${nc}`;
          if (seen.has(k)) continue;
          seen.add(k);
          dist[k] = step;
          next.push([nr, nc]);
        }
      }
      frontier = next;
    }
    return dist;
  }, [selectedChess, remainSteps, size, board, horizontalWalls, verticalWalls]);

  /*
    動畫的觸發點：在 render 期間比對上一次的盤面／領地。

    用 state 而不是 ref —— render 期間讀 ref 是 react-hooks/refs 在擋的事，
    而 useEffect 會慢一幀（先畫出新盤面、下一幀才補上動畫，等於沒有動畫）。
    「render 中比對前值並調整 state」是 React 官方對這個情境的建議寫法，
    RuleModal 重置步驟也是同一個模式。
  */
  const boardSig = useMemo(() => boardSignature(board), [board]);
  const [motion, setMotion] = useState(() => ({
    sig: boardSig,
    slide: {} as Record<string, { dx: number; dy: number }>,
    drop: [] as string[],
    seq: 0,
  }));
  if (motion.sig !== boardSig) {
    setMotion((m) => ({ ...diffBoard(m.sig, boardSig, size), sig: boardSig, seq: m.seq + 1 }));
  }

  const [terr, setTerr] = useState(() => ({
    map: flattenTerritoriesObj,
    wave: {} as Record<string, number>,
    seq: 0,
  }));
  const terrSig = useMemo(
    () => Object.entries(flattenTerritoriesObj).map(([k, v]) => `${k}:${v ?? ""}`).sort().join("|"),
    [flattenTerritoriesObj]
  );
  const wallSig = useMemo(
    () => ({ h: boardSignature(horizontalWalls), v: boardSignature(verticalWalls) }),
    [horizontalWalls, verticalWalls]
  );
  const [walls, setWalls] = useState(() => ({ sig: wallSig, fresh: null as string | null }));
  if (walls.sig.h !== wallSig.h || walls.sig.v !== wallSig.v) {
    setWalls((w) => ({ sig: wallSig, fresh: newWall(w.sig, wallSig) }));
  }

  const [lastTerrSig, setLastTerrSig] = useState(terrSig);
  if (lastTerrSig !== terrSig) {
    setLastTerrSig(terrSig);
    setTerr((t) => ({
      map: flattenTerritoriesObj,
      wave: territoryWave(t.map, flattenTerritoriesObj, board),
      seq: t.seq + 1,
    }));
  }

  return (
    <div className="relative size-full">
      {/* 列座標（A-H）*/}
      {/* <div className="absolute -bottom-5 left-0 flex w-full">
        {Array.from({ length: size }, (_, i) => (
          <div
            className="flex-1 text-center text-xs"
            key={`col-label-${i}`}
          >
            {letters[i]}
          </div>
        ))}
      </div> */}

      {/* 行座標（1-7）*/}
      {/* <div className="absolute -left-5 top-0 flex h-full flex-col justify-center">
        {Array.from({ length: size }, (_, i) => (
          <div
            className="flex h-full items-center justify-center text-xs"
            style={{ height: `${100 / size}%` }}
            key={`row-label-${i}`}
          >
            {size - i}
          </div>
        ))}
      </div> */}

      <SectionShadow>
        {/* 棋盤。
            外圍那圈 9px 的深褐是「牆」不是裝飾邊框 —— 規則裡棋盤的外緣本身
            就算一道牆，之前它在畫面上完全不存在，格線直接切掉。厚度取 9px
            與盤內的牆一致，不是隨便挑的邊框寬度。
            順帶讓棋盤終於像一個物件：原本格線切邊，看起來像沒畫完。
            厚度必須**等於盤內的牆**（固定 9px），因為它就是一道牆。
            原本用 1.25% 讓它跟著棋盤縮放，結果手機上只有 4.4px ——
            比盤內的牆細一半，讀起來就變回「裝飾外框」了。

            圓角也跟著算：巢狀圓角要同心，內圓角 = 外圓角 − 內距。
            原本外 22.4px、內 12px、內距 4.4px，內圓角少了 6px，
            白格子就從那個缺口擠進外框的弧線裡 —— 手機上特別明顯。 */}
        <div
          className="relative size-full rounded-[var(--board-frame-r)] bg-board-line p-[var(--board-wall)]"
          style={{
            '--board-wall': '9px',
            '--board-gap': '4px',
            '--board-frame-r': '1.4rem',
          } as React.CSSProperties}
        >
        {/* 欄數走 inline style 而不是 `grid-cols-${size}`：
            動態拼出來的 class 名稱 Tailwind 的靜態掃描看不到，之前是靠 safelist
            列舉 7/8/9 撐著 —— 盤面大小一旦改成別的值就會靜默壞掉。
            TutorialBoard 本來就是這樣寫的，兩邊統一。 */}
        <div
          ref={gridRef}
          role="grid"
          aria-label={g.board.label}
          onKeyDown={onGridKeyDown}
          className="grid size-full gap-[var(--board-gap)] overflow-hidden rounded-[calc(var(--board-frame-r)-var(--board-wall))] bg-board-line"
          style={
            {
              gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))`,
              // --board-gap 與 --board-wall 都定義在外框那一層，
              // 因為外框的內距與圓角也要用到它們。這裡只是繼承。
            } as React.CSSProperties
          }
        >
          {Array.from({ length: size }, (_, rowIndex) => (
            // role="grid" 要求子層是 row。display:contents 讓這層不產生
            // box，CSS grid 照樣直接排 49 個格子 —— 語意補上了，版面不動。
            <div key={`row-${rowIndex}`} role="row" style={{ display: 'contents' }}>
            {Array.from({ length: size }, (_, colIndex) => {
              const cellPlayer: Player = board?.[rowIndex]?.[colIndex];
              const hasHorizontalWallPlayer = horizontalWalls?.[rowIndex]?.[colIndex];
              const hasVerticalWall = verticalWalls?.[rowIndex]?.[colIndex];
              const isTurn = currentPlayer === cellPlayer;
              const isSelecting = selectedChess?.row === rowIndex && selectedChess?.col === colIndex;
              const isAvailableMove = availableMoves.some(move => move.row === rowIndex && move.col === colIndex);
              const territory = flattenTerritoriesObj?.[`${rowIndex},${colIndex}`];

              const cellBgMapping = {
                'A': 'bg-player-A-50',
                'B': 'bg-player-B-50',
                'C': 'bg-player-C-50',
              }

              /*
                領地色從「格子的 bg class」改成一層可縮放的疊層。

                封閉成領地是這局的得分瞬間，但原本畫面上只是一片顏色突然換掉，
                完全看不出是哪顆棋子圈到的。疊層可以從擁有者的棋子往外一圈圈填。
                格子本體固定奶油色，疊層墊在最底（z-0），棋子與落點照舊在上面。
              */
              const cellClass = ['bg-primary-50'];
              const territoryClass = !isPlacingChess && territory ? cellBgMapping[territory] : null;
              const territoryDelay = terr.wave[`${rowIndex},${colIndex}`];

              if (!isLock && (isPlacingChess && !cellPlayer)) {
                cellClass.push('cursor-pointer');
              } else if (!isLock && !isPlacingChess && (isTurn || isAvailableMove)) {
                cellClass.push('cursor-pointer');
              }

              const isPieceActive =
                isSelecting || (!selectedChess && isTurn && !isLock && !isPlacingChess);

              // 在每一格內
              let isHorizontalWallBreakable = false;
              let isVerticalWallBreakable = false;

              if (isBreakWallAvailable && breakWallCount > 0 && selectedChess) {
                // 下方橫牆（自己這格 or 上面那格）
                if (
                  (rowIndex === selectedChess.row && colIndex === selectedChess.col) ||
                  (rowIndex === selectedChess.row - 1 && colIndex === selectedChess.col)
                ) {
                  isHorizontalWallBreakable = true;
                }
                // 右側直牆（自己這格 or 左邊那格）
                if (
                  (rowIndex === selectedChess.row && colIndex === selectedChess.col) ||
                  (rowIndex === selectedChess.row && colIndex === selectedChess.col - 1)
                ) {
                  isVerticalWallBreakable = true;
                }
              }

              return (
                <div
                  className={`group relative flex items-center justify-center outline-offset-[-3px] focus-visible:outline focus-visible:outline-2 focus-visible:outline-tile-ink ${
                    isSelecting ? 'z-10 ring ring-inset ring-tile-ink' : ''
                  } ${cellClass.join(' ')}`}
                  key={`${rowIndex}-${colIndex}`}
                  role="gridcell"
                  data-cell={`${rowIndex},${colIndex}`}
                  // roving tabindex：整個棋盤只佔一個 tab 停留點。
                  // 49 格各佔一個的話，光是穿過棋盤就要按 49 次 tab。
                  tabIndex={cursor.row === rowIndex && cursor.col === colIndex ? 0 : -1}
                  aria-label={[
                    fmt(g.board.cell, { row: rowIndex + 1, col: colIndex + 1 }),
                    cellPlayer ? fmt(g.board.piece, { player: g.players[cellPlayer] })
                      : territory ? fmt(g.board.territory, { player: g.players[territory] }) : g.board.empty,
                    isAvailableMove ? g.board.canMove : null,
                    !isLock && isPlacingChess && !cellPlayer ? g.board.canPlace : null,
                    hasHorizontalWallPlayer ? g.board.wallBelow : null,
                    hasVerticalWall ? g.board.wallRight : null,
                  ].filter(Boolean).join('，')}
                  onClick={() => onClickSelectChess(cellPlayer, rowIndex, colIndex, isAvailableMove)}
                >
                  {/* 選取中的格子。
                      原本是深墨外框，但框線和築牆預覽佔在同一條邊上互相搶 ——
                      框一重，45% 的預覽就被壓掉了。改成整格微染玩家色：
                      標示得出「選的是這格」，邊線則完全讓給預覽。 */}
                  {isSelecting && currentPlayer && (
                    <div
                      className="pointer-events-none absolute inset-0 opacity-[0.16]"
                      style={{ backgroundColor: PLAYER_VAR[currentPlayer] }}
                    />
                  )}

                  {/* 領地。key 帶上 seq，讓同一格再次易主時動畫會重播。 */}
                  {territoryClass && (
                    <div
                      key={`t${terr.seq}-${territoryDelay !== undefined ? 'in' : 'on'}`}
                      className={`pointer-events-none absolute inset-0 z-0 ${territoryClass} ${
                        territoryDelay !== undefined ? 'animate-territory' : ''
                      }`}
                      style={territoryDelay !== undefined ? { animationDelay: `${territoryDelay}ms` } : undefined}
                    />
                  )}

                  {/* 棋子。
                      外層與格子等大（inset-0），所以位移可以用「格」為單位寫：
                      100% 就是一格寬，再補一道格縫。內層才是那顆圓 ——
                      滑動掛外層、呼吸掛內層，兩個 transform 不會互相蓋掉。 */}
                  {cellPlayer && (() => {
                    const mk = `${rowIndex},${colIndex}`;
                    const slide = motion.slide[mk];
                    const dropped = motion.drop.includes(mk);

                    /*
                      走兩步時要看得到轉角 —— 直線補間會斜著飛過去，
                      那等於在教「可以走斜線」，但這個遊戲只能走上下左右。
                      轉角位置用 BFS 從合法路徑取，慣用的那邊被牆擋住會自動改走另一邊。
                      算不出路徑（例如遠端一次送來整回合、新牆剛好蓋在路上）就退回直線。
                    */
                    const offset = (r: number, c: number) => ({
                      x: `calc(${c - colIndex} * (100% + var(--board-gap)))`,
                      y: `calc(${r - rowIndex} * (100% + var(--board-gap)))`,
                    });
                    let anim = dropped ? 'animate-piece-drop' : '';
                    let vars: React.CSSProperties | undefined;
                    if (slide) {
                      const from: [number, number] = [rowIndex + slide.dy, colIndex + slide.dx];
                      const path = pathBetween(board, { h: horizontalWalls, v: verticalWalls }, from, [rowIndex, colIndex]);
                      const start = offset(from[0], from[1]);
                      if (path && path.length === 3) {
                        const mid = offset(path[1][0], path[1][1]);
                        anim = 'animate-piece-step';
                        vars = { '--slide-x': start.x, '--slide-y': start.y, '--mid-x': mid.x, '--mid-y': mid.y } as React.CSSProperties;
                      } else {
                        anim = 'animate-piece-slide';
                        vars = { '--slide-x': start.x, '--slide-y': start.y } as React.CSSProperties;
                      }
                    }

                    return (
                      <div
                        key={slide || dropped ? `m${motion.seq}` : 'p'}
                        className={`pointer-events-none absolute inset-0 z-20 grid place-items-center ${anim}`}
                        style={vars}
                      >
                        <div
                          className={`size-3/5 rounded-full ${isPieceActive ? 'animate-pulse-shine' : ''}`}
                          style={{ backgroundColor: PLAYER_VAR[cellPlayer] }}
                        />
                      </div>
                    );
                  })()}

                  {/* 放置時的預覽棋子 */}
                  {!cellPlayer && isPlacingChess && currentPlayer && (
                    <div
                      className="absolute z-20 hidden size-3/5 rounded-full opacity-55 group-hover:block"
                      style={{ backgroundColor: PLAYER_VAR[currentPlayer] }}
                    />
                  )}

                  {/* 可移動的落點。
                      原本是整格染成淡綠，但淡色疊在奶油格上很弱，
                      而且會跟領地底色打架。改成置中的圓點 —— 不吃底色，
                      也不會跟「這格屬於誰」的資訊互相干擾。 */}
                  {isAvailableMove && !cellPlayer && (
                    <div
                      key={`d${selectedChess?.row},${selectedChess?.col},${remainSteps}`}
                      className="animate-dot-pop absolute z-10 size-1/4 rounded-full bg-tile-ink/30 transition-colors group-hover:bg-tile-ink/55"
                      style={{ animationDelay: `${(moveDistance[`${rowIndex},${colIndex}`] ?? 1) * 55 - 55}ms` }}
                    />
                  )}

                  {/* 開局可放置的位置。
                      原本開局是一整面空棋盤，只有把游標移到某格才會冒出半透明棋子 ——
                      等於要先猜對地方才知道那裡能放。改成所有可放的格子一開始就點上灰點，
                      與對局中的「可移動落點」用同一個記號，學一次就通用。
                      條件刻意與上面 cursor-pointer 那條一字不差：能點的就有點，
                      兩者分開寫遲早會不一致。游標移上去時讓位給預覽棋子。 */}
                  {!isLock && isPlacingChess && !cellPlayer && (
                    <div className="absolute z-10 size-1/4 rounded-full bg-tile-ink/20 transition-opacity group-hover:opacity-0" />
                  )}

                  {/*
                    牆。
                    格縫是 4px 的深墨線，牆原本也是 4px 且畫在同一個位置 ——
                    一道牆和一條空格線的差別只有顏色，盤面一複雜就難掃視。
                    改成 9px、兩端圓角、並向左右各突出 3px：牆因此比格線厚、
                    也蓋過交叉點，讀起來是「放上去的東西」而不是「被上色的格線」。
                  */}
                  {hasHorizontalWallPlayer && (
                    <div
                      className={`absolute inset-x-[-3px] bottom-[calc(var(--board-gap)*-0.5)] z-20 h-[9px] translate-y-1/2 rounded-full ${
                        walls.fresh === `h:${rowIndex * size + colIndex}` ? 'animate-wall-h' : ''
                      }`}
                      style={{ backgroundColor: PLAYER_VAR[hasHorizontalWallPlayer] }}
                    >
                      {isHorizontalWallBreakable && (
                        <button
                          type="button"
                          aria-label={g.board.breakBelow}
                          className="animate-shine absolute left-1/2 top-1/2 z-30 grid size-7 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-tile-ink text-sm text-tile-cream ring-2 ring-primary-50"
                          onClick={(e) => { e.stopPropagation(); onClickBreakWall(rowIndex, colIndex, 'horizontal'); }}
                        >
                          <GiHammerBreak />
                        </button>
                      )}
                    </div>
                  )}
                  {hasVerticalWall && (
                    <div
                      className={`absolute inset-y-[-3px] right-[calc(var(--board-gap)*-0.5)] z-20 w-[9px] translate-x-1/2 rounded-full ${
                        walls.fresh === `v:${rowIndex * size + colIndex}` ? 'animate-wall-v' : ''
                      }`}
                      style={{ backgroundColor: PLAYER_VAR[hasVerticalWall] }}
                    >
                      {isVerticalWallBreakable && (
                        <button
                          type="button"
                          aria-label={g.board.breakRight}
                          className="animate-shine absolute left-1/2 top-1/2 z-30 grid size-7 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-tile-ink text-sm text-tile-cream ring-2 ring-primary-50"
                          onClick={(e) => { e.stopPropagation(); onClickBreakWall(rowIndex, colIndex, 'vertical'); }}
                        >
                          <GiHammerBreak />
                        </button>
                      )}
                    </div>
                  )}

                  {/*
                    可築牆的位置。
                    原本是灰色半透明的方條 —— 灰色在奶油底上發濁，而且跟「真的牆」
                    是同一種形狀，差別只有深淺。改成當前玩家色的半透明預覽，
                    形狀與尺寸都跟築好之後一模一樣：看到的就是會得到的。
                  */}
                  {isSelecting && currentPlayer && (
                    <>
                      {checkWallBuildable(rowIndex, colIndex, 'top') && (
                        <button
                          type="button"
                          aria-label={g.board.buildTop}
                          className={`wall-hit-h absolute inset-x-[18%] top-[calc(var(--board-gap)*-0.5)] z-20 h-[9px] -translate-y-1/2 rounded-full transition hover:inset-x-[-3px] hover:opacity-100 ${pendingWall === 'top' ? 'inset-x-[-3px] opacity-100' : 'opacity-70'}`}
                          style={{ backgroundColor: PLAYER_VAR[currentPlayer] }}
                          onClick={(e) => { e.stopPropagation(); onWallEdge(rowIndex, colIndex, 'top'); }}
                        />
                      )}
                      {checkWallBuildable(rowIndex, colIndex, 'bottom') && (
                        <button
                          type="button"
                          aria-label={g.board.buildBottom}
                          className={`wall-hit-h absolute inset-x-[18%] bottom-[calc(var(--board-gap)*-0.5)] z-20 h-[9px] translate-y-1/2 rounded-full transition hover:inset-x-[-3px] hover:opacity-100 ${pendingWall === 'bottom' ? 'inset-x-[-3px] opacity-100' : 'opacity-70'}`}
                          style={{ backgroundColor: PLAYER_VAR[currentPlayer] }}
                          onClick={(e) => { e.stopPropagation(); onWallEdge(rowIndex, colIndex, 'bottom'); }}
                        />
                      )}
                      {checkWallBuildable(rowIndex, colIndex, 'left') && (
                        <button
                          type="button"
                          aria-label={g.board.buildLeft}
                          className={`wall-hit-v absolute inset-y-[18%] left-[calc(var(--board-gap)*-0.5)] z-20 w-[9px] -translate-x-1/2 rounded-full transition hover:inset-y-[-3px] hover:opacity-100 ${pendingWall === 'left' ? 'inset-y-[-3px] opacity-100' : 'opacity-70'}`}
                          style={{ backgroundColor: PLAYER_VAR[currentPlayer] }}
                          onClick={(e) => { e.stopPropagation(); onWallEdge(rowIndex, colIndex, 'left'); }}
                        />
                      )}
                      {checkWallBuildable(rowIndex, colIndex, 'right') && (
                        <button
                          type="button"
                          aria-label={g.board.buildRight}
                          className={`wall-hit-v absolute inset-y-[18%] right-[calc(var(--board-gap)*-0.5)] z-20 w-[9px] translate-x-1/2 rounded-full transition hover:inset-y-[-3px] hover:opacity-100 ${pendingWall === 'right' ? 'inset-y-[-3px] opacity-100' : 'opacity-70'}`}
                          style={{ backgroundColor: PLAYER_VAR[currentPlayer] }}
                          onClick={(e) => { e.stopPropagation(); onWallEdge(rowIndex, colIndex, 'right'); }}
                        />
                      )}
                    </>
                  )}
                </div>
              )
            })}
            </div>
          ))}
        </div>
        </div>
      </SectionShadow>

      {/* 手機的築牆控制盤。固定在畫面底部（拇指區），不佔棋盤的位置。 */}
      {wallPadVisible({ coarse: isCoarse, locked: isLock, placing: isPlacingChess, hasSelection: !!selectedChess }) && selectedChess && currentPlayer && (
        <WallDirectionPad
          legal={{
            top: checkWallBuildable(selectedChess.row, selectedChess.col, 'top'),
            bottom: checkWallBuildable(selectedChess.row, selectedChess.col, 'bottom'),
            left: checkWallBuildable(selectedChess.row, selectedChess.col, 'left'),
            right: checkWallBuildable(selectedChess.row, selectedChess.col, 'right'),
          }}
          // 一步之內到得了的四個鄰格。availableMoves 是剩餘步數內的完整
          // 可達集合，鄰格在不在裡面就等於那個方向能不能走。
          movable={{
            top: availableMoves.some((m) => m.row === selectedChess.row - 1 && m.col === selectedChess.col),
            bottom: availableMoves.some((m) => m.row === selectedChess.row + 1 && m.col === selectedChess.col),
            left: availableMoves.some((m) => m.row === selectedChess.row && m.col === selectedChess.col - 1),
            right: availableMoves.some((m) => m.row === selectedChess.row && m.col === selectedChess.col + 1),
          }}
          onMove={(dir) => {
            const d = { top: [-1, 0], bottom: [1, 0], left: [0, -1], right: [0, 1] }[dir];
            selectCell(selectedChess.row + d[0], selectedChess.col + d[1]);
            // 移動之後原本選的那道牆多半已經不合法了，清掉重選
            setPendingWall(null);
          }}
          pending={pendingWall}
          onPick={setPendingWall}
          onConfirm={() => {
            if (pendingWall) commitWall(selectedChess.row, selectedChess.col, pendingWall);
          }}
          onRedo={() => { setPendingWall(null); cancelTurn?.(); }}
          dirty={turnDirty}
          remainSteps={remainSteps}
          color={PLAYER_VAR[currentPlayer]}
        />
      )}
    </div>
  );
});
