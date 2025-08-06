"use client"

import { CheckCircle2 } from "lucide-react"

interface Card {
  name: string
  reasons: string[]
}

interface Props {
  cards: Card[]
  language: string
}

export function RecommendedCardBanner({ cards, language }: Props) {
  if (cards.length === 0) {
    return (
      <div className="bg-red-50 border border-red-200 text-red-700 rounded-xl p-6 mt-4">
        <div className="font-semibold mb-1 flex items-center gap-2">
          ❌ {language === "en" && "Not Eligible Currently"}
          {language === "hi" && "आप वर्तमान में पात्र नहीं हैं"}
          {language === "es" && "Actualmente no eres elegible"}
        </div>
        <p className="text-sm">
          {language === "en" && "You may not qualify for our current offers. Please contact us for alternative options."}
          {language === "hi" && "आप वर्तमान ऑफ़र के लिए पात्र नहीं हो सकते हैं। कृपया वैकल्पिक विकल्पों के लिए हमसे संपर्क करें।"}
          {language === "es" && "Es posible que no califiques para nuestras ofertas actuales. Por favor contáctanos para opciones alternativas."}
        </p>
      </div>
    )
  }

  return (
    <div className="bg-green-50 border border-green-200 text-green-800 rounded-xl p-6 mt-4">
      <div className="font-semibold mb-1 flex items-center gap-2">
        ✅ {language === "en" && <>Based on your inputs, you may be eligible for the <strong>{cards[0].name}</strong>.</>}
        {language === "hi" && <>आपकी जानकारी के आधार पर, आप <strong>{cards[0].name}</strong> के लिए पात्र हो सकते हैं।</>}
        {language === "es" && <>Según tu información, puedes ser elegible para la <strong>{cards[0].name}</strong>.</>}
      </div>
      <ul className="list-disc list-inside text-sm mt-2 text-green-700">
        {cards[0].reasons.map((reason, i) => (
          <li key={i}>✓ {reason}</li>
        ))}
      </ul>
      <p className="mt-4 text-sm">
        🧠 {language === "en" && "This way we are building trust by showing logic clearly to users."}
        {language === "hi" && "इस तरह हम उपयोगकर्ताओं के साथ विश्वास बना रहे हैं, क्योंकि हम तर्क स्पष्ट रूप से दिखा रहे हैं।"}
        {language === "es" && "De esta manera generamos confianza mostrando la lógica claramente a los usuarios."}
      </p>
    </div>
  )
}
