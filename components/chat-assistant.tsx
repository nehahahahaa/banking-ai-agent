"use client";

import React, { useMemo, useState } from "react";
import { ChatSlots } from "@/lib/utils/askAI";

type Props = {
  language: string;
  userContext: {
    income: number;
    age: number;
    employment: string;
    preference: string | null;
  };
};

export function ChatAssistant({ language, userContext }: Props) {
  const [messages, setMessages] = useState<{ from: "user" | "bot"; text: string }[]>([]);
  const [input, setInput] = useState("");
  const [slots, setSlots] = useState<ChatSlots>({
    income: userContext?.income ?? null,
    age: userContext?.age ?? null,
    employment: userContext?.employment ?? null,
    preference: userContext?.preference ?? null,
    hasCosigner: null,
  });
  const [context, setContext] = useState<any>({}); // persist compare/learn mode between turns
  const [isFirstTurn, setIsFirstTurn] = useState(true);
  const [loading, setLoading] = useState(false);

  // parsed from the numbered intro reply (e.g., "1. Card — perks")
  const [firstTwoCards, setFirstTwoCards] = useState<string[]>([]);
  // actions from API: ["recommend", "learn", "compare"]
  const [actions, setActions] = useState<string[]>([]);

  const firstBotIndex = useMemo(
    () => messages.findIndex((m) => m.from === "bot"),
    [messages]
  );

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
        body: JSON.stringify({
          message: messageToSend,
          slots,
          firstTurn: isFirstTurn,
          context, // 🔁 keep intent alive (e.g., compare mode)
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      // Extract first two card names from the numbered intro (lines like: "1. Card — perks")
      if (isFirstTurn && data.reply) {
        const matches = [...String(data.reply).matchAll(/^\s*\d+\.\s(.+?)\s—/gm)].map((m) => m[1]);
        if (matches.length >= 2) setFirstTwoCards(matches.slice(0, 2));
      }

      // Save actions for showing the 3 quick buttons
      setActions(Array.isArray(data.actions) ? data.actions : []);

      setMessages((prev) => [...prev, { from: "bot", text: data.reply }]);
      setSlots(data.slots || {});
      setContext(data.context || {});
      setIsFirstTurn(false);
    } catch (err) {
      console.error("Chat error:", err);
      setMessages((prev) => [
        ...prev,
        { from: "bot", text: "⚠️ Something went wrong. Please try again." },
      ]);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAction = (type: "recommend" | "learn" | "compare") => {
    if (type === "recommend") {
      sendMessage("recommend a card for me");
    } else if (type === "learn") {
      sendMessage("learn more");
    } else if (type === "compare") {
      // build a compare query from the first two intro cards (agent-driven)
      if (firstTwoCards.length >= 2) {
        sendMessage(`compare ${firstTwoCards[0]} vs ${firstTwoCards[1]}`);
      } else {
        // fallback if parsing failed—still agent-driven, just nudge user
        sendMessage("compare 1 vs 2");
      }
    }
  };

  return (
    <div className="fixed bottom-6 right-6 z-50 w-[350px] max-w-[calc(100vw-2rem)] flex flex-col border rounded-lg shadow-md bg-white">
      <div className="p-4 flex-1 overflow-y-auto space-y-3">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`p-2 rounded-lg max-w-[80%] ${
              m.from === "user" ? "bg-blue-100 self-end" : "bg-gray-100 self-start"
            }`}
          >
            {m.text}

            {/* Quick actions on the very first bot message, only when API returns actions */}
            {m.from === "bot" &&
              idx === firstBotIndex &&
              actions.length > 0 && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {actions.includes("recommend") && (
                    <button
                      className="px-3 py-1 text-sm bg-blue-600 text-white rounded"
                      onClick={() => handleQuickAction("recommend")}
                    >
                      Recommend a card for me
                    </button>
                  )}
                  {actions.includes("learn") && (
                    <button
                      className="px-3 py-1 text-sm bg-green-200 rounded"
                      onClick={() => handleQuickAction("learn")}
                    >
                      Learn More
                    </button>
                  )}
                  {actions.includes("compare") && (
                    <button
                      className="px-3 py-1 text-sm bg-yellow-200 rounded"
                      onClick={() => handleQuickAction("compare")}
                    >
                      Compare Cards
                    </button>
                  )}
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
