"use client"

import { useState } from "react"

interface EligibilityFormProps {
  onCheck: (userContext: { income: number; age: number; employment: string; preference: string | null }) => void
  onReset: () => void
}

export function EligibilityForm({ onCheck, onReset }: EligibilityFormProps) {
  const [income, setIncome] = useState("")
  const [age, setAge] = useState("")
  const [employment, setEmployment] = useState("")
  const [preference, setPreference] = useState<string | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    onCheck({
      income: Number(income),
      age: Number(age),
      employment,
      preference
    })
  }

  const handleReset = () => {
    setIncome("")
    setAge("")
    setEmployment("")
    setPreference(null)
    onReset() // clears highlights in table
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4">
      <input
        type="number"
        placeholder="Income"
        value={income}
        onChange={(e) => setIncome(e.target.value)}
        className="border p-2 rounded w-full"
      />
      <input
        type="number"
        placeholder="Age"
        value={age}
        onChange={(e) => setAge(e.target.value)}
        className="border p-2 rounded w-full"
      />
      <input
        type="text"
        placeholder="Employment Type"
        value={employment}
        onChange={(e) => setEmployment(e.target.value)}
        className="border p-2 rounded w-full"
      />

      <div className="flex gap-4">
        <button type="submit" className="bg-blue-600 text-white px-4 py-2 rounded">
          Check Eligibility
        </button>
        <button
          type="button"
          onClick={handleReset}
          className="bg-gray-300 text-gray-800 px-4 py-2 rounded"
        >
          Reset
        </button>
      </div>
    </form>
  )
}
