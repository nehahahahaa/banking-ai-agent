import { NextRequest, NextResponse } from "next/server"
import { handleChatQuery } from "@/lib/utils/scoreCard"
import { cards } from "@/lib/utils/cardsData"

export async function POST(req: NextRequest) {
  try {
    const { userInput, userContext } = await req.json()

    const reply = handleChatQuery(userInput, userContext, cards)

    return NextResponse.json({ reply })
  } catch (error) {
    console.error("Chat agent error:", error)
    return NextResponse.json({ reply: "Something went wrong. Please try again later." }, { status: 500 })
  }
}
