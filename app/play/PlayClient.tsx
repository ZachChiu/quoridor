'use client'
import { useState, useEffect, useMemo, useCallback } from "react";
import Link from 'next/link';
import Chessboard from "@/components/Chessboard";
import SectionShadow from "@/components/SectionShadow";
import ChampionModal from "@/components/ChampionModal";
import GameStatus from "@/components/GameStatus";
import GameTips from "@/components/GameTips";
import IconButton from "@/components/IconButton";

import type { Player, Direction } from "@/types/chessboard.ts";
import flatten from 'lodash-es/flatten';
import uniq from 'lodash-es/uniq';
import cloneDeep from 'lodash-es/cloneDeep';
import max from 'lodash-es/max';
import min from 'lodash-es/min';

import { trackButtonClick } from "@/utils/analytics";
import { MdHome, MdOutlineQuestionMark  } from "react-icons/md";
import { useRuleModal } from "@/contexts/RuleModalContext";
import { useGame } from "@/contexts/GameContext";
import playerTemplates from "@/config/playerTemplates";
import BreakWallConfirmModal from "@/components/BreakWallConfirmModal";
import { useConfirm } from "@/hook/useConfirm";

export default function PlayClient() {
  const { gameState } = useGame();
  const [size, setSize] = useState(0);
  const [board, setBoard] = useState<Player[][]>(playerTemplates.templateBoardTwo);
  const [currentPlayer, setCurrentPlayer] = useState<Player>('A');
  const [verticalWalls, setVerticalWalls] = useState<Player[][]>(playerTemplates.templateVerticalWalls);
  const [horizontalWalls, setHorizontalWalls] = useState<Player[][]>(playerTemplates.templateHorizontalWalls);
  const [selectedChess, setSelectedChess] = useState<{ row: number; col: number } | null>(null);
  const [remainSteps, setRemainSteps] = useState(2);
  // const [territories, setTerritories] = useState<{ A: string[][]; B: string[][] }>({
  //   A: [],
  //   B: []
  // });
  const [uniqTerritories, setUniqTerritories] = useState<{ A: string[]; B: string[]; C?: string[] }>({
    A: [],
    B: []
  });
  const [flattenTerritoriesObj, setFlattenTerritoriesObj] = useState<Record<string, Player>>({});
  const [winingStatus, setWiningStatus] = useState<(Player | 'draw')[]>([]);
  const [openingStep, setOpeningStep] = useState<Player[]>([]);
  const [isChampionModalOpen, setIsChampionModalOpen] = useState(false);
  const isPlacingChess = useMemo(() => !!openingStep.length ,[openingStep])
  const isLock = useMemo(() => !!winingStatus.length, [winingStatus]);
  const [breakWallCountObj, setBreakWallCountObj] = useState({ A: 1, B: 1, C: 1 });
  const isBreakWallAvailable = useMemo(() => gameState.playersNum > 2, [gameState.playersNum]);

  const selectChess = useCallback((row: number, col: number) => {
    if (remainSteps < 2) {
      return;
    }
    if (row === selectedChess?.row && col === selectedChess?.col) {
      setSelectedChess(null);
      return;
    }
    setSelectedChess({ row, col });
  }, [selectedChess, remainSteps]);

  const selectWall = useCallback((row: number, col: number, direction: Direction) => {
    switch (direction) {
      case 'top':
      case 'bottom':
        setHorizontalWalls((prev) => {
          const newWalls = [...prev];
          newWalls[row][col] = currentPlayer;
          return newWalls;
        });
        break;
      case 'left':
      case 'right':
        setVerticalWalls((prev) => {
          const newWalls = [...prev];
          newWalls[row][col] = currentPlayer;
          return newWalls;
        });
        break;
    }

    let newCurrentPlayer: Player = null;
    const turnOrder: Player[] = []
    switch (gameState.playersNum) {
      case 2:
        turnOrder.push(...playerTemplates.turnOrderTwo);
        newCurrentPlayer = turnOrder[turnOrder.indexOf(currentPlayer) + 1] || turnOrder[0];
        break;
      case 3:
        turnOrder.push(...playerTemplates.turnOrderThree);
        newCurrentPlayer = turnOrder[turnOrder.indexOf(currentPlayer) + 1] || turnOrder[0];
        break;
      default:
        break;
    }

    setCurrentPlayer(newCurrentPlayer);
    setRemainSteps(2);
    setSelectedChess(null);
  }, [currentPlayer, setHorizontalWalls, setVerticalWalls, gameState.playersNum]);

  const selectCell = useCallback((row: number, col: number) => {
    if (!selectedChess) return;
    setSelectedChess({ row, col });
    const gap = remainSteps - (Math.abs((selectedChess.row) - row) + Math.abs((selectedChess.col) - col));
    setRemainSteps(gap);

    setBoard((prev) => {
      const newBoard = [...prev];
      newBoard[selectedChess.row][selectedChess.col] = null;
      newBoard[row][col] = currentPlayer;
      return newBoard;
    });
  }, [selectedChess, currentPlayer, remainSteps, setSelectedChess, setBoard]);

  const setChessPosition = useCallback((row: number, col: number) => {
    setBoard((prev) => {
      const newBoard = [...prev];
      newBoard[row][col] = currentPlayer;
      return newBoard;
    });
    const newOpeningStep = [...openingStep];
    newOpeningStep.shift()
    setOpeningStep(newOpeningStep);

    setCurrentPlayer(newOpeningStep[0] || 'A');
  }, [currentPlayer, setBoard, openingStep, setCurrentPlayer]);

  const {
    isOpen: isBreakWallModalOpen,
    confirm: confirmBreakWall,
    handleConfirm: handleBreakWallConfirm,
    handleCancel: handleBreakWallCancel,
  } = useConfirm();

  const onClickBreakWall = useCallback(async (row: number, col: number, direction: 'horizontal' | 'vertical') => {
    if (!isBreakWallAvailable) return;

    const ok = await confirmBreakWall();
    if (ok) {
      setBreakWallCountObj((prev) => ({
        ...prev,
        [currentPlayer as Exclude<Player, null>]: prev[currentPlayer as Exclude<Player, null>] - 1
      }));

      switch (direction) {
        case 'horizontal':
          setHorizontalWalls((prev) => {
            const newWalls = [...prev];
            newWalls[row][col] = null;
            return newWalls;
          });
          break;
        case 'vertical':
          setVerticalWalls((prev) => {
            const newWalls = [...prev];
            newWalls[row][col] = null;
            return newWalls;
          });
          break;
        default:
          break;
      }
    }
  }, [confirmBreakWall, setBreakWallCountObj, setVerticalWalls, setHorizontalWalls, currentPlayer, isBreakWallAvailable]);

  /**
  * 計算可移動的位置
  * @param rowIndex - 行索引
  * @param colIndex - 列索引
  * @param player - 棋子所屬玩家
  * @param maxSteps - 最大步數
  * @returns {Move[]} 可移動的位置
  */
  const getTerritories = useCallback((
    rowIndex: number,
    colIndex: number,
    player: Player,
    maxSteps: number = 50
  ): { moves: string[], hasEnemy: boolean } => {
    // 使用 BFS (廣度優先搜索) 來找出所有可到達的位置
    const queue: { row: number, col: number, steps: number }[] = [{ row: rowIndex, col: colIndex, steps: 0 }];
    const visited = new Set<string>();
    const moves: string[] = [];
    let hasEnemy = false;

    // 將起始棋子的位置加入到 moves 陣列中
    const startPosKey = `${rowIndex},${colIndex}`;
    moves.push(startPosKey);

    // 標記起始位置為已訪問
    visited.add(startPosKey);

    while (queue.length > 0) {
      const { row, col, steps } = queue.shift()!;

      // 如果已經達到最大步數，則停止
      if (steps >= maxSteps) continue;

      // 檢查四個方向
      const directions = [
        { dr: -1, dc: 0 }, // 上
        { dr: 0, dc: 1 },  // 右
        { dr: 1, dc: 0 },  // 下
        { dr: 0, dc: -1 }  // 左
      ];

      for (const { dr, dc } of directions) {
        const r1 = row + dr;
        const c1 = col + dc;

        // 檢查是否在棋盤範圍內
        if (r1 >= 0 && r1 < size && c1 >= 0 && c1 < size) {
          // 檢查是否有牆擋住
          let hasWall = false;

          // 檢查水平牆
          if (dr === 1 && horizontalWalls[row][col]) {
            hasWall = true;
          } else if (dr === -1 && row > 0 && horizontalWalls[row - 1][col]) {
            hasWall = true;
          }

          // 檢查垂直牆
          if (dc === 1 && verticalWalls[row][col]) {
            hasWall = true;
          } else if (dc === -1 && col > 0 && verticalWalls[row][col - 1]) {
            hasWall = true;
          }

          // 如果沒有牆且位置未訪問過
          if (!hasWall) {
            const posKey = `${r1},${c1}`;

            if (!visited.has(posKey)) {
              visited.add(posKey);

              // 檢查該位置是否有棋子
              const cellPlayer = board[r1][c1];

              if (cellPlayer === null) {
                // 空格，可以移動
                moves.push(posKey);
                queue.push({ row: r1, col: c1, steps: steps + 1 });
              } else if (cellPlayer === player) {
                // 同陣營棋子，加入地盤但不能走到這個位置
                moves.push(posKey);
                queue.push({ row: r1, col: c1, steps: steps + 1 });
              } else {
                // 敵方棋子，設置標誌
                hasEnemy = true;
                break;
              }
            }
          }
        }
      }

      if (hasEnemy) break;
    }

    return { moves, hasEnemy };
  }, [size, horizontalWalls, verticalWalls, board]);

  // 在 calculateChessTerritory 函數中
  const calculateChessTerritory = useCallback((
    chessRow: number,
    chessCol: number,
    player: Player
  ): string[] => {
    if (player === null || !board.length) return [];

    // 使用 BFS 計算所有可能的移動位置，包括同陣營棋子
    const { moves, hasEnemy } = getTerritories(chessRow, chessCol, player);

    // 如果遇到敵方棋子，返回空陣列
    if (hasEnemy) {
      return [];
    }

    return moves;
  }, [board, getTerritories]);

  /**
   * 計算所有棋子的地盤
   * @returns {{ A: Move[][], B: Move[][] }} 每個玩家的所有棋子地盤，每顆棋子一個陣列
   */
  const calculateAllTerritories = useCallback((): { A: string[][], B: string[][], C?: string[][] } => {
    const territories: { A: string[][]; B: string[][]; C?: string[][] } = {
      A: [] as string[][],
      B: [] as string[][],
    };

    if (gameState.playersNum === 3) {
      territories.C = [] as string[][];
    }

    // 遍歷棋盤上的每個位置
    for (let row = 0; row < size; row++) {
      for (let col = 0; col < size; col++) {
        const player = board[row][col];
        if (player) {
          // 計算該棋子的地盤
          const territory = calculateChessTerritory(row, col, player);

          // 將地盤加入到對應玩家的地盤列表中，每顆棋子一個陣列
          territories[player]?.push(territory);
        }
      }
    }

    return territories;
  }, [board, size, calculateChessTerritory, gameState.playersNum]);

  /**
   * 當玩家改變時，重新計算地盤
   */
  useEffect(() => {
    const calculatedTerritories: { A: string[][]; B: string[][]; C?: string[][] } = calculateAllTerritories();

    const newFlattenTerritoriesObj: Record<string, Player> = {};
    const newUniqTerritories: { A: string[]; B: string[]; C?: string[] } = {
      A: [],
      B: []
    };

    if (gameState.playersNum === 3) {
      newUniqTerritories.C = [] as string[];
    }

    const keys = Object.keys(calculatedTerritories);
    keys.forEach(key => {
      const flattenTerritories = flatten(calculatedTerritories[key as Exclude<Player, null>]);
      newUniqTerritories[key as Exclude<Player, null>] = uniq(flattenTerritories);
      flattenTerritories.forEach(posKey => {
        newFlattenTerritoriesObj[posKey] = key as Exclude<Player, null>;
      });
    });

    const isGameOver = keys.every(key => calculatedTerritories[key as Exclude<Player, null>]!.length !== 0 && calculatedTerritories[key as Exclude<Player, null>]!.every(arr => arr.length !== 0));
    if (isGameOver) {
      const numberOfA = newUniqTerritories['A']?.length || 0;
      const numberOfB = newUniqTerritories['B'].length || 0;
      const numberOfC = newUniqTerritories['C']?.length || 0;
      const calcArr = [numberOfA, numberOfB];

      if (gameState.playersNum === 3) {
        calcArr.push(numberOfC);
      }

      const maxNumber = max(calcArr);
      const minNumber = min(calcArr);

      if (maxNumber === minNumber) {
        // 平手
        setWiningStatus(['draw']);
      } else {
        // 找出所有分數等於 maxNumber 的玩家
        const winners: Player[] = [];
        if (numberOfA === maxNumber) winners.push('A');
        if (numberOfB === maxNumber) winners.push('B');
        if (gameState.playersNum === 3 && numberOfC === maxNumber) winners.push('C');
        setWiningStatus(winners);
      }
      setIsChampionModalOpen(true);
    }

    setUniqTerritories(newUniqTerritories);
    setFlattenTerritoriesObj(newFlattenTerritoriesObj);
    // setTerritories(calculatedTerritories);
  }, [currentPlayer, calculateAllTerritories, gameState.playersNum, isPlacingChess]);

  /**
   * 重新開始遊戲
   */
  const restartGame = useCallback(() => {
    switch (gameState.playersNum) {
      case 2:
        setBoard(cloneDeep(playerTemplates.templateBoardTwo));
        setVerticalWalls(cloneDeep(playerTemplates.templateVerticalWalls));
        setHorizontalWalls(cloneDeep(playerTemplates.templateHorizontalWalls));
        setOpeningStep(cloneDeep(playerTemplates.openingStepTwo));
        break;
      case 3:
        setBoard(cloneDeep(playerTemplates.templateBoardThree));
        setVerticalWalls(cloneDeep(playerTemplates.templateVerticalWalls));
        setHorizontalWalls(cloneDeep(playerTemplates.templateHorizontalWalls));
        setOpeningStep(cloneDeep(playerTemplates.openingStepThree));
        break;
      default:
        break;
    }

    setSize(7);
    setCurrentPlayer(openingStep[0] || 'A' as Player);
    setSelectedChess(null);
    setRemainSteps(2);
    setWiningStatus([]);
    setIsChampionModalOpen(false);
    trackButtonClick(`restart_local_game_${gameState.playersNum}p`);
    setFlattenTerritoriesObj({});
    setBreakWallCountObj({ A: 1, B: 1, C: 1 });
  }, []);

  useEffect(() => {
    restartGame();
  }, [restartGame]);


  // 當用戶嘗試離開頁面且遊戲尚未結束時顯示確認對話框
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (winingStatus === null) {
        e.preventDefault();
        return;
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
    };
  }, [winingStatus]);

  const { ruleModalState, setRuleModalState } = useRuleModal();
  const handleRuleBtnOpen = () => {
    setRuleModalState({
      ...ruleModalState,
      isOpen: true
    })
  }
  return (
    <>
      <Link className="group fixed left-5 top-5 cursor-pointer" href="/" >
        <SectionShadow roundedFull className='size-auto'>
          <div className="relative z-50 block rounded-full border-4 border-gray-900 bg-white p-3 text-xl group-hover:-translate-x-0.5 group-hover:-translate-y-0.5 group-active:translate-x-1 group-active:translate-y-1">
            <MdHome  />
          </div>
        </SectionShadow>
      </Link>
      <div className={`group fixed left-5 top-[calc(2.25rem+52px)] cursor-pointer`}>
        <IconButton handleClickEvent={() => handleRuleBtnOpen()}>
          <MdOutlineQuestionMark />
        </IconButton>
      </div>

      {/* 賽況面板 */}
      <GameStatus isLock={isLock} currentPlayer={currentPlayer} uniqTerritories={uniqTerritories} />

      {/* 提示面板 */}
      <GameTips isPlacingChess={isPlacingChess} currentPlayer={currentPlayer} winingStatus={winingStatus} breakWallCountObj={breakWallCountObj}/>

      <div className="chessboard-container size-[90dvw] md:size-[90dvh] md:portrait:size-[90dvw] md:landscape:size-[90dvh]">
        <Chessboard
          size={size}
          board={board}
          verticalWalls={verticalWalls}
          horizontalWalls={horizontalWalls}
          currentPlayer={currentPlayer}
          selectedChess={selectedChess}
          remainSteps={remainSteps}
          flattenTerritoriesObj={flattenTerritoriesObj}
          breakWallCountObj={breakWallCountObj}
          isBreakWallAvailable={isBreakWallAvailable}
          isLock={isLock}
          isPlacingChess={isPlacingChess}
          selectChess={selectChess}
          selectWall={selectWall}
          selectCell={selectCell}
          setChessPosition={setChessPosition}
          onClickBreakWall={onClickBreakWall}
        ></Chessboard>
      </div>

      {/* 冠軍訊息 Modal */}
      <ChampionModal
        winners={winingStatus}
        uniqTerritories={uniqTerritories}
        isOpen={isChampionModalOpen}
        onClose={() => setIsChampionModalOpen(false)}
        onRestart={restartGame}
      />

      {/* 破牆確認 Modal */}
      <BreakWallConfirmModal
        isOpen={isBreakWallModalOpen}
        onClose={handleBreakWallCancel}
        onCheck={handleBreakWallConfirm}
      />
    </>
  );
}
