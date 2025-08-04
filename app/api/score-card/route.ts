// /app/api/score-card/route.ts

import { NextResponse } from 'next/server'
import { cards } from '@/lib/utils/cardsData'
import { scoreCard } from '@/lib/utils/scoreCard'

export async function POST(req: Request) {
  try {
    const body = await req.json()
    const { income, age, employment, preference } = body

    // Basic validation
    if (!income || !age || !employment) {
      return NextResponse.json({ error: 'Missing required fields' }, { status: 400 })
    }

    // Score all cards
    const scored = cards.map((card) => {
      const { score, reasons } = scoreCard(card, { income, age, employment, preference })
      return { ...card, score, reasons }
    })

    // Get top scoring card
    const bestCard = scored.sort((a, b) => b.score - a.score)[0]

    return NextResponse.json({ recommended: bestCard })
  } catch (error) {
    return NextResponse.json({ error: 'Server error' }, { status: 500 })
  }
}
