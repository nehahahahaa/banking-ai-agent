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
  const [isOpen, setIsOpen] = useState(false);

  const [messages, setMessages] = useState<{ from: "user" | "bot"; text: string }[]>([]);
  const [input, setInput] = useState("");
  const [slots, setSlots] = useState<ChatSlots>({
    income: userContext?.income ?? null,
    age: userContext?.age ?? null,
    employment: userContext?.employment ?? null,
    preference: userContext?.preference ?? null,
    hasCosigner: null,
  });

  // 🔁 Persist multi-turn intent (e.g., compare/learn) with the backend
  const [context, setContext] = useState<any>({});

  const [isFirstTurn, setIsFirstTurn] = useState(true);
  const [loading, setLoading] = useState(false);

  // Parsed from the numbered intro reply: "1. Card — perks"
  const [firstTwoCards, setFirstTwoCards] = useState<string[]>([]);

  // actions from API (e.g., ["recommend","learn","compare"] or ["apply","compare","check_eligibility"])
  const [actions, setActions] = useState<string[]>([]);
  // optional 💡 tip string from API (after Learn More)
  const [tip, setTip] = useState<string>("");

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
          context, // 🔁 round-trip context to persist compare/learn mode
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      // Extract first two card names from numbered intro lines (e.g., "1. Professional Plus Card — ...")
      if (isFirstTurn && data.reply) {
        const matches = [...String(data.reply).matchAll(/^\s*\d+\.\s(.+?)\s—/gm)].map((m) => m[1]);
        if (matches.length >= 2) setFirstTwoCards(matches.slice(0, 2));
      }

      // Save actions/tip/context from backend
      setActions(Array.isArray(data.actions) ? data.actions : []);
      setTip(typeof data.tip === "string" ? data.tip : "");
      setContext(data.context || {}); // 🔁 keep backend intent state

      setMessages((prev) => [...prev, { from: "bot", text: data.reply }]);
      setSlots(data.slots || {});
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

  const handleIntroQuickAction = (type: "recommend" | "learn" | "compare") => {
    if (type === "recommend") {
      sendMessage("recommend a card for me");
    } else if (type === "learn") {
      sendMessage("learn more");
    } else if (type === "compare") {
      if (firstTwoCards.length >= 2) {
        sendMessage(`compare ${firstTwoCards[0]} vs ${firstTwoCards[1]}`);
      } else {
        sendMessage("compare 1 vs 2"); // safe fallback
      }
    }
  };

  if (!isOpen) {
    return (
      <button
        className="fixed bottom-6 right-6 bg-blue-600 hover:bg-blue-700 text-white rounded-full w-12 h-12 shadow-lg flex items-center justify-center text-xl"
        onClick={() => setIsOpen(true)}
        aria-label="Open chat"
        title="Open chat"
      >
        💬
      </button>
    );
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-[360px] max-w-[calc(100vw-2rem)] flex flex-col border rounded-2xl shadow-2xl bg-white">
      {/* Header with close */}
      <div className="flex items-center justify-between px-4 py-3 bg-blue-700 text-white rounded-t-2xl">
        <div className="font-semibold">Banking Assistant</div>
        <button
          onClick={() => setIsOpen(false)}
          className="px-2 py-1 rounded hover:bg-blue-600"
          aria-label="Close chat"
          title="Close chat"
        >
          ×
        </button>
      </div>

      {/* Messages */}
      <div className="p-4 flex-1 overflow-y-auto space-y-3">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`p-2 rounded-lg max-w-[80%] ${
              m.from === "user" ? "bg-blue-100 self-end ml-auto" : "bg-gray-100 self-start"
            }`}
          >
            {m.text}

            {/* Intro quick actions from API (e.g., ["recommend","learn","compare"]) */}
            {m.from === "bot" &&
              idx === firstBotIndex &&
              actions.length > 0 &&
              // Show when the first bot message contains intro actions
              (actions.includes("recommend") || actions.includes("learn") || actions.includes("compare")) && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {actions.includes("recommend") && (
                    <button
                      className="px-3 py-1 text-sm bg-blue-600 text-white rounded"
                      onClick={() => handleIntroQuickAction("recommend")}
                    >
                      Recommend a card for me
                    </button>
                  )}
                  {actions.includes("learn") && (
                    <button
                      className="px-3 py-1 text-sm bg-green-200 rounded"
                      onClick={() => handleIntroQuickAction("learn")}
                    >
                      Learn More
                    </button>
                  )}
                  {actions.includes("compare") && (
                    <button
                      className="px-3 py-1 text-sm bg-yellow-200 rounded"
                      onClick={() => handleIntroQuickAction("compare")}
                    >
                      Compare Cards
                    </button>
                  )}
                </div>
              )}

            {/* Learn More next-step actions (apply/compare/check_eligibility) + Tip */}
            {m.from === "bot" &&
              idx === messages.length - 1 &&
              actions.length > 0 &&
              // Show when backend sent learn-more actions
              (actions.includes("apply") || actions.includes("check_eligibility") || actions.includes("compare")) && (
                <div className="mt-3 flex flex-col gap-3">
                  <div className="flex flex-wrap gap-2">
                    {actions.includes("apply") && (
                      <button
                        className="px-3 py-1 text-sm bg-blue-600 text-white rounded"
                        onClick={() => sendMessage("apply now")}
                      >
                        Apply / Continue
                      </button>
                    )}
                    {actions.includes("compare") && (
                      <button
                        className="px-3 py-1 text-sm bg-yellow-200 rounded"
                        onClick={() => sendMessage("compare with")}
                      >
                        Compare this with another card
                      </button>
                    )}
                    {actions.includes("check_eligibility") && (
                      <button
                        className="px-3 py-1 text-sm bg-green-200 rounded"
                        onClick={() => sendMessage("check if I’m eligible")}
                      >
                        Check if I’m eligible
                      </button>
                    )}
                  </div>
                  {tip && <div className="text-xs text-gray-600 whitespace-pre-line">{tip}</div>}
                </div>
              )}
          </div>
        ))}
        {loading && <div className="text-gray-500">Bot is typing...</div>}
      </div>

      {/* Composer */}
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
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
          onClick={() => sendMessage()}
          disabled={loading}
        >
          Send
        </button>
      </div>
    </div>
  );
}
