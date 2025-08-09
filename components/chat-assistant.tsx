// TEMP ChatAssistant (sanity check)
"use client"
import { useState } from "react"
import { Send, X, Bot } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

export function ChatAssistant() {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<{id:string;role:"user"|"assistant";content:string}[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return
    const text = input.trim()
    setMessages(m=>[...m,{id:Date.now().toString(),role:"user",content:text}])
    setInput("")
    setIsLoading(true)
    setTimeout(()=>{
      setMessages(m=>[...m,{id:(Date.now()+1).toString(),role:"assistant",content:`Echo: ${text}` }])
      setIsLoading(false)
    },300)
  }

  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <Button onClick={()=>setIsOpen(true)} className="w-14 h-14 rounded-full bg-blue-800 hover:bg-blue-900 shadow-lg">💬</Button>
      </div>
    )
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 w-[350px] max-w-[calc(100vw-2rem)]">
      <Card className="h-[500px] flex flex-col shadow-2xl rounded-2xl">
        <CardHeader className="flex justify-between items-center bg-blue-800 text-white rounded-t-2xl px-4 py-3">
          <CardTitle className="flex items-center gap-2 text-lg"><Bot className="w-5 h-5" /> Banking Assistant</CardTitle>
          <Button variant="ghost" size="icon" onClick={()=>setIsOpen(false)} className="text-white hover:bg-blue-700"><X className="w-4 h-4" /></Button>
        </CardHeader>
        <CardContent className="flex-1 flex flex-col p-4 overflow-y-auto space-y-4">
          {messages.map(m=>(
            <div key={m.id} className={`flex ${m.role==="user"?"justify-end":"justify-start"}`}>
              <div className={`p-3 rounded-lg max-w-[80%] text-sm leading-relaxed ${m.role==="user"?"bg-blue-800 text-white":"bg-gray-100 text-gray-800"}`}>{m.content}</div>
            </div>
          ))}
          {isLoading && <div className="text-sm text-gray-500">Typing...</div>}
        </CardContent>
        <form onSubmit={handleSubmit} className="p-4 border-t flex gap-2">
          <Input value={input} onChange={e=>setInput(e.target.value)} placeholder="Type anything…" className="flex-1" disabled={isLoading}/>
          <Button type="submit" disabled={isLoading || !input.trim()} className="bg-blue-800 hover:bg-blue-900"><Send className="w-4 h-4" /></Button>
        </form>
      </Card>
    </div>
  )
}
