// ✅ Path: components/recommended-card-banner.tsx

"use client"

import { Card } from "@/lib/utils/scoreCard"
import { CheckCircle } from "lucide-react"

interface RecommendedCardBannerProps {
  selectedCard: Card | null
  reasons: string[]
}

export function RecommendedCardBanner({ selectedCard, reasons }: RecommendedCardBannerProps) {
  if (!selectedCard) return null

  return (
    <div className="bg-green-50 border border-green-300 rounded-xl p-6 mt-6 text-sm text-gray-800 shadow-sm space-y-3">
      <div className="flex items-center gap-2">
        <CheckCircle className="text-green-600 w-5 h-5" />
        <p className="font-semibold">
          Based on your inputs, you may be eligible for the <strong>{selectedCard.name}</strong>.
        </p>
      </div>

      <ul className="list-disc list-inside text-sm pl-1 text-gray-700">
        {reasons.map((reason, i) => (
          <li key={i}>✓ {reason}</li>
        ))}
      </ul>

      <p className="text-green-600 font-medium pt-1">
        ✅ Transparent + choice-driven
      </p>
    </div>
  )
}
