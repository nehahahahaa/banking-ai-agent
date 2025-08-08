"use client"

import { Card } from "../lib/utils/cardsData"

interface CardComparisonTableProps {
  cards: Card[]
  recommendedCards: Card[] // Passed from EligibilityForm
}

export function CardComparisonTable({ cards, recommendedCards }: CardComparisonTableProps) {
  const isHighlighted = (cardName: string) =>
    recommendedCards?.some((rc) => rc && rc.name === cardName)

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {cards.map((card, idx) => {
        const highlighted = isHighlighted(card.name)

        return (
          <div
            key={idx}
            className={`p-6 rounded-xl border transition-all ${
              highlighted
                ? "border-2 border-blue-500 shadow-lg"
                : "border border-gray-300"
            }`}
          >
            <h3 className="text-lg font-semibold mb-2 flex items-center justify-between">
              {card.name}
              {highlighted && (
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

            {highlighted && card.reasons && (
              <div className="mt-3">
                <p className="text-blue-600 font-medium">Why we recommend this:</p>
                <ul className="list-disc list-inside text-sm text-blue-600">
                  {card.reasons.map((reason, i) => (
                    <li key={i}>✓ {reason}</li>
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
