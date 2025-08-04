'use client'

import { useState } from 'react'
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent } from "@/components/ui/card"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Bot, Menu, Settings, User } from "lucide-react"

function Sidebar() {
  return (
    <aside className="w-16 bg-white border-r p-4 flex flex-col items-center space-y-4">
      <Button variant="ghost" size="icon"><Menu className="w-6 h-6" /></Button>
      <Button variant="ghost" size="icon"><User className="w-6 h-6" /></Button>
      <Button variant="ghost" size="icon"><Bot className="w-6 h-6" /></Button>
      <Button variant="ghost" size="icon"><Settings className="w-6 h-6" /></Button>
    </aside>
  )
}

function Header({ language, onLanguageChange }: { language: string, onLanguageChange: (lang: string) => void }) {
  return (
    <header className="flex justify-between items-center p-4 border-b bg-white">
      <h1 className="text-xl font-bold">Banking AI Agent</h1>
      <Select value={language} onValueChange={onLanguageChange}>
        <SelectTrigger className="w-[120px]">
          <SelectValue placeholder="Language" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="en">English</SelectItem>
          <SelectItem value="es">Spanish</SelectItem>
        </SelectContent>
      </Select>
    </header>
  )
}

export default function Home() {
  const [language, setLanguage] = useState("en")
  const [input, setInput] = useState("")
  const [messages, setMessages] = useState([
    { sender: "ai", text: "Welcome to Banking AI. How can I assist you today?" }
  ])

  const handleSend = () => {
    if (!input.trim()) return
    setMessages([...messages, { sender: "user", text: input }])
    setInput("")
    // Placeholder: Add backend logic here to get AI response
  }

  return (
    <div className="flex h-screen bg-slate-50">
      <Sidebar />
      <div className="flex-1 flex flex-col">
        <Header language={language} onLanguageChange={setLanguage} />
        <main className="flex-1 overflow-hidden">
          <ScrollArea className="h-full px-6 py-4 space-y-4">
            {messages.map((msg, idx) => (
              <Card key={idx} className={msg.sender === 'user' ? "ml-auto bg-blue-50" : "mr-auto bg-white"}>
                <CardContent className="p-3 text-sm">{msg.text}</CardContent>
              </Card>
            ))}
          </ScrollArea>
        </main>
        <footer className="p-4 border-t bg-white flex gap-2">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Type your message..."
            className="flex-1"
          />
          <Button onClick={handleSend}>Send</Button>
        </footer>
      </div>
    </div>
  )
}
