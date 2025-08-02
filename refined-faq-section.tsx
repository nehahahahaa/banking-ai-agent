"use client"

import { HelpCircle } from "lucide-react"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface RefinedFAQSectionProps {
  language: string
}

export function RefinedFAQSection({ language }: RefinedFAQSectionProps) {
  const faqs = [
    {
      id: "foreign-fees",
      question: {
        en: "Are there foreign transaction fees?",
        hi: "क्या कोई विदेशी लेनदेन शुल्क है?",
        es: "¿Hay comisiones por transacciones extranjeras?",
      },
      answer: {
        en: "It depends on your card. Our Gold Card and Platinum Card have no foreign transaction fees, making them perfect for international travel. However, the Cashback Plus Card charges 2.7% per international transaction. If you travel frequently, we recommend the Platinum Card for the best international benefits.",
        hi: "यह आपके कार्ड पर निर्भर करता है। हमारे गोल्ड कार्ड और प्लैटिनम कार्ड में कोई विदेशी लेनदेन शुल्क नहीं है, जो उन्हें अंतर्राष्ट्रीय यात्रा के लिए बिल्कुल सही बनाता है। हालांकि, कैशबैक प्लस कार्ड प्रति अंतर्राष्ट्रीय लेनदेन 2.7% चार्ज करता है।",
        es: "Depende de tu tarjeta. Nuestra Tarjeta Gold y Tarjeta Platinum no tienen comisiones por transacciones extranjeras, lo que las hace perfectas para viajes internacionales. Sin embargo, la Tarjeta Cashback Plus cobra 2.7% por transacción internacional.",
      },
    },
    {
      id: "payment",
      question: {
        en: "What happens if I miss a payment?",
        hi: "यदि मैं भुगतान चूक जाऊं तो क्या होगा?",
        es: "¿Qué pasa si pierdo un pago?",
      },
      answer: {
        en: "If you miss a payment, you may be charged a late fee of $25-$35 depending on your card type, and it could negatively impact your credit score. We strongly recommend setting up automatic payments to avoid this situation. If you're experiencing financial difficulties, please contact our customer service team immediately - we're here to help you find a solution.",
        hi: "यदि आप भुगतान चूक जाते हैं, तो आपके कार्ड के प्रकार के आधार पर आप पर $25-$35 का विलंब शुल्क लगाया जा सकता है, और यह आपके क्रेडिट स्कोर को नकारात्मक रूप से प्रभावित कर सकता है। हम इस स्थिति से बचने के लिए स्वचालित भुगतान सेट करने की दृढ़ता से सलाह देते हैं।",
        es: "Si pierdes un pago, es posible que se te cobre una tarifa por pago tardío de $25-$35 dependiendo del tipo de tarjeta, y podría impactar negativamente tu puntaje crediticio. Recomendamos encarecidamente configurar pagos automáticos para evitar esta situación.",
      },
    },
    {
      id: "upgrade",
      question: {
        en: "Can I upgrade my card later?",
        hi: "क्या मैं बाद में अपना कार्ड अपग्रेड कर सकता हूं?",
        es: "¿Puedo actualizar mi tarjeta más tarde?",
      },
      answer: {
        en: "Yes, absolutely! After 6 months of responsible card usage and maintaining good payment history, you can request a card upgrade. We'll review your account activity, credit profile, and income to determine eligibility for higher-tier cards. Many customers successfully upgrade from Cashback Plus to Gold Card, or from Gold to Platinum Card as their credit improves.",
        hi: "हां, बिल्कुल! जिम्मेदार कार्ड उपयोग और अच्छे भुगतान इतिहास के 6 महीने बाद, आप कार्ड अपग्रेड का अनुरोध कर सकते हैं। हम उच्च-स्तरीय कार्ड की पात्रता निर्धारित करने के लिए आपकी खाता गतिविधि, क्रेडिट प्रोफाइल और आय की समीक्षा करेंगे।",
        es: "¡Sí, absolutamente! Después de 6 meses de uso responsable de la tarjeta y mantener un buen historial de pagos, puedes solicitar una actualización de tarjeta. Revisaremos tu actividad de cuenta, perfil crediticio e ingresos para determinar la elegibilidad para tarjetas de nivel superior.",
      },
    },
  ]

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
          {language === "en" && "Find answers to common questions about our credit cards and services"}
          {language === "hi" && "हमारे क्रेडिट कार्ड और सेवाओं के बारे में सामान्य प्रश्नों के उत्तर खोजें"}
          {language === "es" &&
            "Encuentra respuestas a preguntas comunes sobre nuestras tarjetas de crédito y servicios"}
        </p>
      </CardHeader>
      <CardContent>
        <Accordion type="single" collapsible className="w-full space-y-4">
          {faqs.map((faq, index) => (
            <AccordionItem
              key={faq.id}
              value={faq.id}
              className="border border-gray-200 rounded-lg px-6 py-2 bg-white shadow-sm hover:shadow-md transition-all duration-200"
            >
              <AccordionTrigger className="text-left hover:no-underline py-4 font-medium text-gray-800 [&[data-state=open]>svg]:rotate-180">
                <span className="text-base">{faq.question[language as keyof typeof faq.question]}</span>
              </AccordionTrigger>
              <AccordionContent className="text-gray-600 pb-4 leading-relaxed border-t border-gray-100 pt-4 mt-2">
                <p className="text-sm">{faq.answer[language as keyof typeof faq.answer]}</p>
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </CardContent>
    </Card>
  )
}
