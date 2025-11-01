"use client";

import { useState } from "react";

export default function Chat() {
  const [message, setMessage] = useState("");
  const [messages, setMessages] = useState<{ role: string; content: string }[]>(
    []
  );
  const [loading, setLoading] = useState(false);

  async function sendMessage() {
    if (!message.trim()) return;

    const newMessages = [...messages, { role: "user", content: message }];
    setMessages(newMessages);
    setMessage("");
    setLoading(true);

    // 调用 API
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
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-auto p-2 space-y-2 border rounded bg-white">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`p-2 rounded ${
              m.role === "user" ? "bg-blue-100 self-end" : "bg-gray-100 self-start"
            }`}
          >
            {m.content}
          </div>
        ))}
        {loading && <div className="text-gray-500">AI 正在输入...</div>}
      </div>

      <div className="mt-2 flex">
        <textarea
          className="flex-1 border p-2 rounded"
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="输入消息..."
        />
        <button
          onClick={sendMessage}
          className="ml-2 bg-blue-500 text-white px-4 py-2 rounded"
        >
          发送
        </button>
      </div>
    </div>
  );
}
