"use client"

import type React from "react"

import { useState } from "react"
import { Send, X, Bot, User, Brain, CreditCard, BarChart3, DollarSign } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

interface ChatAssistantProps {
  language: string
}

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
  actionButtons?: ActionButton[]
}

interface ActionButton {
  text: string
  type: "primary" | "secondary"
  icon?: React.ReactNode
}

export function ChatAssistant({ language }: ChatAssistantProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [messages, setMessages] = useState<Message[]>([
    {
      id: "1",
      role: "assistant",
      content:
        language === "en"
          ? "Hello! I'm your banking assistant. I can help you find the perfect credit card, answer questions about our products, and guide you through the application process. How can I help you today?"
          : language === "hi"
            ? "नमस्ते! मैं आपका बैंकिंग असिस्टेंट हूं। मैं आपको सही क्रेडिट कार्ड खोजने, हमारे उत्पादों के बारे में प्रश्नों के उत्तर देने और आवेदन प्रक्रिया में मार्गदर्शन करने में मदद कर सकता हूं। आज मैं आपकी कैसे मदद कर सकता हूं?"
            : "¡Hola! Soy tu asistente bancario. Puedo ayudarte a encontrar la tarjeta de crédito perfecta, responder preguntas sobre nuestros productos y guiarte a través del proceso de solicitud. ¿Cómo puedo ayudarte hoy?",
    },
  ])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [showContext, setShowContext] = useState(false)

  // Simulated user preferences (hardcoded for now)
  const userPreferences = {
    en: "Travel-focused, No annual fee, Cashback",
    hi: "यात्रा-केंद्रित, कोई वार्षिक शुल्क नहीं, कैशबैक",
    es: "Enfocado en viajes, Sin cuota anual, Cashback",
  }

  // Trust disclaimer text
  const trustDisclaimer = {
    en: "Based on verified product information from August 2025",
    hi: "अगस्त 2025 से सत्यापित उत्पाद जानकारी के आधार पर",
    es: "Basado en información verificada del producto de agosto 2025",
  }

  const suggestionButtons = [
    {
      en: "Best cashback card",
      hi: "सबसे अच्छा कैशबैक कार्ड",
      es: "Mejor tarjeta de cashback",
    },
    {
      en: "Compare Gold vs Platinum",
      hi: "गोल्ड बनाम प्लैटिनम की तुलना",
      es: "Comparar Gold vs Platinum",
    },
    {
      en: "How do I apply?",
      hi: "मैं कैसे आवेदन करूं?",
      es: "¿Cómo aplico?",
    },
  ]

  const getActionButtons = (messageType: string): ActionButton[] => {
    switch (messageType) {
      case "cashback_recommendation":
        return [
          {
            text: language === "en" ? "Apply Now" : language === "hi" ? "अभी आवेदन करें" : "Aplicar Ahora",
            type: "primary",
            icon: <CreditCard className="w-4 h-4" />,
          },
          {
            text:
              language === "en"
                ? "Compare with another card"
                : language === "hi"
                  ? "दूसरे कार्ड से तुलना करें"
                  : "Comparar con otra tarjeta",
            type: "secondary",
            icon: <BarChart3 className="w-4 h-4" />,
          },
          {
            text:
              language === "en"
                ? "Show me cashback options"
                : language === "hi"
                  ? "कैशबैक विकल्प दिखाएं"
                  : "Mostrar opciones de cashback",
            type: "secondary",
            icon: <DollarSign className="w-4 h-4" />,
          },
        ]

      case "card_comparison":
        return [
          {
            text:
              language === "en"
                ? "View detailed comparison"
                : language === "hi"
                  ? "विस्तृत तुलना देखें"
                  : "Ver comparación detallada",
            type: "primary",
            icon: <BarChart3 className="w-4 h-4" />,
          },
          {
            text:
              language === "en"
                ? "Check my eligibility"
                : language === "hi"
                  ? "मेरी पात्रता जांचें"
                  : "Verificar mi elegibilidad",
            type: "secondary",
            icon: <CreditCard className="w-4 h-4" />,
          },
        ]

      case "application_process":
        return [
          {
            text: language === "en" ? "Start application" : language === "hi" ? "आवेदन शुरू करें" : "Iniciar aplicación",
            type: "primary",
            icon: <CreditCard className="w-4 h-4" />,
          },
          {
            text:
              language === "en"
                ? "Check eligibility first"
                : language === "hi"
                  ? "पहले पात्रता जांचें"
                  : "Verificar elegibilidad primero",
            type: "secondary",
          },
          {
            text:
              language === "en"
                ? "See required documents"
                : language === "hi"
                  ? "आवश्यक दस्तावेज देखें"
                  : "Ver documentos requeridos",
            type: "secondary",
          },
        ]

      default:
        return [
          {
            text:
              language === "en"
                ? "Explore card options"
                : language === "hi"
                  ? "कार्ड विकल्प देखें"
                  : "Explorar opciones de tarjetas",
            type: "primary",
            icon: <CreditCard className="w-4 h-4" />,
          },
          {
            text: language === "en" ? "Check eligibility" : language === "hi" ? "पात्रता जांचें" : "Verificar elegibilidad",
            type: "secondary",
          },
        ]
    }
  }

  const getMemoryAwareResponse = (userMessage: string): { content: string; actionType: string } => {
    const lowerMessage = userMessage.toLowerCase()

    // Memory-aware introduction
    const memoryIntro = {
      en: "Got it! Based on what you shared earlier, here's what I suggest… ",
      hi: "समझ गया! आपने पहले जो साझा किया था, उसके आधार पर यहां मेरा सुझाव है… ",
      es: "¡Entendido! Basado en lo que compartiste antes, esto es lo que sugiero… ",
    }

    const intro = memoryIntro[language as keyof typeof memoryIntro]

    // Best cashback card
    if (
      lowerMessage.includes("best cashback") ||
      lowerMessage.includes("cashback card") ||
      lowerMessage.includes("कैशबैक कार्ड") ||
      lowerMessage.includes("tarjeta de cashback")
    ) {
      const content =
        language === "en"
          ? `${intro}Since you prefer no annual fees and cashback rewards, our Cashback Plus Card is perfect for you! It offers 3% cashback on groceries, 2% on gas stations, and 1% on all other purchases. Best of all, it has $0 annual fee and only requires fair credit (580+). You can start earning cashback immediately!`
          : language === "hi"
            ? `${intro}चूंकि आप कोई वार्षिक शुल्क और कैशबैक रिवार्ड्स पसंद करते हैं, हमारा कैशबैक प्लस कार्ड आपके लिए बिल्कुल सही है! यह किराने पर 3% कैशबैक, गैस स्टेशनों पर 2%, और अन्य सभी खरीदारी पर 1% प्रदान करता है।`
            : `${intro}Como prefieres sin cuota anual y recompensas de cashback, ¡nuestra Tarjeta Cashback Plus es perfecta para ti! Ofrece 3% de cashback en supermercados, 2% en gasolineras y 1% en todas las demás compras.`

      return { content, actionType: "cashback_recommendation" }
    }

    // Compare Gold vs Platinum
    if (lowerMessage.includes("compare") && (lowerMessage.includes("gold") || lowerMessage.includes("platinum"))) {
      const content =
        language === "en"
          ? `${intro}Given your travel focus, let me compare these options. Our Gold Card has a $95 annual fee with 2x points on travel purchases and no foreign transaction fees. The Platinum Card has a $450 annual fee but offers 3x points on dining & travel, concierge service, $300 annual travel credit, and airport lounge access. Since you mentioned preferring no annual fees, you might want to consider our Cashback Plus Card instead, which gives you travel flexibility without the yearly cost.`
          : language === "hi"
            ? `${intro}आपके यात्रा फोकस को देखते हुए, मैं इन विकल्पों की तुलना करता हूं। हमारे गोल्ड कार्ड में यात्रा खरीदारी पर 2x पॉइंट्स के साथ $95 वार्षिक शुल्क है। प्लैटिनम कार्ड में $450 वार्षिक शुल्क है लेकिन डाइनिंग और यात्रा पर 3x पॉइंट्स प्रदान करता है।`
            : `${intro}Dado tu enfoque en viajes, permíteme comparar estas opciones. Nuestra Tarjeta Gold tiene una cuota anual de $95 con 2x puntos en compras de viaje. La Tarjeta Platinum tiene una cuota anual de $450 pero ofrece 3x puntos en restaurantes y viajes.`

      return { content, actionType: "card_comparison" }
    }

    // How to apply
    if (lowerMessage.includes("apply") || lowerMessage.includes("आवेदन") || lowerMessage.includes("aplicar")) {
      const content =
        language === "en"
          ? `${intro}Considering your preferences for no annual fees and cashback, I'd recommend starting with the Cashback Plus Card application. Here's the process: 1) Use our eligibility checker above, 2) Gather required documents (government ID, proof of income, SSN), 3) Complete our secure online application (takes 5-10 minutes), 4) Get instant pre-approval or wait 7-10 business days. Since you prefer no fees, this card will give you immediate value!`
          : language === "hi"
            ? `${intro}कोई वार्षिक शुल्क और कैशबैक के लिए आपकी प्राथमिकताओं को देखते हुए, मैं कैशबैक प्लस कार्ड आवेदन से शुरुआत करने की सलाह दूंगा। यहां प्रक्रिया है: 1) ऊपर हमारे पात्रता चेकर का उपयोग करें, 2) आवश्यक दस्तावेज इकट्ठे करें।`
            : `${intro}Considerando tus preferencias por sin cuota anual y cashback, recomendaría comenzar con la aplicación de la Tarjeta Cashback Plus. Aquí está el proceso: 1) Usa nuestro verificador de elegibilidad arriba, 2) Reúne documentos requeridos.`

      return { content, actionType: "application_process" }
    }

    // Default response
    const content =
      language === "en"
        ? `${intro}I remember you're interested in travel-focused benefits, no annual fees, and cashback rewards. I can help you compare our cards with these preferences in mind, explain specific benefits, or guide you through applications. What would you like to explore first?`
        : language === "hi"
          ? `${intro}मुझे याद है कि आप यात्रा-केंद्रित लाभों, कोई वार्षिक शुल्क नहीं, और कैशबैक रिवार्ड्स में रुचि रखते हैं। मैं इन प्राथमिकताओं को ध्यान में रखते हुए हमारे कार्डों की तुलना करने में मदद कर सकता हूं।`
          : `${intro}Recuerdo que estás interesado en beneficios enfocados en viajes, sin cuota anual y recompensas de cashback. Puedo ayudarte a comparar nuestras tarjetas con estas preferencias en mente.`

    return { content, actionType: "default" }
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!input.trim() || isLoading) return

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: input.trim(),
    }

    setMessages((prev) => [...prev, userMessage])
    setInput("")
    setIsLoading(true)
    setShowContext(true)

    // Hide context after 2 seconds and show response
    setTimeout(() => {
      setShowContext(false)
      const response = getMemoryAwareResponse(userMessage.content)
      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: response.content,
        actionButtons: getActionButtons(response.actionType),
      }
      setMessages((prev) => [...prev, assistantMessage])
      setIsLoading(false)
    }, 2000)
  }

  const handleSuggestionClick = (suggestion: string) => {
    setInput(suggestion)
  }

  const handleActionButtonClick = (buttonText: string) => {
    // Placeholder function - buttons are non-functional for now
    console.log(`Action button clicked: ${buttonText}`)
  }

  // Floating chat icon when closed
  if (!isOpen) {
    return (
      <div className="fixed bottom-6 right-6 z-50">
        <Button
          onClick={() => setIsOpen(true)}
          className="w-14 h-14 rounded-full bg-blue-800 hover:bg-blue-900 shadow-lg transition-all duration-200 flex items-center justify-center"
          size="icon"
        >
          <span className="text-2xl">💬</span>
        </Button>
      </div>
    )
  }

  // Chat window when open
  return (
    <div className="fixed bottom-6 right-6 z-50 w-[350px] max-w-[calc(100vw-2rem)]">
      {/* Context Tag */}
      {showContext && (
        <div className="mb-3 animate-in slide-in-from-bottom-2 duration-300">
          <div className="bg-gray-100 border border-gray-200 rounded-full px-4 py-2 shadow-sm">
            <div className="flex items-center gap-2 text-sm text-gray-700">
              <Brain className="w-4 h-4 text-gray-600" />
              <span className="font-medium">
                {language === "en" && "🧠 Agent is considering your preferences:"}
                {language === "hi" && "🧠 एजेंट आपकी प्राथमिकताओं पर विचार कर रहा है:"}
                {language === "es" && "🧠 El agente está considerando tus preferencias:"}
              </span>
              <span className="text-blue-700 font-medium">
                {userPreferences[language as keyof typeof userPreferences]}
              </span>
            </div>
          </div>
        </div>
      )}

      <Card className="h-[500px] flex flex-col shadow-2xl rounded-2xl border-0 bg-white">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-3 bg-blue-800 text-white rounded-t-2xl px-4 py-3">
          <CardTitle className="text-lg flex items-center gap-2">
            <Bot className="w-5 h-5" />
            {language === "en" && "Banking Assistant"}
            {language === "hi" && "बैंकिंग असिस्टेंट"}
            {language === "es" && "Asistente Bancario"}
          </CardTitle>
          <Button
            variant="ghost"
            size="icon"
            onClick={() => setIsOpen(false)}
            className="text-white hover:bg-blue-700 w-8 h-8"
          >
            <X className="w-4 h-4" />
          </Button>
        </CardHeader>

        <CardContent className="flex-1 flex flex-col p-0">
          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-4">
            {messages.map((message) => (
              <div
                key={message.id}
                className={`flex gap-3 ${message.role === "user" ? "justify-end" : "justify-start"}`}
              >
                {message.role === "assistant" && (
                  <div className="w-8 h-8 bg-blue-800 rounded-full flex items-center justify-center flex-shrink-0">
                    <Bot className="w-4 h-4 text-white" />
                  </div>
                )}
                <div className={`max-w-[80%] ${message.role === "user" ? "" : "space-y-3"}`}>
                  <div
                    className={`p-3 rounded-lg ${
                      message.role === "user" ? "bg-blue-800 text-white" : "bg-gray-100 text-gray-800"
                    }`}
                  >
                    <p className="text-sm leading-relaxed">{message.content}</p>
                  </div>

                  {/* Trust Disclaimer - Only for assistant messages */}
                  {message.role === "assistant" && (
                    <div className="px-3">
                      <p className="text-xs text-gray-500 italic">
                        {trustDisclaimer[language as keyof typeof trustDisclaimer]}
                      </p>
                    </div>
                  )}

                  {/* Action Buttons - Only for assistant messages with actions */}
                  {message.role === "assistant" && message.actionButtons && message.actionButtons.length > 0 && (
                    <div className="px-3 space-y-2">
                      {message.actionButtons.map((button, index) => (
                        <Button
                          key={index}
                          onClick={() => handleActionButtonClick(button.text)}
                          className={`
                            w-full text-sm font-medium rounded-lg transition-all duration-200 flex items-center justify-center gap-2
                            ${
                              button.type === "primary"
                                ? "bg-blue-600 hover:bg-blue-700 text-white shadow-sm hover:shadow-md"
                                : "bg-white hover:bg-gray-50 text-gray-700 border border-gray-200 hover:border-gray-300"
                            }
                          `}
                          size="sm"
                        >
                          {button.icon}
                          {button.text}
                        </Button>
                      ))}
                    </div>
                  )}
                </div>
                {message.role === "user" && (
                  <div className="w-8 h-8 bg-gray-300 rounded-full flex items-center justify-center flex-shrink-0">
                    <User className="w-4 h-4 text-gray-600" />
                  </div>
                )}
              </div>
            ))}
            {isLoading && (
              <div className="flex gap-3 justify-start">
                <div className="w-8 h-8 bg-blue-800 rounded-full flex items-center justify-center">
                  <Bot className="w-4 h-4 text-white" />
                </div>
                <div className="bg-gray-100 p-3 rounded-lg">
                  <div className="flex space-x-1">
                    <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.1s" }}
                    ></div>
                    <div
                      className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"
                      style={{ animationDelay: "0.2s" }}
                    ></div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Suggestion Buttons */}
          <div className="p-4 border-t bg-gray-50">
            <p className="text-xs text-gray-600 mb-3 font-medium">
              {language === "en" && "Quick questions:"}
              {language === "hi" && "त्वरित प्रश्न:"}
              {language === "es" && "Preguntas rápidas:"}
            </p>
            <div className="space-y-2">
              {suggestionButtons.map((button, index) => (
                <Button
                  key={index}
                  variant="outline"
                  size="sm"
                  className="w-full text-xs px-3 py-2 h-auto bg-white hover:bg-blue-50 border-blue-200 text-blue-700 hover:text-blue-800 transition-colors rounded-lg text-left justify-start"
                  onClick={() => handleSuggestionClick(button[language as keyof typeof button])}
                >
                  {button[language as keyof typeof button]}
                </Button>
              ))}
            </div>
          </div>

          {/* Input */}
          <div className="p-4 border-t">
            <form onSubmit={handleSubmit} className="flex gap-2">
              <Input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder={
                  language === "en"
                    ? "Ask about credit cards..."
                    : language === "hi"
                      ? "क्रेडिट कार्ड के बारे में पूछें..."
                      : "Pregunta sobre tarjetas de crédito..."
                }
                disabled={isLoading}
                className="flex-1"
              />
              <Button
                type="submit"
                disabled={isLoading || !input.trim()}
                size="icon"
                className="bg-blue-800 hover:bg-blue-900"
              >
                <Send className="w-4 h-4" />
              </Button>
            </form>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
