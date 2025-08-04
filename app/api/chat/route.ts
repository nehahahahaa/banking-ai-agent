// app/api/chat/route.ts
import OpenAI from "openai"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(req: Request) {
  const { message } = await req.json()
  if (!message) {
    return new Response(
      JSON.stringify({ error: "No message provided" }),
      { status: 400 }
    )
  }

  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4",               // or "gpt-3.5-turbo"
      messages: [{ role: "user", content: message }],
    })
    const reply = response.choices?.[0]?.message?.content ?? ""
    return new Response(JSON.stringify({ reply }), { status: 200 })
  } catch (err: any) {
    console.error("OpenAI error:", err)
    return new Response(
      JSON.stringify({ error: "OpenAI request failed" }),
      { status: 500 }
    )
  }
}
