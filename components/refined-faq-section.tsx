"use client"

import { Accordion, AccordionItem } from "@/components/ui/accordion"

export function FaqSection({ language }) {
  return (
    <div className="mt-10">
      <h2 className="text-xl font-semibold mb-4">Frequently Asked Questions</h2>
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="q1" className="border-b">
          <Accordion.Trigger className="py-3 text-left font-medium w-full">
            What happens if I miss a payment?
          </Accordion.Trigger>
          <Accordion.Content className="pb-4 text-gray-700">
            Missing a payment may incur late fees and impact your credit score.
          </Accordion.Content>
        </AccordionItem>

        <AccordionItem value="q2" className="border-b">
          <Accordion.Trigger className="py-3 text-left font-medium w-full">
            Are there foreign transaction fees?
          </Accordion.Trigger>
          <Accordion.Content className="pb-4 text-gray-700">
            Some cards may charge up to 3% on international purchases.
          </Accordion.Content>
        </AccordionItem>

        <AccordionItem value="q3" className="border-b">
          <Accordion.Trigger className="py-3 text-left font-medium w-full">
            Can I upgrade my card later?
          </Accordion.Trigger>
          <Accordion.Content className="pb-4 text-gray-700">
            Yes, many cards allow upgrades after demonstrating consistent use.
          </Accordion.Content>
        </AccordionItem>
      </Accordion>
    </div>
  )
}
