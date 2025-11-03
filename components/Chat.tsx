"use client";

import { useState, useRef, useEffect } from "react";

export default function Chat() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [loading, setLoading] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  /** ✅ 自动滚动到底部 */
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  /** ✅ 自动调整 textarea 高度 */
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
    }
  }, [message]);

  /** ✉️ 发送消息（流式） */
  async function sendMessage() {
    if (!message.trim()) return;

    // 添加用户消息
    const newMessages = [...messages, { role: "user", content: message }];
    setMessages(newMessages);
    setMessage("");
    setLoading(true);

    try {
      // 调用后端 API
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message }),
      });

      const reader = res.body?.getReader();
      const decoder = new TextDecoder();
      let aiMessage = "";

      if (!reader) return;

      // 🔁 持续读取 SSE 数据流
      while (true) {
        const { done, value } = await reader.read();
        if (done) break;

        const chunk = decoder.decode(value, { stream: true });
        const events = chunk
          .split("\n\n") // 按 SSE 块拆分
          .map((block) => block.trim())
          .filter(Boolean);

        for (const eventBlock of events) {
          // 解析事件类型
          const [eventLine, ...dataLines] = eventBlock.split("\n");
          const eventType = eventLine.replace(/^event:\s*/, "").trim();
          const dataLine = dataLines.find((l) => l.startsWith("data:"));
          if (!dataLine) continue;

          const data = dataLine.replace(/^data:\s*/, "");
          if (data === "[DONE]") continue;

          try {
            const json = JSON.parse(data);

            // 🌊 普通流式文本
            if (eventType === "conversation.message.delta" && json.content) {
              aiMessage += json.content;
              setMessages([...newMessages, { role: "assistant", content: aiMessage }]);
            }

            // ⚙️ 检测 function_call 类型（插件 / 前端触发）
            else if (json.type === "function_call") {
              const content = JSON.parse(json.content);

              if (content.plugin_name === "Frontend_Trigger") {
                const eventName = content.arguments?.input?.event;
                const payload = content.arguments?.input?.data;
                handleFrontendAction(eventName, payload);
              }
            }

            // ✅ 对话完成
            else if (eventType === "conversation.chat.completed") {
              console.log("✅ 对话完成");
            }
          } catch (err) {
            console.error("解析 SSE 数据出错:", err, data);
          }
        }
      }
    } catch (err) {
      console.error("发送消息出错:", err);
    } finally {
      setLoading(false);
    }
  }

  /** 🧩 处理前端触发指令 */
  function handleFrontendAction(eventName: string, payload: any) {
    switch (eventName) {
      case "update_button":
        console.log("Payload:", payload);
        alert("Agent 请求前端执行 sendInstruction 🚀");
        
        break;

      case "scrollToBottom":
        window.scrollTo({ top: document.body.scrollHeight, behavior: "smooth" });
        break;

      default:
        console.warn("⚠️ 未识别的前端事件:", eventName, payload);
    }
  }

  return (
    <div className="flex flex-col h-screen bg-white text-black">
      {/* 聊天内容区域 */}
      <div className="flex-1 overflow-y-auto p-8 space-y-4 flex flex-col justify-between">
        <div className="flex-1 min-h-[300px] flex flex-col justify-start">
          {/* 初始提示 */}
          {messages.length === 0 && (
            <div className="text-center text-gray-400 px-4 mt-20">
              <div className="text-2xl font-bold">Coze Chat UI</div>
              <div className="mt-2 text-sm">开始和你的 Agent 聊天吧 🚀</div>
            </div>
          )}

          {/* 消息列表 */}
          {messages.map((m, idx) => (
            <div
              key={idx}
              className={`max-w-[70%] p-4 rounded-xl break-words shadow-md mb-2 ${
                m.role === "user"
                  ? "bg-blue-100 self-end text-right"
                  : "bg-gray-100 self-start text-left"
              }`}
            >
              {m.content}
            </div>
          ))}

          {/* AI 打字中... */}
          {loading && (
            <div className="self-start text-gray-500 animate-pulse">AI 正在输入...</div>
          )}

          <div ref={bottomRef} />
        </div>
      </div>

      {/* 输入框区域 */}
      <div className="p-6 flex gap-4 items-end border-t border-gray-200 bg-white">
        <textarea
          ref={textareaRef}
          className="flex-1 p-4 rounded-xl bg-gray-100 border-none resize-none focus:outline-none overflow-hidden"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="发送消息..."
          rows={1}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              sendMessage();
            }
          }}
        />
        <button
          onClick={sendMessage}
          disabled={loading}
          className="bg-blue-700 text-white px-6 py-3 rounded-full shadow-md hover:bg-blue-600 active:bg-blue-800 transition-colors duration-200 flex-shrink-0 cursor-pointer disabled:opacity-50"
        >
          发送
        </button>
      </div>
    </div>
  );
}
