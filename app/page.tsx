"use client"

import { useState } from "react"
import { Header } from "@/components/header"
import { RecommendedCardBanner } from "@/components/recommended-card-banner"
import { CardComparisonTable } from "@/components/card-comparison-table"
import { RefinedEligibilityChecker } from "@/components/refined-eligibility-checker"
import { RefinedFAQSection } from "@/components/refined-faq-section"
import { ChatAssistant } from "@/components/chat-assistant"
import { EligibilityResult } from "@/components/eligibility-result"
import cards from "@/lib/utils/cardsData"
import { scoreCard } from "@/lib/utils/scoreCard"

export default function BankingAssistant() {
  const [language, setLanguage] = useState("en")

  // Default user context
  const userContext = {
    income: 50000, // You can connect this to actual user input later
    age: 30,
    employment: "salaried",
    preference: null,
  }

  // Score cards and filter top eligible ones
  const scoredCards = cards
    .map(card => {
      const { score, reasons } = scoreCard(card, userContext)
      return { ...card, score, reasons }
    })
    .filter(c => c.score >= 2)
    .sort((a, b) => b.score - a.score)

  const bestMatchedCard = scoredCards[0] || null
  const matchingReasons = bestMatchedCard ? bestMatchedCard.reasons : []

  return (
    <div className="min-h-screen bg-slate-50">
      <Header language={language} onLanguageChange={setLanguage} />

      <main className="container mx-auto px-4 py-8 space-y-12">
        <section>
          <div className="text-center mb-8">
            <h1 className="text-4xl font-bold text-blue-800 mb-4">
              {language === "en" && "Find Your Perfect Credit Card"}
              {language === "hi" && "अपना सही क्रेडिट कार्ड खोजें"}
              {language === "es" && "Encuentra Tu Tarjeta de Crédito Perfecta"}
            </h1>
            <p className="text-lg text-gray-600 max-w-2xl mx-auto">
              {language === "en" &&
                "Compare cards, check eligibility, and get personalized recommendations with our AI-powered banking assistant"}
              {language === "hi" &&
                "कार्ड की तुलना करें, पात्रता जांचें, और हमारे AI-संचालित बैंकिंग असिस्टेंट के साथ व्यक्तिगत सिफारिशें प्राप्त करें"}
              {language === "es" &&
                "Compara tarjetas, verifica elegibilidad y obtén recomendaciones personalizadas con nuestro asistente bancario impulsado por IA"}
            </p>
          </div>

          {/* ✅ Show recommended card with reasons */}
          <RecommendedCardBanner cards={scoredCards} language={language} />

          <div id="card-comparison">
            <CardComparisonTable userContext={userContext} />
          </div>
        </section>

        <section>
          <RefinedEligibilityChecker language={language} />
        </section>

        <section>
          <RefinedFAQSection language={language} />
        </section>
      </main>

      <ChatAssistant language={language} />
    </div>
  )
}
