"use client"
import React, { createContext, useContext, useState } from "react";

interface RuleModalState {
  isOpen: boolean;
}

const defaultState: RuleModalState = {
  isOpen: false
};

interface RuleModalContextType {
  ruleModalState: RuleModalState;
  setRuleModalState: React.Dispatch<React.SetStateAction<RuleModalState>>;
}

const RuleModalContext = createContext<RuleModalContextType | undefined>(undefined);

export const RuleModalProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [ruleModalState, setRuleModalState] = useState<RuleModalState>(defaultState);
  return (
    <RuleModalContext.Provider value={{ ruleModalState, setRuleModalState }}>
      {children}
    </RuleModalContext.Provider>
  );
};

export const useRuleModal = () => {
  const context = useContext(RuleModalContext);

  if (!context) {
    throw new Error("useRuleModal 必須在 RuleModalProvider 內使用");
  }
  return context;
};