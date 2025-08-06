"use client"

import { useState } from "react"
import { cards } from "@/lib/utils/cardsData"
import { CardComparisonPanel } from "@/components/CardComparisonPanel"
import { RecommendedCardBanner } from "@/components/RecommendedCardBanner"
import { EligibilityForm } from "@/components/EligibilityForm"
import { EligibilityResult } from "@/components/EligibilityResult"
import { FaqSection } from "@/components/FaqSection"
import { LanguageSelector } from "@/components/LanguageSelector"

export default function Home() {
  const [selectedCards, setSelectedCards] = useState<typeof cards>([])
  const [language, setLanguage] = useState("en")

  return (
    <main className="p-4 max-w-4xl mx-auto">
      <div className="flex justify-end mb-4">
        <LanguageSelector language={language} setLanguage={setLanguage} />
      </div>

      <h1 className="text-2xl font-bold mb-6">Banking AI Assistant</h1>

      <EligibilityForm
        cards={cards}
        onMatch={(matchedCards) => setSelectedCards(matchedCards)}
        language={language}
      />

      <RecommendedCardBanner cards={selectedCards} language={language} />

      {selectedCards?.length > 0 && (
        <EligibilityResult selectedCard={selectedCards[0]} reasons={selectedCards[0].reasons} />
      )}

      <CardComparisonPanel cards={cards} />

      <FaqSection language={language} />
    </main>
  )
}
