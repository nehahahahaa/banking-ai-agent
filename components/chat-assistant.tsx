You’re right—sorry for the back-and-forth. Here’s the **complete, final `components/chat-assistant.tsx`** with *all* the fixes baked in (silent auto-intro, newline preservation, loading guard, actions fallback, proper button labels, no stray JSX comments, no unused state). Paste-and-go:

```tsx
"use client";

import React, { useEffect, useRef, useState } from "react";
import { ChatSlots } from "@/lib/utils/askAI";

type Props = {
  language: string; // kept for compatibility with your Page
  userContext: {
    income: number | null;
    age: number | null;
    employment: string | null;
    preference: string | null;
  };
};

export function ChatAssistant({ language, userContext }: Props) {
  const [isOpen, setIsOpen] = useState(false);

  const [messages, setMessages] = useState<{ from: "user" | "bot"; text: string }[]>([]);
  const [input, setInput] = useState("");

  // Normalize initial context: treat 0/"" as null so server will ask for them
  const [slots, setSlots] = useState<ChatSlots>({
    income: userContext?.income && userContext.income > 0 ? userContext.income : null,
    age: userContext?.age && userContext.age > 0 ? userContext.age : null,
    employment: userContext?.employment?.trim() ? userContext.employment : null,
    preference: userContext?.preference ?? null,
    hasCosigner: null,
  });

  const [firstTurn, setFirstTurn] = useState(true);
  const [context, setContext] = useState<any>({});
  const [actions, setActions] = useState<string[]>([]);
  const [meta, setMeta] = useState<any>({});
  const [loading, setLoading] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const bootstrappedRef = useRef(false);

  const splitHints = (text: string) => {
    const mainLines: string[] = [];
    const hints: string[] = [];
    for (const line of text.split("\n")) {
      if (/^\s*hint\s*:/i.test(line)) hints.push(line.trim()); // keep the word "Hint:"
      else mainLines.push(line);
    }
    return { main: mainLines.join("\n"), hints };
  };

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  const sendMessage = async (msg: string, silent = false) => {
    const trimmed = msg.trim();
    if (!trimmed) return;
    if (!silent) setMessages((prev) => [...prev, { from: "user", text: trimmed }]);
    setInput("");
    setLoading(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: trimmed, slots, firstTurn, context }),
      });
      const data = await res.json();

      setMessages((prev) => [...prev, { from: "bot", text: data.reply }]);
      if (data.slots) setSlots(data.slots);

      // Always keep buttons visible: fallback to intro set if server sends none
      const nextActions = Array.isArray(data.actions) ? data.actions : [];
      setActions(nextActions.length ? nextActions : ["recommend", "learn", "compare"]);

      setMeta(data.meta ?? {});
      if (data.context) setContext(data.context);
      setFirstTurn(false);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleActionClick = (action: string) => sendMessage(action);

  const renderButtons = () =>
    actions.map((a, idx) => {
      let label = a;
      if (a === "recommend") label = "Recommend a card for me";
      else if (a === "learn") label = "Learn More";
      else if (a === "learn_A") label = `Learn more about ${meta?.learnA || "Card A"}`;
      else if (a === "learn_B") label = `Learn more about ${meta?.learnB || "Card B"}`;
      else if (a === "learn_other")
        label = `Learn more about ${meta?.otherCardName || "another card"}`;
      else if (a === "compare") label = "Compare Cards";
      else if (a === "apply") label = "Apply";
      else if (a === "talk_agent") label = "Talk to Agent";

      return (
        <button
          key={idx}
          className="px-3 py-2 bg-blue-100 rounded hover:bg-blue-200 text-sm"
          onClick={() => handleActionClick(a)}
          disabled={loading}
        >
          {label}
        </button>
      );
    });

  // Auto-intro once when panel opens (silent user msg so no "start" bubble)
  useEffect(() => {
    if (isOpen && firstTurn && messages.length === 0 && !bootstrappedRef.current) {
      bootstrappedRef.current = true;
      sendMessage("start", true);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen, firstTurn, messages.length]);

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
    <div className="fixed bottom-6 right-6 z-50 w-[460px] h-[72vh] max-w-[calc(100vw-2rem)] flex flex-col border rounded-2xl shadow-2xl bg-white">
      {/* Header */}
      <div className="p-3 border-b flex items-center justify-between">
        <div className="font-semibold">Banking Assistant</div>
        <button
          className="px-2 py-1 rounded hover:bg-gray-100"
          onClick={() => setIsOpen(false)}
          aria-label="Close chat"
          title="Close chat"
        >
          ×
        </button>
      </div>

      {/* Messages */}
      <div className="p-4 flex-1 overflow-y-auto space-y-3">
        {messages.map((m, i) => {
          const { main, hints } = splitHints(m.text);
          const isUser = m.from === "user";
          return (
            <div key={i} className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
              <div
                className={`rounded-lg px-3 py-2 max-w-xs ${
                  isUser
                    ? "bg-blue-500 text-white"
                    : "bg-gray-100 text-gray-800 whitespace-pre-wrap" // preserve line breaks
                }`}
              >
                {main}
                {hints.length > 0 && (
                  <div className="mt-1 space-y-1">
                    {hints.map((h, idx) => (
                      <div
                        key={idx}
                        className="text-xs bg-blue-50 border border-blue-200 rounded px-2 py-1"
                      >
                        {h}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          );
        })}
        {loading && <div className="text-sm text-gray-500">Bot is typing…</div>}
        <div ref={chatEndRef} />
      </div>

      {/* Actions + Composer */}
      <div className="p-3 border-t flex flex-col space-y-2">
        <div className="flex space-x-2 flex-wrap">{renderButtons()}</div>
        <div className="flex">
          <input
            type="text"
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1 border rounded-l px-3 py-2 text-sm"
            placeholder="Type your message..."
            onKeyDown={(e) => e.key === "Enter" && !loading && sendMessage(input)}
          />
          <button
            onClick={() => sendMessage(input)}
            className="bg-blue-500 text-white px-4 py-2 rounded-r text-sm"
            disabled={loading}
          >
            Send
          </button>
        </div>
      </div>
    </div>
  );
}
```

If anything still feels off after redeploy, tell me the exact message sequence you try and I’ll adjust both client and route in one shot.
