interface Card {
  name: string
  minIncome: number
  minAge: number
  allowedEmployment: string[]
  features: string[]
}

interface UserInputs {
  income: number
  age: number
  employment: string
  preference: string | null
}

export function scoreCard(card: Card, user: UserInputs) {
  let score = 0
  const reasons: string[] = []

  if (user.income >= card.minIncome) {
    score += 1
    reasons.push("Income criteria matched")
  } else {
    reasons.push("Income below requirement")
  }

  if (user.age >= card.minAge) {
    score += 1
    reasons.push("Age criteria matched")
  } else {
    reasons.push("Age below requirement")
  }

  if (card.allowedEmployment.includes(user.employment)) {
    score += 1
    reasons.push("Employment type accepted")
  } else {
    reasons.push("Employment type not eligible")
  }

  // Optional: Add scoring for preference match later

  return { score, reasons }
}
