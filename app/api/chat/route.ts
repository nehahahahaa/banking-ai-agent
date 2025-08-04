import { NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY!,
})

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json()

    const chatCompletion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: messages,
    })

    return NextResponse.json({
      message: chatCompletion.choices[0].message.content,
    })
  } catch (error) {
    console.error("API Error:", error)
    return NextResponse.json({ error: "Failed to generate response" }, { status: 500 })
  }
}
