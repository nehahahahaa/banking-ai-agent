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

  /* ──────────────────────────────────────────────────────────────
     Added realistic rules for Student Saver Card (no other changes)
     ────────────────────────────────────────────────────────────── */
  try {
    const isStudentCard = card.name === "Student Saver Card"
    const isStudentUser = normalizedEmployment === "student"
    const under21 = user.age < 21
    // if you later add this to the UI, it will be honored automatically
    const hasCosigner = (user as any).hasCosigner === true

    // 1) If a student reports high income, steer away from the student card
    //    (typical ceiling ~ $3k/mo for student products; tweak if needed)
    if (isStudentCard && isStudentUser && user.income > 3000) {
      score = 0
      reasons.length = 0
      failures.push("✗ Income higher than typical for student product; consider a standard card")
    }

    // 2) Under-21 must show independent income OR have a cosigner
    if (isStudentCard && isStudentUser && under21 && user.income < 500 && !hasCosigner) {
      score = 0
      reasons.length = 0
      failures.push("✗ Under 21 without sufficient income; add a cosigner or consider a secured card")
    }
  } catch {
    // fail safe: ignore if any optional property access throws
  }
  /* ────────────────────────────────────────────────────────────── */

  return { score, reasons, failures }
}

// ✅ unchanged
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
    const bestCard = fullyMatchedCards[0] // Ranked by order; customize if needed
    return {
      type: "multiple-match",
      recommendedCards: fullyMatchedCards.map(c => c.name),
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
