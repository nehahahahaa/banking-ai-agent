interface Card {
  name: string;
  fee: number;
  rewards: string;
  perks: string[];
  minIncome: number;
  minCreditScore: number;
}

interface UserContext {
  income: number;
  age: number;
  employment: string;
  preference: string | null;
}

export function scoreCard(card: Card, user: UserContext) {
  let score = 0;
  let reasons: string[] = [];

  if (card.fee === 0) {
    score += 2;
    reasons.push("no annual fee");
  } else if (card.fee < 100) {
    score += 1;
    reasons.push("low annual fee");
  }

  if (user.preference && card.rewards.toLowerCase().includes(user.preference.toLowerCase())) {
    score += 3;
    reasons.push(`great for ${user.preference}`);
  }

  if (user.income >= card.minIncome) {
    score += 2;
    reasons.push("meets income eligibility");
  }

  if (user.employment === "student" && card.name.toLowerCase().includes("student")) {
    score += 2;
    reasons.push("tailored for students");
  }

  if (user.income >= 100000 && card.perks.includes("airport lounge access")) {
    score += 1;
    reasons.push("premium perks for high income");
  }

  if (user.age < 25 && card.minCreditScore <= 650) {
    score += 1;
    reasons.push("good for young applicants");
  }

  if (user.income >= 50000 && card.minCreditScore <= 700) {
    score += 1;
    reasons.push("balanced eligibility");
  }

  if (user.income >= card.minIncome && user.preference === null) {
    reasons.push("eligible based on profile");
  }

  return { score, reasons };
}
