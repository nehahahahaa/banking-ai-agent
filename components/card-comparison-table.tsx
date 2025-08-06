"use client"

import { cards } from "@/lib/utils/cardsData"
import { scoreCard } from "@/lib/utils/scoreCard"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle } from "lucide-react"
import { useState } from "react"
import { RecommendedCardBanner } from "./recommended-card-banner"

interface CardComparisonTableProps {
  userContext: {
    income: number
    age: number
    employment: string
    preference: string | null
  }
}

export function CardComparisonTable({ userContext }: CardComparisonTableProps) {
  const [submitted, setSubmitted] = useState(false)

  const scored = cards.map((card) => {
    const { score, reasons } = scoreCard(card, userContext)
    return { ...card, score, reasons }
  })

  const bestScore = Math.max(...scored.map((c) => c.score))
  const bestCards = scored.filter((card) => card.score === bestScore && bestScore > 0)

  const isFullMatch = (card) => {
    return (
      userContext.income >= card.minIncome &&
      userContext.age >= card.minAge &&
      card.allowedEmployment.includes(userContext.employment)
    )
  }

  return (
    <>
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {scored.map((card) => {
          const highlight = card.score === bestScore && bestScore > 0
          const fullMatch = isFullMatch(card)

          return (
            <Card
              key={card.name}
              className={`border-2 ${
                highlight ? "border-blue-500 shadow-lg" : "border-gray-200"
              } transition-all duration-300`}
            >
              <CardHeader className="bg-blue-50 py-4 px-6 rounded-t-xl">
                <div className="flex items-center gap-2">
                  {highlight && <CheckCircle className="w-5 h-5 text-blue-600" />}
                  <CardTitle className="text-lg text-gray-800 font-semibold">{card.name}</CardTitle>
                </div>
              </CardHeader>
              <CardContent className="p-6 space-y-2">
                <p className="text-sm text-gray-700">
                  <strong>Features:</strong> {card.features?.join(", ") || "Standard Benefits"}
                </p>
                <p className="text-sm text-gray-700">
                  <strong>Min Income:</strong> ${card.minIncome}
                </p>
                <p className="text-sm text-gray-700">
                  <strong>Min Age:</strong> {card.minAge}+
                </p>
                <p className="text-sm text-gray-700">
                  <strong>Employment:</strong> {card.allowedEmployment.join(", ")}
                </p>
                {highlight && (
                  <div className="mt-4">
                    <p className="text-sm text-blue-600 font-medium mb-1">Why we recommend this:</p>
                    <ul className="list-disc list-inside text-sm text-gray-600">
                      {card.reasons.map((r, i) => (
                        <li key={i}>✔ {r}</li>
                      ))}
                    </ul>
                    {fullMatch && (
                      <div className="mt-3 bg-green-50 border-l-4 border-green-400 text-green-700 p-3 text-sm rounded">
                        ✅ Transparent + choice-driven<br />
                        Based on your inputs, you may be eligible for the <strong>{card.name}</strong>.
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>
          )
        })}
      </div>

      {bestCards.length > 0 && (
        <div className="mt-6">
          <RecommendedCardBanner cards={bestCards} />
        </div>
      )}
    </>
  )
}
