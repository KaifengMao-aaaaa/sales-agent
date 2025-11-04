"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useGlobal } from "@/context/GlobalContext";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import CustomerTable from "./CustomerTable";
import RightPanelWrapper from "./RightPanelWrapper";

export default function Chat() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<{ role: string; content: string }[]>([]);
  const [loading, setLoading] = useState(false);
  const [conversationId, setConversationId] = useState<string | null>(null);

  const { refreshButtons, setSendPrompt, setRightPanelComponent, globalConfig } = useGlobal();
  const bottomRef = useRef<HTMLDivElement>(null);
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  const isConfigReady = globalConfig && Object.keys(globalConfig).length > 0 && globalConfig.salesBotId && globalConfig.token && globalConfig.uiBotId;
  /* ---------- 副作用 ---------- */

  // 自动滚动到底部
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // 自动调整输入框高度
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = "auto";
      textareaRef.current.style.height = textareaRef.current.scrollHeight + "px";
    }
  }, [message]);

  /* ---------- 核心函数 ---------- */
  /** ✉️ 发送消息（主函数） */
  const sendMessage = useCallback(
    async (userInput: string) => {
      if (!userInput.trim()) return;

      setMessages((prev) => [...prev, { role: "user", content: userInput }]);
      setMessage("");
      setLoading(true);

      // 先插入一个空的 assistant 消息
      let aiMessage = "";
      setMessages((prev) => [...prev, { role: "assistant", content: aiMessage }]);

      try {
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            message: userInput,
            bot_id: globalConfig.salesBotId,
            conversation_id: conversationId,
            auth_token: globalConfig.token
          }),
        });
        if (!res.body) throw new Error("SSE stream not available");
        await handleSSEStream(res.body.getReader(), aiMessage);
      } catch (err) {
        console.error("发送消息出错:", err);
      } finally {
        setLoading(false);
      }
    },
    [conversationId, globalConfig]
  );
  // 注册 sendPrompt 到全局上下文
  useEffect(() => {
    setSendPrompt(() => sendMessage);
  }, [sendMessage, setSendPrompt]);

  /** 🌊 处理 SSE 数据流 */
  const handleSSEStream = async (reader: ReadableStreamDefaultReader<Uint8Array>, aiMessage: string) => {
    const decoder = new TextDecoder();

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const events = chunk.split("\n\n").map((b) => b.trim()).filter(Boolean);
      for (const block of events) {
        const [eventLine, ...dataLines] = block.split("\n");
        const eventType = eventLine.replace(/^event:\s*/, "").trim();
        const data = dataLines.find((l) => l.startsWith("data:"))?.replace(/^data:\s*/, "");
        if (!data || data === "[DONE]") continue;

        try {
          const json = JSON.parse(data);
          if (json.conversation_id) setConversationId(json.conversation_id);

          if (eventType === "conversation.message.delta" && json.content) {
            aiMessage += json.content;
            updateLastAssistant(aiMessage);
          } else if (json.type === "function_call") {
            aiMessage = await handleFunctionCall(json, aiMessage);
          }
        } catch (err) {
          console.error("解析 SSE 数据出错:", err, data);
        }
      }
    }
  };

  /** 🤖 处理 function_call 指令 */
  const handleFunctionCall = async (json: any, aiMessage: string) => {
    try {
      const content = JSON.parse(json.content);
      if (content.plugin === "event trigger") {
        const response = await handleFrontendAction(content.api_name, content.arguments);
        aiMessage += response;
        return aiMessage
      }
    } catch (err) {
      console.error("解析 function_call 出错:", err);
    }
    return aiMessage
  };

  /** 🔧 更新最后一条 assistant 消息 */
  const updateLastAssistant = (newContent: string) => {
    setMessages((prev) => {
      const last = prev[prev.length - 1];
      if (last?.role === "assistant") {
        return [...prev.slice(0, -1), { role: "assistant", content:  newContent }];
      }
      return [...prev, { role: "assistant", content: newContent }];
    });
  };

  /** 🧩 处理前端触发的事件 */
  const handleFrontendAction = async (eventName: string, payload: any) => {
    switch (eventName) {
      case "button_event":
        return await handleButtonEvent(payload);
      case "show_data":
        console.log("trigger event")
        return handleShowData(payload);
      case "show_markdown":
        return handleShowMarkdown(payload);
      default:
        console.warn("⚠️ 未识别的事件:", eventName, payload);
        return "";
    }
  };

  /** 📊 按钮触发逻辑 */
  const handleButtonEvent = async (payload: any) => {
    try {
      const userRequest = payload.prompt;
      if (!userRequest) throw new Error("缺少 prompt");

      const buttonsRes = await fetch("/api/buttons", {
        headers: { Authorization: `Bearer ${globalConfig.token}` },
      });
      const currentButtons = await buttonsRes.json();

      const message = JSON.stringify({ current_buttons: currentButtons, user_request: userRequest });
      const chatRes = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message, bot_id: globalConfig.uiBotId, auth_token: globalConfig.token }),
      });

      if (!chatRes.body) throw new Error("后端响应为空");

      const result = await parseSSEToCompletion(chatRes.body);
      const parsed = JSON.parse(result);
      const updatedButtons = parsed.buttons || [];
      const userResponse = parsed.response || "";

      await fetch("/api/buttons", {
        method: "POST",
        headers: { "Content-Type": "application/json",  Authorization: `Bearer ${globalConfig.token}`},
        body: JSON.stringify(updatedButtons),
      });

      if (refreshButtons) refreshButtons();
      return userResponse;
    } catch (err) {
      console.error("处理 button_event 出错:", err);
      return "";
    }
  };

  /** 📈 显示表格 */
  const handleShowData = (payload: any) => {
    const raw = JSON.parse(payload.data);
    const keys = Object.keys(raw);
    const rowCount = Math.max(...Object.values(raw).map((arr: any[]) => arr.length));
    const rows = Array.from({ length: rowCount }, (_, i) =>
      Object.fromEntries(keys.map((k) => [k, raw[k][i] ?? null]))
    );

    setRightPanelComponent(<CustomerTable data={rows} />);
    return "";
  };

  /** 📖 显示 Markdown */
  const handleShowMarkdown = (payload: any) => {
    setRightPanelComponent(
      <RightPanelWrapper title="内容">
        <div className="overflow-y-auto h-full bg-white text-gray-800 prose prose-blue max-w-none">
          <ReactMarkdown remarkPlugins={[remarkGfm]}>{payload.markdown}</ReactMarkdown>
        </div>
      </RightPanelWrapper>
    );
    return "";
  };

  /** 🧩 解析 SSE 完整结果 */
  const parseSSEToCompletion = async (body: ReadableStream<Uint8Array>) => {
    const reader = body.getReader();
    const decoder = new TextDecoder();
    let result = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      const chunk = decoder.decode(value, { stream: true });
      const events = chunk.split("\n\n").map((b) => b.trim()).filter(Boolean);

      for (const block of events) {
        const data = block.split("\n").find((l) => l.startsWith("data:"))?.replace(/^data:\s*/, "");
        if (!data || data === "[DONE]") continue;
        const json = JSON.parse(data);
        if (json.type === "answer") result = json.content;
      }
    }
    return result;
  };

  /* ---------- UI ---------- */

  const clearChat = () => {
    if (window.confirm("确定要清空聊天记录吗？")) {
      setMessages([]);
      setConversationId(null);
      setMessage("");
    }
  };
  if (!isConfigReady) {
    return (
      <div className="flex flex-col items-center justify-center h-screen bg-gray-50 text-gray-600">
        <div className="text-2xl font-bold mb-2">⚙️ 请先配置 Global Config</div>
        <div className="text-sm">当前还未检测到全局配置，请在设置页中进行配置。</div>
      </div>
    );
  }
  return (
    <div className="flex flex-col h-screen bg-white text-black">
      {/* 聊天内容 */}
      <div className="flex-1 overflow-y-auto p-8 space-y-4 flex flex-col justify-start">
        {messages.length === 0 && (
          <div className="text-center text-gray-400 px-4 mt-20">
            <div className="text-2xl font-bold">Sales Chat</div>
            <div className="mt-2 text-sm">开始和你的 Agent 聊天吧 🚀</div>
          </div>
        )}

        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`max-w-[70%] p-4 rounded-xl break-words shadow-md mb-2 ${
              m.role === "user" ? "bg-blue-100 self-end text-left" : "bg-gray-100 self-start text-left"
            }`}
          >
            <div className="prose max-w-none prose-headings:text-blue-700 prose-a:text-blue-500 hover:prose-a:underline">
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{m.content}</ReactMarkdown>
            </div>
          </div>
        ))}
        {loading && <div className="self-start text-gray-500 animate-pulse">AI 正在输入...</div>}
        <div ref={bottomRef} />
      </div>

      {/* 输入栏 */}
      <div className="p-6 flex gap-4 items-end border-t border-gray-200 bg-white">
        <button
          onClick={clearChat}
          className="bg-gray-300 text-gray-800 px-4 py-3 rounded-full shadow-md hover:bg-gray-400 active:bg-gray-500 transition-colors duration-200 flex-shrink-0"
        >
          清空
        </button>

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
              sendMessage(message);
            }
          }}
        />

        <button
          onClick={() => sendMessage(message)}
          disabled={loading}
          className="bg-blue-700 text-white px-6 py-3 rounded-full shadow-md hover:bg-blue-600 active:bg-blue-800 transition-colors duration-200 flex-shrink-0 cursor-pointer disabled:opacity-50"
        >
          发送
        </button>
      </div>
    </div>
  );
}
