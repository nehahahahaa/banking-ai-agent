"use client"

import { CheckCircle } from "lucide-react"
import { scoreCard } from "../lib/utils/scoreCard"
import type { Card as CardType } from "../lib/utils/cardsData"

interface CardComparisonTableProps {
  cards?: CardType[]
  recommendedCards?: CardType[]   // array of full card objects
  userContext?: {
    income: number
    age: number
    employment: string
    preference: string | null
  }
}

export function CardComparisonTable({
  cards = [],
  recommendedCards = [],
  userContext,
}: CardComparisonTableProps) {
  const highlightedNames = new Set(
    (recommendedCards || []).map((c) => c?.name).filter(Boolean) as string[]
  )

  const cleanReason = (r: string) => r.replace(/^✓\s*/i, "").trim()

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">
      {cards.map((card, idx) => {
        const isHighlighted = highlightedNames.has(card.name)

        const reasons =
          isHighlighted && userContext
            ? scoreCard(card, {
                ...userContext,
                employment: (userContext.employment || "").toLowerCase(),
              }).reasons.map(cleanReason)
            : []

        return (
          <div
            key={idx}
            className={`rounded-xl border transition-all ${
              isHighlighted
                ? "border-2 border-blue-500 shadow-lg"
                : "border border-gray-300"
            }`}
          >
            {/* Header bar */}
            <div
              className={`rounded-t-xl px-6 py-4 flex items-center justify-between ${
                isHighlighted ? "bg-blue-100" : "bg-blue-50"
              }`}
            >
              <div className="flex items-center gap-2">
                {isHighlighted && <CheckCircle className="w-5 h-5 text-blue-600" />}
                <h3 className="text-lg font-semibold text-gray-800">{card.name}</h3>
              </div>

              {isHighlighted && (
                <span className="bg-blue-500 text-white text-xs font-medium px-2 py-0.5 rounded">
                  Recommended
                </span>
              )}
            </div>

            <div className="p-6 space-y-2">
              <p className="text-sm text-gray-700">
                <strong>Features:</strong> Standard Benefits
              </p>
              <p className="text-sm text-gray-700">
                <strong>Min Income:</strong> ${card.minIncome}
              </p>
              <p className="text-sm text-gray-700">
                <strong>Age Range:</strong> {card.eligibleAges[0]} – {card.eligibleAges[1]}
              </p>
              <p className="text-sm text-gray-700">
                <strong>Employment:</strong> {card.employmentTypes.join(", ")}
              </p>

              {isHighlighted && reasons.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-medium mb-1 text-blue-600">
                    Why we recommend this:
                  </p>
                  <ul className="text-sm text-blue-600 space-y-1">
                    {reasons.map((r, i) => (
                      <li key={i}>✓ {r}</li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          </div>
        )
      })}
    </div>
  )
}
