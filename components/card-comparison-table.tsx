"use client"

import { cards } from "@/lib/utils/cardsData"
import { handleChatQuery, scoreCard } from "@/lib/utils/scoreCard"
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
  const hasSubmitted =
    userContext.income > 0 &&
    userContext.age > 0 &&
    (userContext.employment || "") !== ""

  const ctx = {
    ...userContext,
    employment: (userContext.employment || "").toLowerCase(),
  }

  const result = hasSubmitted ? handleChatQuery(ctx) : null
  const recommendedNames = new Set<string>(
    (result?.recommendedCards as string[] | undefined) ?? []
  )
  const highlightAllowed =
    result?.type === "full-match" || result?.type === "multiple-match"

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-10">
      {cards.map((card) => {
        const isHighlighted = highlightAllowed && recommendedNames.has(card.name)
        const { reasons } = hasSubmitted ? scoreCard(card, ctx) : { reasons: [] as string[] }

        return (
          <Card
            key={card.name}
            className={`relative border-2 ${
              isHighlighted ? "border-blue-500 shadow-lg" : "border-gray-200"
            } transition-all duration-300 rounded-xl`}
          >
            {/* ✅ Badge for highlighted cards */}
            {isHighlighted && (
              <div className="absolute top-2 right-2 bg-blue-500 text-white text-xs font-semibold px-2 py-1 rounded-full shadow">
                Recommended
              </div>
            )}

            <CardHeader className="bg-blue-50 py-4 px-6 rounded-t-xl">
              <div className="flex items-center gap-2">
                {isHighlighted && <CheckCircle className="w-5 h-5 text-blue-600" />}
                <CardTitle className="text-lg text-gray-800 font-semibold">
                  {card.name}
                </CardTitle>
              </div>
            </CardHeader>

            <CardContent className="p-6 space-y-2">
              <p className="text-sm text-gray-700">
                <strong>Features:</strong>{" "}
                {card.features?.join(", ") || "Standard Benefits"}
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

              {isHighlighted && reasons.length > 0 && (
                <div className="mt-4">
                  <p className="text-sm font-medium mb-1 text-blue-600">
                    Why we recommend this:
                  </p>
                  <ul className="list-disc list-inside text-sm text-gray-600">
                    {reasons.map((r, i) => (
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
