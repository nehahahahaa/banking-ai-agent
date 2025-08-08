"use client";
import React, { useState } from "react";
import { cards } from "../data/cards";
import { scoreCard } from "../utils/scoreCard";
import { CardComparisonTable } from "./card-comparison-table";

export const EligibilityForm: React.FC = () => {
  const [income, setIncome] = useState("");
  const [age, setAge] = useState("");
  const [employmentType, setEmploymentType] = useState("");
  const [recommendedCards, setRecommendedCards] = useState<string[]>([]);
  const [message, setMessage] = useState("");

  const handleCheck = () => {
    const user = {
      minIncome: Number(income),
      age: Number(age),
      employmentType: employmentType.toLowerCase(),
    };

    const results = cards
      .map((card) => ({
        card,
        ...scoreCard(card, user),
      }))
      .filter((r) => r.score > 0)
      .sort((a, b) => b.score - a.score);

    if (results.length === 0) {
      setMessage(
        "No card matches your inputs right now. Try adjusting income or employment type to see more options."
      );
      setRecommendedCards([]);
      return;
    }

    if (results.length === 1) {
      setMessage(
        `Based on your inputs, you may be eligible for the ${results[0].card.name}.`
      );
      setRecommendedCards([results[0].card.name]);
      return;
    }

    setMessage(
      `You qualify for multiple cards. We recommend the ${results[0].card.name} as the best fit based on your profile.`
    );
    setRecommendedCards(results.map((r) => r.card.name));
  };

  const handleReset = () => {
    setIncome("");
    setAge("");
    setEmploymentType("");
    setRecommendedCards([]); // removes highlight
    setMessage("");
  };

  return (
    <div className="p-4 border rounded-md bg-white">
      <div className="flex gap-4 mb-4">
        <input
          type="number"
          placeholder="Monthly Income"
          value={income}
          onChang
