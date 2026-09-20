'use client'
import { useState } from "react";
import { GiBrain, GiMeshNetwork, GiRuleBook, GiTabletopPlayers, GiThreeFriends, GiWireframeGlobe } from "react-icons/gi";
import { useTransition } from "@/contexts/TransitionContext";
import { trackButtonClick } from "@/utils/analytics";
// Game Icons（game-icons.net，CC BY 3.0）—— react-icons 已內建，不需另外安裝。
// 選它而不是線條圖示：參考稿的圖示是實心剪影壓在色塊上，
// Lucide 的細線在大尺寸的彩色磁磚上會顯得單薄。
import GameTile from "./components/GameTile";
import DifficultyModal from "./components/DifficultyModal";
import type { Difficulty } from "@/game/ai";
import { useGame } from "@/contexts/GameContext";
import { useRuleModal } from "@/contexts/RuleModalContext";
import { useUser } from "@/contexts/UserContext";
import { createRoom } from "@/utils/gameService";
import type { RoomPlayer } from "@/types/room";
import { serializeWGF, buildPieceIndex } from "@/utils/wgf";
import playerTemplates from "@/config/playerTemplates";
import type { PiecePlacement } from "@/types/wgf";

/**
 * 首頁的遊戲選擇。
 *
 * 原本是「本機／連線」兩顆按鈕再展開人數的兩層選單。改成四塊撞色磁磚
 * 一次攤開 —— 選項總共只有四個，藏在第二層只是多一次點擊，
 * 而參考稿的版面本來就是「一眼看完所有選擇」。
 */
export default function HomeClient() {
  const { navigate, busy } = useTransition();
  const { gameState, setGameState } = useGame();
  const { ensureUser } = useUser();
  const [isCreating, setIsCreating] = useState(false);
  const [soloOpen, setSoloOpen] = useState(false);
  const { ruleModalState, setRuleModalState } = useRuleModal();

  const startLocal = (playersNum: number) => {
    setGameState({ ...gameState, playersNum, aiDifficulty: null });
    navigate('/local', { title: '遊戲開始' });
    trackButtonClick(`start_local_game_${playersNum}p`);
  };

  const startSolo = (aiDifficulty: Difficulty) => {
    setSoloOpen(false);
    setGameState({ ...gameState, playersNum: 2, aiDifficulty });
    navigate('/local', { title: '遊戲開始' });
    trackButtonClick(`start_solo_game_${aiDifficulty}`);
  };

  // 滑過或 focus 到連線磁磚就先把 Firebase 載起來並匿名登入。
  // 失敗不處理 —— 這只是預熱，真的按下去時 startConnect 會再試一次並回報。
  const prewarm = () => { void ensureUser().catch(() => {}); };

  const startConnect = async (playersNum: number) => {
    if (isCreating) return;
    setIsCreating(true);
    try {
      const uid = await ensureUser();
      const player: RoomPlayer = {
        uid,
        displayName: `玩家 ${uid.slice(0, 4).toUpperCase()}`,
        joinedAt: Date.now(),
      };

      let initialWgf: string;
      if (playersNum === 2) {
        const index = buildPieceIndex(playerTemplates.templateBoardTwo);
        const initPositions: PiecePlacement[] = (['A', 'B', 'C'] as const).flatMap(p =>
          index[p].map(({ row, col }, i) => ({ player: p, piece: i + 1, row, col }))
        );
        initialWgf = serializeWGF({ playersNum: 2, initPositions, openingPlacements: [], turns: [] });
      } else {
        initialWgf = serializeWGF({ playersNum: 3, initPositions: [], openingPlacements: [], turns: [] });
      }

      const roomId = await createRoom(playersNum as 2 | 3, 'A', player, initialWgf);
      setGameState({ ...gameState, playersNum, aiDifficulty: null });
      navigate(`/match#roomId=${roomId}`, { title: '遊戲開始' });
      trackButtonClick(`start_connect_game_${playersNum}p`);
    } finally {
      setIsCreating(false);
    }
  };

  // 不再以「已登入」當作可否點擊的條件 —— 現在是按下去才登入。
  const online = isCreating || busy;

  return (
    /*
      配色刻意排成「相鄰必撞」：橫向 琥珀↔紫、藍↔紅，縱向 琥珀↔藍、紫↔紅，
      四組相鄰全是大跨度的色相差。色彩不負責區分本機／連線 —— 那由上方的
      小字與圖示承擔，色彩專心製造衝突感。
    */
    <div className="relative z-20 grid w-full grid-cols-2 gap-3 md:gap-4">
      <GameTile icon={GiTabletopPlayers} tone="amber"  kicker="本機" label="雙人" onClick={() => startLocal(2)} />
      <GameTile icon={GiThreeFriends}    tone="purple" kicker="本機" label="三人" onClick={() => startLocal(3)} />
      <GameTile icon={GiWireframeGlobe}  tone="blue"   kicker="連線" label="雙人" onClick={() => startConnect(2)} onPrefetch={prewarm} disabled={online} />
      <GameTile icon={GiMeshNetwork}     tone="red"    kicker="連線" label="三人" onClick={() => startConnect(3)} onPrefetch={prewarm} disabled={online} />
      <GameTile icon={GiBrain} tone="orange" label="單人對戰" wide onClick={() => setSoloOpen(true)} />
      <GameTile
        icon={GiRuleBook}
        tone="forest"
        label="遊戲規則"
        wide
        onClick={() => setRuleModalState({ ...ruleModalState, isOpen: true })}
      />
      <DifficultyModal isOpen={soloOpen} onClose={() => setSoloOpen(false)} onPick={startSolo} />
    </div>
  );
}
