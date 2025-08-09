"use client";

import React, { useState } from "react";
import { ChatSlots } from "@/lib/utils/askAI";

export default function ChatAssistant() {
  const [messages, setMessages] = useState<{ from: "user" | "bot"; text: string }[]>([]);
  const [input, setInput] = useState("");
  const [slots, setSlots] = useState<ChatSlots>({});
  const [isFirstTurn, setIsFirstTurn] = useState(true);
  const [loading, setLoading] = useState(false);
  const [firstTwoCards, setFirstTwoCards] = useState<string[]>([]); // store first 2 card names from intro

  const sendMessage = async (msg?: string) => {
    const messageToSend = msg || input.trim();
    if (!messageToSend) return;

    setMessages((prev) => [...prev, { from: "user", text: messageToSend }]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: messageToSend, slots, firstTurn: isFirstTurn }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      // Extract first two card names from intro
      if (isFirstTurn && data.reply) {
        const matches = [...data.reply.matchAll(/^(.+?) —/gm)].map((m) => m[1]);
        if (matches.length >= 2) {
          setFirstTwoCards(matches.slice(0, 2));
        }
      }

      setMessages((prev) => [...prev, { from: "bot", text: data.reply }]);
      setSlots(data.slots || {});
      setIsFirstTurn(false);
    } catch (err) {
      console.error("Chat error:", err);
      setMessages((prev) => [...prev, { from: "bot", text: "⚠️ Something went wrong. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAction = (type: "learn" | "compare") => {
    if (type === "learn") {
      sendMessage("learn more");
    } else if (type === "compare" && firstTwoCards.length === 2) {
      sendMessage(`compare ${firstTwoCards[0]} vs ${firstTwoCards[1]}`);
    }
  };

  return (
    <div className="flex flex-col w-full max-w-md mx-auto border rounded-lg shadow-md bg-white">
      <div className="p-4 flex-1 overflow-y-auto space-y-3">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`p-2 rounded-lg max-w-[80%] ${
              m.from === "user" ? "bg-blue-100 self-end" : "bg-gray-100 self-start"
            }`}
          >
            {m.text}
            {/* Show quick actions after first bot intro */}
            {idx === 0 && m.from === "bot" && firstTwoCards.length === 2 && (
              <div className="mt-2 flex gap-2">
                <button
                  className="px-3 py-1 text-sm bg-green-200 rounded"
                  onClick={() => handleQuickAction("learn")}
                >
                  Learn More
                </button>
                <button
                  className="px-3 py-1 text-sm bg-yellow-200 rounded"
                  onClick={() => handleQuickAction("compare")}
                >
                  Compare Cards
                </button>
              </div>
            )}
          </div>
        ))}
        {loading && <div className="text-gray-500">Bot is typing...</div>}
      </div>

      <div className="flex border-t p-2">
        <input
          type="text"
          className="flex-1 p-2 border rounded-lg mr-2"
          placeholder="Type your message..."
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <button
          className="bg-blue-500 text-white px-4 py-2 rounded-lg"
          onClick={() => sendMessage()}
          disabled={loading}
        >
          Send
        </button>
      </div>
    </div>
  );
}
