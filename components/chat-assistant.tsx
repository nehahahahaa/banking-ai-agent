"use client"

import { useState } from "react"
import { PaperPlaneIcon } from "@radix-ui/react-icons"
import { Textarea } from "@/components/ui/textarea"
import { Button } from "@/components/ui/button"

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
  const [response, setResponse] = useState("")
  const [loading, setLoading] = useState(false)

  const handleSend = async () => {
    if (!input.trim()) return

    setLoading(true)
    setResponse("")

    try {
      const res = await fetch("/api/chat-card-agent", {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          userInput: input,
          userContext
        })
      })

      const data = await res.json()
      setResponse(data.reply)
    } catch (error) {
      setResponse("Oops! Something went wrong.")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed bottom-4 right-4 w-full max-w-sm bg-white shadow-lg rounded-xl p-4 border border-gray-200 z-50">
      <h3 className="text-sm font-semibold text-gray-700 mb-2">
        {language === "en" && "Ask me about cards"}
        {language === "hi" && "मुझसे कार्ड के बारे में पूछें"}
        {language === "es" && "Pregúntame sobre tarjetas"}
      </h3>

      <Textarea
        rows={2}
        value={in
