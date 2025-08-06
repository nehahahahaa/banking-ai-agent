"use client"

import { useState } from "react"

interface EligibilityFormProps {
  onSubmit: (result: any) => void
  setLanguage: (lang: string) => void
}

export function EligibilityForm({ onSubmit, setLanguage }: EligibilityFormProps) {
  const [income, setIncome] = useState("")
  const [age, setAge] = useState("")
  const [employment, setEmployment] = useState("salaried")
  const [preference, setPreference] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const userContext = {
      income: Number(income),
      age: Number(age),
      employment,
      preference: preference || null,
    }

    const result = {
      userContext,
      recommendedCards: [], // scoring handled in CardComparisonTable
    }

    onSubmit(result)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 mb-6">
      <div>
        <label className="block text-sm font-medium text-gray-700">Monthly Income ($)</label>
        <input
          type="number"
          className="mt-1 block w-full p-2 border border-gray-300 rounded"
          value={income}
          onChange={(e) => setIncome(e.target.value)}
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Age</label>
        <input
          type="number"
          className="mt-1 block w-full p-2 border border-gray-300 rounded"
          value={age}
          onChange={(e) => setAge(e.target.value)}
          required
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Employment Type</label>
        <select
          className="mt-1 block w-full p-2 border border-gray-300 rounded"
          value={employment}
          onChange={(e) => setEmployment(e.target.value)}
        >
          <option value="salaried">Salaried</option>
          <option value="self-employed">Self-employed</option>
          <option value="student">Student</option>
        </select>
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700">Card Preference (optional)</label>
        <input
          type="text"
          placeholder="e.g., travel, cashback"
          className="mt-1 block w-full p-2 border border-gray-300 rounded"
          value={preference}
          onChange={(e) => setPreference(e.target.value)}
        />
      </div>
      <button
        type="submit"
        className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
      >
        Check Eligibility
      </button>
    </form>
  )
}
