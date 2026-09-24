'use client'
import { useState, useEffect, useMemo, useCallback, useReducer, useRef } from "react";
// 小圓鈕與首頁磁磚用同一套圖示（game-icons 實心）——
// 同一件事在兩個地方長得不一樣，會讓人以為那是兩個不同的東西。
import { GiHut, GiRuleBook } from "react-icons/gi";
import { LuFlag } from "react-icons/lu";
import Link from 'next/link';
import Chessboard from "@/components/Chessboard";
import ChampionModal from "@/components/ChampionModal";
import GameStatus from "@/components/GameStatus";
import GameTips from "@/components/GameTips";
import IconButton from "@/components/IconButton";
import WaitingRoom from "@/components/WaitingRoom";
import { useAiOpponent } from "@/hook/useAiOpponent";
import { playerKeys } from "@/game/territory";
import { playerVar } from "@/config/players";
import { shouldPushWgf } from "@/utils/wgfSync";
import TurnGuide from "@/components/TurnGuide";
import { canPlaceWallNow, hasStarted, legalBreaks, legalMoves, selectablePieces } from "@/game/engine";
import type { Difficulty } from "@/game/ai";
import ShareLinkModal from "@/components/ShareLinkModal";
import FeedbackModal from "@/components/FeedbackModal";
import BreakWallConfirmModal from "@/components/BreakWallConfirmModal";
import SurrenderConfirmModal from "@/components/SurrenderConfirmModal";

import type { Direction } from "@/types/chessboard";

import { joinRoom, getRoom, subscribeRoom, updateGameState, setRoomWinner, sendFeedback } from '@/utils/gameService';
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
  applyTurn, cancelTurn,
  } from "@/game/engine";
import { evaluate, getWinners, type Outcome } from "@/game/score";
import type { GameState, PlayerKey, WallDir } from "@/game/types";
import type { Turn } from "@/game/engine";
import { useGameText, useLocale } from '@/i18n/LocaleProvider';
import { localePath } from '@/i18n/locales';
import { roomShareUrl } from '@/utils/gameMode';
import { fmt } from '@/i18n/content/game';

type OnlinePhase = 'initializing' | 'waiting' | 'playing' | 'error';

interface PlayClientProps {
  roomId?: string;
  /**
   * 本機對戰的人數，由路由給（`/local/3`）。
   *
   * 不從 GameContext 讀：那個值只活在 React state，重整就沒了，
   * 而且伺服器端不知道 —— 靜態 HTML 會先畫一次兩人盤，等 hydration
   * 之後才跳成三人。路由帶著的話，建置時就定了。
   */
  playersNum?: 2 | 3;
  /**
   * 單人對戰的難度。只有 /solo 會給。
   *
   * 不從 GameContext 讀：那個值在玩過單人之後會一直留著，
   * 而只有首頁的本機按鈕會清掉它 —— 從上一頁或連結直接進 /local，
   * 殘留的難度會把 B（三人局連 C）交給 AI，本機對戰就變成了單人。
   */
  aiDifficulty?: Difficulty | null;
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
  | { type: 'cancelTurn' }
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
    // 取消進行中的回合，回到回合開始時的盤面（手機方向盤的「重來」）
    case 'cancelTurn':
      return cancelTurn(state);
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

export default function PlayClient({ roomId, playersNum: routePlayers, aiDifficulty: soloDifficulty }: PlayClientProps) {
  const { gameState } = useGame();
  const { ensureUser } = useUser();
  const { navigate, flash } = useTransition();
  const isOnline = !!roomId;

  // ─── 連線狀態（只在 online 模式使用）────────────────────────────────────────
  const [phase, setPhase] = useState<OnlinePhase>('initializing');
  // 房間坐滿只會發生一次 —— 用 ref 而不是比對 phase，subscribe 的 callback
  // 是在 effect 裡建立的，closure 裡的 phase 永遠是掛載當下那個值。
  const startedRef = useRef(false);
  const [room, setRoom] = useState<Room | null>(null);
  const [myPlayerKey, setMyPlayerKey] = useState<PlayerKey | null>(null);
  const [shareModalOpen, setShareModalOpen] = useState(false);
  const [error, setError] = useState('');
  const initialized = useRef(false);

  // 邀請連結留在邀請者自己的語系（理由見 roomShareUrl）
  const locale = useLocale();
  const shareUrl =
    isOnline && typeof window !== 'undefined'
      ? roomShareUrl(window.location.origin, locale, roomId!)
      : '';

  // ─── 遊戲狀態 ────────────────────────────────────────────────────────────────
  //
  // 全部規則邏輯都在 app/game/ 的純函式裡，這裡只持有一個不可變的 GameState。
  //
  // 人數優先吃路由給的值（`/local/3`）—— 那是伺服器端就知道的，
  // 第一幀畫出來就是對的。單人模式沒有路由參數，退回 GameContext。
  // 連線模式的初值會立刻被來自 Firebase 的 WGF 重播覆蓋，用 2 即可。
  const [state, dispatch] = useReducer(
    gameReducer,
    isOnline ? 2 : (routePlayers ?? ((gameState.playersNum === 3 ? 3 : 2) as 2 | 3)),
    createGame
  );
  // 冠軍 Modal 的開啟與否完全由「是否已分出勝負」推導，只額外記錄使用者
  // 是否手動關閉過，避免用 effect 去同步一個本來就能算出來的狀態。
  const [championDismissed, setChampionDismissed] = useState(false);
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  // 控制盤的破牆模式。指引在畫面上方、開關在下方的控制盤裡，
  // 所以狀態放在共同的父層。

  const playersNum = state.playersNum;
  const { territories, scores, outcome: naturalOutcome } = useMemo(() => evaluate(state), [state]);

  /*
    投降結算。

    刻意**不**寫進 GameState：棋譜（WGF）記的是「下了什麼」，
    投降不是一手棋，塞進去會讓 replay 的語意變成兩種東西。
    盤面本身仍然完全由棋譜決定，這裡只是提前停止。

    分數照常由 evaluate 算出來的 scores 判勝負 —— 「投降」在這個
    遊戲裡的意思是「就此收手、照現況算分」，不是「直接判對手贏」。

    連線模式：投降的人把結果寫進 Firebase，對手從 room.winners 收到。
    這是唯一不能從棋譜推導的結束方式，所以非寫不可。
  */
  const [resigned, setResigned] = useState(false);
  const [surrenderOpen, setSurrenderOpen] = useState(false);
  const remoteWinners = isOnline ? room?.winners : undefined;

  const outcome = useMemo<Outcome>(() => {
    if (naturalOutcome.length) return naturalOutcome;
    if (remoteWinners?.length) return remoteWinners;
    if (resigned) return getWinners(scores, state.playersNum, territories.regionSizes);
    return [];
  }, [naturalOutcome, remoteWinners, resigned, scores, state.playersNum, territories.regionSizes]);

  const isLock = outcome.length > 0;
  const isPlacing = isPlacingPhase(state);

  const g = useGameText();

  /*
    ── 版面靠 CSS 斷點分岔，不靠 JS ────────────────────────────────
    「有沒有控制盤」＝「是不是手指裝置」，而那是 coarse / coarse-land
    這兩個斷點的事（見 tailwind.config.ts）。先前是用 useCoarsePointer()
    在 render 時決定，但靜態匯出的 HTML 不知道裝置是什麼 —— 那個值在
    hydration 之前一律是 false，於是手機一重整就先畫一次桌機版面、
    再整個跳成手機版。CSS 沒有「之前」，第一幀就是對的。

    唯一還交給 JS 的是 isLock：牌局結束控制盤會收起來，版面要跟著回到
    沒有控制盤的排法。那是玩出來的狀態，不會在載入時閃。
  */
  const padGone = isLock;

  /*
    左上那兩顆鈕的排法。只有手機橫躺時改直排 —— 那時上方只剩約 390px
    高，而左側正好是棋盤讓出來的空白，直排剛好站在那裡；橫排則會和
    右上的比分在同一列上對衝。直式與桌機都是橫排，上方本來就空著。
  */
  const topButtons = padGone ? '' : 'coarse-land:flex-col';

  /*
    棋盤佔多大、擺在哪。

    這段寫在 JSX 外面，不是圖方便 —— 字型子集的掃描器一碰到反引號就
    整段當成字串，寫在模板字串裡的註解會被當成「頁面用得到的字」算進
    子集，白白把只有原始碼看得到的字塞進字型檔。

    ── 讓位的方式：padding，不是 margin ────────────────────────────
    控制盤是 fixed，脫離文件流，所以沒有東西「推」得動。
    先前的寫法是給棋盤一個等於控制盤高度的 margin-bottom，硬把它從
    視窗正中央拉上來 —— 那是在用位移模擬擠壓，兩個數字（盤面大小與
    位移量）各自算各自的，改一個就得記得改另一個。

    改成讓**內容區自己變小**：外層拿 padding 把控制盤那一塊讓出來，
    棋盤就在剩下的框裡正常對齊，位移量是 0。

    ── 對齊 ───────────────────────────────────────────────────────
    直式靠下：留白全部集中到上方，那裡本來就要放按鈕與比分。
    下邊距 = 控制盤高 + 5rem。那 5rem 裡放步驟標（26px），上下各留 27px ——
    棋盤下緣、步驟標、控制盤上緣線三者等距。提示句是絕對定位浮在步驟標
    上方的，不佔這條流，所以有沒有它都不會改變這個距離。
    橫式靠右：貼著控制盤，左下那塊空地讓給比分。

    ── 為什麼 coarse 要能蓋掉 md ──────────────────────────────────
    橫躺的手機（例如 844x390）寬度超過 md 斷點，md:landscape:size-[90dvh]
    會蓋掉替控制盤讓位的尺寸 —— 斷點量的是寬度，但「這是不是手機」量的是
    有沒有精準指標。所以 coarse 在 tailwind.config.ts 裡宣告在 md 後面。
  */
  /*
    ── 直式是真的「排在一起」，不是各自定位 ────────────────────────
    這一層是 flex column：棋盤 → gap 16px → 步驟提示，整欄靠下，
    下邊距只留控制盤高度 + 16px。於是三者的間距就是同一個 gap，
    不用推算、也不會因為量到 padding box 還是 border box 而差 2px。

    先前是「棋盤靠下 + 一個算出來的大 padding」配「提示絕對定位掛在
    控制盤上緣」—— 兩套機制湊出來的距離，改一邊就要記得改另一邊。

    橫式維持靠右貼著控制盤（提示在控制盤內部，是那一欄的標籤）。
  */
  const boardArea = padGone ? ''
    : 'coarse:justify-end coarse:gap-4 coarse:pb-[calc(var(--wall-pad-h)+1rem)] '
      + 'coarse-land:items-end coarse-land:justify-center coarse-land:gap-0 coarse-land:pb-0 '
      + 'coarse-land:pr-[calc(var(--wall-pad-w)+0.75rem)]';

  const BOARD_FREE = 'size-[90dvw] md:size-[90dvh] md:portrait:size-[90dvw] md:landscape:size-[90dvh]';
  const boardBox = padGone ? BOARD_FREE
    : 'size-[90dvw] fine:md:size-[90dvh] fine:md:portrait:size-[90dvw] fine:md:landscape:size-[90dvh]'
      /*
        扣掉的不只是控制盤 —— 左上那兩顆鈕（直式 72px 高、橫式 72px 寬）
        也要算進去，不然小螢幕會把棋盤畫到按鈕底下。
        iPhone SE（375x667）實測：只扣 9rem 的話棋盤落在 y=64，
        而按鈕到 y=72，整整壓過去 8px。

        直式：控制盤 + 16px + 步驟標 26px + 16px + 按鈕 72px + 呼吸 18px ≈ 9.25rem
        橫式：控制盤 + 按鈕欄 72px + 左右呼吸 40px ≈ 7rem
        大螢幕不受影響（那邊是 90dvw / 86dvh 先封頂）。
      */
      + ' coarse:size-[min(90dvw,calc(100dvh-var(--wall-pad-h)-9.25rem))]'
      + ' coarse-land:size-[min(86dvh,calc(100dvw-var(--wall-pad-w)-7rem))]';

  /*
    控制盤與棋盤共用的兩個 UI 狀態。

    原本 pendingWall 鎖在 Chessboard、breakMode 鎖在控制盤裡 —— 但步驟提示
    現在排在棋盤與控制盤**中間的文件流**上，由這裡渲染，它也要知道這兩件事。
    與其讓同一件事在三個地方各存一份，不如提到唯一持有狀態的這一層。
  */
  const [pendingWall, setPendingWall] = useState<Direction | null>(null);
  const [breakMode, setBreakMode] = useState(false);

  const onWallStep = useMemo(
    () => !!state.selected && !isPlacing
      // 走不動就進蓋牆 —— 但前提是這一刻准蓋：還沒移動、一步都走不了的棋子
      // （被圍死、只能破牆脫困）不算，它的下一步是破牆，不是蓋牆。
      && (pendingWall !== null || state.remainSteps === 0
        || (canPlaceWallNow(state) && legalMoves(state).length === 0)),
    [state, isPlacing, pendingWall],
  );


  const canBreakWall = engineHasBreakWall(state);

  /*
    現在這一刻真的破得了牆嗎 —— 交給 engine 判斷（它一次看完「這局有沒有
    破牆規則」「還剩幾次」「選中的棋子旁邊有沒有牆」）。

    破不了就自動退出破牆模式。**沒有這一條會走進死路**：破完那一次之後
    鐵鎚變停用（次數用完），而破牆模式下四個方向吃的是 breakable ——
    也全是 false。於是這一手蓋不了牆（回合結束不了），鐵鎚又因為停用而
    按不動，退不出來。實測當下整個控制盤只剩「投降」和「重來」能按。

    控制盤原本自己有這段判斷，把 breakMode 提上來時漏掉了。
  */
  const breakSlots = useMemo(
    () => new Set(legalBreaks(state).map(({ row, col, dir }) => `${row},${col},${dir}`)),
    [state],
  );
  const canBreakNow = breakSlots.size > 0;
  const selectableKeys = useMemo(
    () => new Set(selectablePieces(state).map(({ row, col }) => `${row},${col}`)),
    [state],
  );
  if (breakMode && !canBreakNow) setBreakMode(false);

  // 避免自己寫入 Firebase 的內容又觸發自己重播
  const lastAppliedWgf = useRef<string>('');
  /*
    有沒有先讀到房間的棋譜。

    在讀到之前**一個字都不能寫回去** —— 連線模式的初始 state 是寫死的
    createGame(2)（那時還不知道房間是幾人局），而寫入 effect 在第一次
    render 就會跑。room 還是 null 的那一瞬間，它會把本地這份兩人棋譜
    蓋掉 Firebase 上的 "3|||"，接著讀取 effect 看到的已經是自己剛寫的，
    於是永遠不會重播房間原本的內容。

    症狀是：連線三人房一定會變成兩人局，而且三個人的畫面**一致地錯**，
    所以看起來完全正常 —— 實測 38 手打完，全程沒有任何錯誤訊息。
  */
  const syncedFromRoom = useRef(false);

  // ─── 單人對戰 ────────────────────────────────────────────────────────────────
  //
  // 難度由 /solo 以 prop 帶進來。設定後，除了 A 以外都交給 AI。
  // 連線模式沒有 AI —— 那邊的對手是真人。
  const aiDifficulty = isOnline ? null : soloDifficulty ?? null;
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

  const { think, warmup: warmupAi, cancel: cancelAi } = useAiOpponent(
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

  /*
    對局一結束 AI 就停手，連還在算的那一手也丟掉。

    少了 isLock 這一條，最後一手下完、回合輪到 AI，它照樣找得到自己領地裡的
    合法手 —— 在結算視窗已經打開的時候再蓋一道牆，可能把一塊空地切成
    誰都不算的區域，比分就在結果畫面底下被改掉。投降時 AI 正在算也一樣：
    它那一手會在你投降之後落下。
  */
  useEffect(() => {
    if (isLock) { cancelAi(); return; }
    if (!isAiTurn || !aiDifficulty) return;
    think(wgf, aiDifficulty);
  }, [isLock, isAiTurn, aiDifficulty, wgf, think, cancelAi]);

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
          setError(g.play.noRoom);
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
            setError(g.play.roomFull);
            setPhase('error');
            return;
          }
          const player: RoomPlayer = {
            uid,
            displayName: fmt(g.play.playerName, { id: uid.slice(0, 4).toUpperCase() }),
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
            /*
              坐滿了 —— 原地掃一次「遊戲開始」。

              沒有這一下的話，等待畫面會直接被棋盤取代。正在看分享連結、
              或是剛按完加入的人，畫面就只是「突然變了」，不會意識到
              對局已經開始、而且可能已經輪到自己。

              色塊用自己的顏色：每個人看到的是他自己那一方在開場。
            */
            if (!startedRef.current) {
              startedRef.current = true;
              flash({
                x: window.innerWidth / 2,
                y: window.innerHeight / 2,
                color: assignedKey ? playerVar(assignedKey) : 'rgb(var(--tile-ink))',
                label: g.play.gameStart,
                fg: 'rgb(var(--tile-cream))',
                big: true,
              }, {
                // 蓋滿之後停一下再掃走 —— 不停的話蓋上去與掃下來是連在一起的，
                // 「遊戲開始」四個字根本來不及讀。
                holdMs: 700,
                /*
                  分享 Modal 在**色塊底下**才關掉。

                  先關再蓋的話（兩個 setState 在同一輪 render）Modal 的淡出
                  會和色塊的擴散一起跑：你會看到 Modal 先消失一半，
                  然後才被蓋住 —— 兩件事互相干擾，看起來很趕。
                  等畫面全被蓋住再換，掃開時就已經是乾淨的棋盤。
                */
                onCovered: () => { setShareModalOpen(false); setPhase('playing'); },
              });
              return;
            }
            setPhase('playing');
            setShareModalOpen(false);
          } else {
            setPhase('waiting');
          }
        });

        if (assignedKey === 'A') setShareModalOpen(true);
      } catch (e) {
        console.error(e);
        setError(g.play.connectFail);
        setPhase('error');
      }
    })();

    return () => {
      cancelled = true;
      /*
        必須把旗標放掉。

        dev 的 StrictMode 會刻意讓 effect 跑「掛載 → 卸載 → 再掛載」。
        第一次掛載把 initialized 設成 true，卸載後第二次掛載就被自己的
        守衛擋掉 —— 於是連線初始化永遠不會執行，畫面卡在「{g.play.connecting}」。

        production build 沒有這個雙呼叫，所以只有 npm run dev 會卡住，
        只測 build 產物完全看不到。這個旗標本來是防「deps 變動時重複初始化」，
        放掉它不影響那件事：真的重新初始化時本來就該重跑。
      */
      initialized.current = false;
      unsubscribe?.();
    };
    // g 是模組層常數（GAME_TEXT[locale]），同一語系下參考不變 ——
    // 加進依賴不會讓這個連線 effect 重跑。flash 是 useCallback([])，同理。
  }, [isOnline, roomId, ensureUser, g, flash]);

  // 讀路徑：Firebase 上的 WGF 有變且非自己寫入的，就從空棋盤完整重建
  useEffect(() => {
    if (!isOnline || !room?.wgf || room.wgf === lastAppliedWgf.current) return;
    lastAppliedWgf.current = room.wgf;
    syncedFromRoom.current = true;
    dispatch({ type: 'replay', wgf: room.wgf });
  }, [room?.wgf, isOnline]);

  // 寫路徑：棋譜有變就同步。
  //
  // 由狀態推導而非在每個操作裡手動標記 —— 只有「開局放棋」與「結束回合」
  // 會改變 WGF，選取與移動不會，因此不必逐一判斷哪些操作需要同步。
  // lastAppliedWgf 同時擋掉自己寫入所觸發的重播（echo）。
  useEffect(() => {
    if (!roomId) return;
    const wgf = toWgf(state);
    // 「還沒讀到房間就不准寫」的理由與後果見 utils/wgfSync.ts
    if (!shouldPushWgf({
      isOnline, syncedFromRoom: syncedFromRoom.current,
      localWgf: wgf, lastApplied: lastAppliedWgf.current,
    })) return;
    lastAppliedWgf.current = wgf;
    updateGameState(roomId, wgf, state.currentPlayer);
  }, [state, isOnline, roomId]);

  // 遊戲結束時寫入勝者資訊。平常由房主（A）負責；投降的人不論是誰都要寫 ——
  // 投降是唯一不能從棋譜推導的結束方式，不寫的話對手永遠不會知道。
  useEffect(() => {
    if (!isOnline || !roomId || outcome.length === 0) return;
    if (myPlayerKey !== 'A' && !resigned) return;
    setRoomWinner(roomId, outcome);
  }, [isOnline, roomId, myPlayerKey, outcome, resigned]);

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
    setResigned(false);
    trackButtonClick(`restart_local_game_${playersNum}p`);
  }, [playersNum]);

  const confirmSurrender = useCallback(() => {
    setSurrenderOpen(false);
    setResigned(true);
    trackButtonClick(`surrender_${isOnline ? 'online' : 'local'}_${playersNum}p`);
  }, [isOnline, playersNum]);

  /*
    離開頁面前確認 —— 但只在「真的有東西會被丟掉」的時候。

    原本的條件是 `!isLock`：一進 /local 什麼都還沒做就已經會攔人，
    而那時候按上一頁根本沒有損失，跳出「確定要離開嗎」只是擋路。
    使用者被沒有意義的確認擋過幾次之後，真正該停下來的那次也會直接按掉。

    改成看盤面上有沒有進度：開局擺過子、下過回合、或這一手動到一半。
    連線模式不看這個 —— 那邊離開等於讓對手空等，任何時候都該問一聲。
  */
  // 連線模式不看盤面 —— 那邊離開等於讓對手空等，任何時候都該問一聲
  const hasProgress = isOnline || hasStarted(state);

  useEffect(() => {
    if (isLock || !hasProgress) return;
    const handleBeforeUnload = (e: BeforeUnloadEvent) => e.preventDefault();
    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [isLock, hasProgress]);

  const { ruleModalState, setRuleModalState } = useRuleModal();
  const handleRuleBtnOpen = () => setRuleModalState({ ...ruleModalState, isOpen: true });

  // ─── 連線模式：初始化中 / 錯誤 ─────────────────────────────────────────────
  if (isOnline && phase === 'initializing') {
    return (
      <div className="flex items-center gap-3 text-lg">
        <div className="size-4 animate-spin rounded-full border-2 border-gray-900 border-t-transparent"></div>
        {g.play.connecting}
      </div>
    );
  }

  if (isOnline && phase === 'error') {
    return (
      <div className="flex flex-col items-center gap-6">
        <p className="text-lg text-red-500">{error}</p>
        <Link href={localePath(locale, "/")} className="underline hover:opacity-70">{g.play.backHome}</Link>
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
      <div className={`fixed left-5 top-5 z-50 flex flex-row gap-3 ${topButtons}`}>
        <button
          type="button"
          aria-label={g.play.home}
          onClick={(e) => {
            // 圓從這顆鈕的中心擴散出去 —— 它本身就是圓的，起點天生吻合。
            //
            // 顏色就用這顆鈕自己的紙色：等於整顆鈕直接擴張成畫面，
            // 而且終點是首頁的奶油底，色調連得上。試過深墨，整片黑太重 ——
            // 進場的顏色代表「你選了什麼」，離場不該比進場還搶戲。
            const r = e.currentTarget.getBoundingClientRect();
            navigate(localePath(locale, '/'), {
              wipe: {
                x: r.left + r.width / 2,
                y: r.top + r.height / 2,
                color: 'rgb(var(--tile-cream))',
                // 這顆鈕本來就是圓的，圓角給半徑即可 —— 於是它是
                // 「圓脹大、再縮回圓」，沒有多餘的方轉圓。
                from: { width: r.width, height: r.height, radius: r.width / 2 },
                icon: GiHut,
                // 這顆鈕的圖示只有 24px，寫死 text-7xl 會變成一顆比按鈕
                // 還大的房子憑空冒出來 —— 量它真正的尺寸。
                iconSize: e.currentTarget.querySelector('svg')?.getBoundingClientRect().height,
                iconColor: 'rgb(var(--tile-ink))',
                fg: 'rgb(var(--tile-ink))',
              },
            });
          }}
          className="rounded-full bg-primary-50 p-3.5 text-2xl text-tile-ink transition hover:brightness-95 active:scale-95">
          <GiHut />
        </button>
        <IconButton color="bg-primary-50 text-tile-ink" handleClickEvent={handleRuleBtnOpen} label={g.play.howToPlay}>
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

          {/*
            控制盤在時不顯示回合提示。

            它說的三件事（輪到誰、現在該做什麼、還有沒有破牆）控制盤
            已經全部說了：中央的點是當前玩家的顏色、步驟標寫著現在在
            哪一步、鐵鎚鍵的啟用狀態就是破牆還在不在。
            同一件事講兩次只是多一個浮在畫面上的東西。
          */}
          <GameTips
            isPlacingChess={isPlacing}
            currentPlayer={state.currentPlayer}
            winingStatus={outcome}
            breakWallCountObj={state.breakWallCount}
            aiThinking={isAiTurn}
            selected={!!state.selected}
            remainSteps={state.remainSteps}
            onWallStep={onWallStep}
            playersNum={playersNum}
            onShowResult={() => setChampionDismissed(false)}
          />

          {/* 桌機的投降。手機在控制盤的左上角，那裡已經有一顆；
              這顆補的是「沒有控制盤的時候投降要按哪裡」。

              擺左下：右下是提示膠囊、右上是比分、左上是離開這一局的出口，
              左下是唯一空著的角，而它本來就是「結束」這一類的動作。
              紙色而非磚紅 —— 它要能被找到，但不該比盤面搶眼；
              真正的警告留在按下去之後的確認 Modal 上。 */}
          {!isLock && !isPlacing && (
            <button
              type="button"
              onClick={() => setSurrenderOpen(true)}
              className="fixed bottom-5 left-5 z-40 flex items-center gap-2 rounded-full bg-primary-50
                         px-[18px] py-3 text-[15px] font-black text-ink-soft transition
                         hover:text-tile-ink active:scale-95 lg:bottom-[5dvh] coarse:hidden"
            >
              <LuFlag className="text-xl" />
              {g.surrender.label}
            </button>
          )}

          <div className={`flex flex-1 flex-col items-center justify-center self-stretch ${boardArea}`}>
          <div className={`chessboard-container ${boardBox}`}>
            <Chessboard
              size={BOARD_SIZE}
              board={state.board}
              verticalWalls={state.verticalWalls}
              horizontalWalls={state.horizontalWalls}
              currentPlayer={state.currentPlayer}
              selectedChess={state.selected}
              remainSteps={state.remainSteps}
              canWall={canPlaceWallNow(state)}
              myTurn={isMyTurn}
              selectable={selectableKeys}
              breakSlots={breakSlots}
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
            cancelTurn={() => { if (isMyTurn) dispatch({ type: 'cancelTurn' }); }}
            onSurrender={() => setSurrenderOpen(true)}
            pendingWall={pendingWall}
            setPendingWall={setPendingWall}
            breakMode={breakMode}
            onToggleBreak={() => setBreakMode((b) => !b)}
            onWallStep={onWallStep}
            // 「已經動過」= 這一回合有動作、或步數被用掉、或選了棋子。
            // 三者任一成立，「重來」就該是可按的。
            turnDirty={state.currentTurnActions.length > 0 || state.remainSteps < 2 || !!state.selected}
            />
          </div>

          {/* 直式的步驟提示：排在棋盤與控制盤之間的文件流上，上下各 16px（外層的 gap）。
              橫式那顆在控制盤內部（見 WallDirectionPad），所以這顆只在直式顯示。 */}
          {!padGone && state.currentPlayer && (
            <TurnGuide
              className="hidden coarse-port:flex"
              placing={isPlacing}
              myTurn={isMyTurn}
              selected={!!state.selected}
              onWallStep={onWallStep}
              breakMode={breakMode}
              remainSteps={state.remainSteps}
              color={playerVar(state.currentPlayer)}
            />
          )}
          </div>

          <ChampionModal
            winners={outcome}
            uniqTerritories={territories.owned}
            isOpen={isLock && !championDismissed}
            onClose={() => setChampionDismissed(true)}
            onRestart={isOnline ? undefined : restartGame}
            onFeedback={() => { setChampionDismissed(true); setFeedbackOpen(true); }}
          />

          {/*
            回饋自帶這一局的完整棋譜。

            「我遇到一個很怪的狀況」平常要請對方描述半天還常常對不上，
            附上 WGF 就能在 replay 裡重現他當下的盤面 —— 等於每一則
            回饋都自帶重現步驟。這是 WGF 的又一次回收。
          */}
          <FeedbackModal
            isOpen={feedbackOpen}
            onClose={() => setFeedbackOpen(false)}
            onSubmit={async (rating, message, contact) =>
              sendFeedback({
                rating, message, contact: contact || undefined,
                wgf: toWgf(state),
                mode: isOnline ? 'online' : aiDifficulty ? 'ai' : 'local',
                playersNum,
                result: outcome.join('/') || g.play.unfinished,
                /*
                  自然結束 vs 投降。判斷不看本地的 resigned ——
                  連線時投降的可能是對手，那邊 resigned 是 false，
                  但 naturalOutcome 仍然是空的（棋譜上這局沒下完）。
                  「沒有自然結束卻有結果」就是投降。
                */
                ended: naturalOutcome.length ? 'natural' : outcome.length ? 'resign' : 'unfinished',
                // 規則限 400 字。App 內建瀏覽器（FB / IG）的 UA 會超過，
                // 不截斷的話整筆回饋都會被拒
                ua: typeof navigator !== 'undefined' ? navigator.userAgent.slice(0, 400) : '',
                viewport: typeof window !== 'undefined'
                  ? `${window.innerWidth}x${window.innerHeight}@${window.devicePixelRatio}` : '',
              }, await ensureUser())
            }
          />

          <BreakWallConfirmModal
            isOpen={isBreakWallModalOpen}
            onClose={handleBreakWallCancel}
            onCheck={handleBreakWallConfirm}
          />

          <SurrenderConfirmModal
            isOpen={surrenderOpen}
            onClose={() => setSurrenderOpen(false)}
            onConfirm={confirmSurrender}
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
