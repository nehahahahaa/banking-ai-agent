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
    const partialMatches = scored.filter(
      (c) => c.score > 0 && c.score < 3
    )

    if (fullMatches.length > 0) {
      setResult({
        type: "full-match",
        cards: fullMatches,
      })
    } else if (partialMatches.length > 0) {
      setResult({
        type: "partial-match",
        failures: partialMatches.flatMap((pm) => [
          `${pm.name}:`,
          ...pm.failures,
        ]),
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

  // NEW helper to group failures without bullets for card headings
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
      {submitted && result?.type === "full
