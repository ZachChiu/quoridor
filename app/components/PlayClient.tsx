'use client'
import { useState, useEffect, useMemo, useCallback, useReducer, useRef } from "react";
import { GiHouse, GiRuleBook } from "react-icons/gi";
import Link from 'next/link';
import Chessboard from "@/components/Chessboard";
import ChampionModal from "@/components/ChampionModal";
import GameStatus from "@/components/GameStatus";
import GameTips from "@/components/GameTips";
import IconButton from "@/components/IconButton";
import WaitingRoom from "@/components/WaitingRoom";
import { useAiOpponent } from "@/hook/useAiOpponent";
import { playerKeys } from "@/game/territory";
import ShareLinkModal from "@/components/ShareLinkModal";
import BreakWallConfirmModal from "@/components/BreakWallConfirmModal";

import type { Direction } from "@/types/chessboard";

import { joinRoom, getRoom, subscribeRoom, updateGameState, setRoomWinner } from '@/utils/gameService';
import { useUser } from '@/contexts/UserContext';
import type { Room, RoomPlayer } from '@/types/room';

import { trackButtonClick } from "@/utils/analytics";
import { useRuleModal } from "@/contexts/RuleModalContext";
import { useTransition } from "@/contexts/TransitionContext";
import { useGame } from "@/contexts/GameContext";
import { useConfirm } from "@/hook/useConfirm";

import {
  BOARD_SIZE,
  createGame,
  isBreakWallAvailable as engineHasBreakWall,
  isPlacingPhase,
  movePiece,
  placeOpeningPiece,
  placeWall,
  breakWall,
  replay,
  selectPiece,
  toWgf,
  applyTurn,
} from "@/game/engine";
import { evaluate } from "@/game/score";
import type { GameState, PlayerKey, WallDir } from "@/game/types";
import type { Turn } from "@/game/engine";

type OnlinePhase = 'initializing' | 'waiting' | 'playing' | 'error';

interface PlayClientProps {
  roomId?: string;
}

/** Chessboard 的方向語彙 → engine 的牆方向。 */
const toWallDir = (direction: Direction): WallDir =>
  direction === 'top' || direction === 'bottom' ? 'H' : 'V';

type GameEvent =
  | { type: 'reset'; playersNum: 2 | 3 }
  | { type: 'replay'; wgf: string }
  | { type: 'select'; row: number; col: number }
  | { type: 'move'; row: number; col: number }
  | { type: 'placeOpening'; row: number; col: number }
  | { type: 'placeWall'; row: number; col: number; dir: WallDir }
  | { type: 'breakWall'; row: number; col: number; dir: WallDir }
  | { type: 'aiTurn'; turn: Turn };

/**
 * 以 reducer 串接 engine 的純函式。
 *
 * 用 reducer 而非 useState + closure 的理由：每次轉換都保證作用在最新狀態上。
 * 若從 render closure 讀取 state，同一幀內連續觸發的事件會互相覆蓋
 * （例如點擊事件冒泡導致同一次點擊觸發兩個處理器）。
 */
function gameReducer(state: GameState, event: GameEvent): GameState {
  switch (event.type) {
    case 'reset':
      return createGame(event.playersNum);
    case 'replay':
      return replay(event.wgf);
    case 'select':
      return selectPiece(state, event.row, event.col);
    case 'move':
      return movePiece(state, event.row, event.col);
    case 'placeOpening':
      return placeOpeningPiece(state, event.row, event.col);
    case 'placeWall':
      return placeWall(state, event.row, event.col, event.dir);
    case 'breakWall':
      return breakWall(state, event.row, event.col, event.dir);
    case 'aiTurn':
      // 一次轉換完成「選子 → 移動 → 築牆」。
      // 分三次 dispatch 會讓中間兩個狀態真的存在於 React 裡，而 AI 的 effect
      // 依賴 state —— 它會在同一個回合內被重新觸發、再問 Worker 一次，
      // 最後那次的回覆可能在回合已經交出去之後才套用，等於幫對手下了一手。
      return applyTurn(state, event.turn);
  }
}

export default function PlayClient({ roomId }: PlayClientProps) {
  const { gameState } = useGame();
  const { ensureUser } = useUser();
  const { navigate } = useTransition();
  const isOnline = !!roomId;

  // ─── 連線狀態（只在 online 模式使用）────────────────────────────────────────
  const [phase, setPhase] = useState<OnlinePhase>('initializing');
  const [room, setRoom] = useState<Room | null>(null);
  const [myPlayerKey, setMyPlayerKey] = useState<PlayerKey | null>(null);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [error, setError] = useState('');
  const initialized = useRef(false);

  const shareUrl =
    isOnline && typeof window !== 'undefined'
      ? `${window.location.origin}/match#roomId=${roomId}`
      : '';

  // ─── 遊戲狀態 ────────────────────────────────────────────────────────────────
  //
  // 全部規則邏輯都在 app/game/ 的純函式裡，這裡只持有一個不可變的 GameState。
  // 本機模式在掛載時就能從 GameContext 取得正確人數；連線模式的初值會立刻被
  // 來自 Firebase 的 WGF 重播覆蓋，因此初始人數用 2 即可。
  const [state, dispatch] = useReducer(
    gameReducer,
    isOnline ? 2 : ((gameState.playersNum === 3 ? 3 : 2) as 2 | 3),
    createGame
  );
  // 冠軍 Modal 的開啟與否完全由「是否已分出勝負」推導，只額外記錄使用者
  // 是否手動關閉過，避免用 effect 去同步一個本來就能算出來的狀態。
  const [championDismissed, setChampionDismissed] = useState(false);

  const playersNum = state.playersNum;
  const { territories, outcome } = useMemo(() => evaluate(state), [state]);
  const isLock = outcome.length > 0;
  const isPlacing = isPlacingPhase(state);
  const canBreakWall = engineHasBreakWall(state);

  // 避免自己寫入 Firebase 的內容又觸發自己重播
  const lastAppliedWgf = useRef<string>('');

  // ─── 單人對戰 ────────────────────────────────────────────────────────────────
  //
  // 難度由 GameContext 帶進來（首頁選的）。設定後，除了 A 以外都交給 AI。
  // 連線模式沒有 AI —— 那邊的對手是真人。
  const aiDifficulty = isOnline ? null : gameState.aiDifficulty;
  const aiPlayers = useMemo(
    () => (aiDifficulty ? playerKeys(playersNum).slice(1) : []),
    [aiDifficulty, playersNum]
  );
  const isAiTurn = aiPlayers.includes(state.currentPlayer);

  // 只有輪到我的時候才能操作（遊戲結束、或輪到 AI 時一律鎖定）
  const isMyTurn = useMemo(() => {
    if (isLock || isAiTurn) return false;
    if (!isOnline || !myPlayerKey) return true;
    return state.currentPlayer === myPlayerKey;
  }, [isLock, isAiTurn, isOnline, myPlayerKey, state.currentPlayer]);

  const { think, warmup: warmupAi } = useAiOpponent(
    useCallback((move) => {
      if (move.kind === 'opening') {
        dispatch({ type: 'placeOpening', row: move.cell.row, col: move.cell.col });
      } else {
        dispatch({ type: 'aiTurn', turn: move.turn });
      }
    }, [])
  );

  const wgf = useMemo(() => toWgf(state), [state]);

  // 進入單人模式時先預熱 Worker，第一次思考才不必等模組載入
  useEffect(() => {
    if (!aiDifficulty) return;
    warmupAi(wgf, aiDifficulty);
    // 只在進入 AI 模式時預熱一次，故意不依賴 wgf
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [aiDifficulty, warmupAi]);

  useEffect(() => {
    if (!isAiTurn || !aiDifficulty) return;
    think(wgf, aiDifficulty);
  }, [isAiTurn, aiDifficulty, wgf, think]);

  // ─── Firebase 初始化（online only）──────────────────────────────────────────
  useEffect(() => {
    if (!isOnline || initialized.current) return;
    initialized.current = true;
    // 這道旗標會在 cleanup 裡放掉 —— 見下方的說明。

    let unsubscribe: (() => void) | undefined;
    let cancelled = false;

    (async () => {
      try {
        // Firebase 的載入與匿名登入延後到這裡才觸發，
        // 因此本機對戰（無 roomId）完全不會下載 Firebase SDK。
        const uid = await ensureUser();
        if (cancelled) return;

        const existing = await getRoom(roomId!);
        if (cancelled) return;
        if (!existing) {
          setError('不存在的對局');
          setPhase('error');
          return;
        }

        const slots = (['A', 'B', 'C'] as const).slice(0, existing.playersNum);
        const myExistingKey = slots.find(s => existing.players[s]?.uid === uid);

        let assignedKey: PlayerKey;

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
            uid,
            displayName: `玩家 ${uid.slice(0, 4).toUpperCase()}`,
            joinedAt: Date.now(),
          };
          await joinRoom(roomId!, next, player);
          assignedKey = next;
        }

        setMyPlayerKey(assignedKey);

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

        if (assignedKey === 'A') setShareModalOpen(true);
      } catch (e) {
        console.error(e);
        setError('連線失敗，請重新整理後再試');
        setPhase('error');
      }
    })();

    return () => {
      cancelled = true;
      /*
        必須把旗標放掉。

        dev 的 StrictMode 會刻意讓 effect 跑「掛載 → 卸載 → 再掛載」。
        第一次掛載把 initialized 設成 true，卸載後第二次掛載就被自己的
        守衛擋掉 —— 於是連線初始化永遠不會執行，畫面卡在「正在連線…」。

        production build 沒有這個雙呼叫，所以只有 npm run dev 會卡住，
        只測 build 產物完全看不到。這個旗標本來是防「deps 變動時重複初始化」，
        放掉它不影響那件事：真的重新初始化時本來就該重跑。
      */
      initialized.current = false;
      unsubscribe?.();
    };
  }, [isOnline, roomId, ensureUser]);

  // 讀路徑：Firebase 上的 WGF 有變且非自己寫入的，就從空棋盤完整重建
  useEffect(() => {
    if (!isOnline || !room?.wgf || room.wgf === lastAppliedWgf.current) return;
    lastAppliedWgf.current = room.wgf;
    dispatch({ type: 'replay', wgf: room.wgf });
  }, [room?.wgf, isOnline]);

  // 寫路徑：棋譜有變就同步。
  //
  // 由狀態推導而非在每個操作裡手動標記 —— 只有「開局放棋」與「結束回合」
  // 會改變 WGF，選取與移動不會，因此不必逐一判斷哪些操作需要同步。
  // lastAppliedWgf 同時擋掉自己寫入所觸發的重播（echo）。
  useEffect(() => {
    if (!isOnline || !roomId) return;
    const wgf = toWgf(state);
    if (wgf === lastAppliedWgf.current) return;
    lastAppliedWgf.current = wgf;
    updateGameState(roomId, wgf, state.currentPlayer);
  }, [state, isOnline, roomId]);

  // 遊戲結束時，由房主（A）負責寫入勝者資訊
  useEffect(() => {
    if (!isOnline || !roomId || myPlayerKey !== 'A' || outcome.length === 0) return;
    setRoomWinner(roomId, outcome);
  }, [isOnline, roomId, myPlayerKey, outcome]);

  // ─── 操作 ────────────────────────────────────────────────────────────────────

  const selectChess = useCallback((row: number, col: number) => {
    if (!isMyTurn) return;
    dispatch({ type: 'select', row, col });
  }, [isMyTurn]);

  const selectCell = useCallback((row: number, col: number) => {
    if (!isMyTurn) return;
    dispatch({ type: 'move', row, col });
  }, [isMyTurn]);

  const selectWall = useCallback((row: number, col: number, direction: Direction) => {
    if (!isMyTurn) return;
    dispatch({ type: 'placeWall', row, col, dir: toWallDir(direction) });
  }, [isMyTurn]);

  const setChessPosition = useCallback((row: number, col: number) => {
    if (!isMyTurn) return;
    dispatch({ type: 'placeOpening', row, col });
  }, [isMyTurn]);

  const {
    isOpen: isBreakWallModalOpen,
    confirm: confirmBreakWall,
    handleConfirm: handleBreakWallConfirm,
    handleCancel: handleBreakWallCancel,
  } = useConfirm();

  const onClickBreakWall = useCallback(async (
    row: number,
    col: number,
    direction: 'horizontal' | 'vertical'
  ) => {
    if (!isMyTurn || !canBreakWall) return;
    const ok = await confirmBreakWall();
    if (!ok) return;
    // 破牆不結束回合，故不改變 WGF；會併入本回合、於蓋牆時一併送出
    dispatch({ type: 'breakWall', row, col, dir: direction === 'horizontal' ? 'H' : 'V' });
  }, [isMyTurn, canBreakWall, confirmBreakWall]);

  const restartGame = useCallback(() => {
    dispatch({ type: 'reset', playersNum });
    setChampionDismissed(false);
    trackButtonClick(`restart_local_game_${playersNum}p`);
  }, [playersNum]);

  // 當用戶嘗試離開頁面且遊戲尚未結束時顯示確認對話框
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (!isLock) e.preventDefault();
    };
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isLock]);

  const { ruleModalState, setRuleModalState } = useRuleModal();
  const handleRuleBtnOpen = () => setRuleModalState({ ...ruleModalState, isOpen: true });

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
      {/* 左上角的操作鈕。用 flex 直排而不是各自寫死 top 值 ——
          之前兩顆的尺寸不同，間距是按舊尺寸算出來的，改一顆就會對不齊。

          用中性的紙色（與棋盤格同一個值），不用琥珀／森綠：對局畫面上
          已經有兩到三個玩家色在跑，操作鈕再各帶一個色相就是五個色相同時
          在搶注意力。它們是「離開這一局」的出口，本來就不該比盤面搶眼。
          也不用深墨 —— 那在奶油底上太重。 */}
      <div className="fixed left-5 top-5 z-50 flex flex-col gap-3">
        <button
          type="button"
          aria-label="回首頁"
          onClick={(e) => {
            // 圓從這顆鈕的中心擴散出去 —— 它本身就是圓的，起點天生吻合。
            //
            // 顏色就用這顆鈕自己的紙色：等於整顆鈕直接擴張成畫面，
            // 而且終點是首頁的奶油底，色調連得上。試過深墨，整片黑太重 ——
            // 進場的顏色代表「你選了什麼」，離場不該比進場還搶戲。
            const r = e.currentTarget.getBoundingClientRect();
            navigate('/', {
              wipe: {
                x: r.left + r.width / 2,
                y: r.top + r.height / 2,
                color: 'rgb(var(--tile-cream))',
              },
            });
          }}
          className="rounded-full bg-primary-50 p-3.5 text-2xl text-tile-ink transition hover:brightness-95 active:scale-95">
          <GiHouse />
        </button>
        <IconButton color="bg-primary-50 text-tile-ink" handleClickEvent={handleRuleBtnOpen} label="遊玩方式">
          <GiRuleBook />
        </IconButton>
      </div>

      {/* 連線模式：等待畫面 */}
      {isOnline && phase === 'waiting' && (
        <WaitingRoom
          joinedCount={joinedCount}
          totalCount={totalCount}
          onShare={() => setShareModalOpen(true)}
        />
      )}

      {/* 棋盤（本地模式 or 連線模式已開始）*/}
      {(!isOnline || phase === 'playing') && (
        <>
          <GameStatus
            isLock={isLock}
            currentPlayer={state.currentPlayer}
            uniqTerritories={territories.owned}
            playersNum={playersNum}
          />

          <GameTips
            isPlacingChess={isPlacing}
            currentPlayer={state.currentPlayer}
            winingStatus={outcome}
            breakWallCountObj={state.breakWallCount}
            aiThinking={isAiTurn}
          />

          <div className="chessboard-container size-[90dvw] md:size-[90dvh] md:portrait:size-[90dvw] md:landscape:size-[90dvh]">
            <Chessboard
              size={BOARD_SIZE}
              board={state.board}
              verticalWalls={state.verticalWalls}
              horizontalWalls={state.horizontalWalls}
              currentPlayer={state.currentPlayer}
              selectedChess={state.selected}
              remainSteps={state.remainSteps}
              flattenTerritoriesObj={territories.ownerByCell}
              breakWallCountObj={state.breakWallCount}
              isBreakWallAvailable={canBreakWall}
              isLock={isLock}
              isPlacingChess={isPlacing && isMyTurn}
              selectChess={selectChess}
              selectWall={selectWall}
              selectCell={selectCell}
              setChessPosition={setChessPosition}
              onClickBreakWall={onClickBreakWall}
            />
          </div>

          <ChampionModal
            winners={outcome}
            uniqTerritories={territories.owned}
            isOpen={isLock && !championDismissed}
            onClose={() => setChampionDismissed(true)}
            onRestart={isOnline ? undefined : restartGame}
          />

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
