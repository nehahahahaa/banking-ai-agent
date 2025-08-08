import { Card } from "./cardsData"
import { UserInfo } from "./userTypes"
import { cards } from "./cardsData"

export const scoreCard = (
  card: Card,
  user: UserInfo
): { score: number; reasons: string[]; failures: string[] } => {
  let score = 0
  const reasons: string[] = []
  const failures: string[] = []

  const normalizedEmployment = user.employment.toLowerCase()

  if (user.income >= card.minIncome) {
    score += 1
    reasons.push("✓ Income meets requirement")
  } else {
    failures.push("✗ Income below minimum requirement")
  }

  if (user.age >= card.eligibleAges[0] && user.age <= card.eligibleAges[1]) {
    score += 1
    reasons.push("✓ Age within eligibility range")
  } else {
    failures.push("✗ Age not within eligible range")
  }

  if (card.employmentTypes.includes(normalizedEmployment)) {
    score += 1
    reasons.push("✓ Employment type matches")
  } else {
    failures.push("✗ Employment type not eligible")
  }

  // ✅ Student rule (simple): 18–25 with income > $5,000 requires a cosigner.
  //    If income ≤ $5,000, no cosigner needed.
  if (
    card.employmentTypes.includes("student") &&
    normalizedEmployment === "student" &&
    user.age >= 18 &&
    user.age <= 25
  ) {
    const hasCosigner = (user as any).hasCosigner === true

    if (user.income > 5000 && !hasCosigner) {
      // Block this student product unless they have a cosigner
      score = 0
      reasons.length = 0
      failures.push("✗ For student income above $5,000, a cosigner is required to be eligible.")
    }
  }

  return { score, reasons, failures }
}

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
      recommendedCards: [fullyMatchedCards[0].name],
      reasons: fullyMatchedCards[0].reasons,
      message: `Based on your inputs, you may be eligible for the ${fullyMatchedCards[0].name}.`,
    }
  }

  if (fullyMatchedCards.length > 1) {
    const bestCard = fullyMatchedCards[0]
    return {
      type: "multiple-match",
      recommendedCards: fullyMatchedCards.map(c => c.name),
      reasons: bestCard.reasons,
      message: `You qualify for multiple cards. We recommend the ${bestCard.name} as the best fit based on your profile.`,
    }
  }

  // 🔸 NEW: Force a yellow "partial-match" when student 18–25 with income > $5k and no cosigner,
  // even if there are otherwise no partials (would have fallen to red "no-match").
  const studentNeedsCosigner =
    user.employment?.toLowerCase() === "student" &&
    user.age >= 18 &&
    user.age <= 25 &&
    user.income > 5000 &&
    !(user as any).hasCosigner

  if (partialMatchedCards.length > 0 || studentNeedsCosigner) {
    let failures = partialMatchedCards.flatMap(c => [`${c.name}:`, ...c.failures])

    if (studentNeedsCosigner) {
      const studentCard = scoredCards.find(c => c.employmentTypes.includes("student"))
      const studentFailureText =
        "✗ For student income above $5,000, a cosigner is required to be eligible."
      if (studentCard) {
        const block = [`${studentCard.name}:`, ...(studentCard.failures?.length ? studentCard.failures : [studentFailureText])]
        failures = [...block, ...failures]
      } else {
        failures = ["Student Essentials Card:", studentFailureText, ...failures]
      }
    }

    const message = studentNeedsCosigner
      ? "To become eligible for the student card with income above $5,000, please select 'Has cosigner' and try again."
      : "Some eligibility criteria were not met. Please see the reasons below."

    return {
      type: "partial-match",
      recommendedCards: [],
      reasons: [],
      failures,
      message,
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

