"use client"

import type React from "react"

import { useState } from "react"
import { Send, X, Bot, User, Brain, CreditCard, BarChart3, DollarSign } from "lucide-react"
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
  const [isOpen, setIsOpen] = useState(false)
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
  const [showContext, setShowContext] = useState(false)

  // Simulated user preferences (hardcoded for now)
  const userPreferences = {
    en: "Travel-focused, No annual fee, Cashback",
    hi: "यात्रा-केंद्रित, कोई वार्षिक शुल्क नहीं, कैशबैक",
    es: "Enfocado en viajes, Sin cuota anual, Cashback",
  }

  // Trust disclaimer text
  const trustDisclaimer = {
    en: "Based on verified product information from August 2025",
    hi: "अगस्त 2025 से सत्यापित उत्पाद जानकारी के आधार पर",
    es: "Basado en información verificada del producto de agosto 2025",
  }

  const suggestionButtons = [
    {
      en: "Best cashback card",
      hi: "सबसे अच्छा कैशबैक कार्ड",
      es: "Mejor tarjeta de cashback",
    },
    {
      en: "Compare Gold vs Platinum",
      hi: "गोल्ड बनाम प्लैटिनम की तुलना",
      es: "Comparar Gold vs Platinum",
    },
    {
      en: "How do I apply?",
      hi: "मैं कैसे आवेदन करूं?",
      es: "¿Cómo aplico?",
    },
  ]

  const getActionButtons = (messageType: string): ActionButton[] => {
    /* (same as before) */
    // … your existing code …
  }

  // REMOVE getMemoryAwareResponse and the mock timeout

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
    }

    // 1) Add the user's message
    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)
    setShowContext(true)

    try {
      // 2) Send to your real backend
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: userMessage.content }),
      })
      const { reply, error } = await res.json()
      if (error) throw new Error(error)

      // Hide context tag once we have a reply
      setShowContext(false)
      // 3) Add the assistant's reply
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: reply,
        actionButtons: getActionButtons("default"), // you can adjust based on reply content
      }
      setMessages((prev) => [...prev, assistantMessage])
    } catch (err) {
      console.error(err)
      setMessages((prev) => [
        ...prev,
        {
          id: (Date.now() + 2).toString(),
          role: "assistant",
          content: "Sorry, something went wrong. Please try again.",
        },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion)
  }

  const handleActionButtonClick = (buttonText: string) => {
    console.log(`Action button clicked: ${buttonText}`)
  }

  // Floating chat icon when closed
  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setIsOpen(true)}
          className="w-14 h-14 rounded-full bg-blue-800 hover:bg-blue-900 shadow-lg transition-all duration-200 flex items-center justify-center"
          size="icon"
        >
          <span className="text-2xl">💬</span>
        </Button>
      </div>
    )
  }

  // Chat window when open (same UI as before)
  return (
    <div className="fixed bottom-6 right-6 z-50 w-[350px] max-w-[calc(100vw-2rem)]">
      {showContext && (
        <div className="mb-3 animate-in slide-in-from-bottom-2 duration-300">
          <div className="bg-gray-100 border border-gray-200 rounded-full px-4 py-2 shadow-sm">
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <Brain className="w-4 h-4 text-gray-600" />
              <span className="font-medium">
                {language === "en" && "🧠 Agent is considering your preferences:"}
                {language === "hi" && "🧠 एजेंट आपकी प्राथमिकताओं पर विचार कर रहा है:"}
                {language === "es" && "🧠 El agente está considerando tus preferencias:"}
              </span>
              <span className="text-blue-700 font-medium">
                {userPreferences[language]}
              </span>
            </div>
          </div>
        </div>
      )}

      <Card className="h-[500px] flex flex-col shadow-2xl rounded-2xl border-0 bg-white">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 bg-blue-800 text-white rounded-t-2xl px-4 py-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Bot className="w-5 h-5" />
            {language === "en" && "Banking Assistant"}
            {language === "hi" && "बैंकिंग असिस्टेंट"}
            {language === "es" && "Asistente Bancario"}
          </CardTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(false)}
            className="text-white hover:bg-blue-700 w-8 h-8"
          >
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col p-0">
          {/* Messages list (unchanged) */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${
                  message.role === "user" ? "justify-end" : "justify-start"
                }`}
              >
                {/* ...rendering logic unchanged… */}
              </div>
            ))}
            {isLoading && (
              /* …loading indicator unchanged… */
              <div className="flex gap-3 justify-start">
                {/* … */}
              </div>
            )}
          </div>

          {/* Suggestion buttons unchanged */}
          <div className="p-4 border-t bg-gray-50">
            {/* … */}
          </div>

          {/* Input form */}
          <div className="p-4 border-t">
            <form onSubmit={handleSubmit} className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={
                  language === "en"
                    ? "Ask about credit cards..."
                    : language === "hi"
                      ? "क्रेडिट कार्ड के बारे में पूछें..."
                      : "Pregunta sobre tarjetas de crédito..."
                }
                disabled={isLoading}
                className="flex-1"
              />
              <Button
                type="submit"
                disabled={isLoading || !input.trim()}
                size="icon"
                className="bg-blue-800 hover:bg-blue-900"
              >
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
