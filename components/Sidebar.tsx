"use client";
import { useState, useEffect } from "react";
import { useGlobal } from "@/context/GlobalContext";
import { FiMenu, FiSettings } from "react-icons/fi";

export default function Sidebar() {
  const { sidebarCollapsed, setSidebarCollapsed, buttons, sendPrompt, setGlobalConfig } = useGlobal();

  const [activeButton, setActiveButton] = useState<string>("");
  const [showConfig, setShowConfig] = useState(false);
  const [token, setToken] = useState("");
  const [salesBotId, setSalesBotId] = useState("");
  const [uiBotId, setUiBotId] = useState("");

  // 初始化时从 localStorage 加载配置
  useEffect(() => {
    const saved = JSON.parse(localStorage.getItem("appConfig") || "{}");
    if (saved.token) setToken(saved.token);
    if (saved.salesBotId) setSalesBotId(saved.salesBotId);
    if (saved.uiBotId) setUiBotId(saved.uiBotId);
  }, []);

  const saveConfig = () => {
    const newConfig = { token, salesBotId, uiBotId };
    localStorage.setItem("appConfig", JSON.stringify(newConfig));
    if (setGlobalConfig) setGlobalConfig(newConfig);
    setShowConfig(false);
  };

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

      {/* 展开状态下才显示导航按钮 */}
      {!sidebarCollapsed && (
        <nav className="flex-1 flex flex-col p-2 space-y-1 relative overflow-visible">
          {buttons.map((btn) => {
            const isActive = activeButton === btn.name;
            return (
              <div key={btn.name} className="relative group w-full">
                <button
                  onClick={async () => {
                    setActiveButton(btn.name);
                    if (sendPrompt) await sendPrompt(btn.description);
                  }}
                  className={`flex items-center gap-3 w-full px-2 py-2 rounded transition-all duration-200
                    ${isActive ? "bg-blue-600 text-white" : "text-gray-800 hover:bg-blue-200 justify-start"}
                    cursor-pointer`}
                >
                  <span className="truncate">{btn.name}</span>
                </button>

                {/* Tooltip */}
                <div
                  className="absolute left-full top-1/2 -translate-y-1/2 ml-2 bg-gray-900 text-white text-xs rounded px-2 py-1 
                             opacity-0 group-hover:opacity-100 transition-opacity z-50 flex flex-col items-start min-w-max"
                >
                  <span className="font-semibold">{btn.name}</span>
                  <span className="text-[10px] mt-0.5">{btn.description || "无描述信息"}</span>
                </div>
              </div>
            );
          })}
        </nav>
      )}

      {/* 底部版本信息 + 设置按钮 */}
      {!sidebarCollapsed && (
        <div className="p-4 border-t border-gray-400 text-gray-600 text-sm flex justify-between items-center">
          <span>v1.0</span>
          <button
            onClick={() => setShowConfig(true)}
            className="text-gray-600 hover:text-gray-900 transition-colors"
          >
            <FiSettings size={18} />
          </button>
        </div>
      )}

      {/* 🧩 设置弹窗（透明背景） */}
      {showConfig && (
        <div className="fixed inset-0 bg-black/30 flex justify-center items-center z-50">
          <div className="bg-white rounded-xl shadow-lg p-6 w-80 space-y-4">
            <h2 className="text-lg font-bold">配置设置</h2>

            <div className="flex flex-col space-y-2">
              <label className="text-sm text-gray-600">Token</label>
              <input
                className="border rounded p-2 text-sm"
                value={token}
                onChange={(e) => setToken(e.target.value)}
                placeholder="请输入 Token"
              />
            </div>

            <div className="flex flex-col space-y-2">
              <label className="text-sm text-gray-600">销售 Agent ID</label>
              <input
                className="border rounded p-2 text-sm"
                value={salesBotId}
                onChange={(e) => setSalesBotId(e.target.value)}
                placeholder="请输入销售 Agent ID"
              />
            </div>

            <div className="flex flex-col space-y-2">
              <label className="text-sm text-gray-600">UI Agent ID</label>
              <input
                className="border rounded p-2 text-sm"
                value={uiBotId}
                onChange={(e) => setUiBotId(e.target.value)}
                placeholder="请输入 UI Agent ID"
              />
            </div>

            <div className="flex justify-end gap-3 pt-2">
              <button
                onClick={() => setShowConfig(false)}
                className="text-gray-600 hover:underline text-sm"
              >
                取消
              </button>
              <button
                onClick={saveConfig}
                className="bg-blue-600 text-white px-4 py-1.5 rounded hover:bg-blue-700 text-sm"
              >
                保存
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}
