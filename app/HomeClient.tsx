"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { trackButtonClick } from "@/utils/analytics";
import { MdOutlinePublic, MdOutlineQuestionMark } from "react-icons/md";
import Button from "./components/Button";
import IconButton from "./components/IconButton";
import { LuSwords } from "react-icons/lu";
import { useGame } from "@/contexts/GameContext";
import { useRuleModal } from "@/contexts/RuleModalContext";
import { createGameRoom } from "@/lib/gameService";
import playerTemplates from "@/config/playerTemplates";
import { Player } from "./types/chessboard";
import { RiTeamFill } from "react-icons/ri";
import { MdDoorBack } from "react-icons/md";
import RoomListModal from "./components/RoomListModal";
import { useConfirm } from "./hook/useConfirm";

export default function HomeClient() {
  const router = useRouter();
  const { gameState, setGameState } = useGame();

  const handleStartLocalGame = (playersNum: number) => {
    setGameState({
      ...gameState,
      playersNum,
    });
    router.push("/play");
    trackButtonClick(`start_local_game_${playersNum}p`);
  };

  const handleStartConnectGame = () => {
    setShowOnlineGameOptions(true);
    trackButtonClick("start_online_game");
  };

  const handleStartOnlineGame = async (playersNum: number) => {
    try {
      setIsCreatingRoom(true);

      // 建立初始遊戲狀態
      const initialGameState = {
        size: 7,
        board:
          playersNum === 2
            ? playerTemplates.templateBoardTwo
            : playerTemplates.templateBoardThree,
        currentPlayer: "A" as Player,
        verticalWalls: playerTemplates.templateVerticalWalls,
        horizontalWalls: playerTemplates.templateHorizontalWalls,
        selectedChess: null,
        remainSteps: 2,
        uniqTerritories:
          playersNum === 2 ? { A: [], B: [] } : { A: [], B: [], C: [] },
        flattenTerritoriesObj: {},
        winingStatus: [],
        openingStep:
          playersNum === 2
            ? playerTemplates.openingStepTwo
            : playerTemplates.openingStepThree,
        isChampionModalOpen: false,
        breakWallCountObj: { A: 1, B: 1, C: 1 },
        playersNum,
      };

      // 建立線上遊戲房間並取得 token
      const token = await createGameRoom(playersNum, initialGameState);

      // 更新本地遊戲狀態
      setGameState({
        ...gameState,
        playersNum,
      });

      // 導向遊戲頁面並帶上 token
      router.push(`/play?token=${token}`);
      trackButtonClick(`start_online_game_${playersNum}p`);
    } catch (error) {
      console.error("建立線上遊戲房間失敗:", error);
      alert("建立遊戲房間失敗，請稍後再試");
    } finally {
      setIsCreatingRoom(false);
    }
  };

  const [showLocalGameOptions, setShowLocalGameOptions] = useState(false);
  const [showOnlineGameOptions, setShowOnlineGameOptions] = useState(false);
  const [isCreatingRoom, setIsCreatingRoom] = useState(false);

  const { ruleModalState, setRuleModalState } = useRuleModal();
  const handleRuleBtnOpen = () => {
    setRuleModalState({
      ...ruleModalState,
      isOpen: true,
    });
  };

  const {
    isOpen: isRoomListModalOpen,
    confirm: confirmRoomList,
    handleCancel: handleRoomListCancel,
  } = useConfirm();

  return (
    <div className="relative z-20">
      <div className={`group fixed right-5 top-5 cursor-pointer`}>
        <IconButton handleClickEvent={() => handleRuleBtnOpen()}>
          <MdOutlineQuestionMark />
        </IconButton>
      </div>
      <div className="group fixed right-5 top-[calc(2.25rem+52px)] cursor-pointer">
        <IconButton handleClickEvent={() => confirmRoomList()}>
          <RiTeamFill />
        </IconButton>
      </div>

      <RoomListModal
        isOpen={isRoomListModalOpen}
        onClose={handleRoomListCancel}
      />

      {!showLocalGameOptions && !showOnlineGameOptions && (
        <div className="flex flex-col gap-4">
          <Button
            color="bg-primary-500 flex items-center justify-center gap-2"
            handleClickEvent={() => setShowLocalGameOptions(true)}
          >
            <LuSwords className="text-2xl" /> 本機對戰
          </Button>
          <Button
            color="bg-primary-300 flex items-center gap-2"
            handleClickEvent={() => handleStartConnectGame()}
          >
            <MdOutlinePublic className="text-2xl" /> 連線對戰
          </Button>
        </div>
      )}
      {showLocalGameOptions && (
        <div className={`flex flex-col gap-4`}>
          <Button
            color="bg-primary-500 flex justify-center items-center gap-2"
            handleClickEvent={() => setShowLocalGameOptions(false)}
          >
            <MdDoorBack className="text-2xl" /> 返回
          </Button>
          <Button
            color="bg-primary-600 flex items-center gap-2"
            handleClickEvent={() => handleStartLocalGame(2)}
          >
            <LuSwords className="text-2xl" /> 雙人對戰
          </Button>
          <Button
            color="bg-primary-700 flex items-center gap-2"
            handleClickEvent={() => handleStartLocalGame(3)}
          >
            <LuSwords className="text-2xl" /> 三人對戰
          </Button>
        </div>
      )}
      {showOnlineGameOptions && (
        <div className={`flex flex-col gap-4`}>
          <Button
            color="bg-primary-500 flex justify-center items-center gap-2"
            handleClickEvent={() => setShowOnlineGameOptions(false)}
          >
            <MdDoorBack className="text-2xl" /> 返回
          </Button>
          <Button
            color="bg-primary-600 flex items-center gap-2"
            handleClickEvent={() => handleStartOnlineGame(2)}
            disabled={isCreatingRoom}
          >
            <MdOutlinePublic className="text-2xl" />{" "}
            {isCreatingRoom ? "建立中..." : "雙人連線對戰"}
          </Button>
          <Button
            color="bg-primary-700 flex items-center gap-2"
            handleClickEvent={() => handleStartOnlineGame(3)}
            disabled={isCreatingRoom}
          >
            <MdOutlinePublic className="text-2xl" />{" "}
            {isCreatingRoom ? "建立中..." : "三人連線對戰"}
          </Button>
        </div>
      )}
    </div>
  );
}
