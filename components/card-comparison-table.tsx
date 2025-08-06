
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
}

export function CardComparisonTable({ userContext }: CardComparisonTableProps) {
  const scored = cards.map((card) => {
    const { score, reasons } = scoreCard(card, userContext)
    return { ...card, score, reasons }
  })

  const bestScore = Math.max(...scored.map((c) => c.score))

  return (
    <>
      <div className="text-center mt-10">
        <h1 className="text-3xl font-bold text-blue-800">Find Your Perfect Credit Card</h1>
        <p className="mt-2 text-gray-600">
          Compare cards, check eligibility, and get personalized recommendations with our AI-powered banking assistant
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">
        {scored.map((card) => (
          <Card
            key={card.name}
            className={`border-2 ${
              card.score === bestScore ? "border-blue-500 shadow-lg" : "border-gray-200"
            } transition-all duration-300 rounded-xl`}
          >
            <CardHeader className="bg-blue-50 py-4 px-6 rounded-t-xl">
              <div className="flex items-center gap-2">
                {card.score === bestScore && (
                  <CheckCircle className="w-5 h-5 text-blue-600" />
                )}
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
                <strong>Employment:</strong> {card.allowedEmployment?.join(", ")}
              </p>
              {card.score === bestScore && card.reasons?.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm text-blue-600 font-medium mb-1">Why we recommend this:</p>
                  <ul className="list-disc list-inside text-sm text-gray-600">
                    {card.reasons.map((r, i) => (
                      <li key={i}>✓ {r}</li>
                    ))}
                  </ul>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>
    </>
  )
}
