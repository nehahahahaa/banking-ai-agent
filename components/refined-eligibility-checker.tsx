"use client";

import React, { useState } from "react";
import { scoreCard } from "@/utils/scoreCard";
import { cards } from "@/data/cards";
import { CardComparisonTable } from "@/components/card-comparison-table";

export const EligibilityForm: React.FC = () => {
  const [income, setIncome] = useState("");
  const [age, setAge] = useState("");
  const [employmentType, setEmploymentType] = useState("");
  const [recommendedCards, setRecommendedCards] = useState<string[]>([]);

  const handleCheck = () => {
    const user = {
      income: Number(income),
      age: Number(age),
      employmentType: employmentType.toLowerCase(),
    };

    const eligible = cards.filter((card) => {
      const { score } = scoreCard(card, user);
      return score > 0;
    });

    setRecommendedCards(eligible.map((c) => c.name));
  };

  const handleReset = () => {
    setIncome("");
    setAge("");
    setEmploymentType("");
    setRecommendedCards([]); // Clears highlights in the table
  };

  return (
    <div className="space-y-6">
      {/* Input Row */}
      <div className="flex flex-wrap gap-4 items-end">
        <div>
          <label className="block text-sm font-medium">Monthly Income</label>
          <input
            type="number"
            value={income}
            onChange={(e) => setIncome(e.target.value)}
            className="border p-2 rounded w-48"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Your Age</label>
          <input
            type="number"
            value={age}
            onChange={(e) => setAge(e.target.value)}
            className="border p-2 rounded w-32"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Employment Type</label>
          <input
            type="text"
            value={employmentType}
            onChange={(e) => setEmploymentType(e.target.value)}
            className="border p-2 rounded w-48"
          />
        </div>

        {/* Buttons in same row */}
        <button
          onClick={handleCheck}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
        >
          Check Eligibility
        </button>
        <button
          onClick={handleReset}
          className="bg-gray-400 text-white px-4 py-2 rounded hover:bg-gray-500"
        >
          Reset
        </button>
      </div>

      {/* Pass recommended cards to table */}
      <CardComparisonTable recommendedCards={recommendedCards} />
    </div>
  );
};
