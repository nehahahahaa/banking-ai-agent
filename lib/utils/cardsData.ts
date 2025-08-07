export interface Card {
  name: string
  minIncome: number
  eligibleAges: [number, number]
  employmentTypes: string[]
  benefits: string[]
}

export const cards: Card[] = [
  {
    name: "Platinum Travel Card",
    minIncome: 30000,
    eligibleAges: [21, 65],
    employmentTypes: ["salaried", "self-employed"],
    benefits: ["Travel rewards", "Lounge access"],
  },
  {
    name: "Student Saver Card",
    minIncome: 0,
    eligibleAges: [18, 25],
    employmentTypes: ["student"],
    benefits: ["Cashback", "No annual fee"],
  },
  {
    name: "Senior Secure Card",
    minIncome: 10000,
    eligibleAges: [55, 80],
    employmentTypes: ["retired"],
    benefits: ["Medical benefits", "No late fee"],
  },
]
