import { NextRequest, NextResponse } from "next/server"

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json()

    const togetherResponse = await fetch("https://api.together.xyz/v1/chat/completions", {
      method: "POST",
      headers: {
        "Authorization": `Bearer ${process.env.TOGETHER_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "mistralai/Mixtral-8x7B-Instruct-v0.1",
        messages,
      }),
    })

    const responseData = await togetherResponse.json()

    return NextResponse.json({
      message: responseData.choices?.[0]?.message?.content || "No response from Together AI.",
    })
  } catch (error) {
    console.error("API ERROR:", error)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}
