"use client"

import React, { useState } from "react"
import { cards } from "@/lib/utils/cardsData"

interface EligibilityFormProps {
  onCheck: (highlighted: string[]) => void
}

export function EligibilityForm({ onCheck }: EligibilityFormProps) {
  const [income, setIncome] = useState("")
  const [age, setAge] = useState("")
  const [employment, setEmployment] = useState("")

  const handleSubmit = () => {
    const matchedCards = cards
      .filter((card) => {
        const incomeOK = Number(income) >= card.minIncome
        const ageOK =
          Number(age) >= card.eligibleAges[0] &&
          Number(age) <= card.eligibleAges[1]
        const employmentOK = card.employmentTypes.includes(employment.toLowerCase())
        return incomeOK && ageOK && employmentOK
      })
      .map((c) => c.name)

    onCheck(matchedCards)
  }

  const handleReset = () => {
    setIncome("")
    setAge("")
    setEmployment("")
    onCheck([]) // clears highlight
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Inputs in one row */}
      <div className="flex gap-4">
        <input
          type="number"
          placeholder="Monthly Income"
          value={income}
          onChange={(e) => setIncome(e.target.value)}
          className="border p-2 rounded w-1/3"
        />
        <input
          type="number"
          placeholder="Your Age"
          value={age}
          onChange={(e) => setAge(e.target.value)}
          className="border p-2 rounded w-1/3"
        />
        <input
          type="text"
          placeholder="Employment Type"
          value={employment}
          onChange={(e) => setEmployment(e.target.value)}
          className="border p-2 rounded w-1/3"
        />
      </div>

      {/* Buttons in one row */}
      <div className="flex gap-4">
        <button
          type="button"
          onClick={handleSubmit}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Check Eligibility
        </button>
        <button
          type="button"
          onClick={handleReset}
          className="bg-gray-300 text-black px-4 py-2 rounded"
        >
          Reset
        </button>
      </div>
    </div>
  )
}
