"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { scoreCard } from "@/lib/utils/scoreCard"
import { cards } from "@/lib/utils/cardsData"

interface EligibilityFormProps {
  onSubmit: (result: {
    userContext: {
      income: number
      age: number
      employment: string
      preference: string | null
    }
  }) => void
  setLanguage: (lang: string) => void
}

export function EligibilityForm({ onSubmit, setLanguage }: EligibilityFormProps) {
  const [income, setIncome] = useState("")
  const [age, setAge] = useState("")
  const [employment, setEmployment] = useState("")
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = (e: any) => {
    e.preventDefault()

    const userContext = {
      income: Number(income),
      age: Number(age),
      employment,
      preference: null,
    }

    setSubmitted(true)
    onSubmit({ userContext })
  }

  const userContext = {
    income: Number(income),
    age: Number(age),
    employment,
    preference: null,
  }

  const allScores = cards.map(card => scoreCard(card, userContext))
  const noMatch = submitted && allScores.every(score => score.score === 0)

  return (
    <form onSubmit={handleSubmit} className="space-y-6 bg-gray-50 p-6 rounded-xl shadow">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div>
          <Label>Monthly Income ($)</Label>
          <Input type="number" value={income} onChange={(e) => setIncome(e.target.value)} />
        </div>
        <div>
          <Label>Age</Label>
          <Input type="number" value={age} onChange={(e) => setAge(e.target.value)} />
        </div>
        <div>
          <Label>Employment Type</Label>
          <Input type="text" value={employment} onChange={(e) => setEmployment(e.target.value)} />
        </div>
      </div>

      <Button type="submit" className="mt-4">Check Eligibility</Button>

      {/* 🔴 Scenario 4 – No Match Red Box */}
      {noMatch && (
        <div className="mt-6 border-l-4 border-red-500 bg-red-50 p-4 text-red-700 rounded">
          <p className="font-semibold">❌ No card matches your inputs right now.</p>
          <p className="mt-1">
            Try adjusting income, age, or employment type to see more options.
            You can also <strong>connect with a banking specialist</strong> for personalized support.
          </p>
          <p className="mt-1">
            📞 Call us at <strong>1-800-555-BANK</strong> to speak with an agent.
          </p>
        </div>
      )}
    </form>
  )
}
