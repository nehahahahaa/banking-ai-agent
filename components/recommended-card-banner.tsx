"use client"

import { CheckCircle2 } from "lucide-react"

interface Card {
  name: string
  reasons: string[]
}

interface Props {
  cards: Card[]
}

export function RecommendedCardBanner({ cards }: Props) {
  if (cards.length === 0) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-6 mt-4">
        <div className="font-semibold mb-1 flex items-center gap-2">
          ❌ Not Eligible Currently
        </div>
        <p className="text-sm">You may not qualify for our current offers. Please contact us for alternative options.</p>
      </div>
    )
  }

  return (
    <div className="bg-green-50 border border-green-200 text-green-800 rounded-xl p-6 mt-4">
      <div className="font-semibold mb-1 flex items-center gap-2">
        ✅ Based on your inputs, you may be eligible for the <strong>{cards[0].name}</strong>.
      </div>
      <ul className="list-disc list-inside text-sm mt-2 text-green-700">
        {cards[0].reasons.map((reason, i) => (
          <li key={i}>✓ {reason}</li>
        ))}
      </ul>
      <p className="mt-4 text-sm">🧠 This way we are building trust by showing logic clearly to users.</p>
    </div>
  )
}
