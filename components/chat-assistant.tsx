"use client"

import type React from "react"
import { useState } from "react"
import { Send, Bot, User, Brain, CreditCard, BarChart3, DollarSign } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface ChatAssistantProps {
  language: string
}

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  actionButtons?: ActionButton[]
}

interface ActionButton {
  text: string
  type: "primary" | "secondary"
  icon?: React.ReactNode
}

export function ChatAssistant({ language }: ChatAssistantProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content:
        language === "en"
          ? "Hello! I'm your banking assistant. I can help you find the perfect credit card, answer questions about our products, and guide you through the application process. How can I help you today?"
          : language === "hi"
          ? "नमस्ते! मैं आपका बैंकिंग असिस्टेंट हूं। मैं आपको सही क्रेडिट कार्ड खोजने, हमारे उत्पादों के बारे में प्रश्नों के उत्तर देने और आवेदन प्रक्रिया में मार्गदर्शन करने में मदद कर सकता हूं। आज मैं आपकी कैसे मदद कर सकता हूं?"
          : "¡Hola! Soy tu asistente bancario. Puedo ayudarte a encontrar la tarjeta de crédito perfecta, responder preguntas sobre nuestros productos y guiarte a través del proceso de solicitud. ¿Cómo puedo ayudarte hoy?",
    },
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)

    // simulate reply
    setTimeout(() => {
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: language === "en" ? `Thanks for asking about: "${userMessage.content}". Here's what I suggest...` : "...",
      }
      setMessages((prev) => [...prev, assistantMessage])
      setIsLoading(false)
    }, 2000)
  }

  return (
    <Card className="w-full max-w-xl mx-auto mt-8 shadow-lg">
      <CardHeader className="bg-blue-800 text-white rounded-t-lg px-4 py-3">
        <CardTitle className="flex items-center gap-2">
          <Bot className="w-5 h-5" />
          {language === "en" && "Banking Assistant"}
          {language === "hi" && "बैंकिंग असिस्टेंट"}
          {language === "es" && "Asistente Bancario"}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-4 space-y-4">
        <div className="h-[300px] overflow-y-auto space-y-4">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex gap-3 ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
              {msg.role === "assistant" && <Bot className="w-5 h-5 text-blue-800" />}
              <div className={`p-3 rounded-lg text-sm max-w-[75%] ${msg.role === "user" ? "bg-blue-800 text-white" : "bg-gray-100 text-gray-800"}`}>
                {msg.content}
              </div>
              {msg.role === "user" && <User className="w-5 h-5 text-gray-500" />}
            </div>
          ))}
          {isLoading && (
            <div className="text-sm text-gray-400 italic">Typing...</div>
          )}
        </div>
        <form onSubmit={handleSubmit} className="flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder={language === "en" ? "Ask a question..." : "..."}
          />
          <Button type="submit" disabled={!input.trim() || isLoading}>
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
