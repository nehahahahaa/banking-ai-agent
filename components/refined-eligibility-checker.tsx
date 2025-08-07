

"use client"

import { useState } from "react"
import { CheckCircle } from "lucide-react"
import { cards } from "@/lib/utils/cardsData"
import { handleChatQuery } from "@/lib/utils/scoreCard"
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
  const [result, setResult] = useState<any>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)

    const context = {
      income: Number(income),
      age: Number(age),
      employment: employment.toLowerCase(),
      preference: null,
    }

    const response = handleChatQuery(context)

    const matchedCards = response.recommendedCards?.map((name: string) =>
      cards.find((c) => c.name === name)
    ) || []

    setResult({ ...response, recommendedCards: matchedCards })
    onSubmit({ userContext: context, ...response })
  } // ✅ ← This was the missing brace causing the Vercel build to fail

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

      {/* ✅ Green Box – Full or Multiple Match */}
      {submitted && result?.type === "full-match" && (
        <div className="mt-6 border border-green-500 bg-green-50 text-green-800 p-4 rounded-xl">
          <p className="font-semibold mb-2">🧠 Builds trust by showing logic clearly</p>
          <p>{result.message}</p>
          <ul className="list-disc list-inside mt-2">
            {result.recommendedCards.map((card: any, i: number) => (
              <li key={i}>{card.name}</li>
            ))}
          </ul>
        </div>
      )}

      {submitted && result?.type === "multiple-match" && (
        <div className="mt-6 border border-green-500 bg-green-50 text-green-800 p-4 rounded-xl">
          <p className="font-semibold mb-2">🟢 Transparent + ranked choices</p>
          <p>{result.message}</p>
          <ul className="list-disc list-inside mt-2">
            {result.recommendedCards.map((card: any, i: number) => (
              <li key={i}>{card.name}</li>
            ))}
          </ul>
        </div>
      )}

      {/* ⚠️ Yellow Box – Partial Match */}
      {submitted && result?.type === "partial-match" && (
        <div className="mt-6 border border-yellow-500 bg-yellow-50 text-yellow-800 p-4 rounded-xl">
          <p className="font-semibold mb-2">⚠️ Partial match – explained clearly</p>
          <p>{result.message}</p>
          <ul className="list-disc list-inside mt-2">
            {result.failures.map((fail: string, i: number) => (
              <li key={i}>{fail}</li>
            ))}
          </ul>
        </div>
      )}

      {/* ❌ Red Box – No Match */}
      {submitted && result?.type === "no-match" && (
        <div className="mt-6 border border-red-500 bg-red-50 text-red-800 p-4 rounded-xl">
          <p className="font-semibold mb-2">❌ No card matches your inputs right now.</p>
          <p>
            Try adjusting income, age, or employment type to see more options.
            You can also <strong>connect with a banking specialist</strong> for personalized guidance.
          </p>
          <p className="mt-1">📞 Call us at <strong>1-800-555-BANK</strong> to speak with an agent.</p>
        </div>
      )}
    </div>
  )
}
