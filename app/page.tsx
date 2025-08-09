"use client"

import { useState } from "react"
import { EligibilityForm } from "@/components/refined-eligibility-checker"
import { CardComparisonTable } from "@/components/card-comparison-table"
import { FaqSection } from "@/components/refined-faq-section"
import { cards as defaultCards } from "@/lib/utils/cardsData"
import { ChatAssistant } from "@/components/chat-assistant" // ✅ import your chat assistant

export default function Page() {
  const [result, setResult] = useState<any>(null)

  // Always pass an array to the table (prevents Vercel prerender errors)
  const safeRecommended =
    Array.isArray(result?.recommendedCards)
      ? result!.recommendedCards
      : result?.recommendedCards
        ? [result.recommendedCards]
        : []

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Heading */}
      <div className="text-center mt-10">
        <h1 className="text-3xl font-bold text-blue-800">Find Your Perfect Credit Card</h1>
        <p className="mt-2 text-gray-600">
          Compare cards, check eligibility, and get personalized recommendations with our AI-powered banking assistant
        </p>
      </div>

      {/* Card Comparison */}
      <div className="mt-10">
        <CardComparisonTable
          // Keeping this prop to avoid changing current behavior (even if unused by the table)
          userContext={result?.userContext || { income: 0, age: 0, employment: "", preference: null }}
          // Ensure cards is always an array (static prerender safe)
          cards={defaultCards}
          // Ensure recommendedCards is always an array
          recommendedCards={safeRecommended}
        />
      </div>

      {/* Eligibility Form */}
      <div className="mt-10">
        <EligibilityForm onSubmit={setResult} setLanguage={() => {}} />
      </div>

      {/* FAQ Section */}
      <div className="mt-10">
        <FaqSection language="en" />
      </div>

      {/* ✅ Floating Chat Assistant */}
      <ChatAssistant
        language="en"
        userContext={result?.userContext || { income: 0, age: 0, employment: "", preference: null }}
      />
    </div>
  )
}
