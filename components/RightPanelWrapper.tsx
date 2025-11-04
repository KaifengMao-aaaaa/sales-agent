"use client";
import { ReactNode } from "react";
import { FiArrowRight } from "react-icons/fi";
import { useGlobal } from "@/context/GlobalContext";

interface RightPanelWrapperProps {
  title?: string;
  children: ReactNode;
}

export default function RightPanelWrapper({ title, children }: RightPanelWrapperProps) {
  const { setRightPanelComponent } = useGlobal();

  return (
    <div className="h-screen w-full flex flex-col bg-gray-50">
      {/* 顶部栏 */}
      <div className="flex items-center p-4 border-b border-gray-200 bg-white">
        <button
          onClick={() => setRightPanelComponent(null)}
          className="p-2 mr-2 rounded-full hover:bg-gray-100 transition cursor-pointer"
        >
          <FiArrowRight className="text-lg text-gray-700" />
        </button>
        <h1 className="text-lg font-medium text-gray-800">{title || "返回"}</h1>
      </div>

      {/* 内容区域 */}
      <div className="flex-1 overflow-auto p-4">{children}</div>
    </div>
  );
}
