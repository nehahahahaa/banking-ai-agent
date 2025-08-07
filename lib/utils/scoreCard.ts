import { Card } from "./cardsData"
import { UserInfo } from "./userTypes"

export const scoreCard = (
  card: Card,
  user: UserInfo
): { score: number; reasons: string[]; failures: string[] } => {
  let score = 0
  const reasons: string[] = []
  const failures: string[] = []

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

  if (card.employmentTypes.includes(user.employment)) {
    score += 1
    reasons.push("✓ Employment type matches")
  } else {
    failures.push("✗ Employment type not eligible")
  }

  return { score, reasons, failures }
}
