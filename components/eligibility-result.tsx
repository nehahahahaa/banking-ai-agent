import React from "react"

interface EligibilityResultProps {
  selectedCard: {
    name: string
  }
  reasons: string[]
}

export const EligibilityResult = ({ selectedCard, reasons }: EligibilityResultProps) => {
  return (
    <div className="bg-green-100 border border-green-400 text-green-900 px-6 py-4 rounded-lg shadow-md mt-4">
      <h2 className="text-xl font-semibold mb-2">🧠 Based on your inputs, you may be eligible for the <span className="font-bold">{selectedCard.name}</span>.</h2>
      <ul className="list-disc list-inside mb-2">
        {reasons.map((reason, index) => (
          <li key={index}>{reason}</li>
        ))}
      </ul>
      <p className="mt-2 text-sm text-green-700">✅ This way, we’re building trust by showing logic clearly to the user.</p>
    </div>
  )
}
