"use client"

import { useState } from "react"
import { CheckCircle } from "lucide-react"
import { cards } from "../lib/utils/cardsData"
import { handleChatQuery } from "../lib/utils/scoreCard"

interface EligibilityFormProps {
  onSubmit: (result: any) => void
  setLanguage: (lang: string) => void
}

export function EligibilityForm({ onSubmit, setLanguage }: EligibilityFormProps) {
  const [income, setIncome] = useState("")
  const [age, setAge] = useState("")
  const [employment, setEmployment] = useState("")
  const [hasCosigner, setHasCosigner] = useState(false)

  const [submitted, setSubmitted] = useState(false)
  const [result, setResult] = useState<any>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setSubmitted(true)

    // ✅ Only show/allow cosigner for students 18–25 with income > 5000
    const showCosigner =
      employment.toLowerCase() === "student" &&
      Number(age) >= 18 &&
      Number(age) <= 25 &&
      Number(income) > 5000

    // ✅ Only pass cosigner if the checkbox is actually shown
    const effectiveCosigner = showCosigner ? hasCosigner : false

    const context = {
      income: Number(income),
      age: Number(age),
      employment: employment.toLowerCase(),
      preference: null,
      hasCosigner: effectiveCosigner,
    }

    const response = handleChatQuery(context)

    // names -> objects (for table highlight)
    const matchedCards =
      response.recommendedCards?.map((name: string) => cards.find(c => c?.name === name)) || []

    // Student-specific copy when approving with cosigner (only when cosigner path is actually used)
    const studentCardName = "Student Essentials Card"
    const recommendsStudent = matchedCards.some(c => c?.name === studentCardName)
    const useCosignerMsg = recommendsStudent && effectiveCosigner

    const message = useCosignerMsg
      ? `Recommended with Cosigner — ${studentCardName} fits your profile with a qualified cosigner.`
      : response.message

    setResult({ ...response, recommendedCards: matchedCards, message })
    onSubmit({ userContext: context, ...response, recommendedCards: matchedCards, message })
  }

  const handleReset = () => {
    setIncome("")
    setAge("")
    setEmployment("")
    setHasCosigner(false)
    setSubmitted(false)
    setResult(null)

    // Clear highlights/results upstream
    onSubmit({
      userContext: { income: 0, age: 0, employment: "", preference: null },
      recommendedCards: [],
      type: null,
      reasons: [],
      failures: [],
      message: "",
    })
  }

  // ✅ Only show cosigner when: student + age 18–25 + income > 5000
  const showCosigner =
    employment.toLowerCase() === "student" &&
    Number(age) >= 18 &&
    Number(age) <= 25 &&
    Number(income) > 5000

  // ✅ Tag appears only when cosigner path is actually used
  const showCosignerTag = showCosigner && hasCosigner

  // Group flat failures so card headings aren’t bullets
  const groupFailures = (rows: string[]) => {
    const groups: Array<{ card: string; items: string[] }> = []
    let current: { card: string; items: string[] } | null = null

    rows?.forEach((line) => {
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

        {showCosigner && (
          <div className="flex items-center gap-2 pt-1">
            <input
              id="cosigner"
              type="checkbox"
              className="h-4 w-4"
              checked={hasCosigner}
              onChange={(e) => setHasCosigner(e.target.checked)}
            />
            <label htmlFor="cosigner" className="text-sm text-gray-700">
              Has cosigner?
            </label>
          </div>
        )}

        <div className="flex gap-4">
          <button
            type="submit"
            className="mt-6 flex-1 bg-blue-700 text-white font-semibold py-2 px-4 rounded hover:bg-blue-800 transition"
          >
            Check Eligibility
          </button>
          <button
            type="button"
            onClick={handleReset}
            className="mt-6 flex-1 bg-gray-300 text-gray-800 font-semibold py-2 px-4 rounded hover:bg-gray-400 transition"
          >
            Reset
          </button>
        </div>
      </form>

      {/* ✅ Green Box – Full match */}
      {submitted && result?.type === "full-match" && (
        <div className="mt-6 border border-green-500 bg-green-50 text-green-800 p-4 rounded-xl">
          <p className="font-semibold mb-2">🧠 Builds trust by showing logic clearly</p>
          <p>{result.message}</p>
          <ul className="list-disc list-inside mt-2">
            {result.recommendedCards?.map((card: any, i: number) => (
              <li key={i}>
                {card.name}
                {card.name === "Student Essentials Card" && showCosignerTag && (
                  <span className="ml-2 text-xs font-medium text-blue-600">(with cosigner)</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ✅ Green Box – Multiple matches */}
      {submitted && result?.type === "multiple-match" && (
        <div className="mt-6 border border-green-500 bg-green-50 text-green-800 p-4 rounded-xl">
          <p className="font-semibold mb-2">🟢 Transparent + ranked choices</p>
          <p>{result.message}</p>
          <ul className="list-disc list-inside mt-2">
            {result.recommendedCards?.map((card: any, i: number) => (
              <li key={i}>
                {card.name}
                {card.name === "Student Essentials Card" && showCosignerTag && (
                  <span className="ml-2 text-xs font-medium text-blue-600">(with cosigner)</span>
                )}
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* ⚠️ Yellow Box – Partial match (card headings without bullets) */}
      {submitted && result?.type === "partial-match" && (
        <div className="mt-6 border border-yellow-500 bg-yellow-50 text-yellow-800 p-4 rounded-xl">
          <p className="font-semibold mb-2">⚠️ Partial match – explained clearly</p>
          <p>{result.message || "Some eligibility criteria were not met. Please see the reasons below."}</p>

          <div className="mt-3 space-y-3">
            {groupFailures(result.failures || []).map((g, gi) => (
              <div key={gi}>
                <p className="font-medium text-gray-900">{g.card}:</p>
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

      {/* ❌ Red Box – No match */}
      {submitted && result?.type === "no-match" && (
        <div className="mt-6 border border-red-500 bg-red-50 text-red-800 p-4 rounded-xl">
          <p className="font-semibold mb-2">❌ No card matches your inputs right now.</p>
          <p>Try adjusting income, age, or employment type to see more options.</p>
        </div>
      )}
    </div>
  )
}

// Also export default for safety (in case somewhere imports default)
export default EligibilityForm
