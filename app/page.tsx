"use client"

import { useState } from "react"
import { EligibilityForm } from "@/components/refined-eligibility-checker"
import { CardComparisonTable } from "@/components/card-comparison-table"
import { FaqSection } from "@/components/refined-faq-section"
import { cards as defaultCards } from "@/lib/utils/cardsData"

export default function Page() {
  const [result, setResult] = useState<any>(null)

  const safeRecommended =
    Array.isArray(result?.recommendedCards)
      ? result!.recommendedCards
      : result?.recommendedCards
        ? [result.recommendedCards]
        : []

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="text-center mt-10">
        <h1 className="text-3xl font-bold text-blue-800">Find Your Perfect Credit Card</h1>
        <p className="mt-2 text-gray-600">
          Compare cards, check eligibility, and get personalized recommendations with our AI-powered banking assistant
        </p>
      </div>

      <div className="mt-10">
        <CardComparisonTable
          userContext={result?.userContext || { income: 0, age: 0, employment: "", preference: null }}
          cards={defaultCards}                        {/* <- never an object rendered */}
          recommendedCards={safeRecommended}          {/* <- guaranteed array */}
        />
      </div>

      <div className="mt-10">
        <EligibilityForm onSubmit={setResult} setLanguage={() => {}} />
      </div>

      <div className="mt-10">
        <FaqSection language="en" />
      </div>

      <div className="fixed bottom-6 right-6 bg-blue-600 text-white px-4 py-2 rounded-full shadow-lg cursor-pointer">
        Chat with Assistant
      </div>
    </div>
  )
}
