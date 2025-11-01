"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function Sidebar() {
  const [active, setActive] = useState("GPT 聊天");
  const router = useRouter();

  const buttons = ["GPT 聊天", "功能二", "客户信息"];

  return (
    <aside className="w-72 bg-gray-200 text-gray-900 flex flex-col shadow-lg">
      {/* 标题 */}
      <div className="p-6 text-xl font-bold border-b border-gray-400">
        菜单
      </div>

      {/* 导航按钮 */}
      <nav className="flex-1 p-4 space-y-3">
        {buttons.map((btn) => {
          const isActive = active === btn;

          // 点击处理
          const handleClick = () => {
            setActive(btn);
            if (btn === "客户信息") {
              router.push("/customers"); // 跳转到客户信息页面
            } else {
              router.push("/"); // 默认主页
            }
          };

          return (
            <button
              key={btn}
              onClick={handleClick}
              className={`
                w-full text-left px-4 py-3 rounded-lg flex items-center
                transition-all duration-200
                cursor-pointer
                ${isActive ? "bg-blue-600 text-white shadow-md" : "text-gray-800"}
                hover:bg-blue-200 hover:scale-105
              `}
            >
              {btn}
            </button>
          );
        })}
      </nav>

      {/* 底部信息 */}
      <div className="p-4 border-t border-gray-400 text-gray-600 text-sm">
        v1.0
      </div>
    </aside>
  );
}
