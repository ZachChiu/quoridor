"use client";
import React, { useState, useEffect } from "react";
import SectionShadow from "./SectionShadow";
import Button from "./Button";
import IconButton from "./IconButton";
import {
  MdClose,
  MdPlayArrow,
  MdArrowRight,
  MdInfo,
  MdRefresh,
} from "react-icons/md";
import { RiDeleteBin2Fill, RiTeamFill } from "react-icons/ri";
import { getAllGameTokens, clearAllGameRooms } from "@/lib/gameService";
import { TbMoodAnnoyed2 } from "react-icons/tb";
import { GiSwordWound } from "react-icons/gi";

interface Props {
  isOpen: boolean;
  onClose: () => void;
}

const RoomListModal: React.FC<Props> = ({ isOpen, onClose }) => {
  const [gameTokens, setGameTokens] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleRoomListClear = async () => {
    try {
      await clearAllGameRooms();
      setGameTokens([]);
    } catch (err) {
      // console.error("清空房間失敗:", err);
      setError("清空房間失敗，請稍後再試");
    }
  };

  const loadGameRooms = async () => {
    setIsLoading(true);
    setError(null);
    try {
      const tokens = await getAllGameTokens();
      setGameTokens(tokens);
    } catch (err) {
      // console.error("載入房間列表失敗:", err);
      setError("載入房間列表失敗，請稍後再試");
    } finally {
      setIsLoading(false);
    }
  };

  const handleJoinRoom = (token: string) => {
    window.location.href = `/play?token=${token}`;
  };

  useEffect(() => {
    if (isOpen) {
      loadGameRooms();
    }
  }, [isOpen]);

  return (
    <div
      className={`fixed inset-0 z-50 flex w-full  items-center justify-center px-4 ${
        isOpen ? "opacity-100" : "pointer-events-none opacity-0"
      } transition-opacity duration-300`}
    >
      <div
        className="fixed inset-0 bg-black/50"
        onClick={() => onClose()}
      ></div>
      <div className="max-w-md min-w-[28rem]">
        <SectionShadow>
          <div
            className={`relative w-full rounded-xl border-2 border-gray-900 bg-primary p-6 font-[family-name:var(--font-geist-sans)]`}
          >
            <div className="mb-4 flex items-center justify-between">
              <h2 className="flex items-center gap-2 text-2xl font-bold">
                <RiTeamFill className="text-2xl" />
                房間列表
              </h2>
              <div className="flex items-center gap-2">
                <div
                  className="group cursor-pointer"
                  onClick={() => loadGameRooms()}
                >
                  <IconButton>
                    <MdRefresh className={isLoading ? "animate-spin" : ""} />
                  </IconButton>
                </div>
                <div
                  className="group cursor-pointer"
                  onClick={() => onClose()}
                >
                  <IconButton>
                    <MdClose />
                  </IconButton>
                </div>
              </div>
            </div>
            <div className="content scrollbar-hide mb-6 max-h-[45dvh] space-y-4 overflow-y-auto px-2 pt-1 pb-1 lg:max-h-[60dvh]">
              <style jsx>{`
                .content::-webkit-scrollbar {
                  display: none;
                }
              `}</style>

              {isLoading && (
                <div className="flex items-center justify-center py-8">
                  <div className="flex items-center gap-2 text-gray-600">
                    <MdRefresh className="animate-spin text-xl" />
                    <span>載入中...</span>
                  </div>
                </div>
              )}

              {error && (
                <div className="rounded-lg bg-red-100 p-4 text-red-700">
                  <div className="flex items-center gap-2">
                    <MdInfo className="text-xl" />
                    <span>{error}</span>
                  </div>
                </div>
              )}

              {!isLoading && !error && gameTokens.length === 0 && (
                <div className="flex flex-col items-center justify-center py-8 text-gray-800">
                  <TbMoodAnnoyed2 className="mb-2 text-4xl" />
                  <p className="text-center">目前沒有戰場</p>
                  <p className="text-center">又是和平的一天</p>
                </div>
              )}

              {!isLoading && !error && gameTokens.length > 0 && (
                <div className="space-y-3">
                  {gameTokens.map((token, index) => (
                    <SectionShadow key={token}>
                      <div
                        className="relative group cursor-pointer rounded-xl border-4 border-black bg-white p-4 transition-all hover:bg-primary-50 mb-[0.5rem] hover:-translate-x-0.5 hover:-translate-y-0.5 active:translate-x-1 active:translate-y-1 transform-gpu"
                        onClick={() => handleJoinRoom(token)}
                      >
                        <div className="flex items-center justify-between">
                          <div className="flex items-center gap-3">
                            <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gray-100 text-gray-700 group-hover:bg-red-100 group-hover:text-red-500">
                              <GiSwordWound className="text-xl" />
                            </div>
                            <div>
                              <h3 className="font-semibold text-gray-800">
                                戰場 #{index + 1}
                              </h3>
                              <p className="text-sm text-gray-500">
                                Token: {token}
                              </p>
                            </div>
                          </div>
                          <div className="flex items-center opacity-0 transition-opacity group-hover:opacity-100">
                            <span className="text font-bold text-base">加入</span>
                            <MdArrowRight className="text-xl" />
                          </div>
                        </div>
                      </div>
                    </SectionShadow>
                  ))}
                </div>
              )}
            </div>

            <div className="w-full flex items-center justify-between gap-4">
              <div className="w-[45%]">
                <Button
                  color="bg-primary-600"
                  handleClickEvent={() => handleRoomListClear()}
                >
                  <span className="flex items-center gap-2">
                    <RiDeleteBin2Fill className="text-2xl" /> 清空
                  </span>
                </Button>
              </div>
              <Button
                color="bg-primary-400"
                handleClickEvent={() => onClose()}
              >
                <span className="flex items-center gap-2">
                  <MdPlayArrow className="text-2xl" /> 回到大廳
                </span>
              </Button>
            </div>
          </div>
        </SectionShadow>
      </div>
    </div>
  );
};

export default RoomListModal;
