
"use client"

import { useState } from "react"
import { CheckCircle } from "lucide-react"
import { cards } from "@/lib/utils/cardsData"
import { scoreCard } from "@/lib/utils/scoreCard"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface EligibilityFormProps {
  onSubmit: (result: any) => void
  setLanguage: (lang: string) => void
}

export function EligibilityForm({ onSubmit, setLanguage }: EligibilityFormProps) {
  const [income, setIncome] = useState("")
  const [age, setAge] = useState("")
  const [employment, setEmployment] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const [recommendedCards, setRecommendedCards] = useState<any[]>([])
  const [userContext, setUserContext] = useState<any>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)

    const context = {
      income: Number(income),
      age: Number(age),
      employment,
      preference: null,
    }

    const scored = cards.map((card) => {
      const { score, reasons } = scoreCard(card, context)
      return { ...card, score, reasons }
    })

    const bestScore = Math.max(...scored.map((c) => c.score))
    const bestCards = scored.filter((c) => c.score === bestScore)

    setRecommendedCards(bestCards)
    setUserContext(context)
    onSubmit({ userContext: context, recommendedCards: bestCards })
  }

  return (
    <div className="bg-white shadow-md rounded-xl p-6 mt-10 max-w-4xl mx-auto">
      <div className="flex items-center gap-2 mb-2 text-green-700">
        <CheckCircle className="w-5 h-5" />
        <h2 className="text-md font-semibold">Check Your Eligibility</h2>
      </div>
      <p className="text-sm text-gray-600 mb-6">
        Get personalized card recommendations in just a few steps
      </p>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Monthly Income (USD)</label>
            <input
              type="number"
              className="mt-1 block w-full p-2 border border-gray-300 rounded"
              value={income}
              onChange={(e) => setIncome(e.target.value)}
              placeholder="Please enter your income"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Your Age</label>
            <input
              type="number"
              className="mt-1 block w-full p-2 border border-gray-300 rounded"
              value={age}
              onChange={(e) => setAge(e.target.value)}
              placeholder="Please enter your age"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Employment Type</label>
            <select
              className="mt-1 block w-full p-2 border border-gray-300 rounded"
              value={employment}
              onChange={(e) => setEmployment(e.target.value)}
              required
            >
              <option value="" disabled>None</option>
              <option value="salaried">Salaried</option>
              <option value="self-employed">Self-employed</option>
              <option value="student">Student</option>
              <option value="retired">Retired</option>
            </select>
          </div>
        </div>

        <button
          type="submit"
          className="mt-6 w-full bg-blue-700 text-white font-semibold py-2 px-4 rounded hover:bg-blue-800 transition"
        >
          Check Eligibility
        </button>
      </form>

      {submitted && recommendedCards.length > 0 && (
        <div className="mt-6 border border-green-500 bg-green-50 text-green-800 p-4 rounded-xl">
          <p className="font-semibold mb-2">🧠 Builds trust by showing logic clearly</p>
          <p>Based on your inputs, we recommend the following card(s):</p>
          <ul className="list-disc list-inside mt-2">
            {recommendedCards.map((card, i) => (
              <li key={i}>{card.name}</li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
