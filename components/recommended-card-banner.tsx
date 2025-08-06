"use client"

import { BadgeCheck } from "lucide-react"

interface RecommendedCardBannerProps {
  cards: {
    name: string
    score: number
    reasons: string[]
  }[]
  language: string
}

export function RecommendedCardBanner({
  cards,
  language,
}: RecommendedCardBannerProps) {
  if (!cards || cards.length === 0) return null

  const bestCard = cards[0] // Assuming the best is always first in the list

  return (
    <div className="bg-green-50 border border-green-300 p-4 rounded-lg my-4 shadow-sm">
      <div className="flex items-center gap-2 mb-2">
        <BadgeCheck className="w-5 h-5 text-green-600" />
        <p className="text-green-800 font-semibold text-sm">
          Based on your inputs, you may be eligible for the{" "}
          <span className="font-bold">{bestCard.name}</span>.
        </p>
      </div>
      <ul className="list-disc list-inside text-sm text-gray-700 ml-6">
        {bestCard.reasons.map((reason, index) => (
          <li key={index}>✔ {reason}</li>
        ))}
      </ul>
      <p className="mt-3 text-xs text-green-700 italic">
        🧠 Builds trust by showing logic clearly · Transparent + choice-driven
      </p>
    </div>
  )
}
