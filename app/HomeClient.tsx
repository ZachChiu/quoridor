'use client'
import { useState } from "react";
import { GiBrain, GiMeshNetwork, GiRuleBook, GiTabletopPlayers, GiThreeFriends, GiWireframeGlobe } from "react-icons/gi";
import { useTransition } from "@/contexts/TransitionContext";
import { trackButtonClick } from "@/utils/analytics";
// Game Icons（game-icons.net，CC BY 3.0）—— react-icons 已內建，不需另外安裝。
// 選它而不是線條圖示：參考稿的圖示是實心剪影壓在色塊上，
// Lucide 的細線在大尺寸的彩色磁磚上會顯得單薄。
import GameTile, { TONE_COLOR, type TileOrigin } from "./components/GameTile";
import DifficultyModal from "./components/DifficultyModal";
import type { Difficulty } from "@/game/ai";

/**
 * 把磁磚的幾何換算成轉場的起點。
 *
 * DOMRect 不是純資料（而且會隨捲動失效），所以在這裡就拆成數字帶走。
 * 圓角 16px 對應磁磚的 rounded-2xl —— 兩邊要一致，轉場的第一格才會
 * 和磁磚完全疊合。
 */
const wipeFrom = ({ rect, color, icon, iconSize, label, kicker, row, iconColor, fg }: TileOrigin) => ({
  x: rect.left + rect.width / 2,
  y: rect.top + rect.height / 2,
  color,
  from: { width: rect.width, height: rect.height, radius: 16 },
  icon, iconSize, label, kicker, row, iconColor, fg,
});
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
  const { navigate } = useTransition();
  const { gameState, setGameState } = useGame();
  const { ensureUser } = useUser();
  const [isCreating, setIsCreating] = useState(false);
  const [soloOpen, setSoloOpen] = useState(false);
  const { ruleModalState, setRuleModalState } = useRuleModal();

  /*
    轉場一律是「從你按的那個東西擴散出一個圓」，顏色就是它的顏色 ——
    按本機雙人是琥珀、連線三人是磚紅、單人是陶橘。同一套動作，
    但每次的起點與顏色都由你的選擇決定。
  */
  const startLocal = (playersNum: number, origin: TileOrigin) => {
    setGameState({ ...gameState, playersNum, aiDifficulty: null });
    navigate('/local', { wipe: wipeFrom(origin) });
    trackButtonClick(`start_local_game_${playersNum}p`);
  };

  const startSolo = (aiDifficulty: Difficulty, at: { x: number; y: number }) => {
    setSoloOpen(false);
    setGameState({ ...gameState, playersNum: 2, aiDifficulty });
    navigate('/solo', { wipe: { ...at, color: TONE_COLOR.orange } });
    trackButtonClick(`start_solo_game_${aiDifficulty}`);
  };

  // 滑過或 focus 到連線磁磚就先把 Firebase 載起來並匿名登入。
  // 失敗不處理 —— 這只是預熱，真的按下去時 startConnect 會再試一次並回報。
  const prewarm = () => { void ensureUser().catch(() => {}); };

  const startConnect = async (playersNum: number, origin: TileOrigin) => {
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
      navigate(`/match#roomId=${roomId}`, { wipe: wipeFrom(origin) });
      trackButtonClick(`start_connect_game_${playersNum}p`);
    } finally {
      setIsCreating(false);
    }
  };

  /*
    連線那兩塊不再變灰。

    原本是 disabled={isCreating || busy}，但 busy 是**換頁轉場**的旗標 ——
    按任何一塊磁磚（包括本機雙人）都會讓連線那兩塊反白，而那時候
    根本沒有東西在載，看起來像壞了。

    真正要擋的只有「同一塊被連按兩下建出兩間房」，那件事由 startConnect
    開頭的 isCreating 判斷處理就夠了，不需要在畫面上表現出來 ——
    何況滑過磁磚時 onPrefetch 已經先把 Firebase SDK 載好、匿名登入做完，
    真正的等待通常趨近於零。
  */

  return (
    /*
      配色刻意排成「相鄰必撞」：橫向 琥珀↔紫、藍↔紅，縱向 琥珀↔藍、紫↔紅，
      四組相鄰全是大跨度的色相差。色彩不負責區分本機／連線 —— 那由上方的
      小字與圖示承擔，色彩專心製造衝突感。
    */
    <div className="relative z-20 grid w-full grid-cols-2 gap-3 md:gap-4">
      <GameTile icon={GiTabletopPlayers} tone="amber"  kicker="本機" label="雙人" onClick={(o) => startLocal(2, o)} />
      <GameTile icon={GiThreeFriends}    tone="purple" kicker="本機" label="三人" onClick={(o) => startLocal(3, o)} />
      <GameTile icon={GiWireframeGlobe}  tone="blue"   kicker="連線" label="雙人" onClick={(o) => startConnect(2, o)} onPrefetch={prewarm} />
      <GameTile icon={GiMeshNetwork}     tone="red"    kicker="連線" label="三人" onClick={(o) => startConnect(3, o)} onPrefetch={prewarm} />
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
