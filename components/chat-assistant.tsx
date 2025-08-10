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

function normalizeActionKeys(actions: unknown): string[] {
  if (!Array.isArray(actions)) return [];
  return actions
    .map((a) => (typeof a === "string" ? a.trim().toLowerCase() : ""))
    .filter(Boolean);
}

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

  // Server-driven multi-turn state
  const [context, setContext] = useState<any>({});

  const [isFirstTurn, setIsFirstTurn] = useState(true);
  const [loading, setLoading] = useState(false);

  // For default compare from intro (if needed)
  const [firstTwoCards, setFirstTwoCards] = useState<string[]>([]);

  // Server-driven actions/tip/meta
  const [actions, setActions] = useState<string[]>([]);
  const [tip, setTip] = useState<string>("");
  const [meta, setMeta] = useState<any>({});

  // Normalize actions for robust matching
  const normActions = useMemo(() => {
    const arr = normalizeActionKeys(actions);
    return new Set(arr); // lowercase keys
  }, [actions]);

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
        cache: "no-store", // avoid stale Vercel cache
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: messageToSend,
          slots,
          firstTurn: isFirstTurn,
          context, // round-trip server state
        }),
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();

      // Parse two card names from numbered intro "1. Card — ..."
      if (isFirstTurn && data.reply) {
        const matches = [...String(data.reply).matchAll(/^\s*\d+\.\s(.+?)\s—/gm)].map((m) => m[1]);
        if (matches.length >= 2) setFirstTwoCards(matches.slice(0, 2));
      }

      setActions(Array.isArray(data.actions) ? data.actions : []);
      setTip(typeof data.tip === "string" ? data.tip : "");
      setMeta(data.meta || {});
      setContext(data.context || {});

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

  // First-intro quick actions
  const handleIntroQuickAction = (type: "recommend" | "learn" | "compare") => {
    if (type === "recommend") {
      sendMessage("recommend a card for me");
    } else if (type === "learn") {
      sendMessage("learn more");
    } else if (type === "compare") {
      if (firstTwoCards.length >= 2) {
        sendMessage(`compare ${firstTwoCards[0]} vs ${firstTwoCards[1]}`);
      } else {
        sendMessage("compare 1 vs 2"); // safe fallback if intro parse changes
      }
    }
  };

  // Render server-driven buttons + tip for a given bot message index
  const renderActions = (whereIdx: number) => {
    // Only render buttons for the most recent bot message,
    // except for the very first bot message where we show the 3 intro buttons.
    const isLatestBot = whereIdx === messages.length - 1;
    const isFirstBot = whereIdx === firstBotIndex;

    // Case 1: First bot reply → exactly 3 buttons
    if (
      isFirstBot &&
      (normActions.has("recommend") || normActions.has("learn") || normActions.has("compare"))
    ) {
      return (
        <>
          <div className="mt-3 flex flex-wrap gap-2">
            {normActions.has("recommend") && (
              <button
                className="px-3 py-1 text-sm bg-blue-600 text-white rounded"
                onClick={() => handleIntroQuickAction("recommend")}
              >
                Recommend a card for me
              </button>
            )}
            {normActions.has("learn") && (
              <button
                className="px-3 py-1 text-sm bg-green-200 rounded"
                onClick={() => handleIntroQuickAction("learn")}
              >
                Learn More
              </button>
            )}
            {normActions.has("compare") && (
              <button
                className="px-3 py-1 text-sm bg-yellow-200 rounded"
                onClick={() => handleIntroQuickAction("compare")}
              >
                Compare Cards
              </button>
            )}
          </div>
          {tip && <div className="mt-2 text-xs text-gray-600 whitespace-pre-line">{tip}</div>}
        </>
      );
    }

    // Only attach follow-up buttons to the latest bot message
    if (!isLatestBot) return null;

    // Case 2: After Compare (or two-pick Learn) → two Learn buttons only
    if (normActions.has("learn_a") || normActions.has("learn_b")) {
      const labelA = meta?.learnA || "Card A";
      const labelB = meta?.learnB || "Card B";
      return (
        <>
          <div className="mt-3 flex flex-wrap gap-2">
            {normActions.has("learn_a") && (
              <button
                className="px-3 py-1 text-sm bg-green-200 rounded"
                onClick={() => sendMessage("learn_A")}
              >
                Learn more about {labelA}
              </button>
            )}
            {normActions.has("learn_b") && (
              <button
                className="px-3 py-1 text-sm bg-green-200 rounded"
                onClick={() => sendMessage("learn_B")}
              >
                Learn more about {labelB}
              </button>
            )}
          </div>
          {tip && <div className="mt-2 text-xs text-gray-600 whitespace-pre-line">{tip}</div>}
        </>
      );
    }

    // Case 3: Eligible → only Apply
    if (normActions.has("apply")) {
      return (
        <>
          <div className="mt-3">
            <button
              className="px-3 py-1 text-sm bg-blue-600 text-white rounded"
              onClick={() => sendMessage("apply")}
            >
              Apply
            </button>
          </div>
          {tip && <div className="mt-2 text-xs text-gray-600 whitespace-pre-line">{tip}</div>}
        </>
      );
    }

    // Case 4: Not eligible → Learn Other / Talk to Agent (dynamic other card label)
    if (normActions.has("learn_other") || normActions.has("talk_agent")) {
      const otherCardName: string | undefined = meta?.otherCardName;
      const otherLabel = otherCardName ? `Learn about ${otherCardName}` : "Learn about another card";
      return (
        <>
          <div className="mt-3 flex flex-wrap gap-2">
            {normActions.has("learn_other") && (
              <button
                className="px-3 py-1 text-sm bg-green-200 rounded"
                onClick={() => sendMessage("learn_other")}
              >
                {otherLabel}
              </button>
            )}
            {normActions.has("talk_agent") && (
              <button
                className="px-3 py-1 text-sm bg-gray-200 rounded"
                onClick={() => sendMessage("talk_agent")}
              >
                Talk to Agent
              </button>
            )}
          </div>
          {tip && <div className="mt-2 text-xs text-gray-600 whitespace-pre-line">{tip}</div>}
        </>
      );
    }

    // Generic tip/hints for any other step
    if (tip) {
      return <div className="mt-2 text-xs text-gray-600 whitespace-pre-line">{tip}</div>;
    }

    return null;
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
      {/* Header with close; include language so param is "used" (avoids noUnusedParameters build errors) */}
      <div className="flex items-center justify-between px-4 py-3 bg-blue-700 text-white rounded-t-2xl">
        <div className="font-semibold">
          Banking Assistant{language ? ` • ${language.toUpperCase()}` : ""}
        </div>
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
            {/* Server-driven buttons/tips */}
            {m.from === "bot" && renderActions(idx)}
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
