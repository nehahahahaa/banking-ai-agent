"use client"

import { useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { CheckCircle2 } from "lucide-react"
import { cards } from "@/lib/utils/cardsData"
import { getBestCards } from "@/lib/utils/scoreCard"

interface Props {
  language: string
  onUserContextChange: (context: {
    income: number
    age: number
    employment: string
    preference: string | null
  }) => void
}

export function RefinedEligibilityChecker({ language, onUserContextChange }: Props) {
  const [income, setIncome] = useState("")
  const [age, setAge] = useState("")
  const [employment, setEmployment] = useState("Salaried")
  const [submitted, setSubmitted] = useState(false)
  const [bestCard, setBestCard] = useState<null | any>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    const context = {
      income: Number(income),
      age: Number(age),
      employment,
      preference: null,
    }

    // Update user context for chat assistant
    onUserContextChange(context)

    const results = getBestCards(cards, context)
    setBestCard(results.length > 0 ? results[0] : null)
    setSubmitted(true)
  }

  return (
    <section className="space-y-6">
      <Card>
        <CardContent className="p-6 space-y-4">
          <h2 className="text-xl font-semibold text-green-800 flex items-center gap-2">
            <CheckCircle2 className="text-green-500 w-5 h-5" />
            {language === "en" && "Check Your Eligibility"}
            {language === "hi" && "अपनी पात्रता जांचें"}
            {language === "es" && "Verifica Tu Elegibilidad"}
          </h2>
          <p className="text-gray-600">
            {language === "en" && "Get personalized card recommendations in just a few steps"}
            {language === "hi" && "कुछ आसान चरणों में व्यक्तिगत कार्ड सिफारिशें प्राप्त करें"}
            {language === "es" && "Obtén recomendaciones personalizadas de tarjetas en solo unos pasos"}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium">Monthly Income (USD)</label>
                <Input
                  type="number"
                  value={income}
                  onChange={(e) => setIncome(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Your Age</label>
                <Input
                  type="number"
                  value={age}
                  onChange={(e) => setAge(e.target.value)}
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium">Employment Type</label>
                <select
                  value={employment}
                  onChange={(e) => setEmployment(e.target.value)}
                  className="w-full p-2 border rounded-md"
                >
                  <option value="Salaried">Salaried</option>
                  <option value="Self-Employed">Self-Employed</option>
                  <option value="Student">Student</option>
                </select>
              </div>
            </div>

            <Button type="submit" className="bg-blue-800 hover:bg-blue-900 text-white w-full">
              {language === "en" && "Check Eligibility"}
              {language === "hi" && "पात्रता जांचें"}
              {language === "es" && "Verificar Elegibilidad"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {submitted && (
        <Card className="bg-green-50 border-green-200">
          <CardContent className="p-6">
            {bestCard ? (
              <>
                <h3 className="text-green-800 font-semibold flex items-center gap-2 text-lg">
                  <CheckCircle2 className="text-green-500 w-5 h-5" />
                  Based on your inputs, you may be eligible for the {bestCard.name}.
                </h3>
                <ul className="list-disc list-inside text-gray-700 mt-2 space-y-1">
                  {bestCard.reasons.map((reason: string, idx: number) => (
                    <li key={idx}>{reason}</li>
                  ))}
                </ul>
              </>
            ) : (
              <p className="text-red-600">Sorry, no cards match your profile.</p>
            )}
          </CardContent>
        </Card>
      )}
    </section>
  )
}
