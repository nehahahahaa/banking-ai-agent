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
