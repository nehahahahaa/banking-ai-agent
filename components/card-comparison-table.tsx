"use client"

import { cards } from "@/lib/utils/cardsData"
import { scoreCard } from "@/lib/utils/scoreCard"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle } from "lucide-react"

interface CardComparisonTableProps {
  userContext: {
    income: number
    age: number
    employment: string
    preference: string | null
  }
  recommendedCards?: string[] // for reset logic
}

export function CardComparisonTable({ userContext, recommendedCards = [] }: CardComparisonTableProps) {
  const hasSubmitted = userContext.income > 0 && userContext.age > 0 && userContext.employment !== ""

  const scored = cards.map((card) => {
    const { score, reasons } = scoreCard(card, userContext)
    return { ...card, score, reasons }
  })

  const bestScore = hasSubmitted ? Math.max(...scored.map((c) => c.score)) : 0

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">
      {scored.map((card) => {
        const isRecommended =
          hasSubmitted &&
          card.score === bestScore &&
          (recommendedCards.length === 0 || recommendedCards.includes(card.name))

        return (
          <Card
            key={card.name}
            className={`relative border-2 ${
              isRecommended ? "border-blue-500 shadow-lg" : "border-gray-200"
            } transition-all duration-300 rounded-xl`}
          >
            <CardHeader className="bg-blue-50 py-4 px-6 rounded-t-xl flex items-center gap-2">
              {isRecommended && (
                <span className="absolute -top-3 left-3 bg-blue-500 text-white text-xs font-semibold px-2 py-1 rounded">
                  Recommended
                </span>
              )}
              {isRecommended && <CheckCircle className="w-5 h-5 text-blue-600" />}
              <CardTitle className="text-lg text-gray-800 font-semibold">{card.name}</CardTitle>
            </CardHeader>

            <CardContent className="p-6 space-y-2">
              <p className="text-sm text-gray-700">
                <strong>Features:</strong> {card.features?.join(", ") || "Standard Benefits"}
              </p>
              <p className="text-sm text-gray-700">
                <strong>Min Income:</strong> ${card.minIncome}
              </p>
              <p className="text-sm text-gray-700">
                <strong>Age Range:</strong> {card.eligibleAges[0]} – {card.eligibleAges[1]}
              </p>
              <p className="text-sm text-gray-700">
                <strong>Employment:</strong> {card.employmentTypes?.join(", ")}
              </p>

              {hasSubmitted && card.reasons?.length > 0 && (
                <div className="mt-4">
                  <p className={`text-sm font-medium mb-1 ${isRecommended ? "text-blue-600" : "text-gray-600"}`}>
                    Why we recommend this:
                  </p>
                  <ul className="list-disc list-inside text-sm text-gray-600">
                    {card.reasons.map((r, i) => (
                      <li key={i}>{r}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        )
      })}
    </div>
  )
}
