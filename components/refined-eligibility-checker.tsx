"use client"

import { useState } from "react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Label } from "@/components/ui/label"
import { Card, CardContent } from "@/components/ui/card"

export function RefinedEligibilityChecker({
  language,
  setUserContext,
}: {
  language: string
  setUserContext: (ctx: {
    income: number
    age: number
    employment: string
    preference: string | null
  }) => void
}) {
  const [income, setIncome] = useState("")
  const [age, setAge] = useState("")
  const [employment, setEmployment] = useState("")
  const [preference, setPreference] = useState("")

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    setUserContext({
      income: Number(income),
      age: Number(age),
      employment: employment.toLowerCase(),
      preference: preference || null,
    })
  }

  return (
    <Card className="max-w-xl mx-auto">
      <CardContent className="space-y-4 p-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <Label>Monthly Income</Label>
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
          <div>
            <Label>What’s most important to you? (e.g. cashback, travel)</Label>
            <Input type="text" value={preference} onChange={(e) => setPreference(e.target.value)} />
          </div>
          <Button type="submit" className="bg-blue-800 hover:bg-blue-900 text-white">
            Check Eligibility
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
