"use client";

import { useState, useRef, useEffect } from "react";

export default function Chat() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<{ role: string; content: string }[]>(
    []
  );
  const [loading, setLoading] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // 滚动到底部
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 自动调整textarea高度
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
    }
  }, [message]);

  async function sendMessage() {
    if (!message.trim()) return;

    const newMessages = [...messages, { role: "user", content: message }];
    setMessages(newMessages);
    setMessage("");
    setLoading(true);

    // 调用后端 API
    const res = await fetch("/api/chat", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ message }),
    });
    const data = await res.json();

    setMessages([
      ...newMessages,
      { role: "assistant", content: data.messages?.[0]?.content || "" },
    ]);
    setLoading(false);
  }

  return (
    <div className="flex flex-col h-screen bg-white text-black">
      {/* 聊天内容区域 */}
      <div className="flex-1 overflow-y-auto p-8 space-y-4 flex flex-col justify-between">
        <div className="flex-1 min-h-[300px] flex flex-col justify-start">
          {/* 欢迎信息 */}
          {messages.length === 0 && (
            <div className="text-center text-gray-400 px-4 mt-20">
              <div className="text-2xl font-bold">Chatbot UI</div>
              <div className="mt-2 text-sm">开始聊天吧</div>
            </div>
          )}

          {/* 消息列表 */}
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`max-w-[70%] p-4 rounded-xl break-words shadow-md ${
                m.role === "user"
                  ? "bg-gray-200 self-end text-right" // 用户消息靠右
                  : "bg-gray-100 self-start text-left" // AI消息靠左
              }`}
            >
              {m.content}
            </div>
          ))}

          {/* 加载中 */}
          {loading && (
            <div className="self-start text-gray-500 animate-pulse">
              AI 正在输入...
            </div>
          )}
          <div ref={bottomRef} />
        </div>
      </div>

      {/* 输入框区域 */}
      <div className="p-6 flex gap-4 items-end" style={{ paddingBottom: "32px" }}>
        <textarea
          ref={textareaRef}
          className="flex-1 p-4 rounded-xl bg-gray-100 border-none resize-none focus:outline-none overflow-hidden"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="发送消息..."
          rows={1}
        />
        <button
          onClick={sendMessage}
          className="
            bg-blue-700 
            text-white 
            px-6 py-3 
            rounded-full 
            shadow-md 
            hover:bg-blue-600 
            active:bg-blue-800 
            transition-colors 
            duration-200
            flex-shrink-0
            cursor-pointer
          "
        >
          发送
        </button>
      </div>
    </div>
  );
}
