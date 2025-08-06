"use client"

interface FaqSectionProps {
  language: string
}

export function FaqSection({ language }: FaqSectionProps) {
  const faqs = [
    {
      q: "What happens if I miss a payment?",
      a: "Missing a payment may incur a fee and affect your credit score.",
    },
    {
      q: "Are there foreign transaction fees?",
      a: "Some cards charge 1–3%. Look for cards labeled as 'no foreign fee'.",
    },
    {
      q: "Can I upgrade my card later?",
      a: "Yes, many banks allow upgrades based on usage and payment history.",
    },
  ]

  return (
    <div className="mt-10">
      <h2 className="text-xl font-bold mb-4">FAQs</h2>
      <div className="space-y-3">
        {faqs.map((faq, idx) => (
          <details key={idx} className="border rounded-md p-3 bg-gray-50">
            <summary className="font-medium cursor-pointer">{faq.q}</summary>
            <p className="mt-2 text-sm text-gray-700">{faq.a}</p>
          </details>
        ))}
      </div>
    </div>
  )
}
