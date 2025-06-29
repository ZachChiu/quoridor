'use client'
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useSearchParams, useRouter } from 'next/navigation';
import Link from 'next/link';
import Chessboard from "@/components/Chessboard";
import SectionShadow from "@/components/SectionShadow";
import ChampionModal from "@/components/ChampionModal";
import GameStatus from "@/components/GameStatus";
import GameTips from "@/components/GameTips";
import IconButton from "@/components/IconButton";
import Button from "@/components/Button";

import type { Player, Direction } from "@/types/chessboard.ts";
import flatten from 'lodash-es/flatten';
import uniq from 'lodash-es/uniq';
import cloneDeep from 'lodash-es/cloneDeep';
import max from 'lodash-es/max';
import min from 'lodash-es/min';

import { trackButtonClick } from "@/utils/analytics";
import { MdHome, MdOutlineQuestionMark, MdShare, MdWarning, MdPlayArrow } from "react-icons/md";
import { useRuleModal } from "@/contexts/RuleModalContext";
import { useGame } from "@/contexts/GameContext";
import playerTemplates from "@/config/playerTemplates";
import BreakWallConfirmModal from "@/components/BreakWallConfirmModal";
import { useConfirm } from "@/hook/useConfirm";
import { updateGameState as syncGameStateToRTD, subscribeToGameState, GamePlayState } from "@/lib/gameService";

export default function PlayClient() {
  const { gameState } = useGame();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [showShareToast, setShowShareToast] = useState(false);
  const [showRTDTimeoutError, setShowRTDTimeoutError] = useState(false);
  const shareToastTimeout = useRef<NodeJS.Timeout | null>(null);
  const gameToken = searchParams.get('token');
  const isOnlineMode = !!gameToken;
  
  // RTD 初始資料載入狀態
  const isLoadingRTD = useRef(!!gameToken);
  const rtdInitialized = useRef(!gameToken);
  const rtdTimeoutTimer = useRef<NodeJS.Timeout | null>(null);
  
  // 統一管理遊戲狀態
  const [gamePlayState, setGamePlayState] = useState<GamePlayState>({
    size: 7,
    board: playerTemplates.templateBoardTwo,
    currentPlayer: 'A',
    verticalWalls: playerTemplates.templateVerticalWalls,
    horizontalWalls: playerTemplates.templateHorizontalWalls,
    selectedChess: null,
    remainSteps: 2,
    uniqTerritories: { A: [], B: [] },
    flattenTerritoriesObj: {},
    winingStatus: [],
    openingStep: [],
    isChampionModalOpen: false,
    breakWallCountObj: { A: 1, B: 1, C: 1 },
    playersNum: gameState.playersNum 
  });
  
  const { 
    size, board, currentPlayer, verticalWalls, horizontalWalls, 
    selectedChess, remainSteps, uniqTerritories, flattenTerritoriesObj,
    winingStatus, openingStep, isChampionModalOpen, breakWallCountObj,
    playersNum 
  } = gamePlayState;
  
  const isPlacingChess = useMemo(() => !!openingStep.length, [openingStep]);
  const isLock = useMemo(() => !!winingStatus.length, [winingStatus]);
  const isBreakWallAvailable = useMemo(() => playersNum > 2, [playersNum]);
  
  // 線上模式：監聽並同步 RTD 狀態
  useEffect(() => {
    if (!gameToken) return;
    
    // console.log('開始監聽 RTD 狀態，gameToken:', gameToken);
    isLoadingRTD.current = true;
    rtdInitialized.current = false;
    
    // 設定 10 秒超時計時器
    rtdTimeoutTimer.current = setTimeout(() => {
      if (!rtdInitialized.current) {
        // console.error('RTD 初始化超時：10 秒內未收到初始資料');
        setShowRTDTimeoutError(true);
        isLoadingRTD.current = false;
      }
    }, 10000);
    
    // 監聽遊戲狀態變化
    const unsubscribe = subscribeToGameState(gameToken, (rtdGameState) => {
      // console.log('遊戲狀態變化:', rtdGameState);
      if (rtdGameState) {
        // 從 RTD 取得狀態並更新本地狀態（不觸發再次同步到 RTD）
        setGamePlayState(rtdGameState);
        
        // 標記 RTD 初始資料已載入完成
        if (!rtdInitialized.current) {
          // console.log('RTD 初始資料載入完成');
          isLoadingRTD.current = false;
          rtdInitialized.current = true;
          
          // 清除超時計時器
          if (rtdTimeoutTimer.current) {
            clearTimeout(rtdTimeoutTimer.current);
            rtdTimeoutTimer.current = null;
          }
        }
      }
    });
    
    // 清理監聽器和計時器
    return () => {
      unsubscribe();
      if (rtdTimeoutTimer.current) {
        clearTimeout(rtdTimeoutTimer.current);
        rtdTimeoutTimer.current = null;
      }
    };
  }, [gameToken]);
  
  // RTD 超時錯誤處理
  const handleRTDTimeoutConfirm = useCallback(() => {
    setShowRTDTimeoutError(false);
    router.push('/');
  }, [router]);
  
  // 統一狀態更新函數
  const updateGameState = useCallback(async (updates: Partial<GamePlayState>) => {
    // 如果是連線模式且 RTD 初始資料尚未載入完成，則不執行更新
    if (gameToken && !rtdInitialized.current) {
      // console.log('RTD 初始資料尚未載入完成，跳過狀態更新:', updates);
      return;
    }
    
    // 先更新本地狀態
    setGamePlayState(prev => {
      const newState = { ...prev, ...updates };
      
      // 如果是連線對戰模式，同步到 RTD
      if (gameToken && rtdInitialized.current) {
        // console.log('同步遊戲狀態到 RTD:', updates);
        syncGameStateToRTD(gameToken, newState).catch(error => {
          // console.error('同步遊戲狀態到 RTD 失敗:', error);
        });
      }
      
      return newState;
    });
  }, [gameToken]);

  const selectChess = useCallback((row: number, col: number) => {
    if (remainSteps < 2) {
      return;
    }
    if (row === selectedChess?.row && col === selectedChess?.col) {
      updateGameState({ selectedChess: null });
      return;
    }
    updateGameState({ selectedChess: { row, col } });
  }, [selectedChess, remainSteps, updateGameState]);

  // 輔助函數：更新水平牆壁
  const updateHorizontalWall = useCallback((row: number, col: number, player: Player): Player[][] => {
    const newWalls = horizontalWalls.map(wallRow => [...wallRow]);
    newWalls[row][col] = player;
    return newWalls;
  }, [horizontalWalls]);
  
  // 輔助函數：更新垂直牆壁
  const updateVerticalWall = useCallback((row: number, col: number, player: Player): Player[][] => {
    const newWalls = verticalWalls.map(wallRow => [...wallRow]);
    newWalls[row][col] = player;
    return newWalls;
  }, [verticalWalls]);
  
  // 輔助函數：取得下一個玩家
  const getNextPlayer = useCallback((current: Player): Player => {
    const turnOrder: Player[] = playersNum === 2 
      ? [...playerTemplates.turnOrderTwo]
      : [...playerTemplates.turnOrderThree];
    
    const currentIndex = turnOrder.indexOf(current);
    const nextIndex = (currentIndex + 1) % turnOrder.length;
    return turnOrder[nextIndex];
  }, [playersNum]);
  
  // 輔助函數：移除水平牆壁
  const removeHorizontalWall = useCallback((row: number, col: number): Player[][] => {
    const newWalls = horizontalWalls.map(wallRow => [...wallRow]);
    newWalls[row][col] = null;
    return newWalls;
  }, [horizontalWalls]);
  
  // 輔助函數：移除垂直牆壁
  const removeVerticalWall = useCallback((row: number, col: number): Player[][] => {
    const newWalls = verticalWalls.map(wallRow => [...wallRow]);
    newWalls[row][col] = null;
    return newWalls;
  }, [verticalWalls]);
  
  // 輔助函數：減少玩家破牆次數
  const decreaseBreakWallCount = useCallback((player: Player) => {
    return {
      ...breakWallCountObj,
      [player as Exclude<Player, null>]: breakWallCountObj[player as Exclude<Player, null>] - 1
    };
  }, [breakWallCountObj]);

  const selectWall = useCallback((row: number, col: number, direction: Direction) => {
    const updates: Partial<GamePlayState> = {};
    
    // 根據方向更新對應的牆壁
    if (direction === 'top' || direction === 'bottom') {
      updates.horizontalWalls = updateHorizontalWall(row, col, currentPlayer);
    } else if (direction === 'left' || direction === 'right') {
      updates.verticalWalls = updateVerticalWall(row, col, currentPlayer);
    }

    // 切換到下一個玩家並重置狀態
    updates.currentPlayer = getNextPlayer(currentPlayer);
    updates.remainSteps = 2;
    updates.selectedChess = null;
    
    updateGameState(updates);
  }, [currentPlayer, updateHorizontalWall, updateVerticalWall, getNextPlayer, updateGameState]);

  const selectCell = useCallback((row: number, col: number) => {
    if (!selectedChess) return;
    
    const gap = remainSteps - (Math.abs((selectedChess.row) - row) + Math.abs((selectedChess.col) - col));
    const newBoard = board.map(boardRow => [...boardRow]);
    newBoard[selectedChess.row][selectedChess.col] = null;
    newBoard[row][col] = currentPlayer;
    
    updateGameState({
      selectedChess: { row, col },
      remainSteps: gap,
      board: newBoard
    });
  }, [selectedChess, currentPlayer, remainSteps, board, updateGameState]);

  const setChessPosition = useCallback((row: number, col: number) => {
    const newBoard = board.map(boardRow => [...boardRow]);
    newBoard[row][col] = currentPlayer;
    
    const newOpeningStep = [...openingStep];
    newOpeningStep.shift();
    
    updateGameState({
      board: newBoard,
      openingStep: newOpeningStep,
      currentPlayer: newOpeningStep[0] || 'A'
    });
  }, [currentPlayer, board, openingStep, updateGameState]);

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
      const updates: Partial<GamePlayState> = {
        breakWallCountObj: decreaseBreakWallCount(currentPlayer)
      };

      // 根據方向移除對應的牆壁
      if (direction === 'horizontal') {
        updates.horizontalWalls = removeHorizontalWall(row, col);
      } else if (direction === 'vertical') {
        updates.verticalWalls = removeVerticalWall(row, col);
      }
      
      updateGameState(updates);
    }
  }, [confirmBreakWall, decreaseBreakWallCount, removeHorizontalWall, removeVerticalWall, currentPlayer, isBreakWallAvailable, updateGameState]);

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

    if (playersNum === 3) {
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
  }, [board, size, calculateChessTerritory, playersNum]);

  /**
   * 當玩家改變時，重新計算地盤
   */
  useEffect(() => {
    if (isPlacingChess) {
      return
    }
    const calculatedTerritories: { A: string[][]; B: string[][]; C?: string[][] } = calculateAllTerritories();

    const newFlattenTerritoriesObj: Record<string, Player> = {};
    const newUniqTerritories: { A: string[]; B: string[]; C?: string[] } = {
      A: [],
      B: [],
      ...(playersNum >= 3 ? { C: [] } : {})
    };

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
      const calcArr = [numberOfA, numberOfB, ...(playersNum >= 3 ? [numberOfC] : [])];
      const maxNumber = max(calcArr);
      const minNumber = min(calcArr);
      if (maxNumber === minNumber) {
        // 平手
        updateGameState({ winingStatus: ['draw'] });
      } else {
        // 找出所有分數等於 maxNumber 的玩家
        const winners: Player[] = [];
        if (numberOfA === maxNumber) winners.push('A');
        if (numberOfB === maxNumber) winners.push('B');
        if (playersNum >= 3 && numberOfC === maxNumber) winners.push('C');
        updateGameState({ winingStatus: winners });
      }
      updateGameState({ isChampionModalOpen: true });
    }

    updateGameState({ 
      uniqTerritories: newUniqTerritories,
      flattenTerritoriesObj: newFlattenTerritoriesObj 
    });
    // setTerritories(calculatedTerritories);
  }, [currentPlayer, calculateAllTerritories, playersNum, isPlacingChess]);

  /**
   * 重新開始遊戲
   */
  const restartGame = useCallback(() => {
    let newGameState: Partial<GamePlayState> = {
      size: 7,
      currentPlayer: 'A' as Player,
      selectedChess: null,
      remainSteps: 2,
      winingStatus: [],
      isChampionModalOpen: false,
      flattenTerritoriesObj: {},
      breakWallCountObj: { A: 1, B: 1, C: 1 },
      uniqTerritories: { A: [], B: [], ...(playersNum >= 3 ? { C: [] } : {}) }
    };
    
    switch (playersNum) {
      case 2:
        newGameState = {
          ...newGameState,
          board: cloneDeep(playerTemplates.templateBoardTwo),
          verticalWalls: cloneDeep(playerTemplates.templateVerticalWalls),
          horizontalWalls: cloneDeep(playerTemplates.templateHorizontalWalls),
          openingStep: cloneDeep(playerTemplates.openingStepTwo)
        };
        break;
      case 3:
        newGameState = {
          ...newGameState,
          board: cloneDeep(playerTemplates.templateBoardThree),
          verticalWalls: cloneDeep(playerTemplates.templateVerticalWalls),
          horizontalWalls: cloneDeep(playerTemplates.templateHorizontalWalls),
          openingStep: cloneDeep(playerTemplates.openingStepThree)
        };
        break;
      default:
        break;
    }

    updateGameState(newGameState);
    trackButtonClick(`restart_local_game_${playersNum}p`);
  }, [playersNum, updateGameState]);

  /// 連線對戰的話，不用重新開始，直接載入 RTD 資料
  if (!gameToken) {
    useEffect(() => {
      restartGame();
    }, [restartGame]);
  }


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

  // 分享連線功能
  const handleShareGame = async () => {
    if (!isOnlineMode) return;
    
    try {
      const currentUrl = window.location.href;
      await navigator.clipboard.writeText(currentUrl);
    } catch (err) {
      // 備用方案：使用舊式複製方法
      const textArea = document.createElement('textarea');
      textArea.value = window.location.href;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
    } finally {
      setShowShareToast(true);
      if (shareToastTimeout.current) {
        clearTimeout(shareToastTimeout.current);
      }
      shareToastTimeout.current = setTimeout(() => {
        setShowShareToast(false);
        shareToastTimeout.current = null;
      }, 4000);
    }
  }
  return (
    <>
      {/* RTD 載入遮罩 */}
      {isLoadingRTD.current && (
        <div className="fixed inset-0 z-[999] flex items-center justify-center bg-black bg-opacity-50 backdrop-blur-sm">
          <div className="w-fit h-fit">
            <SectionShadow>
              <div className="relative flex flex-col items-center space-y-4 rounded-xl bg-white p-8 shadow-xl border-4 border-gray-900">
                <div className="h-12 w-12 animate-spin rounded-full border-4 border-gray-300 border-t-gray-900"></div>
                <p className="text-lg font-medium text-gray-700">正在載入遊戲資料...</p>
              </div>
            </SectionShadow>
          </div>
        </div>
      )}
      
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

       {/* 分享連線按鈕 - 只在連線模式顯示 */}
       {isOnlineMode && (
        <div className={`group fixed left-5 top-[calc(2.25rem+52px+1rem+52px)] cursor-pointer`}>
          <IconButton handleClickEvent={handleShareGame}>
            <MdShare />
          </IconButton>
        </div>
      )}
      {/* 分享成功提示 Toast */}
      <div className={`fixed top-2/3 left-1/2 transform -translate-x-1/2 z-[100] ${showShareToast ? 'opacity-100' : 'pointer-events-none  opacity-0'} transition-opacity duration-300`}>
        <SectionShadow>
          <div className="relative bg-white border-2 border-gray-900 px-8 py-4 rounded-xl shadow-2xl">
            <p className="font-bold text-xl tracking-wide">⚔️ 戰場連結已就緒！</p>
            <p className="font-medium animate-pulse">
                🔥 召喚你的對手，決戰時刻即將展開！ 🔥
            </p>
          </div>
        </SectionShadow>
      </div>

      {/* 賽況面板 */}
      <GameStatus isLock={isLock || isLoadingRTD.current} currentPlayer={currentPlayer} uniqTerritories={uniqTerritories} />

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
          isLock={isLock || isLoadingRTD.current}
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
        onClose={() => updateGameState({ isChampionModalOpen: false })}
        onRestart={restartGame}
      />

      {/* 破牆確認 Modal */}
      <BreakWallConfirmModal
        isOpen={isBreakWallModalOpen}
        onClose={handleBreakWallCancel}
        onCheck={handleBreakWallConfirm}
      />

      {/* RTD 超時錯誤彈窗 */}
      <div className={`fixed inset-0 z-50 flex w-full items-center justify-center px-4 ${showRTDTimeoutError ? 'opacity-100' : 'pointer-events-none opacity-0'} transition-opacity duration-300`}>
        <div className="fixed inset-0 bg-black/50"></div>
        <div className='max-w-md'>
          <SectionShadow>
            <div className={`relative w-full rounded-xl border-2 border-gray-900 bg-primary p-6 font-[family-name:var(--font-geist-sans)]`}>
              <div className="mb-4 flex items-center justify-start gap-2 text-2xl font-bold">
                <MdWarning className="text-2xl text-red-500" />戰場遺失
              </div>
              <div className="mb-6 leading-relaxed">
                不是你的對手跑路了，就是你在搞，不要亂打 token，給我回去重來！！！
              </div>
              <Button color='bg-primary-400' handleClickEvent={handleRTDTimeoutConfirm}>
                <span className="flex items-center gap-2"><MdPlayArrow className='text-2xl'/> 確定</span>
              </Button>
            </div>
          </SectionShadow>
        </div>
      </div>
    </>
  );
}
