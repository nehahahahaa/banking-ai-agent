import { CreditCard, Star, Shield, Plane, ShoppingBag } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

interface CardComparisonProps {
  language: string
}

export function CardComparison({ language }: CardComparisonProps) {
  const cards = [
    {
      name: {
        en: "Travel Rewards Card",
        hi: "ट्रैवल रिवार्ड्स कार्ड",
        es: "Tarjeta de Recompensas de Viaje",
      },
      icon: <Plane className="w-6 h-6" />,
      annualFee: "$95",
      rewards: {
        en: "2x points on travel, 1x on everything else",
        hi: "यात्रा पर 2x पॉइंट्स, बाकी सब पर 1x",
        es: "2x puntos en viajes, 1x en todo lo demás",
      },
      benefits: {
        en: ["No foreign transaction fees", "Travel insurance", "Airport lounge access"],
        hi: ["कोई विदेशी लेनदेन शुल्क नहीं", "यात्रा बीमा", "एयरपोर्ट लाउंज एक्सेस"],
        es: ["Sin comisiones por transacciones extranjeras", "Seguro de viaje", "Acceso a salas VIP"],
      },
      eligibility: {
        en: "Good credit (670+)",
        hi: "अच्छा क्रेडिट (670+)",
        es: "Buen crédito (670+)",
      },
      color: "bg-blue-600",
    },
    {
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
      benefits: {
        en: ["No annual fee", "Fraud protection", "Mobile app"],
        hi: ["कोई वार्षिक शुल्क नहीं", "धोखाधड़ी सुरक्षा", "मोबाइल ऐप"],
        es: ["Sin cuota anual", "Protección contra fraude", "App móvil"],
      },
      eligibility: {
        en: "Fair credit (580+)",
        hi: "उचित क्रेडिट (580+)",
        es: "Crédito regular (580+)",
      },
      color: "bg-emerald-600",
    },
    {
      name: {
        en: "Premium Rewards Card",
        hi: "प्रीमियम रिवार्ड्स कार्ड",
        es: "Tarjeta Premium de Recompensas",
      },
      icon: <Star className="w-6 h-6" />,
      annualFee: "$450",
      rewards: {
        en: "3x points on dining & travel, 1x on everything else",
        hi: "डाइनिंग और यात्रा पर 3x पॉइंट्स, बाकी सब पर 1x",
        es: "3x puntos en restaurantes y viajes, 1x en todo lo demás",
      },
      benefits: {
        en: ["Concierge service", "Priority boarding", "$300 travel credit"],
        hi: ["कंसीयर्ज सेवा", "प्राथमिकता बोर्डिंग", "$300 यात्रा क्रेडिट"],
        es: ["Servicio de conserjería", "Embarque prioritario", "$300 crédito de viaje"],
      },
      eligibility: {
        en: "Excellent credit (740+)",
        hi: "उत्कृष्ट क्रेडिट (740+)",
        es: "Crédito excelente (740+)",
      },
      color: "bg-purple-600",
    },
  ]

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {cards.map((card, index) => (
        <Card key={index} className="relative overflow-hidden">
          <CardHeader className="pb-4">
            <div className={`w-full h-32 ${card.color} rounded-lg flex items-center justify-center text-white mb-4`}>
              {card.icon}
              <CreditCard className="w-8 h-8 ml-2" />
            </div>
            <CardTitle className="text-lg">{card.name[language as keyof typeof card.name]}</CardTitle>
            <div className="flex justify-between items-center">
              <Badge variant="secondary">
                {language === "en" && `Annual Fee: ${card.annualFee}`}
                {language === "hi" && `वार्षिक शुल्क: ${card.annualFee}`}
                {language === "es" && `Cuota Anual: ${card.annualFee}`}
              </Badge>
            </div>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <h4 className="font-semibold text-sm text-gray-700 mb-2">
                {language === "en" && "Rewards"}
                {language === "hi" && "रिवार्ड्स"}
                {language === "es" && "Recompensas"}
              </h4>
              <p className="text-sm text-gray-600">{card.rewards[language as keyof typeof card.rewards]}</p>
            </div>

            <div>
              <h4 className="font-semibold text-sm text-gray-700 mb-2">
                {language === "en" && "Benefits"}
                {language === "hi" && "लाभ"}
                {language === "es" && "Beneficios"}
              </h4>
              <ul className="text-sm text-gray-600 space-y-1">
                {card.benefits[language as keyof typeof card.benefits].map((benefit, idx) => (
                  <li key={idx} className="flex items-center gap-2">
                    <Shield className="w-3 h-3 text-emerald-500" />
                    {benefit}
                  </li>
                ))}
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-sm text-gray-700 mb-2">
                {language === "en" && "Eligibility"}
                {language === "hi" && "पात्रता"}
                {language === "es" && "Elegibilidad"}
              </h4>
              <p className="text-sm text-gray-600">{card.eligibility[language as keyof typeof card.eligibility]}</p>
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
