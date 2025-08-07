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
            <label classN
