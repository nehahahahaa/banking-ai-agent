"use client"

import { useState } from "react"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { cards } from "@/lib/utils/cardsData"
import { handleChatQuery } from "@/lib/utils/scoreCard"

interface ChatAssistantProps {
  language: string
  userContext: {
    income: number
    age: number
    employment: string
    preference: string | null
  }
}

export function ChatAssistant({ language, userContext }: ChatAssistantProps) {
  const [input, setInput] = useState("")
  const [messages, setMessages] = useState([
    {
      from: "bot",
      text:
        language === "en"
          ? "Hi! Need help choosing a card? Ask me anything like 'Which card is best for me?'"
          : language === "hi"
          ? "नमस्ते! कौन सा कार्ड आपके लिए सबसे अच्छा है? पूछें।"
          : "¡Hola! ¿Cuál es la mejor tarjeta para mí? Pregunta lo que necesites.",
    },
  ])

  const handleSend = () => {
    if (!input.trim()) return

    const userMessage = { from: "user", text: input }
    const botReply = {
      from: "bot",
      text: handleChatQuery(input, userContext, cards),
    }

    setMessages((prev) => [...prev, userMessage, botReply])
    setInput("")
  }

  return (
    <div className="fixed bottom-4 right-4 w-full max-w-md z-50">
      <Card className="bg-white shadow-xl rounded-xl p-4 space-y-3 max-h-[500px] overflow-y-auto">
        {messages.map((msg, i) => (
          <div
            key={i}
            className={`text-sm p-2 rounded ${
              msg.from === "bot" ? "bg-blue-50 text-gray-700" : "bg-gray-100 text-gray-800 text-right"
            }`}
          >
            {msg.text}
          </div>
        ))}
        <div className="flex gap-2">
          <Textarea
            placeholder={
              language === "en"
                ? "Ask me a question..."
                : language === "hi"
                ? "मुझसे कोई सवाल पूछें..."
                : "Hazme una pregunta..."
            }
            value={input}
            onChange={(e) => setInput(e.target.value)}
            className="flex-1"
          />
          <Button onClick={handleSend} className="bg-blue-700 text-white">
            Send
          </Button>
        </div>
      </Card>
    </div>
  )
}
