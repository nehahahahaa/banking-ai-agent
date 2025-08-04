import { NextRequest, NextResponse } from "next/server"
import OpenAI from "openai"

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json()

    const chatCompletion = await openai.chat.completions.create({
      model: "gpt-3.5-turbo",
      messages,
    })

    return NextResponse.json({
      message: chatCompletion.choices[0].message.content,
    })
  } catch (error) {
    console.error("API ERROR:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}
