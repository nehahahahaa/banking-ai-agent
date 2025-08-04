'use client';

import { useState } from 'react';

export function ChatAssistant({ language }: { language: string }) {
  const [text, setText] = useState('');
  const [messages, setMessages] = useState<
    { sender: 'user' | 'bot'; text: string }[]
  >([{ sender: 'bot', text: language === 'en' ? 'Hello—how can I help you today?' : 'Hola, ¿en qué puedo ayudarte hoy?' }]);

  const handleSend = async () => {
    if (!text.trim()) return;
    // Add user message
    setMessages((prev) => [...prev, { sender: 'user', text }]);
    const userMessage = text;
    setText('');

    try {
      const res = await fetch('/api/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: userMessage }),
      });
      const { reply, error } = await res.json();
      if (error) throw new Error(error);

      setMessages((prev) => [...prev, { sender: 'bot', text: reply }]);
    } catch (err: any) {
      setMessages((prev) => [
        ...prev,
        { sender: 'bot', text: 'Sorry, something went wrong. Please try again.' },
      ]);
      console.error('Chat error:', err);
    }
  };

  return (
    <div className="fixed bottom-4 right-4 w-80 bg-white border rounded shadow-lg flex flex-col">
      <div className="p-2 border-b bg-gray-50 font-semibold">Chat</div>
      <div className="flex-1 overflow-auto p-2 space-y-2">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`p-2 rounded ${
              msg.sender === 'user' ? 'bg-blue-100 self-end' : 'bg-gray-100 self-start'
            }`}
          >
            {msg.text}
          </div>
        ))}
      </div>
      <div className="p-2 border-t flex gap-2">
        <input
          className="flex-1 border rounded px-2 py-1"
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder={language === 'en' ? 'Type a message…' : 'Escribe un mensaje…'}
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
        />
        <button
          className="bg-blue-600 text-white px-3 py-1 rounded"
          onClick={handleSend}
        >
          Send
        </button>
      </div>
    </div>
  );
}
