import { CreditCard, Star, Plane, ShoppingBag, Award } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

interface CardComparisonTableProps {
  language: string
}

export function CardComparisonTable({ language }: CardComparisonTableProps) {
  const cards = [
    {
      id: "gold",
      name: {
        en: "Gold Card",
        hi: "गोल्ड कार्ड",
        es: "Tarjeta Gold",
      },
      icon: <Award className="w-6 h-6" />,
      annualFee: "$95",
      rewards: {
        en: "2x points on travel, 1x on everything else",
        hi: "यात्रा पर 2x पॉइंट्स, बाकी सब पर 1x",
        es: "2x puntos en viajes, 1x en todo lo demás",
      },
      eligibility: {
        en: "Good credit (670+)",
        hi: "अच्छा क्रेडिट (670+)",
        es: "Buen crédito (670+)",
      },
      isRecommended: false,
      color: "bg-yellow-600",
    },
    {
      id: "platinum",
      name: {
        en: "Platinum Card",
        hi: "प्लैटिनम कार्ड",
        es: "Tarjeta Platinum",
      },
      icon: <Plane className="w-6 h-6" />,
      annualFee: "$450",
      rewards: {
        en: "3x points on dining & travel, 1x on everything else",
        hi: "डाइनिंग और यात्रा पर 3x पॉइंट्स, बाकी सब पर 1x",
        es: "3x puntos en restaurantes y viajes, 1x en todo lo demás",
      },
      eligibility: {
        en: "Excellent credit (740+)",
        hi: "उत्कृष्ट क्रेडिट (740+)",
        es: "Crédito excelente (740+)",
      },
      isRecommended: true,
      color: "bg-gray-600",
    },
    {
      id: "cashback",
      name: {
        en: "Cashback Plus Card",
        hi: "कैशबैक प्लस कार्ड",
        es: "Tarjeta Cashback Plus",
      },
      icon: <ShoppingBag className="w-6 h-6" />,
      annualFee: "$0",
      rewards: {
        en: "3% cashback on groceries, 2% on gas, 1% on everything else",
        hi: "किराने पर 3% कैशबैक, गैस पर 2%, बाकी सब पर 1%",
        es: "3% cashback en supermercados, 2% en gasolina, 1% en todo lo demás",
      },
      eligibility: {
        en: "Fair credit (580+)",
        hi: "उचित क्रेडिट (580+)",
        es: "Crédito regular (580+)",
      },
      isRecommended: false,
      color: "bg-emerald-600",
    },
  ]

  return (
    <div className="max-w-7xl mx-auto">
      {/* Section Header */}
      <div className="text-center mb-8">
        <h2 className="text-2xl font-bold text-gray-900 mb-2 flex items-center justify-center gap-2">
          <CreditCard className="w-6 h-6 text-blue-800" />
          {language === "en" && "Compare Credit Cards"}
          {language === "hi" && "क्रेडिट कार्ड की तुलना करें"}
          {language === "es" && "Comparar Tarjetas de Crédito"}
        </h2>
        <p className="text-gray-600">
          {language === "en" && "Choose the perfect card for your lifestyle and spending habits"}
          {language === "hi" && "अपनी जीवनशैली और खर्च की आदतों के लिए सही कार्ड चुनें"}
          {language === "es" && "Elige la tarjeta perfecta para tu estilo de vida y hábitos de gasto"}
        </p>
      </div>

      {/* 3-Column Card Layout */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {cards.map((card) => (
          <Card
            key={card.id}
            className={`relative overflow-hidden transition-all duration-200 hover:shadow-lg ${
              card.isRecommended
                ? "border-2 border-blue-300 shadow-lg ring-2 ring-blue-100"
                : "border border-gray-200 hover:border-gray-300"
            }`}
          >
            {/* Best Match Badge */}
            {card.isRecommended && (
              <div className="absolute top-4 right-4 z-10">
                <Badge className="bg-blue-600 text-white font-semibold px-3 py-1 text-sm">
                  {language === "en" && "Best Match"}
                  {language === "hi" && "सर्वोत्तम मैच"}
                  {language === "es" && "Mejor Opción"}
                </Badge>
              </div>
            )}

            <CardHeader className="pb-4">
              {/* Card Visual */}
              <div
                className={`w-full h-40 ${card.color} rounded-lg flex items-center justify-center text-white mb-4 relative overflow-hidden`}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent"></div>
                <div className="relative z-10 flex items-center gap-3">
                  {card.icon}
                  <CreditCard className="w-8 h-8" />
                </div>
              </div>

              {/* Card Name */}
              <CardTitle className="text-xl font-bold text-center text-gray-900">
                {card.name[language as keyof typeof card.name]}
              </CardTitle>
            </CardHeader>

            <CardContent className="space-y-6">
              {/* Annual Fee */}
              <div className="text-center">
                <h3 className="text-sm font-semibold text-gray-600 mb-2">
                  {language === "en" && "Annual Fee"}
                  {language === "hi" && "वार्षिक शुल्क"}
                  {language === "es" && "Cuota Anual"}
                </h3>
                <p className="text-3xl font-bold text-gray-900">{card.annualFee}</p>
              </div>

              {/* Rewards */}
              <div>
                <h3 className="text-sm font-semibold text-gray-600 mb-3">
                  {language === "en" && "Rewards"}
                  {language === "hi" && "रिवार्ड्स"}
                  {language === "es" && "Recompensas"}
                </h3>
                <p className="text-sm text-gray-700 leading-relaxed">
                  {card.rewards[language as keyof typeof card.rewards]}
                </p>
              </div>

              {/* Eligibility */}
              <div>
                <h3 className="text-sm font-semibold text-gray-600 mb-3">
                  {language === "en" && "Eligibility"}
                  {language === "hi" && "पात्रता"}
                  {language === "es" && "Elegibilidad"}
                </h3>
                <p className="text-sm text-gray-700 font-medium">
                  {card.eligibility[language as keyof typeof card.eligibility]}
                </p>
              </div>

              {/* Action Button */}
              <div className="pt-4">
                <Button
                  className={`w-full ${
                    card.isRecommended
                      ? "bg-blue-800 hover:bg-blue-900 text-white"
                      : "bg-gray-600 hover:bg-gray-700 text-white"
                  }`}
                >
                  {language === "en" && "Learn More"}
                  {language === "hi" && "और जानें"}
                  {language === "es" && "Saber Más"}
                </Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recommendation Note */}
      <div className="mt-8 p-6 bg-blue-50 rounded-lg border border-blue-200">
        <div className="flex items-center gap-3 mb-3">
          <Star className="w-5 h-5 text-blue-600" />
          <h3 className="text-lg font-semibold text-blue-800">
            {language === "en" && "Why Choose Platinum Card?"}
            {language === "hi" && "प्लैटिनम कार्ड क्यों चुनें?"}
            {language === "es" && "¿Por qué elegir la Tarjeta Platinum?"}
          </h3>
        </div>
        <p className="text-blue-700 leading-relaxed">
          {language === "en" &&
            "The Platinum Card offers the perfect balance of premium rewards and exclusive benefits. With 3x points on dining and travel, plus no foreign transaction fees, it's ideal for frequent travelers and dining enthusiasts who want to maximize their rewards."}
          {language === "hi" &&
            "प्लैटिनम कार्ड प्रीमियम रिवार्ड्स और विशेष लाभों का सही संतुलन प्रदान करता है। डाइनिंग और यात्रा पर 3x पॉइंट्स के साथ, साथ ही कोई विदेशी लेनदेन शुल्क नहीं, यह बार-बार यात्रा करने वालों और डाइनिंग के शौकीनों के लिए आदर्श है।"}
          {language === "es" &&
            "La Tarjeta Platinum ofrece el equilibrio perfecto entre recompensas premium y beneficios exclusivos. Con 3x puntos en restaurantes y viajes, además de sin comisiones por transacciones extranjeras, es ideal para viajeros frecuentes y entusiastas gastronómicos."}
        </p>
      </div>
    </div>
  )
}
