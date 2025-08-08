"use client"

import React from "react"
import { cards } from "@/lib/utils/cardsData"

interface CardComparisonTableProps {
  highlightedCards: string[]
}

export default function CardComparisonTable({ highlightedCards }: CardComparisonTableProps) {
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
            {/* 🔹 Highlight Tag */}
            {isHighlighted && (
              <span className="absolute -top-3 left-3 bg-blue-500 text-white text-xs font-semibold px-2 py-1 rounded">
                Recommended
              </span>
            )}

            <h3 className="text-lg font-semibold mb-2">{card.name}</h3>
            <p><strong>Features:</strong> Standard Benefits</p>
            <p><strong>Min Income:</strong> ${card.minIncome.toLocaleString()}</p>
            <p>
              <strong>Age Range:</strong> {card.eligibleAges[0]} – {card.eligibleAges[1]}
            </p>
            <p><strong>Employment:</strong> {card.employmentTypes.join(", ")}</p>

            {isHighlighted && card.reasons && (
              <div className="mt-2 text-sm text-blue-600">
                <strong>Why we recommend this:</strong>
                <ul className="list-disc list-inside">
                  {card.reasons.map((reason: string, idx: number) => (
                    <li key={idx}>{reason}</li>
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
