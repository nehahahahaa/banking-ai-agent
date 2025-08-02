"use client"

import { HelpCircle, ExternalLink } from "lucide-react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"

interface FAQSectionProps {
  language: string
}

export function FAQSection({ language }: FAQSectionProps) {
  const faqs = [
    {
      id: "payment",
      question: {
        en: "What happens if I miss a payment?",
        hi: "यदि मैं भुगतान चूक जाऊं तो क्या होगा?",
        es: "¿Qué pasa si pierdo un pago?",
      },
      answer: {
        en: "If you miss a payment, you may be charged a late fee of $25-$35 and your credit score could be affected. We recommend setting up automatic payments to avoid this. Our Premium Rewards Card offers payment flexibility features.",
        hi: "यदि आप भुगतान चूक जाते हैं, तो आप पर $25-$35 का विलंब शुल्क लगाया जा सकता है और आपका क्रेडिट स्कोर प्रभावित हो सकता है। इससे बचने के लिए हम स्वचालित भुगतान सेट करने की सलाह देते हैं।",
        es: "Si pierdes un pago, es posible que se te cobre una tarifa por pago tardío de $25-$35 y tu puntaje crediticio podría verse afectado. Recomendamos configurar pagos automáticos para evitar esto.",
      },
      relatedCard: "premium",
    },
    {
      id: "foreign-fees",
      question: {
        en: "Is there a foreign transaction fee?",
        hi: "क्या विदेशी लेनदेन शुल्क हैं?",
        es: "¿Hay comisiones por transacciones extranjeras?",
      },
      answer: {
        en: "This depends on your specific card. Our Travel Rewards Card and Premium Rewards Card have no foreign transaction fees, while the Cashback Plus Card charges 2.7% per international transaction.",
        hi: "यह आपके विशिष्ट कार्ड पर निर्भर करता है। हमारे ट्रैवल रिवार्ड्स कार्ड और प्रीमियम रिवार्ड्स कार्ड में कोई विदेशी लेनदेन शुल्क नहीं है, जबकि कैशबैक प्लस कार्ड प्रति अंतर्राष्ट्रीय लेनदेन 2.7% चार्ज करता है।",
        es: "Esto depende de tu tarjeta específica. Nuestra Tarjeta de Recompensas de Viaje y Tarjeta Premium de Recompensas no tienen comisiones por transacciones extranjeras, mientras que la Tarjeta Cashback Plus cobra 2.7% por transacción internacional.",
      },
      relatedCard: "travel",
    },
    {
      id: "upgrade",
      question: {
        en: "Can I upgrade my card later?",
        hi: "क्या मैं बाद में अपना कार्ड अपग्रेड कर सकता हूं?",
        es: "¿Puedo actualizar mi tarjeta más tarde?",
      },
      answer: {
        en: "Yes, you can upgrade your card after 6 months of responsible use. We'll review your account and credit profile to determine eligibility for higher-tier cards like our Premium Rewards Card.",
        hi: "हां, आप जिम्मेदार उपयोग के 6 महीने बाद अपना कार्ड अपग्रेड कर सकते हैं। हम उच्च-स्तरीय कार्ड की पात्रता निर्धारित करने के लिए आपके खाते और क्रेडिट प्रोफाइल की समीक्षा करेंगे।",
        es: "Sí, puedes actualizar tu tarjeta después de 6 meses de uso responsable. Revisaremos tu cuenta y perfil crediticio para determinar la elegibilidad para tarjetas de nivel superior.",
      },
      relatedCard: "premium",
    },
    {
      id: "rewards",
      question: {
        en: "How do I redeem my rewards?",
        hi: "मैं अपने रिवार्ड्स कैसे रिडीम करूं?",
        es: "¿Cómo canjeo mis recompensas?",
      },
      answer: {
        en: "You can redeem rewards through our mobile app, online banking, or by calling customer service. Options include cash back, statement credits, gift cards, and travel bookings. The Cashback Plus Card offers the simplest redemption process.",
        hi: "आप हमारे मोबाइल ऐप, ऑनलाइन बैंकिंग, या ग्राहक सेवा को कॉल करके रिवार्ड्स रिडीम कर सकते हैं। विकल्पों में कैश बैक, स्टेटमेंट क्रेडिट, गिफ्ट कार्ड और यात्रा बुकिंग शामिल हैं।",
        es: "Puedes canjear recompensas a través de nuestra app móvil, banca en línea, o llamando al servicio al cliente. Las opciones incluyen cashback, créditos en el estado de cuenta, tarjetas de regalo y reservas de viaje.",
      },
      relatedCard: "cashback",
    },
    {
      id: "credit-limit",
      question: {
        en: "What is the minimum credit limit?",
        hi: "न्यूनतम क्रेडिट लिमिट क्या है?",
        es: "¿Cuál es el límite de crédito mínimo?",
      },
      answer: {
        en: "Minimum credit limits vary by card and your creditworthiness. Typically, limits start at $500 for our Cashback Plus Card and $5,000 for premium cards. Higher income may qualify you for increased limits.",
        hi: "न्यूनतम क्रेडिट लिमिट कार्ड और आपकी साख के अनुसार अलग होती है। आमतौर पर, हमारे कैशबैक प्लस कार्ड के लिए लिमिट $500 से और प्रीमियम कार्ड के लिए $5,000 से शुरू होती है।",
        es: "Los límites de crédito mínimos varían según la tarjeta y tu solvencia crediticia. Típicamente, los límites comienzan en $500 para nuestra Tarjeta Cashback Plus y $5,000 para tarjetas premium.",
      },
      relatedCard: "cashback",
    },
    {
      id: "security",
      question: {
        en: "How secure are online transactions?",
        hi: "ऑनलाइन लेनदेन कितने सुरक्षित हैं?",
        es: "¿Qué tan seguras son las transacciones en línea?",
      },
      answer: {
        en: "All our cards feature advanced security including EMV chip technology, fraud monitoring, and zero liability protection. You're never responsible for unauthorized charges. Our mobile app provides real-time transaction alerts.",
        hi: "हमारे सभी कार्ड में EMV चिप तकनीक, धोखाधड़ी निगरानी, और शून्य दायित्व सुरक्षा सहित उन्नत सुरक्षा शामिल है। आप अनधिकृत शुल्कों के लिए कभी जिम्मेदार नहीं हैं।",
        es: "Todas nuestras tarjetas cuentan con seguridad avanzada incluyendo tecnología de chip EMV, monitoreo de fraude y protección de responsabilidad cero. Nunca eres responsable de cargos no autorizados.",
      },
      relatedCard: null,
    },
  ]

  const scrollToCard = (cardId: string | null) => {
    if (cardId) {
      const element = document.getElementById("card-comparison")
      if (element) {
        element.scrollIntoView({ behavior: "smooth" })
      }
    }
  }

  return (
    <Card className="max-w-4xl mx-auto">
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <HelpCircle className="w-5 h-5 text-blue-800" />
          {language === "en" && "Frequently Asked Questions"}
          {language === "hi" && "अक्सर पूछे जाने वाले प्रश्न"}
          {language === "es" && "Preguntas Frecuentes"}
        </CardTitle>
        <p className="text-sm text-gray-600">
          {language === "en" && "Find answers to common questions about our credit cards"}
          {language === "hi" && "हमारे क्रेडिट कार्ड के बारे में सामान्य प्रश्नों के उत्तर खोजें"}
          {language === "es" && "Encuentra respuestas a preguntas comunes sobre nuestras tarjetas de crédito"}
        </p>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="w-full space-y-3">
          {faqs.map((faq) => (
            <AccordionItem
              key={faq.id}
              value={faq.id}
              className="border border-gray-200 rounded-lg px-4 bg-white shadow-sm"
            >
              <AccordionTrigger className="text-left hover:no-underline py-4 font-medium text-gray-800">
                <span>{faq.question[language as keyof typeof faq.question]}</span>
              </AccordionTrigger>
              <AccordionContent className="text-gray-600 pb-4 leading-relaxed">
                <div className="space-y-3">
                  <p>{faq.answer[language as keyof typeof faq.answer]}</p>
                  {faq.relatedCard && (
                    <div className="flex items-center gap-2 pt-3 border-t border-gray-100">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => scrollToCard(faq.relatedCard)}
                        className="text-blue-600 border-blue-200 hover:bg-blue-50"
                      >
                        <ExternalLink className="w-3 h-3 mr-1" />
                        {language === "en" && "View Card Details"}
                        {language === "hi" && "कार्ड विवरण देखें"}
                        {language === "es" && "Ver Detalles de Tarjeta"}
                      </Button>
                    </div>
                  )}
                </div>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  )
}
