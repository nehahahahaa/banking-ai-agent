import { CreditCard, Star, Plane, ShoppingBag, Award } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface SimpleCardComparisonProps {
  language: string
}

export function SimpleCardComparison({ language }: SimpleCardComparisonProps) {
  const cards = [
    {
      id: "cashback",
      name: {
        en: "Cashback Plus Card",
        hi: "कैशबैक प्लस कार्ड",
        es: "Tarjeta Cashback Plus",
      },
      icon: <ShoppingBag className="w-5 h-5" />,
      annualFee: "$0",
      rewards: {
        en: "3% groceries, 2% gas",
        hi: "किराने पर 3%, गैस पर 2%",
        es: "3% supermercados, 2% gasolina",
      },
      eligibility: {
        en: "Fair credit (580+)",
        hi: "उचित क्रेडिट (580+)",
        es: "Crédito regular (580+)",
      },
      isRecommended: false,
      color: "bg-emerald-600",
    },
    {
      id: "travel",
      name: {
        en: "Platinum Travel Card",
        hi: "प्लैटिनम ट्रैवल कार्ड",
        es: "Tarjeta Platinum Travel",
      },
      icon: <Plane className="w-5 h-5" />,
      annualFee: "$95",
      rewards: {
        en: "2x travel, 1x everything",
        hi: "यात्रा पर 2x, बाकी सब पर 1x",
        es: "2x viajes, 1x todo lo demás",
      },
      eligibility: {
        en: "Good credit (670+)",
        hi: "अच्छा क्रेडिट (670+)",
        es: "Buen crédito (670+)",
      },
      isRecommended: true,
      color: "bg-blue-600",
    },
    {
      id: "premium",
      name: {
        en: "Premium Rewards Card",
        hi: "प्रीमियम रिवार्ड्स कार्ड",
        es: "Tarjeta Premium Rewards",
      },
      icon: <Award className="w-5 h-5" />,
      annualFee: "$450",
      rewards: {
        en: "3x dining & travel",
        hi: "डाइनिंग और यात्रा पर 3x",
        es: "3x restaurantes y viajes",
      },
      eligibility: {
        en: "Excellent credit (740+)",
        hi: "उत्कृष्ट क्रेडिट (740+)",
        es: "Crédito excelente (740+)",
      },
      isRecommended: false,
      color: "bg-purple-600",
    },
  ]

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <CreditCard className="w-5 h-5 text-blue-800" />
          {language === "en" && "Compare Credit Cards"}
          {language === "hi" && "क्रेडिट कार्ड की तुलना करें"}
          {language === "es" && "Comparar Tarjetas de Crédito"}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b">
                <th className="text-left py-3 px-2 font-semibold text-gray-700">
                  {language === "en" && "Card"}
                  {language === "hi" && "कार्ड"}
                  {language === "es" && "Tarjeta"}
                </th>
                <th className="text-left py-3 px-2 font-semibold text-gray-700">
                  {language === "en" && "Annual Fee"}
                  {language === "hi" && "वार्षिक शुल्क"}
                  {language === "es" && "Cuota Anual"}
                </th>
                <th className="text-left py-3 px-2 font-semibold text-gray-700">
                  {language === "en" && "Rewards"}
                  {language === "hi" && "रिवार्ड्स"}
                  {language === "es" && "Recompensas"}
                </th>
                <th className="text-left py-3 px-2 font-semibold text-gray-700">
                  {language === "en" && "Eligibility"}
                  {language === "hi" && "पात्रता"}
                  {language === "es" && "Elegibilidad"}
                </th>
              </tr>
            </thead>
            <tbody>
              {cards.map((card) => (
                <tr key={card.id} className={`border-b hover:bg-gray-50 ${card.isRecommended ? "bg-blue-50" : ""}`}>
                  <td className="py-4 px-2">
                    <div className="flex items-center gap-3">
                      <div className={`w-8 h-8 ${card.color} rounded-lg flex items-center justify-center text-white`}>
                        {card.icon}
                      </div>
                      <div>
                        <div className="font-medium text-gray-900 flex items-center gap-2">
                          {card.name[language as keyof typeof card.name]}
                          {card.isRecommended && (
                            <Badge className="bg-blue-600 text-white text-xs font-medium">
                              {language === "en" && "Best Match"}
                              {language === "hi" && "सर्वोत्तम मैच"}
                              {language === "es" && "Mejor Opción"}
                            </Badge>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="py-4 px-2">
                    <span className="font-semibold text-gray-900">{card.annualFee}</span>
                  </td>
                  <td className="py-4 px-2">
                    <span className="text-sm text-gray-600">{card.rewards[language as keyof typeof card.rewards]}</span>
                  </td>
                  <td className="py-4 px-2">
                    <span className="text-sm text-gray-600">
                      {card.eligibility[language as keyof typeof card.eligibility]}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        <div className="mt-4 p-4 bg-blue-50 rounded-lg border border-blue-200">
          <div className="flex items-center gap-2 mb-2">
            <Star className="w-4 h-4 text-blue-600" />
            <span className="text-sm font-medium text-blue-800">
              {language === "en" && "Recommendation"}
              {language === "hi" && "सिफारिश"}
              {language === "es" && "Recomendación"}
            </span>
          </div>
          <p className="text-sm text-blue-700">
            {language === "en" &&
              "The Platinum Travel Card offers the best balance of rewards and benefits for most users."}
            {language === "hi" &&
              "प्लैटिनम ट्रैवल कार्ड अधिकांश उपयोगकर्ताओं के लिए रिवार्ड्स और लाभों का सबसे अच्छा संतुलन प्रदान करता है।"}
            {language === "es" &&
              "La Tarjeta Platinum Travel ofrece el mejor equilibrio de recompensas y beneficios para la mayoría de usuarios."}
          </p>
        </div>
      </CardContent>
    </Card>
  )
}
