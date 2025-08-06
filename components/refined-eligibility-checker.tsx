"use client"

import { useState } from "react"

export function EligibilityForm({ onSubmit, setLanguage }) {
  const [income, setIncome] = useState("")
  const [age, setAge] = useState("")
  const [employment, setEmployment] = useState("salaried")
  const [preference, setPreference] = useState("")

  const handleSubmit = (e) => {
    e.preventDefault()
    const result = {
      income: parseInt(income),
      age: parseInt(age),
      employment,
      preference,
    }
    onSubmit(result)
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-4 mb-6">
      <div>
        <label className="block text-sm font-medium">Monthly Income (USD)</label>
        <input
          type="number"
          value={income}
          onChange={(e) => setIncome(e.target.value)}
          required
          className="w-full border p-2 rounded"
        />
      </div>

      <div>
        <label className="block text-sm font-medium">Age</label>
        <input
          type="number"
          value={age}
          onChange={(e) => setAge(e.target.value)}
          required
          className="w-full border p-2 rounded"
        />
      </div>

      <div>
        <label className="block text-sm font-medium">Employment Type</label>
        <select
          value={employment}
          onChange={(e) => setEmployment(e.target.value)}
          className="w-full border p-2 rounded"
        >
          <option value="salaried">Salaried</option>
          <option value="self-employed">Self-Employed</option>
          <option value="student">Student</option>
          <option value="retired">Retired</option>
        </select>
      </div>

      <div>
        <label className="block text-sm font-medium">Card Preference (optional)</label>
        <input
          type="text"
          value={preference}
          onChange={(e) => setPreference(e.target.value)}
          className="w-full border p-2 rounded"
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
