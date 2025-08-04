export function scoreCard(card: any, userContext: {
  income: number
  age: number
  employment: string
  preference: string | null
}) {
  let score = 0;
  const reasons: string[] = [];

  if (userContext.income >= card.minIncome) {
    score += 1;
    reasons.push("Meets income requirement");
  } else {
    reasons.push("Below income requirement");
  }

  if (userContext.age >= card.minAge) {
    score += 1;
    reasons.push("Eligible age");
  } else {
    reasons.push("Below minimum age");
  }

  if (card.allowedEmployment.includes(userContext.employment)) {
    score += 1;
    reasons.push("Employment type accepted");
  } else {
    reasons.push("Employment type not accepted");
  }

  if (
    userContext.preference &&
    card.features.some((feature: string) =>
      feature.toLowerCase().includes(userContext.preference!.toLowerCase())
    )
  ) {
    score += 1;
    reasons.push("Matches user preference");
  }

  return { score, reasons };
}

export function getBestCards(cards: any[], userContext: {
  income: number;
  age: number;
  employment: string;
  preference: string | null;
}) {
  const scoredCards = cards.map((card) => {
    const { score, reasons } = scoreCard(card, userContext);
    return { ...card, score, reasons };
  });

  const bestScore = Math.max(...scoredCards.map((card) => card.score));
  return scoredCards.filter((card) => card.score === bestScore);
}

export function handleChatQuery(userInput: string, userContext: {
  income: number;
  age: number;
  employment: string;
  preference: string | null;
}, cards: any[]) {
  const lowerInput = userInput.toLowerCase();

  if (
    lowerInput.includes("which card") ||
    lowerInput.includes("best card") ||
    lowerInput.includes("recommend")
  ) {
    const bestCards = getBestCards(cards, userContext);

    if (bestCards.length === 1) {
      return `We recommend the **${bestCards[0].name}** based on your profile. Reason: ${bestCards[0].reasons.join(", ")}`;
    } else if (bestCards.length > 1) {
      const names = bestCards.map((card) => `**${card.name}**`).join(" and ");
      return `You're eligible for multiple cards: ${names}. These match your profile best.`;
    } else {
      return "Sorry, no cards match your current profile. You can try updating your details.";
    }
  } else {
    return "This assistant is for helping you find the best credit card. For other queries, please contact customer service.";
  }
}
