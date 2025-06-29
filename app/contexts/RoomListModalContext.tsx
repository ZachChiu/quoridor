"use client"
import React, { createContext, useContext, useState } from "react";

interface RoomListModalState {
  isOpen: boolean;
}

const defaultState: RoomListModalState = {
  isOpen: false
};

interface RoomListModalContextType {
  roomListModalState: RoomListModalState;
  setRoomListModalState: React.Dispatch<React.SetStateAction<RoomListModalState>>;
}

const RoomListModalContext = createContext<RoomListModalContextType | undefined>(undefined);

export const RoomListModalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [roomListModalState, setRoomListModalState] = useState<RoomListModalState>(defaultState);
  return (
    <RoomListModalContext.Provider value={{ roomListModalState, setRoomListModalState }}>
      {children}
    </RoomListModalContext.Provider>
  );
};

export const useRoomListModal = (): RoomListModalContextType => {
  const context = useContext(RoomListModalContext);

  if (!context) {
    throw new Error("useRoomListModal 必須在 RoomListModalProvider 內使用");
  }
  return context;
};