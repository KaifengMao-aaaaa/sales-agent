"use client";
import { createContext, useContext, useState, ReactNode, useEffect, useCallback } from "react";

export interface ButtonItem {
  name: string;
  description: string
}
interface GlobalConfig {
  token?: string;
  salesBotId?: string;
  uiBotId?: string;
}
interface GlobalContextType {
  sidebarCollapsed: boolean;
  setSidebarCollapsed: (v: boolean) => void;
  rightPanelComponent: ReactNode | null;
  setRightPanelComponent: (v: ReactNode | null) => void;
  buttons: ButtonItem[];
  refreshButtons: () => Promise<void>;
  sendPrompt?: (prompt: string) => Promise<void>;
  setSendPrompt: (fn: (prompt: string) => Promise<void>) => void;
  globalConfig: GlobalConfig;
  setGlobalConfig: (config: GlobalConfig) => void;
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
  const [buttons, setButtons] = useState<ButtonItem[]>([]);
  const [globalConfig, setGlobalConfig] = useState<{ token?: string; salesBotId?: string; uiBotId?: string }>({});
  const [sendPrompt, setSendPrompt] = useState<(prompt: string) => Promise<void>>();
  const refreshButtons = async () => {
    if (!globalConfig.token) {
      console.warn("⚠️ token 不存在，跳过加载按钮");
      return;
    }
    try {
      const res = await fetch("/api/buttons", { cache: "no-store", 
        headers: { Authorization: `Bearer ${globalConfig.token}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data: ButtonItem[] = await res.json();
      setButtons(data);
    } catch (err) {
      console.error("加载按钮失败:", err);
    }
  };
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("appConfig") || "{}");
    if (saved) setGlobalConfig(saved);
  }, []);
  // ✅ 在组件首次挂载时加载按钮
  useEffect(() => {
    refreshButtons();
  }, [globalConfig]);
  const stableSetSendPrompt = useCallback(setSendPrompt, []);
  return (
    <GlobalContext.Provider
      value={{
        sidebarCollapsed,
        setSidebarCollapsed,
        rightPanelComponent,
        setRightPanelComponent,
        buttons,
        refreshButtons,
        sendPrompt,
        setSendPrompt: stableSetSendPrompt,
        setGlobalConfig,
        globalConfig
      }}
    >
      {children}
    </GlobalContext.Provider>
  );
}
