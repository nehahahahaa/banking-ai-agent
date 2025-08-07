export function handleChatQuery(user: UserInfo) {
  const scoredCards = cards.map(card => {
    const result = scoreCard(card, user)
    return { ...card, ...result }
  })

  const fullyMatchedCards = scoredCards.filter(card => card.score === 3)
  const partialMatchedCards = scoredCards.filter(card => card.score > 0 && card.score < 3)

  if (fullyMatchedCards.length === 1) {
    return {
      type: "full-match",
      recommendedCards: [fullyMatchedCards[0]], // ✅ return full object
      reasons: fullyMatchedCards[0].reasons,
      message: `Based on your inputs, you may be eligible for the ${fullyMatchedCards[0].name}.`,
    }
  }

  if (fullyMatchedCards.length > 1) {
    const bestCard = fullyMatchedCards[0] // Ranked by order
    return {
      type: "multiple-match",
      recommendedCards: fullyMatchedCards, // ✅ full objects array
      reasons: bestCard.reasons,
      message: `You qualify for multiple cards. We recommend the ${bestCard.name} as the best fit based on your profile.`,
    }
  }

  if (partialMatchedCards.length > 0) {
    return {
      type: "partial-match",
      recommendedCards: [],
      reasons: [],
      failures: partialMatchedCards.flatMap(c => [`${c.name}:`, ...c.failures]),
      message: "Some eligibility criteria were not met. Please see the reasons below.",
    }
  }

  return {
    type: "no-match",
    recommendedCards: [],
    reasons: [],
    failures: [],
    message: "No card matches your inputs right now. Try adjusting income or employment type to see more options.",
  }
}
