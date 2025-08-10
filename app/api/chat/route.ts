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
  const [context, setContext] = useState<any>({});
  const [firstTurn, setFirstTurn] = useState(true);
  const [loading, setLoading] = useState(false);
  const [firstTwoCards, setFirstTwoCards] = useState<string[]>([]);
  const [actions, setActions] = useState<string[]>([]); // ["recommend","learn","compare"]
  const [tip, setTip] = useState<string | null>(null);

  const firstBotIndex = useMemo(
    () => messages.findIndex((m) => m.from === "bot"),
    [messages]
  );

  const sendMessage = async (msg?: string) => {
    const messageToSend = (msg ?? input).trim();
    if (!messageToSend) return;

    setMessages((prev) => [...prev, { from: "user", text: messageToSend }]);
    setInput("");
    setLoading(true);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: messageToSend, slots, firstTurn, context }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      // Parse first two card names from numbered intro like "1. Card — ..."
      if (firstTurn && data.reply) {
        const matches = [...String(data.reply).matchAll(/^\s*\d+\.\s(.+?)\s—/gm)].map((m) => m[1]);
        if (matches.length >= 2) setFirstTwoCards(matches.slice(0, 2));
      }

      setMessages((prev) => [...prev, { from: "bot", text: data.reply }]);
      setSlots(data.slots || {});
      setContext(data.context || {});
      setActions(Array.isArray(data.actions) ? data.actions : []);
      setTip(typeof data.tip === "string" ? data.tip : null);
      setFirstTurn(false);
    } catch (err) {
      console.error("Chat error:", err);
      setMessages((prev) => [...prev, { from: "bot", text: "⚠️ Something went wrong. Please try again." }]);
    } finally {
      setLoading(false);
    }
  };

  const handleQuickAction = (action: string) => {
    if (action === "learn") return sendMessage("learn more");
    if (action === "recommend") return sendMessage("recommend a card for me");
    if (action === "compare") {
      // If we already selected a card in learn mode, server handles bare "compare" / "compare with"
      if (context?.selectedCard) return sendMessage("compare with");
      // else just start compare flow
      return sendMessage("compare");
    }
    if (action === "apply") return sendMessage("apply now");
    if (action === "check_eligibility") return sendMessage("Am I eligible?");
  };

  /* FAB closed state */
  if (!isOpen) {
    return (
      <button
        className="fixed bottom-6 right-6 w-14 h-14 rounded-full bg-blue-800 text-white shadow-lg"
        onClick={() => setIsOpen(true)}
        aria-label="Open chat"
        title="Open chat"
      >
        💬
      </button>
    );
  }

  /* Open panel */
  return (
    <div className="fixed bottom-6 right-6 z-50 w-[360px] max-w-[calc(100vw-2rem)] flex flex-col border rounded-2xl shadow-2xl bg-white">
      <div className="flex items-center justify-between px-4 py-3 bg-blue-800 text-white rounded-t-2xl">
        <div className="font-semibold">Banking Assistant</div>
        <button onClick={() => setIsOpen(false)} aria-label="Close chat">✕</button>
      </div>

      <div className="p-4 flex-1 overflow-y-auto space-y-3">
        {messages.map((m, idx) => (
          <div
            key={idx}
            className={`p-2 rounded-lg max-w-[84%] ${
              m.from === "user" ? "bg-blue-100 self-end" : "bg-gray-100 self-start"
            }`}
          >
            <div className="whitespace-pre-wrap">{m.text}</div>

            {/* Show quick actions on the FIRST bot message */}
            {m.from === "bot" &&
              idx === firstBotIndex &&
              actions.length > 0 && (
                <div className="mt-2 flex flex-wrap gap-2">
                  {actions.includes("recommend") && (
                    <button
                      className="px-3 py-1 text-sm bg-blue-200 rounded"
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
                  {actions.includes("apply") && (
                    <button
                      className="px-3 py-1 text-sm bg-purple-200 rounded"
                      onClick={() => handleQuickAction("apply")}
                    >
                      Apply / Continue
                    </button>
                  )}
                  {actions.includes("check_eligibility") && (
                    <button
                      className="px-3 py-1 text-sm bg-orange-200 rounded"
                      onClick={() => handleQuickAction("check_eligibility")}
                    >
                      Check if I’m eligible
                    </button>
                  )}
                </div>
              )}

            {/* Optional tip block */}
            {m.from === "bot" && idx === firstBotIndex && tip && (
              <div className="mt-2 text-xs text-gray-600 whitespace-pre-wrap">{tip}</div>
            )}
          </div>
        ))}
        {loading && <div className="text-gray-500">Bot is typing...</div>}
      </div>

      <div className="flex border-t p-2 gap-2">
        <input
          type="text"
          className="flex-1 p-2 border rounded-lg"
          placeholder="Type your message…"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <button
          className="bg-blue-600 text-white px-4 py-2 rounded-lg"
          onClick={() => sendMessage()}
          disabled={loading}
        >
          Send
        </button>
      </div>
    </div>
  );
}

export default ChatAssistant;
