"use client"

import { useState } from "react"
import { Send, X, Bot } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { askAI, ChatSlots } from "@/lib/utils/askAI"
import { handleChatQuery } from "@/lib/utils/handleChatQuery" // fallback only
import { cards } from "@/lib/utils/cardsData"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
}

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
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  // conversational slots (start with any known context)
  const [slots, setSlots] = useState<ChatSlots>({
    income: userContext?.income ?? null,
    age: userContext?.age ?? null,
    employment: userContext?.employment ?? null,
    preference: userContext?.preference ?? null,
    hasCosigner: null,
  })

  // ensure the first bot reply is ALWAYS the intro list
  const [firstTurnDone, setFirstTurnDone] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const text = input.trim()
    const userMsg: Message = { id: Date.now().toString(), role: "user", content: text }
    setMessages((m) => [...m, userMsg])
    setInput("")
    setIsLoading(true)

    try {
      if (!firstTurnDone) {
        // Call the API with firstTurn=true to force the intro
        const res = await fetch("/api/chat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ message: text, slots, firstTurn: true }),
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json()
        setSlots((s) => ({ ...s, ...(data.slots || {}) }))
        setMessages((m) => [
          ...m,
          { id: (Date.now() + 1).toString(), role: "assistant", content: data.reply },
        ])
        setFirstTurnDone(true)
        return
      }

      // Subsequent turns -> slot-filling route via askAI (recommend, compare, learn more)
      const data = await askAI(text, slots)
      if (data?.slots) setSlots(data.slots)
      setMessages((m) => [
        ...m,
        { id: (Date.now() + 1).toString(), role: "assistant", content: data.reply },
      ])
    } catch {
      // Final safety fallback to your local engine (deterministic)
      const reply = handleChatQuery(
        text,
        {
          income: Number(slots.income ?? 0),
          age: Number(slots.age ?? 0),
          employment: String(slots.employment ?? ""),
          preference: slots.preference ?? null,
        } as any,
        cards
      )
      setMessages((m) => [
        ...m,
        { id: (Date.now() + 2).toString(), role: "assistant", content: reply },
      ])
    } finally {
      setIsLoading(false)
    }
  }

  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setIsOpen(true)}
          className="w-14 h-14 rounded-full bg-blue-800 hover:bg-blue-900 shadow-lg flex items-center justify-center"
        >
          💬
        </Button>
      </div>
    )
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-[350px] max-w-[calc(100vw-2rem)]">
      <Card className="h-[500px] flex flex-col shadow-2xl rounded-2xl">
        <CardHeader className="flex justify-between items-center bg-blue-800 text-white rounded-t-2xl px-4 py-3">
          <CardTitle className="flex items-center gap-2 text-lg">
            <Bot className="w-5 h-5" /> Banking Assistant
          </CardTitle>
          <Button variant="ghost" size="icon" onClick={() => setIsOpen(false)} className="text-white hover:bg-blue-700">
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col p-4 overflow-y-auto space-y-4">
          {messages.map((m) => (
            <div key={m.id} className={`flex ${m.role === "user" ? "justify-end" : "justify-start"}`}>
              <div className={`p-3 rounded-lg max-w-[80%] text-sm leading-relaxed ${
                m.role === "user" ? "bg-blue-800 text-white" : "bg-gray-100 text-gray-800"
              }`}>
                {m.content}
              </div>
            </div>
          ))}
          {isLoading && <div className="text-sm text-gray-500">Typing...</div>}
        </CardContent>

        <form onSubmit={handleSubmit} className="p-4 border-t flex gap-2">
          <Input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about cards..."
            className="flex-1"
            disabled={isLoading}
          />
          <Button type="submit" disabled={isLoading || !input.trim()} className="bg-blue-800 hover:bg-blue-900">
            <Send className="w-4 h-4" />
          </Button>
        </form>
      </Card>
    </div>
  )
}
