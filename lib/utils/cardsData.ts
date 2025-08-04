export const cards = [
  {
    name: "Platinum Travel Card",
    fee: 450,
    rewards: "3x on travel, 1x on everything else",
    perks: ["airport lounge access", "foreign transaction waiver"],
    minIncome: 100000,
    minCreditScore: 750,
  },
  {
    name: "Gold Rewards Card",
    fee: 95,
    rewards: "2x on travel, 1x on everything else",
    perks: ["travel insurance"],
    minIncome: 60000,
    minCreditScore: 700,
  },
  {
    name: "Cashback Plus Card",
    fee: 0,
    rewards: "2% cashback on groceries and gas",
    perks: ["no annual fee"],
    minIncome: 25000,
    minCreditScore: 650,
  },
  {
    name: "Student Starter Card",
    fee: 0,
    rewards: "1% cashback on all purchases",
    perks: ["no annual fee", "low credit requirement"],
    minIncome: 0,
    minCreditScore: 600,
  },
] as const;
