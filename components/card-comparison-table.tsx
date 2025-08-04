import { cards } from "@/lib/utils/cardsData"
import { scoreCard } from "@/lib/utils/scoreCard"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { CheckCircle } from "lucide-react"
import { cards } from "@/utils/cardsData"
import { scoreCard } from "@/utils/scoreCard"

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
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {scored.map((card) => (
        <Card
          key={card.name}
          className={`border-2 ${
            card.score === bestScore ? "border-blue-500 shadow-lg" : "border-gray-200"
          } transition-all duration-300`}
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
              <strong>Fee:</strong> ${card.fee} / year
            </p>
            <p className="text-sm text-gray-700">
              <strong>Rewards:</strong> {card.rewards}
            </p>
            <p className="text-sm text-gray-700">
              <strong>Perks:</strong> {card.perks?.join(", ") || "Standard Benefits"}
            </p>
            <p className="text-sm text-gray-700">
              <strong>Eligibility:</strong> Income ${card.minIncome}+, Credit Score {card.minCreditScore}+
            </p>
            {card.score === bestScore && (
              <div className="mt-4">
                <p className="text-sm text-blue-600 font-medium mb-1">Why we recommend this:</p>
                <ul className="list-disc list-inside text-sm text-gray-600">
                  {card.reasons.map((r, i) => (
                    <li key={i}>✔ {r}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
