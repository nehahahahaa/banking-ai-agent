"use client"

import { CardComparisonPanel } from "@/components/card-comparison-table"
import { EligibilityForm } from "@/components/refined-eligibility-checker"
import { EligibilityResult } from "@/components/eligibility-result"
import { RecommendedCardBanner } from "@/components/recommended-card-banner"
import { FaqSection } from "@/components/refined-faq-section"


export default function HomePage() {
  const [selectedCards, setSelectedCards] = useState([])
  const [language, setLanguage] = useState("en")
  const [eligibilityResult, setEligibilityResult] = useState({})

  const handleEligibilityCheck = (result) => {
    setEligibilityResult(result || {})
    setSelectedCards(result?.recommendedCards || [])
  }

  return (
    <main className="p-6 max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Banking AI Assistant</h1>

      <EligibilityForm onSubmit={handleEligibilityCheck} setLanguage={setLanguage} />

      {eligibilityResult && Object.keys(eligibilityResult).length > 0 && (
        <EligibilityResult result={eligibilityResult} language={language} />
      )}

      <RecommendedCardBanner cards={selectedCards ?? []} language={language} />

      <CardComparisonPanel cards={selectedCards ?? []} />

      <FaqSection language={language} />
    </main>
  )
}
