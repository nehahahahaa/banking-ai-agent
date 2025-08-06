"use client"

import { useState } from "react"
import { EligibilityForm } from "@/components/refined-eligibility-checker"
import { CardComparisonTable } from "@/components/CardComparisonTable"
import { FAQSection } from "@/components/refined-faq-section"

export default function Page() {
  const [result, setResult] = useState<any>(null)

  return (
    <div className="max-w-7xl mx-auto p-6">
      {/* Card Comparison Table at Top */}
      <CardComparisonTable userContext={result?.userContext || { income: 0, age: 0, employment: '', preference: null }} />

      {/* Eligibility Form Below Cards */}
      <div className="mt-10">
        <EligibilityForm onSubmit={setResult} setLanguage={() => {}} />
      </div>

      {/* FAQ Section */}
      <div className="mt-10">
        <FAQSection />
      </div>

      {/* Floating Chat Assistant Button */}
      <div className="fixed bottom-6 right-6 bg-blue-600 text-white px-4 py-2 rounded-full shadow-lg cursor-pointer">
        Chat with Assistant
      </div>
    </div>
  )
}
