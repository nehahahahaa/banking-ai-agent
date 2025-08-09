import { NextRequest, NextResponse } from "next/server";
import { cards } from "@/lib/utils/cardsData";
import { scoreCard, handleChatQuery as runEngine } from "@/lib/utils/scoreCard"; // ✅ Correct import

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

function extractNumber(n: string): number | null {
  const m = n.replace(/[,]/g, "").match(/-?\d+(\.\d+)?/);
  return m ? Number(m[0]) : null;
}

function parseIncomeFromText(t: string): number | null {
  const text = t.toLowerCase().replace(/[,]/g, "").trim();

  const km = text.match(/(\d+(?:\.\d+)?)\s*([km])\b/);
  if (km) {
    const val = parseFloat(km[1]);
    const mult = km[2] === "k" ? 1_000 : 1_000_000;
    return Math.round(val * mult);
  }

  const incomeCues = ["income", "$", "usd", "per month", "per year", "salary", "earn"];
  const hasCue = incomeCues.some((c) => text.includes(c));

  const money = text.match(/\$?\s*(\d+(?:\.\d+)?)\s*(usd)?\b/);
  if (money && hasCue) {
    return Number(money[1]);
  }

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
    case "age":
      return "What is your age?";
    case "employment":
      return "What is your employment type? (salaried, self-employed, student, retired)";
    case "income":
      return "What is your monthly income (USD)?";
    case "hasCosigner":
      return "Do you have a qualified cosigner? (yes/no)";
    default:
      return "Tell me about your preference (e.g., travel, cashback, no annual fee), or say 'recommend a card'.";
  }
}

function updateSlotsFromMessage(slots: Slots, message: string): Slots {
  const t = message.toLowerCase();
  const s: Slots = { ...slots };

  if (s.age == null) {
    const n = extractNumber(t);
    if (n != null && n >= 0 && n <= 120) s.age = n;
  }

  if (s.employment == null) {
    const emp = normalizeEmployment(t);
    if (emp) s.employment = emp;
  }

  if (s.income == null) {
    const income = parseIncomeFromText(t);
    if (income != null) s.income = income;
  }

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
  if (engine.type === "full-match") {
    return `🧠 Builds trust by showing logic clearly\n${engine.message}`;
  }
  if (engine.type === "multiple-match") {
    return `🟢 Transparent + ranked choices\n${engine.message}`;
  }
  if (engine.type === "partial-match") {
    const failures: string[] = engine.failures || [];
    const out: string[] = [`⚠️ Partial match – explained clearly`, engine.message];
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

    if (firstTurn) {
      return NextResponse.json({ reply: formatIntro(), slots, done: false });
    }

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
        `- **${cardA.name}**: ${
          (resultA.reasons && resultA.reasons.length
            ? resultA.reasons.join("; ")
            : resultA.failures.join("; "))
        }`,
        `- **${cardB.name}**: ${
          (resultB.reasons && resultB.reasons.length
            ? resultB.reasons.join("; ")
            : resultB.failures.join("; "))
        }`,
        (resultA.score > resultB.score)
          ? `👉 Best for you: **${cardA.name}**`
          : (resultB.score > resultA.score)
            ? `👉 Best for you: **${cardB.name}**`
            : `Both cards are equally suitable based on your profile.`
      ].join("\n");

      return NextResponse.json({ reply, slots: updatedSlots, done: true });
    }

    if (text.includes("recommend")) {
      const updatedSlots = updateSlotsFromMessage(slots, message);
      const missing = nextMissingSlot(updatedSlots);
      if (missing) {
        return NextResponse.json({ reply: askFor(missing), slots: updatedSlots, done: false });
      }
      const engineResult = runEngine({
        income: Number(updatedSlots.income),
        age: Number(updatedSlots.age),
        employment: String(updatedSlots.employment),
        preference: updatedSlots.preference ?? null,
        hasCosigner: updatedSlots.hasCosigner === true,
      } as any);
      return NextResponse.json({ reply: renderEngineReply(engineResult), slots: updatedSlots, done: true });
    }

    return NextResponse.json({
      reply:
        "I’m here to help you with cards. Try saying 'recommend a card for me', 'learn more', or 'compare Card A vs Card B'.",
      slots,
      done: false,
    });
  } catch (err) {
    console.error("API ERROR:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
