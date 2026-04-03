'use client'
import { useState } from "react";
import { useRouter } from "next/navigation";
import { signInAnonymously } from "firebase/auth";
import { trackButtonClick } from "@/utils/analytics";
import { MdDoorBack, MdOutlinePublic, MdOutlineQuestionMark } from "react-icons/md";
import Button from "./components/Button";
import IconButton from "./components/IconButton";
import { LuSwords } from "react-icons/lu";
import { useGame } from "@/contexts/GameContext";
import { useRuleModal } from "@/contexts/RuleModalContext";
import { auth } from "@/utils/firebase";
import { createRoom } from "@/utils/gameService";
import type { RoomPlayer } from "@/types/room";

export default function HomeClient() {
  const router = useRouter();
  const { gameState, setGameState } = useGame();

  const handleStartLocalGame = (playersNum: number) => {
    setGameState({
      ...gameState,
      playersNum,
    });
    router.push('/local');
    trackButtonClick(`start_local_game_${playersNum}p`);
  };

  const [showLocalGameOptions, setShowLocalGameOptions] = useState(false);
  const [showConnectGameOptions, setShowConnectGameOptions] = useState(false);
  const [isCreating, setIsCreating] = useState(false);

  const { ruleModalState, setRuleModalState } = useRuleModal();
  const handleRuleBtnOpen = () => {
    setRuleModalState({
      ...ruleModalState,
      isOpen: true
    })
  }

  const handleStartConnectGame = async (playersNum: number) => {
    if (isCreating) return;
    setIsCreating(true);
    try {
      const { user } = await signInAnonymously(auth);
      const player: RoomPlayer = {
        uid: user.uid,
        displayName: `玩家 ${user.uid.slice(0, 4).toUpperCase()}`,
        joinedAt: Date.now(),
      };
      const roomId = await createRoom(playersNum as 2 | 3, 'A', player);
      setGameState({ ...gameState, playersNum });
      router.push(`/match?roomId=${roomId}`);
      trackButtonClick(`start_connect_game_${playersNum}p`);
    } finally {
      setIsCreating(false);
    }
  };

  return (
    <div className="relative z-20">
      <div className={`group fixed right-5 top-5 cursor-pointer`}>
        <IconButton handleClickEvent={() => handleRuleBtnOpen()}>
          <MdOutlineQuestionMark />
        </IconButton>
      </div>
      {!showLocalGameOptions && !showConnectGameOptions &&
        <div className="flex flex-col gap-4">
          <Button
            color="bg-primary-500 flex items-center justify-center gap-2"
            handleClickEvent={() => setShowLocalGameOptions(true)}
          >
            <LuSwords className="text-2xl"/> 本機對戰
          </Button>
          <Button
            color="bg-primary-300 flex items-center gap-2"
            handleClickEvent={() => setShowConnectGameOptions(true)}
          >
            <MdOutlinePublic className="text-2xl" /> 連線對戰
          </Button>
        </div>
      }
      {showLocalGameOptions &&
        <div className={`flex flex-col gap-4`}>
          <Button
            color="bg-primary-500 flex justify-center items-center gap-2"
            handleClickEvent={() => setShowLocalGameOptions(false)}
          >
            <MdDoorBack className="text-2xl"/> 返回
          </Button>
          <Button
            color="bg-primary-600 flex items-center gap-2"
            handleClickEvent={() => handleStartLocalGame(2)}
          >
            <LuSwords className="text-2xl"/> 雙人對戰
          </Button>
          <Button
            color="bg-primary-700 flex items-center gap-2"
            handleClickEvent={() => handleStartLocalGame(3)}
          >
            <LuSwords className="text-2xl"/> 三人對戰
          </Button>
        </div>
      }
      {showConnectGameOptions &&
        <div className={`flex flex-col gap-4`}>
          <Button
            color="bg-primary-500 flex justify-center items-center gap-2"
            handleClickEvent={() => setShowConnectGameOptions(false)}
          >
            <MdDoorBack className="text-2xl"/> 返回
          </Button>
          <Button
            color="bg-primary-300 flex items-center gap-2"
            handleClickEvent={() => handleStartConnectGame(2)}
          >
            <MdOutlinePublic className="text-2xl" /> 雙人對戰
          </Button>
          <Button
            color="bg-primary-400 flex items-center gap-2"
            handleClickEvent={() => handleStartConnectGame(3)}
          >
            <MdOutlinePublic className="text-2xl" /> 三人對戰
          </Button>
        </div>
      }
    </div>
  )
}
