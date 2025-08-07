"use client"

import { CheckCircle2 } from "lucide-react"
import { Card } from "@/components/ui/card"
import { useEffect, useState } from "react"

interface EligibilityResultProps {
  bestMatch: string | null
  totalQualified: number
  hasSubmitted: boolean
}

export function EligibilityResult({
  bestMatch,
  totalQualified,
  hasSubmitted,
}: EligibilityResultProps) {
  const [message, setMessage] = useState<string | null>(null)

  useEffect(() => {
    if (!hasSubmitted) {
      setMessage(null)
      return
    }

    if (bestMatch && totalQualified === 1) {
      setMessage("Based on your inputs, you may be eligible for the " + bestMatch + ".")
    } else if (bestMatch && totalQualified > 1) {
      setMessage(
        "You qualify for multiple cards. We recommend the " + bestMatch + " as the best fit based on your profile."
      )
    } else {
      setMessage("No card matches your inputs right now. Try adjusting income or employment type to see more options.")
    }
  }, [bestMatch, hasSubmitted, totalQualified])

  if (!hasSubmitted) return null

  return (
    <Card className="p-4 mt-6 border-green-500 bg-green-50">
      <p className="text-sm text-green-700 font-semibold flex items-center gap-2 mb-2">
        <span role="img" aria-label="trust">🧠</span> Builds trust by showing logic clearly
      </p>
      <p className="text-sm text-gray-800">{message}</p>
    </Card>
  )
}
