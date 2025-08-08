"use client"

import React from "react"
import { cards } from "@/lib/utils/cardsData"

interface CardComparisonTableProps {
  highlightedCards: string[]
}

export function CardComparisonTable({ highlightedCards }: CardComparisonTableProps) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-6">
      {cards.map((card) => {
        const isHighlighted = highlightedCards.includes(card.name)

        return (
          <div
            key={card.name}
            className={`relative border rounded-xl p-4 shadow-sm transition ${
              isHighlighted ? "border-2 border-blue-500" : "border-gray-200"
            }`}
          >
            {isHighlighted && (
              <span className="absolute -top-3 left-3 bg-blue-500 text-white text-xs font-semibold px-2 py-1 rounded">
                Recommended
              </span>
            )}

            <h3 className="text-lg font-semibold mb-2">{card.name}</h3>
            <p><strong>Benefits:</strong> {card.benefits.join(", ")}</p>
            <p><strong>Min Income:</strong> ${card.minIncome.toLocaleString()}</p>
            <p>
              <strong>Age Range:</strong> {card.eligibleAges[0]} – {card.eligibleAges[1]}
            </p>
            <p><strong>Employment:</strong> {card.employmentTypes.join(", ")}</p>
          </div>
        )
      })}
    </div>
  )
}
