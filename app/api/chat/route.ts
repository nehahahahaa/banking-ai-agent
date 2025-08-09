import { NextRequest, NextResponse } from "next/server";
import { cards } from "@/lib/utils/cardsData";
import { scoreCard, handleChatQuery as runEngine } from "@/lib/utils/scoreCard";

type Slots = {
  income?: number | null;
  age?: number | null;
  employment?: string | null;
  preference?: string | null;
  hasCosigner?: boolean | null;
};

const EMPLOYMENT_ALIASES: Record<string, string> = {
  salaried: "salaried",
  "full time": "salaried",
  "full-time": "salaried",
  employee: "salaried",
  job: "salaried",
  student: "student",
  studying: "student",
  college: "student",
  retired: "retired",
  pension: "retired",
  self: "self-employed",
  "self employed": "self-employed",
  "self-employed": "self-employed",
  freelance: "self-employed",
  contractor: "self-employed",
};

function normalizeEmployment(text: string): string | null {
  const t = text.toLowerCase();
  for (const [k, v] of Object.entries(EMPLOYMENT_ALIASES)) {
    if (t.includes(k)) return v;
  }
  return null;
}

// generic number grabber (used for age)
function extractNumber(n: string): number | null {
  const m = n.replace(/[,]/g, "").match(/-?\d+(\.\d+)?/);
  return m ? Number(m[0]) : null;
}

// robust income parser: respects cues and k/m suffixes
function parseIncomeFromText(t: string): number | null {
  const text = t.toLowerCase().replace(/[,]/g, "").trim();

  // quick cue check
  const incomeCues = ["income", "$", "usd", "per month", "per year", "salary", "earn", "k"];
  const hasCue = incomeCues.some((c) => text.includes(c));

  // k/m suffix (e.g., 5k, 7.5k, 0.9m)
  const km = text.match(/(\d+(?:\.\d+)?)\s*([km])\b/);
  if (km) {
    const val = parseFloat(km[1]);
    const mult = km[2] === "k" ? 1_000 : 1_000_000;
    return Math.round(val * mult);
  }

  // plain money like $4500 or 4500 usd
  const money = text.match(/\$?\s*(\d+(?:\.\d+)?)\s*(usd)?\b/);
  if (money && hasCue) {
    return Number(money[1]);
  }

  // last resort: if there is a bare number and it's clearly not an age (>= 1000), accept
  const num = extractNumber(text);
  if (num != null && num >= 1000) return num;

  return null;
}

function detectPreference(text: string): string | null {
  const t = text.toLowerCase();
  if (t.includes("travel")) return "travel";
  if (t.includes("cashback") || t.includes("cash back")) return "cashback";
  if (t.includes("no annual fee")) return "no annual fee";
  if (t.includes("premium")) return "premium";
  if (t.includes("student")) return "student";
  return null;
}

function nextMissingSlot(slots: Slots): keyof Slots | null {
  if (slots.age == null) return "age";
  if (slots.employment == null || slots.employment === "") return "employment";
  if (slots.income == null) return "income";
  if (
    slots.employment === "student" &&
    typeof slots.age === "number" &&
    slots.age >= 18 &&
    slots.age <= 25 &&
    typeof slots.income === "number" &&
    slots.income > 5000 &&
    slots.hasCosigner == null
  ) {
    return "hasCosigner";
  }
  return null;
}

function askFor(slot: keyof Slots): string {
  switch (slot) {
    case "age": return "What is your age?";
    case "employment": return "What is your employment type? (salaried, self-employed, student, retired)";
    case "income": return "What is your monthly income (USD)?";
    case "hasCosigner": return "Do you have a qualified cosigner? (yes/no)";
    default: return "Tell me about your preference (e.g., travel, cashback, no annual fee), or say 'recommend a card'.";
  }
}

function updateSlotsFromMessage(slots: Slots, message: string): Slots {
  const t = message.toLowerCase();
  const s: Slots = { ...slots };

  // Age: accept small numbers (<=120)
  if (s.age == null) {
    const n = extractNumber(t);
    if (n != null && n >= 0 && n <= 120) s.age = n;
  }

  // Employment
  if (s.employment == null) {
    const emp = normalizeEmployment(t);
    if (emp) s.employment = emp;
  }

  // Income: require cue OR large number, and support k/m suffix
  if (s.income == null) {
    const income = parseIncomeFromText(t);
    if (income != null) s.income = income;
  }

  // Cosigner (student 18–25 & income > 5000)
  if (
    s.hasCosigner == null &&
    s.employment === "student" &&
    typeof s.age === "number" &&
    s.age >= 18 &&
    s.age <= 25 &&
    typeof s.income === "number" &&
    s.income > 5000
  ) {
    if (/\b(yes|yep|yeah|true)\b/i.test(message)) s.hasCosigner = true;
    if (/\b(no|nope|nah|false)\b/i.test(message)) s.hasCosigner = false;
  }

  // Preference (optional)
  if (s.preference == null) {
    const pref = detectPreference(t);
    if (pref) s.preference = pref;
  }

  return s;
}

function formatIntro() {
  const lines = cards.slice(0, 3).map((c) => {
    const perks = (c.benefits || []).join(", ");
    return `${c.name} — ${perks || "Standard benefits"}`;
  });
  return [
    "I can help you find the right card. Here are your options:",
    ...lines,
    "You can pick a card to learn more, say “recommend a card for me”, or say “compare Card A vs Card B”."
  ].join("\n\n");
}

function renderEngineReply(engine: any): string {
  if (engine.type === "full-match") return `🧠 Builds trust by showing logic clearly\n${engine.message}`;
  if (engine.type === "multiple-match") return `🟢 Transparent + ranked choices\n${engine.message}`;
  if (engine.type === "partial-match") {
    const failures: string[] = engine.failures || [];
    let out = [`⚠️ Partial match – explained clearly`, engine.message];
    let current: string | null = null;
    failures.forEach((line) => {
      if (line.endsWith(":")) {
        current = line.slice(0, -1);
        out.push(`\n${current}:`);
      } else {
        out.push(`- ${line.replace(/^[-•]\s*/, "")}`);
      }
    });
    return out.join("\n");
  }
  return engine.message || "❌ No card matches your inputs right now.";
}

export async function POST(req: NextRequest) {
  try {
    const { message, slots: incomingSlots, firstTurn } = await req.json();
    const text = (message || "").toLowerCase();

    const slots: Slots = {
      income: incomingSlots?.income ?? null,
      age: incomingSlots?.age ?? null,
      employment: incomingSlots?.employment ?? null,
      preference: incomingSlots?.preference ?? null,
      hasCosigner: incomingSlots?.hasCosigner ?? null,
    };

    // First turn intro
    if (firstTurn) {
      return NextResponse.json({ reply: formatIntro(), slots, done: false });
    }

    // Learn more intent
    if (/learn more/.test(text)) {
      return NextResponse.json({
        reply: "Which card would you like to learn more about? You can say the name or number from the list.",
        slots,
        done: false,
      });
    }

    const learnCard = cards.find((c) => text.includes(c.name.toLowerCase()));
    if (learnCard && (text.includes("details") || text.includes("learn") || text.includes("about"))) {
      return NextResponse.json({
        reply:
          `${learnCard.name} — ${(learnCard.benefits || []).join(", ")}\n` +
          `Min income: $${learnCard.minIncome}\n` +
          `Age: ${learnCard.eligibleAges.join("-")}\n` +
          `Employment: ${learnCard.employmentTypes.join(", ")}`,
        slots,
        done: false,
      });
    }

    // Compare flow
    const compareMatch = text.match(/compare\s+(.+)\s+vs\s+(.+)/i);
    if (compareMatch) {
      const a = compareMatch[1].trim().toLowerCase();
      const b = compareMatch[2].trim().toLowerCase();
      const cardA = cards.find((c) => c.name.toLowerCase().includes(a) || a.includes(c.name.toLowerCase()));
      const cardB = cards.find((c) => c.name.toLowerCase().includes(b) || b.includes(c.name.toLowerCase()));

      if (!cardA || !cardB) {
        return NextResponse.json({
          reply: "I couldn’t find one or both cards to compare. Please use full names.",
          slots,
          done: false,
        });
      }

      const updatedSlots = updateSlotsFromMessage(slots, message);
      const missing = nextMissingSlot(updatedSlots);
      if (missing) {
        return NextResponse.json({ reply: askFor(missing), slots: updatedSlots, done: false });
      }

      const resultA = scoreCard(cardA as any, updatedSlots as any);
      const resultB = scoreCard(cardB as any, updatedSlots as any);

      const reply = [
        `⚖️ Comparison for your profile:`,
        `- **${cardA.name}**: ${resultA.reason
