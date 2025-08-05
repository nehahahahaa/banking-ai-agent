"use client"

import { useState } from "react"
import { ChatAssistant } from "@/components/chat-assistant"
import { RefinedEligibilityChecker } from "@/components/refined-eligibility-checker"

export default function HomePage() {
  const [userContext, setUserContext] = useState<{
    income: number
    age: number
    employment: string
    preference: string | null
  } | null>(null)

  return (
    <main className="p-6 space-y-6">
      <RefinedEligibilityChecker
        language="en"
        onUserContextChange={(context) => setUserContext(context)}
      />

      {userContext && (
        <ChatAssistant
          language="en"
          userContext={userContext}
        />
      )}
    </main>
  )
}
