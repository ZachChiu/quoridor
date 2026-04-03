'use client'
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import Link from 'next/link';
import Chessboard from "@/components/Chessboard";
import SectionShadow from "@/components/SectionShadow";
import ChampionModal from "@/components/ChampionModal";
import GameStatus from "@/components/GameStatus";
import GameTips from "@/components/GameTips";
import IconButton from "@/components/IconButton";
import ShareLinkModal from "@/components/ShareLinkModal";

import type { Player, Direction } from "@/types/chessboard.ts";
import flatten from 'lodash-es/flatten';
import uniq from 'lodash-es/uniq';
import cloneDeep from 'lodash-es/cloneDeep';
import max from 'lodash-es/max';
import min from 'lodash-es/min';

import { signInAnonymously } from 'firebase/auth';
import { auth } from '@/utils/firebase';
import { joinRoom, getRoom, subscribeRoom } from '@/utils/gameService';
import type { Room, RoomPlayer } from '@/types/room';

import { trackButtonClick } from "@/utils/analytics";
import { buildPieceIndex, getPieceNumber, updatePieceIndex, serializeWGF } from "@/utils/wgf";
import type { GameAction, PieceIndex, PiecePlacement } from "@/types/wgf";
import { MdHome, MdOutlineQuestionMark } from "react-icons/md";
import { useRuleModal } from "@/contexts/RuleModalContext";
import { useGame } from "@/contexts/GameContext";
import playerTemplates from "@/config/playerTemplates";
import BreakWallConfirmModal from "@/components/BreakWallConfirmModal";
import { useConfirm } from "@/hook/useConfirm";

type OnlinePhase = 'initializing' | 'waiting' | 'playing' | 'error';

interface PlayClientProps {
  roomId?: string;
}

export default function PlayClient({ roomId }: PlayClientProps) {
  const { gameState } = useGame();
  const isOnline = !!roomId;

  // ─── 連線狀態（只在 online 模式使用）────────────────────────────────────────
  const [phase, setPhase] = useState<OnlinePhase>('initializing');
  const [room, setRoom] = useState<Room | null>(null);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [error, setError] = useState('');
  const initialized = useRef(false);

  const shareUrl =
    isOnline && typeof window !== 'undefined'
      ? `${window.location.origin}/match?roomId=${roomId}`
      : '';

  const playersNum = isOnline ? (room?.playersNum ?? 2) : gameState.playersNum;

  // ─── Firebase 初始化（online only）──────────────────────────────────────────
  useEffect(() => {
    if (!isOnline || initialized.current) return;
    initialized.current = true;

    let unsubscribe: (() => void) | undefined;

    (async () => {
      try {
        const { user } = await signInAnonymously(auth);

        const existing = await getRoom(roomId!);
        if (!existing) {
          setError('不存在的對局');
          setPhase('error');
          return;
        }

        const slots = (['A', 'B', 'C'] as const).slice(0, existing.playersNum);
        const myExistingKey = slots.find(s => existing.players[s]?.uid === user.uid);

        let assignedKey: 'A' | 'B' | 'C';

        if (myExistingKey) {
          assignedKey = myExistingKey;
        } else {
          const next = slots.find(s => !existing.players[s]);
          if (!next) {
            setError('房間已滿，無法加入');
            setPhase('error');
            return;
          }
          const player: RoomPlayer = {
            uid: user.uid,
            displayName: `玩家 ${user.uid.slice(0, 4).toUpperCase()}`,
            joinedAt: Date.now(),
          };
          await joinRoom(roomId!, next, player);
          assignedKey = next;
        }

        // TODO: setMyPlayerKey(assignedKey) — wire up during firebase integration

        unsubscribe = subscribeRoom(roomId!, (updated) => {
          if (!updated) return;
          setRoom(updated);
          const joined = Object.keys(updated.players).length;
          if (joined >= updated.playersNum) {
            setPhase('playing');
            setShareModalOpen(false);
          } else {
            setPhase('waiting');
          }
        });

        if (assignedKey === 'A') {
          setShareModalOpen(true);
        }
      } catch (e) {
        console.error(e);
        setError('連線失敗，請重新整理後再試');
        setPhase('error');
      }
    })();

    return () => {
      unsubscribe?.();
    };
  }, [isOnline, roomId]);

  // ─── 棋盤狀態 ────────────────────────────────────────────────────────────────
  const [size, setSize] = useState(0);
  const [board, setBoard] = useState<Player[][]>(playerTemplates.templateBoardTwo);
  const [currentPlayer, setCurrentPlayer] = useState<Player>('A');
  const [verticalWalls, setVerticalWalls] = useState<Player[][]>(playerTemplates.templateVerticalWalls);
  const [horizontalWalls, setHorizontalWalls] = useState<Player[][]>(playerTemplates.templateHorizontalWalls);
  const [selectedChess, setSelectedChess] = useState<{ row: number; col: number } | null>(null);
  const [remainSteps, setRemainSteps] = useState(2);
  const [uniqTerritories, setUniqTerritories] = useState<{ A: string[]; B: string[]; C?: string[] }>({
    A: [],
    B: []
  });
  const [flattenTerritoriesObj, setFlattenTerritoriesObj] = useState<Record<string, Player>>({});
  const [winingStatus, setWiningStatus] = useState<(Player | 'draw')[]>([]);
  const [openingStep, setOpeningStep] = useState<Player[]>([]);
  const [isChampionModalOpen, setIsChampionModalOpen] = useState(false);
  const isPlacingChess = useMemo(() => !!openingStep.length, [openingStep])
  const isLock = useMemo(() => !!winingStatus.length, [winingStatus]);
  const [breakWallCountObj, setBreakWallCountObj] = useState({ A: 1, B: 1, C: 1 });
  const isBreakWallAvailable = useMemo(() => playersNum > 2, [playersNum]);

  // WGF 棋譜記錄
  const [pieceIndex, setPieceIndex] = useState<PieceIndex>({ A: [], B: [], C: [] });
  const [wgfInitPositions, setWgfInitPositions] = useState<PiecePlacement[]>([]);
  const [openingPlacements, setOpeningPlacements] = useState<PiecePlacement[]>([]);
  const [gameTurns, setGameTurns] = useState<GameAction[][]>([]);
  const [currentTurnActions, setCurrentTurnActions] = useState<GameAction[]>([]);

  useEffect(() => {
    if (gameTurns.length === 0) return;
    console.log('[WGF]', serializeWGF({
      playersNum: playersNum as 2 | 3,
      initPositions: wgfInitPositions,
      openingPlacements,
      turns: gameTurns,
    }));
  }, [gameTurns, playersNum, wgfInitPositions, openingPlacements]);

  const selectChess = useCallback((row: number, col: number) => {
    if (remainSteps < 2) return;
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
    switch (playersNum) {
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

    if (currentPlayer) {
      const wallDir = (direction === 'top' || direction === 'bottom') ? 'H' : 'V';
      const wallAction: GameAction = { type: 'placeWall', player: currentPlayer, piece: 0, dir: wallDir, row, col };
      const completedTurn = [...currentTurnActions, wallAction];
      setGameTurns(prev => [...prev, completedTurn]);
      setCurrentTurnActions([]);
    }

    setCurrentPlayer(newCurrentPlayer);
    setRemainSteps(2);
    setSelectedChess(null);
  }, [currentPlayer, currentTurnActions, setHorizontalWalls, setVerticalWalls, playersNum]);

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

    if (currentPlayer) {
      const piece = getPieceNumber(pieceIndex, currentPlayer, selectedChess.row, selectedChess.col);
      setCurrentTurnActions(prev => [...prev, { type: 'move', player: currentPlayer, piece, row, col }]);
      setPieceIndex(prev => updatePieceIndex(prev, currentPlayer, selectedChess.row, selectedChess.col, row, col));
    }
  }, [selectedChess, currentPlayer, remainSteps, pieceIndex, setSelectedChess, setBoard]);

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

    if (currentPlayer) {
      const piece = pieceIndex[currentPlayer].length + 1;
      setOpeningPlacements(prev => [...prev, { player: currentPlayer, piece, row, col }]);
      setPieceIndex(prev => ({ ...prev, [currentPlayer]: [...prev[currentPlayer], { row, col }] }));
    }
  }, [currentPlayer, setBoard, openingStep, setCurrentPlayer, pieceIndex]);

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

      if (currentPlayer) {
        const breakDir = direction === 'horizontal' ? 'H' : 'V';
        setCurrentTurnActions(prev => [...prev, { type: 'breakWall', player: currentPlayer, piece: 0, dir: breakDir, row, col }]);
      }
    }
  }, [confirmBreakWall, setBreakWallCountObj, setVerticalWalls, setHorizontalWalls, currentPlayer, isBreakWallAvailable]);

  const getTerritories = useCallback((
    rowIndex: number,
    colIndex: number,
    player: Player,
    maxSteps: number = 50
  ): { moves: string[], hasEnemy: boolean } => {
    const queue: { row: number, col: number, steps: number }[] = [{ row: rowIndex, col: colIndex, steps: 0 }];
    const visited = new Set<string>();
    const moves: string[] = [];
    let hasEnemy = false;

    const startPosKey = `${rowIndex},${colIndex}`;
    moves.push(startPosKey);
    visited.add(startPosKey);

    while (queue.length > 0) {
      const { row, col, steps } = queue.shift()!;

      if (steps >= maxSteps) continue;

      const directions = [
        { dr: -1, dc: 0 },
        { dr: 0, dc: 1 },
        { dr: 1, dc: 0 },
        { dr: 0, dc: -1 }
      ];

      for (const { dr, dc } of directions) {
        const r1 = row + dr;
        const c1 = col + dc;

        if (r1 >= 0 && r1 < size && c1 >= 0 && c1 < size) {
          let hasWall = false;

          if (dr === 1 && horizontalWalls[row][col]) {
            hasWall = true;
          } else if (dr === -1 && row > 0 && horizontalWalls[row - 1][col]) {
            hasWall = true;
          }

          if (dc === 1 && verticalWalls[row][col]) {
            hasWall = true;
          } else if (dc === -1 && col > 0 && verticalWalls[row][col - 1]) {
            hasWall = true;
          }

          if (!hasWall) {
            const posKey = `${r1},${c1}`;

            if (!visited.has(posKey)) {
              visited.add(posKey);

              const cellPlayer = board[r1][c1];

              if (cellPlayer === null) {
                moves.push(posKey);
                queue.push({ row: r1, col: c1, steps: steps + 1 });
              } else if (cellPlayer === player) {
                moves.push(posKey);
                queue.push({ row: r1, col: c1, steps: steps + 1 });
              } else {
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

  const calculateChessTerritory = useCallback((
    chessRow: number,
    chessCol: number,
    player: Player
  ): string[] => {
    if (player === null || !board.length) return [];

    const { moves, hasEnemy } = getTerritories(chessRow, chessCol, player);

    if (hasEnemy) return [];

    return moves;
  }, [board, getTerritories]);

  const calculateAllTerritories = useCallback((): { A: string[][], B: string[][], C?: string[][] } => {
    const territories: { A: string[][]; B: string[][]; C?: string[][] } = {
      A: [] as string[][],
      B: [] as string[][],
    };

    if (playersNum === 3) {
      territories.C = [] as string[][];
    }

    for (let row = 0; row < size; row++) {
      for (let col = 0; col < size; col++) {
        const player = board[row][col];
        if (player) {
          const territory = calculateChessTerritory(row, col, player);
          territories[player]?.push(territory);
        }
      }
    }

    return territories;
  }, [board, size, calculateChessTerritory, playersNum]);

  useEffect(() => {
    if (isPlacingChess) return;

    const calculatedTerritories = calculateAllTerritories();

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
        setWiningStatus(['draw']);
      } else {
        const winners: Player[] = [];
        if (numberOfA === maxNumber) winners.push('A');
        if (numberOfB === maxNumber) winners.push('B');
        if (playersNum >= 3 && numberOfC === maxNumber) winners.push('C');
        setWiningStatus(winners);
      }
      setIsChampionModalOpen(true);
    }

    setUniqTerritories(newUniqTerritories);
    setFlattenTerritoriesObj(newFlattenTerritoriesObj);
  }, [currentPlayer, calculateAllTerritories, playersNum, isPlacingChess]);

  const restartGame = useCallback(() => {
    switch (playersNum) {
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
    trackButtonClick(`restart_local_game_${playersNum}p`);
    setFlattenTerritoriesObj({});
    setBreakWallCountObj({ A: 1, B: 1, C: 1 });
    setUniqTerritories({ A: [], B: [], ...(playersNum >= 3 ? { C: [] } : {}) });
    setFlattenTerritoriesObj({});

    if (playersNum === 3) {
      setPieceIndex({ A: [], B: [], C: [] });
      setWgfInitPositions([]);
    } else {
      const index = buildPieceIndex(playerTemplates.templateBoardTwo);
      setPieceIndex(index);
      const initPos: PiecePlacement[] = (['A', 'B', 'C'] as const).flatMap(p =>
        index[p].map(({ row, col }, i) => ({ player: p, piece: i + 1, row, col }))
      );
      setWgfInitPositions(initPos);
    }
    setOpeningPlacements([]);
    setGameTurns([]);
    setCurrentTurnActions([]);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    restartGame();
  }, [restartGame]);

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
    setRuleModalState({ ...ruleModalState, isOpen: true });
  }

  // ─── 連線模式：初始化中 / 錯誤 ─────────────────────────────────────────────
  if (isOnline && phase === 'initializing') {
    return (
      <div className="flex items-center gap-3 text-lg">
        <div className="size-4 animate-spin rounded-full border-2 border-gray-900 border-t-transparent"></div>
        正在連線…
      </div>
    );
  }

  if (isOnline && phase === 'error') {
    return (
      <div className="flex flex-col items-center gap-6">
        <p className="text-lg text-red-500">{error}</p>
        <Link href="/" className="underline hover:opacity-70">返回首頁</Link>
      </div>
    );
  }

  const joinedCount = Object.keys(room?.players ?? {}).length;
  const totalCount = room?.playersNum ?? 2;

  return (
    <>
      {/* 首頁按鈕 */}
      <Link className="group fixed left-5 top-5 cursor-pointer" href="/">
        <SectionShadow roundedFull className='size-auto'>
          <div className="relative z-50 block rounded-full border-4 border-gray-900 bg-white p-3 text-xl group-hover:-translate-x-0.5 group-hover:-translate-y-0.5 group-active:translate-x-1 group-active:translate-y-1">
            <MdHome />
          </div>
        </SectionShadow>
      </Link>
      <div className="group fixed left-5 top-[calc(2.25rem+52px)] cursor-pointer">
        <IconButton handleClickEvent={() => handleRuleBtnOpen()}>
          <MdOutlineQuestionMark />
        </IconButton>
      </div>

      {/* 連線模式：等待畫面 */}
      {isOnline && phase === 'waiting' && (
        <div className="flex flex-col items-center gap-6">
          <div className="flex items-center gap-3 text-lg">
            <div className="size-4 animate-spin rounded-full border-2 border-gray-900 border-t-transparent"></div>
            等待其他玩家加入…
          </div>
          <p className="text-sm text-gray-500">
            {joinedCount} / {totalCount} 玩家已加入
          </p>
          <SectionShadow>
            <button
              onClick={() => setShareModalOpen(true)}
              className="relative z-10 flex items-center gap-2 rounded-xl border-4 border-gray-900 bg-white px-6 py-3 font-bold transition-transform hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-1 active:translate-y-1"
            >
              分享邀請連結
            </button>
          </SectionShadow>
        </div>
      )}

      {/* 棋盤（本地模式 or 連線模式已開始）*/}
      {(!isOnline || phase === 'playing') && (
        <>
          {/* 賽況面板 */}
          <GameStatus isLock={isLock} currentPlayer={currentPlayer} uniqTerritories={uniqTerritories} />

          {/* 提示面板 */}
          <GameTips isPlacingChess={isPlacingChess} currentPlayer={currentPlayer} winingStatus={winingStatus} breakWallCountObj={breakWallCountObj} />

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
            />
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
      )}

      {/* 連線模式：分享連結 Modal */}
      {isOnline && (
        <ShareLinkModal
          isOpen={shareModalOpen}
          shareUrl={shareUrl}
          joinedCount={joinedCount}
          totalCount={totalCount}
          onClose={() => setShareModalOpen(false)}
        />
      )}
    </>
  );
}
