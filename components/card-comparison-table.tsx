"use client"

import { cards } from "@/lib/utils/cardsData"
import { scoreCard } from "@/lib/utils/scoreCard"
import { Card as UICard, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle } from "lucide-react"

interface CardComparisonTableProps {
  userContext: {
    income: number
    age: number
    employment: string
    preference: string | null
  }
}

export function CardComparisonTable({ userContext }: CardComparisonTableProps) {
  const hasSubmitted = userContext.income > 0 && userContext.age > 0 && userContext.employment !== ""

  // Score each card
  const scored = cards.map((card) => {
    const { score, reasons, failures } = scoreCard(card, userContext)
    return { ...card, score, reasons, failures }
  })

  const bestScore = hasSubmitted ? Math.max(...scored.map((c) => c.score)) : 0

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">
      {scored.map((card) => {
        const isRecommended = hasSubmitted && card.score === bestScore

        return (
          <UICard
            key={card.name}
            className={`border-2 ${
              isRecommended ? "border-blue-500 shadow-lg" : "border-gray-200"
            } transition-all duration-300 rounded-xl`}
          >
            <CardHeader className="bg-blue-50 py-4 px-6 rounded-t-xl">
              <div className="flex items-center gap-2">
                {isRecommended && <CheckCircle className="w-5 h-5 text-blue-600" />}
                <CardTitle className="text-lg text-gray-800 font-semibold">{card.name}</CardTitle>
              </div>
            </CardHeader>
            <CardContent className="p-6 space-y-2">
              <p className="text-sm text-gray-700">
                <strong>Features:</strong> {card.features?.join(", ") || "Standard Benefits"}
              </p>
              <p className="text-sm text-gray-700">
                <strong>Min Income:</strong> ${card.minIncome.toLocaleString()}
              </p>
              <p className="text-sm text-gray-700">
                <strong>Age Range:</strong> {card.eligibleAges?.[0]} – {card.eligibleAges?.[1]}
              </p>
              <p className="text-sm text-gray-700">
                <strong>Employment:</strong> {card.employmentTypes?.join(", ") || "N/A"}
              </p>

              {hasSubmitted && (card.reasons?.length || card.failures?.length) && (
                <div className="mt-4">
                  <p className={`text-sm font-medium mb-1 ${isRecommended ? "text-blue-600" : "text-gray-600"}`}>
                    Why we recommend this:
                  </p>
                  <ul className="list-disc list-inside text-sm text-gray-600 space-y-1">
                    {card.reasons?.map((r, i) => <li key={`r-${i}`}>{r}</li>)}
                    {card.failures?.map((f, i) => <li key={`f-${i}`}>{f}</li>)}
                  </ul>
                </div>
              )}
            </CardContent>
          </UICard>
        )
      })}
    </div>
  )
}
