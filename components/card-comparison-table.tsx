"use client"

import { scoreCard } from "../lib/utils/scoreCard"
import type { Card as CardType } from "../lib/utils/cardsData"

interface CardComparisonTableProps {
  cards?: CardType[]
  recommendedCards?: CardType[]   // from EligibilityForm (array of cards)
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
  // Build a quick lookup for which cards should be highlighted
  const highlightedNames = new Set(
    (recommendedCards || []).map((c) => c?.name).filter(Boolean) as string[]
  )

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {cards.map((card, idx) => {
        const isHighlighted = highlightedNames.has(card.name)

        // Recompute reasons ONLY for highlighted cards (so the list shows)
        const reasons =
          isHighlighted && userContext
            ? scoreCard(card, {
                ...userContext,
                employment: (userContext.employment || "").toLowerCase(),
              }).reasons
            : []

        return (
          <div
            key={idx}
            className={`p-6 rounded-xl border transition-all ${
              isHighlighted
                ? "border-2 border-blue-500 shadow-lg"
                : "border border-gray-300"
            }`}
          >
            <h3 className="text-lg font-semibold mb-2 flex items-center justify-between">
              {card.name}
              {isHighlighted && (
                <span className="bg-blue-500 text-white text-xs font-medium px-2 py-0.5 rounded">
                  Recommended
                </span>
              )}
            </h3>

            <p className="text-sm mb-1">
              <strong>Features:</strong> Standard Benefits
            </p>
            <p className="text-sm mb-1">
              <strong>Min Income:</strong> ${card.minIncome}
            </p>
            <p className="text-sm mb-1">
              <strong>Age Range:</strong> {card.eligibleAges[0]} – {card.eligibleAges[1]}
            </p>
            <p className="text-sm mb-3">
              <strong>Employment:</strong> {card.employmentTypes.join(", ")}
            </p>

            {isHighlighted && reasons.length > 0 && (
              <div className="mt-3">
                <p className="text-blue-600 font-medium">Why we recommend this:</p>
                <ul className="list-disc list-inside text-sm text-blue-600">
                  {reasons.map((r, i) => (
                    <li key={i}>✓ {r}</li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
