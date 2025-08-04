import { cards } from "@/lib/utils/cardsData"
import { scoreCard } from "@/lib/utils/scoreCard"
import { Lightbulb, Star, ArrowRight } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface RecommendedCardBannerProps {
  language: string,
  recommendedCard: null | {
    name: string
    reasons: string[]
  }
}

export function RecommendedCardBanner({ language, recommendedCard }: RecommendedCardBannerProps) {
  if (!recommendedCard) return null

  return (
    <Card className="bg-gradient-to-r from-blue-50 to-indigo-50 border-2 border-blue-200 shadow-lg mb-8">
      <CardContent className="p-6">
        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center shadow-md">
              <Lightbulb className="w-6 h-6 text-white" />
            </div>
            <div className="flex-1">
              <div className="flex items-center gap-2 mb-1">
                <Star className="w-4 h-4 text-blue-600" />
                <span className="text-sm font-semibold text-blue-800 uppercase tracking-wide">
                  {language === "en" && "Recommended Card"}
                  {language === "hi" && "अनुशंसित कार्ड"}
                  {language === "es" && "Tarjeta Recomendada"}
                </span>
              </div>
              <p className="text-lg font-semibold text-gray-900">
                💡 {language === "en" && `Based on your inputs, we recommend the ${recommendedCard.name}`}
                {language === "hi" && `💡 आपके इनपुट के आधार पर, हम ${recommendedCard.name} की सिफारिश करते हैं`}
                {language === "es" && `💡 Basado en tus datos, recomendamos la Tarjeta ${recommendedCard.name}`}
              </p>
              <ul className="mt-2 list-disc list-inside text-sm text-gray-700">
                {recommendedCard.reasons.map((reason, i) => (
                  <li key={i}>✔ {reason}</li>
                ))}
              </ul>
            </div>
          </div>
          <div className="hidden sm:block">
            <Button className="bg-blue-600 hover:bg-blue-700 text-white font-medium px-6 py-2 rounded-lg shadow-md transition-all duration-200 hover:shadow-lg">
              <span className="mr-2">
                {language === "en" && "Learn More"}
                {language === "hi" && "और जानें"}
                {language === "es" && "Saber Más"}
              </span>
              <ArrowRight className="w-4 h-4" />
            </Button>
          </div>
        </div>

        {/* Mobile Button */}
        <div className="sm:hidden mt-4">
          <Button className="w-full bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 rounded-lg shadow-md">
            <span className="mr-2">
              {language === "en" && "Learn More"}
              {language === "hi" && "और जानें"}
              {language === "es" && "Saber Más"}
            </span>
            <ArrowRight className="w-4 h-4" />
          </Button>
        </div>
      </CardContent>
    </Card>
  )
}
