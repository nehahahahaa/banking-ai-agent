"use client"

import { useState } from "react"
import { EligibilityForm } from "@/components/refined-eligibility-checker"
import { CardComparisonTable } from "@/components/card-comparison-table"
import { FaqSection } from "@/components/refined-faq-section"

export default function Page() {
  const [result, setResult] = useState<any>(null)

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="mt-10">
        <EligibilityForm onSubmit={setResult} setLanguage={() => {}} />
      </div>

      {result && (
        <div className="mt-10">
          <CardComparisonTable userContext={result.userContext} />
        </div>
      )}

      <div className="mt-10">
        <FaqSection language="en" />
      </div>

      <div className="fixed bottom-6 right-6 bg-blue-600 text-white px-4 py-2 rounded-full shadow-lg cursor-pointer">
        Chat with Assistant
      </div>
    </div>
  )
}
