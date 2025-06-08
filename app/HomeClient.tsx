'use client'
import { useState } from "react";
import { useRouter } from "next/navigation";
import { trackButtonClick } from "@/utils/analytics";
import { MdDoorBack, MdOutlinePublic, MdOutlineQuestionMark } from "react-icons/md";
import Button from "./components/Button";
import IconButton from "./components/IconButton";
import { LuSwords } from "react-icons/lu";
import { useGame } from "@/contexts/GameContext";
import { useRuleModal } from "@/contexts/RuleModalContext";

export default function HomeClient() {
  const router = useRouter();
  const { gameState, setGameState } = useGame();

  const handleStartLocalGame = (playersNum: number) => {
    setGameState({
      ...gameState,
      playersNum,
    });
    router.push('/play');
    trackButtonClick(`start_local_game_${playersNum}p`);
  };

  const handleStartConnectGame = () => {
    // trackButtonClick('開始連線對戰');
    alert('還在準備中啦哈哈哈');
  };

  const [showLocalGameOptions, setShowLocalGameOptions] = useState(false);

  const { ruleModalState, setRuleModalState } = useRuleModal();
  const handleRuleBtnOpen = () => {
    setRuleModalState({
      ...ruleModalState,
      isOpen: true
    })
  }

  return (
    <div className="relative z-20">
      <div className={`group fixed right-5 top-5 cursor-pointer`}>
        <IconButton handleClickEvent={() => handleRuleBtnOpen()}>
          <MdOutlineQuestionMark />
        </IconButton>
      </div>
      {!showLocalGameOptions &&
        <div className="flex flex-col gap-4">
          <Button
            color="bg-primary-500 flex items-center justify-center gap-2"
            handleClickEvent={() => setShowLocalGameOptions(true)}
          >
            <LuSwords className="text-2xl"/> 本機對戰
          </Button>
          <Button
            color="bg-primary-300 flex items-center gap-2"
            handleClickEvent={() => handleStartConnectGame()}
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
    </div>
  )
}