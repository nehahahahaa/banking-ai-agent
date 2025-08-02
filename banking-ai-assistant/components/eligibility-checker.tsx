"use client"

import type React from "react"

import { useState } from "react"
import { CheckCircle, TrendingUp, Award, CreditCard } from "lucide-react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"

interface EligibilityCheckerProps {
  language: string
}

export function EligibilityChecker({ language }: EligibilityCheckerProps) {
  const [income, setIncome] = useState("")
  const [age, setAge] = useState("")
  const [employment, setEmployment] = useState("")
  const [result, setResult] = useState<string | null>(null)

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault()

    const incomeNum = Number.parseInt(income)
    const ageNum = Number.parseInt(age)

    if (incomeNum >= 30000 && ageNum >= 18 && employment) {
      if (incomeNum >= 75000 && ageNum >= 25) {
        setResult("premium")
      } else if (incomeNum >= 50000 && ageNum >= 21) {
        setResult("travel")
      } else {
        setResult("cashback")
      }
    } else {
      setResult("not-eligible")
    }
  }

  const getResultCard = () => {
    if (!result) return null

    const cardData = {
      premium: {
        name: {
          en: "Platinum Card (Premium Rewards)",
          hi: "प्लैटिनम कार्ड (प्रीमियम रिवार्ड्स)",
          es: "Tarjeta Platinum (Recompensas Premium)",
        },
        icon: <Award className="w-6 h-6 text-purple-600" />,
        color: "border-purple-200 bg-purple-50",
        benefits: {
          en: ["3x points on dining & travel", "Concierge service", "$300 travel credit", "Airport lounge access"],
          hi: ["डाइनिंग और यात्रा पर 3x पॉइंट्स", "कंसीयर्ज सेवा", "$300 यात्रा क्रेडिट", "एयरपोर्ट लाउंज एक्सेस"],
          es: [
            "3x puntos en restaurantes y viajes",
            "Servicio de conserjería",
            "$300 crédito de viaje",
            "Acceso a salas VIP",
          ],
        },
        fee: "$450",
      },
      travel: {
        name: {
          en: "Travel Rewards Card",
          hi: "ट्रैवल रिवार्ड्स कार्ड",
          es: "Tarjeta de Recompensas de Viaje",
        },
        icon: <TrendingUp className="w-6 h-6 text-blue-600" />,
        color: "border-blue-200 bg-blue-50",
        benefits: {
          en: ["2x points on travel", "No foreign transaction fees", "Travel insurance", "Mobile app"],
          hi: ["यात्रा पर 2x पॉइंट्स", "कोई विदेशी लेनदेन शुल्क नहीं", "यात्रा बीमा", "मोबाइल ऐप"],
          es: ["2x puntos en viajes", "Sin comisiones extranjeras", "Seguro de viaje", "App móvil"],
        },
        fee: "$95",
      },
      cashback: {
        name: {
          en: "Cashback Plus Card",
          hi: "कैशबैक प्लस कार्ड",
          es: "Tarjeta Cashback Plus",
        },
        icon: <CreditCard className="w-6 h-6 text-emerald-600" />,
        color: "border-emerald-200 bg-emerald-50",
        benefits: {
          en: ["3% cashback on groceries", "2% cashback on gas", "No annual fee", "Fraud protection"],
          hi: ["किराने पर 3% कैशबैक", "गैस पर 2% कैशबैक", "कोई वार्षिक शुल्क नहीं", "धोखाधड़ी सुरक्षा"],
          es: [
            "3% cashback en supermercados",
            "2% cashback en gasolina",
            "Sin cuota anual",
            "Protección contra fraude",
          ],
        },
        fee: "$0",
      },
    }

    if (result === "not-eligible") {
      return (
        <Card className="border-red-200 bg-red-50">
          <CardContent className="p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center">
                <CheckCircle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <h3 className="font-semibold text-red-800">
                  {language === "en" && "Not Eligible Currently"}
                  {language === "hi" && "वर्तमान में पात्र नहीं"}
                  {language === "es" && "No Elegible Actualmente"}
                </h3>
                <p className="text-sm text-red-600">
                  {language === "en" && "Based on the information provided"}
                  {language === "hi" && "प्रदान की गई जानकारी के आधार पर"}
                  {language === "es" && "Basado en la información proporcionada"}
                </p>
              </div>
            </div>
            <p className="text-sm text-red-700">
              {language === "en" &&
                "You may not qualify for our current offers. Please contact us for alternative options or consider building your credit history."}
              {language === "hi" &&
                "आप हमारे वर्तमान ऑफर के लिए योग्य नहीं हो सकते। वैकल्पिक विकल्पों के लिए कृपया हमसे संपर्क करें या अपना क्रेडिट इतिहास बनाने पर विचार करें।"}
              {language === "es" &&
                "Es posible que no califiques para nuestras ofertas actuales. Por favor contáctanos para opciones alternativas o considera construir tu historial crediticio."}
            </p>
          </CardContent>
        </Card>
      )
    }

    const card = cardData[result as keyof typeof cardData]

    return (
      <Card className={`${card.color} border-2`}>
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 bg-white rounded-full flex items-center justify-center shadow-sm">
              {card.icon}
            </div>
            <div>
              <h3 className="font-semibold text-gray-800">
                {language === "en" && "You might be eligible for"}
                {language === "hi" && "आप इसके लिए पात्र हो सकते हैं"}
                {language === "es" && "Podrías ser elegible para"}
              </h3>
              <p className="text-lg font-bold text-gray-900">{card.name[language as keyof typeof card.name]}</p>
            </div>
          </div>

          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-sm font-medium text-gray-700">
                {language === "en" && "Annual Fee"}
                {language === "hi" && "वार्षिक शुल्क"}
                {language === "es" && "Cuota Anual"}
              </span>
              <Badge variant="secondary">{card.fee}</Badge>
            </div>

            <div>
              <h4 className="text-sm font-medium text-gray-700 mb-2">
                {language === "en" && "Key Benefits"}
                {language === "hi" && "मुख्य लाभ"}
                {language === "es" && "Beneficios Clave"}
              </h4>
              <ul className="space-y-1">
                {card.benefits[language as keyof typeof card.benefits].map((benefit, idx) => (
                  <li key={idx} className="text-sm text-gray-600 flex items-center gap-2">
                    <CheckCircle className="w-3 h-3 text-emerald-500 flex-shrink-0" />
                    {benefit}
                  </li>
                ))}
              </ul>
            </div>

            <Button className="w-full mt-4 bg-blue-800 hover:bg-blue-900">
              {language === "en" && "Apply Now"}
              {language === "hi" && "अभी आवेदन करें"}
              {language === "es" && "Aplicar Ahora"}
            </Button>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="max-w-4xl mx-auto">
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-500" />
            {language === "en" && "Check Your Eligibility"}
            {language === "hi" && "अपनी पात्रता जांचें"}
            {language === "es" && "Verifica Tu Elegibilidad"}
          </CardTitle>
          <p className="text-sm text-gray-600">
            {language === "en" && "Get personalized card recommendations based on your profile"}
            {language === "hi" && "अपनी प्रोफाइल के आधार पर व्यक्तिगत कार्ड सिफारिशें प्राप्त करें"}
            {language === "es" && "Obtén recomendaciones personalizadas de tarjetas basadas en tu perfil"}
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <Label htmlFor="income" className="text-sm font-medium">
                  {language === "en" && "Annual Income (USD)"}
                  {language === "hi" && "वार्षिक आय (USD)"}
                  {language === "es" && "Ingresos Anuales (USD)"}
                </Label>
                <Input
                  id="income"
                  type="number"
                  placeholder="50,000"
                  value={income}
                  onChange={(e) => setIncome(e.target.value)}
                  required
                  className="text-lg"
                />
                <p className="text-xs text-gray-500">
                  {language === "en" && "Enter your gross annual income"}
                  {language === "hi" && "अपनी सकल वार्षिक आय दर्ज करें"}
                  {language === "es" && "Ingresa tu ingreso anual bruto"}
                </p>
              </div>

              <div className="space-y-3">
                <Label className="text-sm font-medium">
                  {language === "en" && "Employment Type"}
                  {language === "hi" && "रोजगार प्रकार"}
                  {language === "es" && "Tipo de Empleo"}
                </Label>
                <Select value={employment} onValueChange={setEmployment} required>
                  <SelectTrigger className="text-lg">
                    <SelectValue
                      placeholder={
                        language === "en"
                          ? "Select employment type"
                          : language === "hi"
                            ? "रोजगार प्रकार चुनें"
                            : "Selecciona tipo de empleo"
                      }
                    />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="salaried">
                      {language === "en" && "Salaried"}
                      {language === "hi" && "वेतनभोगी"}
                      {language === "es" && "Asalariado"}
                    </SelectItem>
                    <SelectItem value="self-employed">
                      {language === "en" && "Self-employed"}
                      {language === "hi" && "स्व-नियोजित"}
                      {language === "es" && "Trabajador Independiente"}
                    </SelectItem>
                    <SelectItem value="student">
                      {language === "en" && "Student"}
                      {language === "hi" && "छात्र"}
                      {language === "es" && "Estudiante"}
                    </SelectItem>
                    <SelectItem value="retired">
                      {language === "en" && "Retired"}
                      {language === "hi" && "सेवानिवृत्त"}
                      {language === "es" && "Jubilado"}
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="space-y-3">
              <Label htmlFor="age" className="text-sm font-medium">
                {language === "en" && "Age"}
                {language === "hi" && "उम्र"}
                {language === "es" && "Edad"}
              </Label>
              <Input
                id="age"
                type="number"
                placeholder="25"
                value={age}
                onChange={(e) => setAge(e.target.value)}
                required
                className="text-lg"
                min="18"
                max="80"
              />
              <p className="text-xs text-gray-500">
                {language === "en" && "Must be 18 or older"}
                {language === "hi" && "18 या उससे अधिक उम्र होनी चाहिए"}
                {language === "es" && "Debe ser mayor de 18 años"}
              </p>
            </div>

            <Button type="submit" className="w-full bg-blue-800 hover:bg-blue-900 text-lg py-3">
              {language === "en" && "Check My Eligibility"}
              {language === "hi" && "मेरी पात्रता जांचें"}
              {language === "es" && "Verificar Mi Elegibilidad"}
            </Button>
          </form>
        </CardContent>
      </Card>

      {result && getResultCard()}
    </div>
  )
}
