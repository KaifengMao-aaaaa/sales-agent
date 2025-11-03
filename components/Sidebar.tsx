"use client";
import { useState } from "react";
import { useGlobal } from "@/context/GlobalContext";
import { FiMenu } from "react-icons/fi";

export default function Sidebar() {
  const { sidebarCollapsed, setSidebarCollapsed, buttons } = useGlobal();
  const [activeButton, setActiveButton] = useState<string>("");

  return (
    <aside
      className={`flex flex-col bg-gray-200 text-gray-900 shadow-lg transition-all duration-300
        ${sidebarCollapsed ? "w-16" : "w-56"} overflow-visible relative`}
    >
      {/* 顶部菜单 + 折叠按钮 */}
      <div className="flex items-center justify-between p-4 border-b border-gray-400">
        {!sidebarCollapsed && <span className="font-bold text-lg">菜单</span>}
        <button
          onClick={() => setSidebarCollapsed(!sidebarCollapsed)}
          className="p-1 rounded hover:bg-gray-300 transition-colors"
        >
          <FiMenu size={20} />
        </button>
      </div>

      {/* 导航按钮 */}
      <nav className="flex-1 flex flex-col p-2 space-y-1">
        {buttons.map((btn) => {
          const isActive = activeButton === btn.name;
          return (
            <div key={btn.name} className="relative group w-full">
              <button
                onClick={() => {
                  setActiveButton(btn.name);
                }}
                className={`flex items-center gap-3 w-full px-2 py-2 rounded transition-all duration-200
                  ${isActive ? "bg-blue-600 text-white" : "text-gray-800 hover:bg-blue-200 justify-start"}
                  cursor-pointer`}
              >
                {!sidebarCollapsed && <span className="truncate">{btn.name}</span>}
              </button>

              {/* Tooltip */}
              <div className="absolute left-full top-1/2 -translate-y-1/2 ml-2 bg-black text-white text-xs rounded px-2 py-1 opacity-0 group-hover:opacity-100 transition-opacity z-50 flex flex-col items-start min-w-max">
                <span className="font-semibold">{btn.name}</span>
                <span className="text-[10px] mt-0.5">{btn.description || "无描述信息"}</span>
              </div>
            </div>
          );
        })}
      </nav>

      {/* 底部信息 */}
      {!sidebarCollapsed && (
        <div className="p-4 border-t border-gray-400 text-gray-600 text-sm">v1.0</div>
      )}
    </aside>
  );
}
