"use client"

import { Button } from "@/components/ui/button"

interface HeaderProps {
  language: string
  onLanguageChange: (lang: string) => void
}

export function Header({ language, onLanguageChange }: HeaderProps) {
  const languages = [
    { code: "en", name: "English", flag: "🇺🇸" },
    { code: "hi", name: "हिंदी", flag: "🇮🇳" },
    { code: "es", name: "Español", flag: "🇪🇸" },
  ]

  return (
    <header className="bg-white shadow-sm border-b">
      <div className="container mx-auto px-4 py-4 flex justify-between items-center">
        <div className="flex items-center space-x-2">
          <div className="w-8 h-8 bg-blue-800 rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-sm">B</span>
          </div>
          <span className="text-xl font-bold text-blue-800">BankAssist</span>
        </div>

        {/* Language Toggle */}
        <div className="flex items-center gap-1 bg-gray-50 rounded-lg p-1 border border-gray-200">
          {languages.map((lang) => (
            <Button
              key={lang.code}
              variant="ghost"
              size="sm"
              onClick={() => onLanguageChange(lang.code)}
              className={`
                relative px-3 py-2 rounded-md transition-all duration-200 hover:bg-white
                ${
                  language === lang.code
                    ? "bg-white shadow-sm border border-blue-200 text-blue-800"
                    : "text-gray-600 hover:text-gray-800"
                }
              `}
              aria-label={`Switch to ${lang.name}`}
            >
              <span className="text-lg" role="img" aria-label={lang.name}>
                {lang.flag}
              </span>
              <span className="sr-only">{lang.name}</span>
              {language === lang.code && (
                <div className="absolute bottom-0 left-1/2 transform -translate-x-1/2 w-6 h-0.5 bg-blue-600 rounded-full"></div>
              )}
            </Button>
          ))}
        </div>
      </div>
    </header>
  )
}
