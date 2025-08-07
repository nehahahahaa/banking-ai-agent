import { NextRequest, NextResponse } from "next/server"
import { handleChatQuery } from "@/lib/utils/scoreCard"

export async function POST(req: NextRequest) {
  try {
    const { userContext } = await req.json()

    const reply = handleChatQuery(userContext)

    return NextResponse.json({ reply })
  } catch (error) {
    console.error("Chat agent error:", error)
    return NextResponse.json(
      { reply: "Something went wrong. Please try again later." },
      { status: 500 }
    )
  }
}
