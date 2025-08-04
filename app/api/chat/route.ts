import { NextResponse } from "next/server"
import { Configuration, OpenAIApi } from "openai"

const configuration = new Configuration({
  apiKey: process.env.OPENAI_API_KEY,
})

const openai = new OpenAIApi(configuration)

export async function POST(req: Request) {
  const { message } = await req.json()
  if (!message) {
    return NextResponse.json({ error: "No message provided" }, { status: 400 })
  }
  try {
    const completion = await openai.createChatCompletion({
      model: "gpt-4",
      messages: [{ role: "user", content: message }],
    })
    const aiResponse = completion.data.choices[0].message?.content || ""
    return NextResponse.json({ reply: aiResponse })
  } catch (error: any) {
    console.error("OpenAI error:", error.message)
    return NextResponse.json({ error: "OpenAI request failed" }, { status: 500 })
  }
}
