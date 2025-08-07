"use client"

import { cards } from "@/lib/utils/cardsData"
import { Card } from "@/lib/utils/cardsData"

interface Props {
  userContext: {
    income: number
    age: number
    employment: string
    preference: string | null
  }
  result?: {
    recommendedCards?: Card[]
  }
}

export function CardComparisonTable({ userContext, result }: Props) {
  const dataToShow = result?.recommendedCards?.length
    ? result.recommendedCards
    : cards

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {dataToShow.map((card, index) => (
        <div
          key={index}
          className="bg-white border rounded-xl p-4 shadow hover:shadow-md transition"
        >
          <h3 className="text-lg font-semibold text-blue-700 mb-2">{card.name}</h3>
          <ul className="text-sm text-gray-600 space-y-1">
            <li>
              <strong>Income Requirement:</strong> ${card.minIncome.toLocaleString()}
            </li>
            <li>
              <strong>Eligible Ages:</strong> {card.eligibleAges[0]}–{card.eligibleAges[1]}
            </li>
            <li>
              <strong>Employment Types:</strong> {card.employmentTypes.join(", ")}
            </li>
            <li>
              <strong>Benefits:</strong> {card.benefits.join(", ")}
            </li>
          </ul>
        </div>
      ))}
    </div>
  )
}
