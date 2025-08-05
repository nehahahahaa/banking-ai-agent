import { cards } from "./cardsData";
import { scoreCard } from "./scoreCard";

interface UserContext {
  income: number;
  age: number;
  employment: string;
  preference: string | null;
}

export function handleChatQuery(
  query: string,
  user: UserContext,
  cardList = cards
): string {
  const q = query.toLowerCase();

  // Match preference keywords
  const preferenceMap: Record<string, string> = {
    travel: "travel",
    cashback: "cashback",
    "no annual fee": "no annual fee",
    student: "student",
    premium: "premium",
  };

  let detectedPref: string | null = null;
  for (const key in preferenceMap) {
    if (q.includes(key)) {
      detectedPref = preferenceMap[key];
      break;
    }
  }

  // Score and filter
  let bestCard = null;
  let bestScore = -1;
  let reasons: string[] = [];

  for (const card of cardList) {
    const { score, reasons: r } = scoreCard(card, {
      ...user,
      preference: detectedPref,
    });

    if (score > bestScore) {
      bestCard = card;
      bestScore = score;
      reasons = r;
    }
  }

  if (bestCard) {
    return `You may be eligible for the **${bestCard.name}** card.\n\nReasons:\n- ${reasons.join("\n- ")}`;
  } else {
    return `Based on your information, no matching cards found. Please check your inputs or ask about specific preferences like "travel card" or "student card".`;
  }
}
