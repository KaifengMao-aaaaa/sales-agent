"use client";
import Sidebar from "@/components/Sidebar";
import { GlobalProvider, useGlobal } from "@/context/GlobalContext";
import "./globals.css";

function LayoutContent({ children }: { children: React.ReactNode }) {
  const { rightPanelComponent } = useGlobal();

  return (
    <div className="flex h-screen overflow-hidden">
      {/* 左侧 Sidebar */}
      <Sidebar />

      {/* 中间容器：聊天 + 右侧 panel */}
      <div className="flex flex-1 min-w-0">
        {/* 聊天框 */}
        <div className="flex-1 bg-gray-50">
          {children}
        </div>

        {/* 右侧动态 panel */}
        {rightPanelComponent && (
          <div className="flex-1 max-w-[50%] bg-white border-l border-gray-300 overflow-auto">
            {rightPanelComponent}
          </div>
        )}
      </div>
    </div>

  );
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="zh-CN">
      <body>
        <GlobalProvider>
          <LayoutContent>{children}</LayoutContent>
        </GlobalProvider>
      </body>
    </html>
  );
}
