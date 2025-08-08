import React from "react";
import { cards } from "@/data/cards";
import { CheckCircleIcon } from "@heroicons/react/24/solid";

interface Props {
  recommendedCards?: string[];
}

export const CardComparisonTable: React.FC<Props> = ({ recommendedCards = [] }) => {
  return (
    <div className="overflow-x-auto border rounded-lg">
      <table className="min-w-full border-collapse">
        <thead className="bg-gray-100">
          <tr>
            <th className="border px-4 py-2">Card Name</th>
            <th className="border px-4 py-2">Min Income</th>
            <th className="border px-4 py-2">Eligible Ages</th>
            <th className="border px-4 py-2">Employment Types</th>
            <th className="border px-4 py-2">Benefits</th>
          </tr>
        </thead>
        <tbody>
          {cards.map((card) => {
            const isHighlighted =
              Array.isArray(recommendedCards) &&
              recommendedCards.includes(card.name);

            return (
              <tr
                key={card.name}
                className={isHighlighted ? "bg-blue-50 border-l-4 border-blue-500" : ""}
              >
                <td className="border px-4 py-2 flex items-center gap-2">
                  {card.name}
                  {isHighlighted && (
                    <span className="bg-blue-200 text-blue-800 text-xs px-2 py-0.5 rounded-full flex items-center gap-1">
                      <CheckCircleIcon className="h-4 w-4" /> Recommended
                    </span>
                  )}
                </td>
                <td className="border px-4 py-2">{card.minIncome}</td>
                <td className="border px-4 py-2">{card.eligibleAges.join(" - ")}</td>
                <td className="border px-4 py-2">{card.employmentTypes.join(", ")}</td>
                <td className="border px-4 py-2">{card.benefits.join(", ")}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
