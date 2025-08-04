import { NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function POST(req: NextRequest) {
  try {
    const { message } = await req.json()

    if (!message) {
      return NextResponse.json({ error: "Message is required" }, { status: 400 })
    }

    const chatCompletion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages: [{ role: "user", content: message }],
    })

    return NextResponse.json({
      message: chatCompletion.choices[0].message.content,
    })
  } catch (err) {
    console.error("API Error:", err)
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 })
  }
}
