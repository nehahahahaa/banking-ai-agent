export type ChatSlots = {
  income?: number | null
  age?: number | null
  employment?: string | null
  preference?: string | null
  hasCosigner?: boolean | null
}

export async function askAI(message: string, slots: ChatSlots) {
  const res = await fetch("/api/chat", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ message, slots }),
  })
  if (!res.ok) throw new Error(`HTTP ${res.status}`)
  return (await res.json()) as { 
    reply: string
    slots: ChatSlots
    done: boolean
  }
}
