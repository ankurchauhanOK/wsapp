"use client";

import { useState, useRef, useEffect } from "react";
import { handleIncomingMessage } from "@/lib/bot";
import { getStoreUrl } from "@/lib/bot/messages";
import { SendHorizontal, Bot, User, Phone, ExternalLink } from "lucide-react";

interface ChatMessage {
  role: "user" | "bot";
  text: string;
}

const SUGGESTIONS = ["Hi", "Hello", "Hey", "Start", "Shop", "Groceries", "Status", "Help"];

export default function PlaygroundPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      role: "bot",
      text: "👋 Welcome to the WhatsApp bot playground!\n\nType a message below to simulate what customers will see when they message your shop on WhatsApp.",
    },
  ]);
  const [input, setInput] = useState("");
  const endRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  function sendMessage(text: string) {
    const trimmed = text.trim();
    if (!trimmed) return;

    const userMsg: ChatMessage = { role: "user", text: trimmed };
    const response = handleIncomingMessage({ from: "demo-user", text: trimmed });
    const botMsg: ChatMessage = {
      role: "bot",
      text: response?.text ?? "Sorry, I didn't understand that.",
    };

    setMessages((prev) => [...prev, userMsg, botMsg]);
    setInput("");
  }

  return (
    <div className="p-4 max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6">
        <div className="w-10 h-10 rounded-full bg-green-100 flex items-center justify-center">
          <Phone className="w-5 h-5 text-green-600" />
        </div>
        <div>
          <h1 className="text-lg font-bold">Bot Playground</h1>
          <p className="text-sm text-gray-500">Simulate WhatsApp customer messages</p>
        </div>
        <a
          href={getStoreUrl() + "/store"}
          target="_blank"
          className="ml-auto text-xs text-green-600 flex items-center gap-1"
        >
          Storefront <ExternalLink className="w-3 h-3" />
        </a>
      </div>

      {/* Chat */}
      <div className="bg-white rounded-xl border shadow-sm mb-4">
        <div className="h-[400px] overflow-y-auto p-4 space-y-3">
          {messages.map((msg, i) => (
            <div
              key={i}
              className={`flex gap-2 ${msg.role === "user" ? "flex-row-reverse" : ""}`}
            >
              <div
                className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 ${
                  msg.role === "user" ? "bg-blue-100" : "bg-green-100"
                }`}
              >
                {msg.role === "user" ? (
                  <User className="w-4 h-4 text-blue-600" />
                ) : (
                  <Bot className="w-4 h-4 text-green-600" />
                )}
              </div>
              <div
                className={`max-w-[80%] rounded-xl px-3 py-2 text-sm whitespace-pre-wrap ${
                  msg.role === "user"
                    ? "bg-blue-500 text-white rounded-tr-sm"
                    : "bg-gray-100 text-gray-800 rounded-tl-sm"
                }`}
              >
                {msg.text}
              </div>
            </div>
          ))}
          <div ref={endRef} />
        </div>

        {/* Suggestions */}
        <div className="px-4 pb-3 flex flex-wrap gap-1.5 border-t pt-3">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => sendMessage(s)}
              className="text-xs px-2.5 py-1 rounded-full border text-gray-500 hover:bg-gray-50 hover:border-gray-300 transition-colors"
            >
              {s}
            </button>
          ))}
        </div>

        {/* Input */}
        <div className="border-t p-3 flex gap-2">
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage(input)}
            placeholder="Type a customer message..."
            className="flex-1 text-sm border rounded-lg px-3 py-2 outline-none focus:border-green-400"
          />
          <button
            onClick={() => sendMessage(input)}
            className="w-9 h-9 rounded-lg bg-green-600 text-white flex items-center justify-center hover:bg-green-700 shrink-0"
          >
            <SendHorizontal className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Info */}
      <div className="text-xs text-gray-400 space-y-1">
        <p>
          <strong>Store URL:</strong> <code className="bg-gray-100 px-1">{getStoreUrl()}/store</code>
        </p>
        <p>
          Configure via <code className="bg-gray-100 px-1">NEXT_PUBLIC_STORE_URL</code> in
          .env.local
        </p>
        <p>
          <strong>WhatsApp link:</strong>{" "}
          <code className="bg-gray-100 px-1">https://wa.me/917017846105</code>
        </p>
        <p>
          Ready for Meta WhatsApp Cloud API — see <code className="bg-gray-100 px-1">/api/webhook</code>
        </p>
      </div>
    </div>
  );
}
