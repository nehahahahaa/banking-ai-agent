"use client"

import { useState } from "react"
import { CheckCircle, AlertTriangle } from "lucide-react"
import { scoreCard } from "../lib/utils/scoreCard"
import { cards } from "../lib/utils/cardsData"

export default function RefinedEligibilityChecker() {
  const [income, setIncome] = useState("")
  const [age, setAge] = useState("")
  const [employmentType, setEmploymentType] = useState("")
  const [submitted, setSubmitted] = useState(false)
  const [result, setResult] = useState<any>(null)

  const handleCheckEligibility = () => {
    setSubmitted(true)

    const user = {
      income: Number(income),
      age: Number(age),
      employmentType: employmentType.toLowerCase(),
    }

    const scored = cards.map((card) => ({
      ...card,
      ...scoreCard(card, user),
    }))

    const fullMatches = scored.filter((c) => c.score === 3)
    const partialMatches = scored.filter((c) => c.score > 0 && c.score < 3)

    if (fullMatches.length > 0) {
      setResult({
        type: "full-match",
        cards: fullMatches,
      })
    } else if (partialMatches.length > 0) {
      setResult({
        type: "partial-match",
        failures: partialMatches.flatMap((pm) => [`${pm.name}:`, ...pm.failures]),
      })
    } else {
      setResult({
        type: "no-match",
      })
    }
  }

  const handleReset = () => {
    setIncome("")
    setAge("")
    setEmploymentType("")
    setSubmitted(false)
    setResult(null)
  }

  // Group failures so card headings are NOT bullets
  const groupFailures = (rows: string[]) => {
    const groups: Array<{ card: string; items: string[] }> = []
    let current: { card: string; items: string[] } | null = null

    rows.forEach((line) => {
      if (line.endsWith(":")) {
        current = { card: line.replace(/:$/, ""), items: [] }
        groups.push(current)
      } else if (current) {
        current.items.push(line.replace(/^[-•]\s*/, "").trim())
      }
    })
    return groups
  }

  return (
    <div className="mt-10 p-6 border border-gray-300 rounded-xl shadow-sm">
      <h2 className="text-xl font-semibold flex items-center gap-2 text-green-700">
        <CheckCircle className="w-5 h-5 text-green-600" />
        Check Your Eligibility
      </h2>
      <p className="text-gray-600 mb-4">
        Get personalized card recommendations in just a few steps
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <input
          type="number"
          placeholder="Monthly Income (USD)"
          value={income}
          onChange={(e) => setIncome(e.target.value)}
          className="border rounded-lg p-2"
        />
        <input
          type="number"
          placeholder="Your Age"
          value={age}
          onChange={(e) => setAge(e.target.value)}
          className="border rounded-lg p-2"
        />
        <select
          value={employmentType}
          onChange={(e) => setEmploymentType(e.target.value)}
          className="border rounded-lg p-2"
        >
          <option value="">Employment Type</option>
          <option value="salaried">Salaried</option>
          <option value="self-employed">Self-Employed</option>
          <option value="student">Student</option>
          <option value="retired">Retired</option>
        </select>
      </div>

      <div className="flex gap-4 mt-4">
        <button
          onClick={handleCheckEligibility}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg"
        >
          Check Eligibility
        </button>
        <button
          onClick={handleReset}
          className="bg-gray-300 text-gray-800 px-4 py-2 rounded-lg"
        >
          Reset
        </button>
      </div>

      {/* Full Match */}
      {submitted && result?.type === "full-match" && (
        <div className="mt-6 border border-green-500 bg-green-50 text-green-800 p-4 rounded-xl">
          <p className="font-semibold mb-2">🧠 Builds trust by showing logic clearly</p>
          <p>Based on your inputs, you may be eligible for the following cards:</p>
          <ul className="list-disc list-inside mt-2">
            {result.cards.map((card: any, index: number) => (
              <li key={index}>{card.name}</li>
            ))}
          </ul>
        </div>
      )}

      {/* Partial Match */}
      {submitted && result?.type === "partial-match" && (
        <div className="mt-6 border border-yellow-500 bg-yellow-50 text-yellow-800 p-4 rounded-xl">
          <p className="font-semibold mb-2">⚠️ Partial match – explained clearly</p>
          <p>Some eligibility criteria were not met. Please see the reasons below.</p>

          <div className="mt-3 space-y-3">
            {groupFailures(result.failures || []).map((g, gi) => (
              <div key={gi}>
                {/* Card heading — NO bullet */}
                <p className="font-medium text-gray-900">{g.card}:</p>
                {/* Reasons — NO bullets; ensure each starts with ✗ */}
                <ul className="list-none pl-0 mt-1 space-y-1">
                  {g.items.map((it, ii) => (
                    <li key={ii} className="pl-0">
                      {it.startsWith("✗") ? it : `✗ ${it}`}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* No Match */}
      {submitted && result?.type === "no-match" && (
        <div className="mt-6 border border-red-500 bg-red-50 text-red-800 p-4 rounded-xl">
          <p className="font-semibold mb-2">❌ No eligible cards found</p>
          <p>Please adjust your inputs and try again.</p>
        </div>
      )}
    </div>
  )
}
