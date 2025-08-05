"use client"

import type React from "react"
import { useState } from "react"
import { CheckCircle } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { cards } from "@/lib/utils/cardsData"
import { scoreCard } from "@/lib/utils/scoreCard"

interface RefinedEligibilityCheckerProps {
  language: string
}

export function RefinedEligibilityChecker({ language }: RefinedEligibilityCheckerProps) {
  const [income, setIncome] = useState("")
  const [age, setAge] = useState("")
  const [employment, setEmployment] = useState("")
  const [recommendedCard, setRecommendedCard] = useState<null | { name: string; reasons: string[] }>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const incomeNum = Number.parseInt(income)
    const ageNum = Number.parseInt(age)

    if (incomeNum >= 25000 && ageNum >= 18 && employment) {
      let bestCard = null
      let bestScore = -1
      let bestReasons: string[] = []

      for (const card of cards) {
        const { score, reasons } = scoreCard(card, {
          income: incomeNum,
          age: ageNum,
          employment,
          preference: null,
        })
        if (score > bestScore) {
          bestScore = score
          bestCard = card.name
          bestReasons = reasons
        }
      }

      setRecommendedCard({ name: bestCard!, reasons: bestReasons })
    } else {
      setRecommendedCard(null)
    }
  }

  const getResultCard = () => {
    if (!income || !age || !employment) return null

    if (!recommendedCard) {
      return (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="font-semibold text-red-800">
                  {language === "en" && "Not Eligible Currently"}
                  {language === "hi" && "वर्तमान में पात्र नहीं"}
                  {language === "es" && "No Elegible Actualmente"}
                </h3>
                <p className="text-sm text-red-600">
                  {language === "en" && "Based on the information provided"}
                  {language === "hi" && "प्रदान की गई जानकारी के आधार पर"}
                  {language === "es" && "Basado en la información proporcionada"}
                </p>
              </div>
            </div>
            <p className="text-sm text-red-700">
              {language === "en" &&
                "You may not qualify for our current offers. Please contact us for alternative options."}
              {language === "hi" && "आप हमारे वर्तमान ऑफर के लिए योग्य नहीं हो सकते। वैकल्पिक विकल्पों के लिए कृपया हमसे संपर्क करें।"}
              {language === "es" &&
                "Es posible que no califiques para nuestras ofertas actuales. Por favor contáctanos para opciones alternativas."}
            </p>
          </CardContent>
        </Card>
      )
    }

    return (
      <Card className="border-green-200 bg-green-50 border-2">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <p className="text-lg font-semibold text-gray-900">
                ✅ {language === "en" && `Based on your inputs, you may be eligible for the ${recommendedCard.name}.`}
                {language === "hi" && `✅ आपके इनपुट के आधार पर, आप ${recommendedCard.name} के लिए पात्र हो सकते हैं।`}
                {language === "es" && `✅ Basado en tus datos, podrías ser elegible para la Tarjeta ${recommendedCard.name}.`}
              </p>
              <ul className="mt-2 list-disc list-inside text-sm text-gray-700">
                {recommendedCard.reasons.map
