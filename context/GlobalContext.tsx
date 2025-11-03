"use client";
import { createContext, useContext, useState, ReactNode } from "react";

const initialButtons = [
  {
    name: "GPT 聊天",
    onClick: () => console.log("点击 GPT 聊天"),
  },
  {
    name: "功能二",
    onClick: () => console.log("点击 功能二"),
  },
  {
    name: "客户信息",
    onClick: () => console.log("点击 客户信息"),
  },
];

export interface ButtonItem {
  name: string;
  description?: string
}

interface GlobalContextType {
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (v: boolean) => void;
  rightPanelComponent: ReactNode | null;
  setRightPanelComponent: (v: ReactNode | null) => void;
  buttons: ButtonItem[];
  setButtons: (buttons: ButtonItem[]) => void;
}

const GlobalContext = createContext<GlobalContextType | undefined>(undefined);

export const useGlobal = () => {
  const ctx = useContext(GlobalContext);
  if (!ctx) throw new Error("useGlobal must be used within GlobalProvider");
  return ctx;
};

export function GlobalProvider({ children }: { children: ReactNode }) {
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  const [rightPanelComponent, setRightPanelComponent] = useState<ReactNode | null>(null);
  const [buttons, setButtons] = useState<ButtonItem[]>(initialButtons);
  return (
    <GlobalContext.Provider
      value={{
        sidebarCollapsed,
        setSidebarCollapsed,
        rightPanelComponent,
        setRightPanelComponent,
        buttons,
        setButtons,
      }}
    >
      {children}
    </GlobalContext.Provider>
  );
}
