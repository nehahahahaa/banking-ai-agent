interface Card {
  name: string;
  minIncome: number;
  eligibleAges: [number, number];
  employmentTypes: string[];
  benefits: string[];
}

interface UserInfo {
  income: number;
  age: number;
  employment: string;
  preference: null | string;
}

export const scoreCard = (card: Card, user: UserInfo): { score: number; reasons: string[] } => {
  let score = 0;
  const reasons: string[] = [];

  if (user.income >= card.minIncome) {
    score += 1;
    reasons.push("✓ Income meets requirement");
  } else {
    reasons.push("✗ Income below requirement");
  }

  if (user.age >= card.eligibleAges[0] && user.age <= card.eligibleAges[1]) {
    score += 1;
    reasons.push("✓ Age within eligibility range");
  } else {
    reasons.push("✗ Age not within eligibility range");
  }

  if (card.employmentTypes.includes(user.employment)) {
    score += 1;
    reasons.push("✓ Employment type accepted");
  } else {
    reasons.push("✗ Employment type not accepted");
  }

  return { score, reasons };
};

export const handleChatQuery = async (input: any) => {
  // Example logic for processing the input, replace with real logic
  return {
    message: 'Recommendation logic not yet implemented.',
    input,
  };
};
