"use client"
import React, { createContext, useContext, useState } from "react";
import type { Difficulty } from "@/game/ai";

interface GameState {
  playersNum: number;
  /**
   * 單人對戰的難度。null 代表所有人都由本機玩家操作。
   * 設定後，除了 A 以外的玩家都交給 AI。
   */
  aiDifficulty: Difficulty | null;
}

const defaultState: GameState = {
  playersNum: 2,
  aiDifficulty: null,
};

interface GameContextType {
  gameState: GameState;
  setGameState: React.Dispatch<React.SetStateAction<GameState>>;
}

const GameContext = createContext<GameContextType | undefined>(undefined);

export const GameProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [gameState, setGameState] = useState<GameState>(defaultState);
  return (
    <GameContext.Provider value={{ gameState, setGameState }}>
      {children}
    </GameContext.Provider>
  );
};

export const useGame = () => {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error("useGame 必須在 GameProvider 內使用");
  }
  return context;
};