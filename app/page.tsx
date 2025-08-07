"use client"

import { useState } from "react"
import { EligibilityForm } from "@/components/refined-eligibility-checker"
import { CardComparisonTable } from "@/components/card-comparison-table"
import { FaqSection } from "@/components/refined-faq-section"

export default function Page() {
  const [result, setResult] = useState<any>(null)

  const fullMatch =
    result?.eligibleCards?.length &&
    result?.ineligibleCards?.length === 0

  const hasPartialMatch =
    result?.eligibleCards?.length &&
    result?.ineligibleCards?.length

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Heading */}
      <div className="text-center mt-10">
        <h1 className="text-3xl font-bold text-blue-800">Find Your Perfect Credit Card</h1>
        <p className="mt-2 text-gray-600">
          Compare cards, check eligibility, and get personalized recommendations with our AI-powered banking assistant
        </p>
      </div>

      {/* ✅ Always show the card comparison table */}
      <div className="mt-10">
        <CardComparisonTable userContext={result?.userContext || { income: 0, age: 0, employment: '', preference: null }} />
      </div>

      {/* ✅ Eligibility Form */}
      <div className="mt-10">
        <EligibilityForm onSubmit={setResult} setLanguage={() => {}} />
      </div>

      {/* ✅ Full Match Result */}
      {fullMatch && (
        <div className="mt-8 bg-green-50 border border-green-400 text-green-800 p-4 rounded-lg">
          <p className="font-semibold mb-2">🧠 Builds trust by showing logic clearly</p>
          <p>Based on your inputs, we recommend the following card(s):</p>
          <ul className="list-disc list-inside mt-2">
            {result.eligibleCards.map((card: any) => (
              <li key={card.name}>{card.name}</li>
            ))}
          </ul>
        </div>
      )}

      {/* ✅ Partial Match Result */}
      {hasPartialMatch && !fullMatch && (
        <div className="mt-8 bg-yellow-50 border border-yellow-400 text-yellow-800 p-4 rounded-lg">
          <p className="font-semibold mb-2">⚠️ Partial match – explained clearly</p>
          <p>Some eligibility criteria were not met. Please see the reasons below.</p>
          <ul className="list-disc list-inside mt-2 space-y-2">
            {result.ineligibleCards.map((card: any) => (
              <li key={card.name}>
                <span className="font-semibold">{card.name}:</span>
                <ul className="list-disc list-inside ml-4">
                  {card.failures?.map((f: string, i: number) => (
                    <li key={i}>✗ {f}</li>
                  ))}
                </ul>
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* FAQ Section */}
      <div className="mt-10">
        <FaqSection language="en" />
      </div>

      {/* Floating Chat */}
      <div className="fixed bottom-6 right-6 bg-blue-600 text-white px-4 py-2 rounded-full shadow-lg cursor-pointer">
        Chat with Assistant
      </div>
    </div>
  )
}
