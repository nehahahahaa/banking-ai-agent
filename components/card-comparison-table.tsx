import React from "react";
import { Card } from "../data/cards";

interface CardComparisonTableProps {
  cards: Card[];
  recommendedCards: string[];
}

export const CardComparisonTable: React.FC<CardComparisonTableProps> = ({
  cards,
  recommendedCards,
}) => {
  return (
    <div className="overflow-x-auto mt-6">
      <table className="min-w-full border border-gray-300">
        <thead>
          <tr className="bg-gray-100">
            <th className="p-3 text-left">Card Name</th>
            <th className="p-3 text-left">Min Income</th>
            <th className="p-3 text-left">Eligible Ages</th>
            <th className="p-3 text-left">Employment Types</th>
            <th className="p-3 text-left">Benefits</th>
          </tr>
        </thead>
        <tbody>
          {cards.map((card) => {
            const isHighlighted = recommendedCards.includes(card.name);
            return (
              <tr
                key={card.name}
                className={`border-t ${isHighlighted ? "border-4 border-blue-500" : ""}`}
              >
                <td className="p-3 font-medium flex items-center gap-2">
                  {card.name}
                  {isHighlighted && (
                    <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded">
                      Recommended
                    </span>
                  )}
                </td>
                <td className="p-3">${card.minIncome.toLocaleString()}</td>
                <td className="p-3">
                  {card.eligibleAges[0]} - {card.eligibleAges[1]}
                </td>
                <td className="p-3">{card.employmentTypes.join(", ")}</td>
                <td className="p-3">{card.benefits.join(", ")}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};
