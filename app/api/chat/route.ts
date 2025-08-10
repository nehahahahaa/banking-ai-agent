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

type Context = {
  mode?: "compare" | "learn";
  compare?: { a: string; b: string }; // canonical card names
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

// robust income parser: cues + k/m suffix
function parseIncomeFromText(t: string): number | null {
  const text = t.toLowerCase().replace(/[,]/g, "").trim();

  // k/m suffix (5k, 0.9m)
  const km = text.match(/(\d+(?:\.\d+)?)\s*([km])\b/);
  if (km) {
    const val = parseFloat(km[1]);
    const mult = km[2] === "k" ? 1_000 : 1_000_000;
    return Math.round(val * mult);
  }

  const incomeCues = ["income", "$", "usd", "per month", "per year", "salary", "earn"];
  const hasCue = incomeCues.some((c) => text.includes(c));

  // money like $4500 or 4500 usd (only with cue)
  const money = text.match(/\$?\s*(\d+(?:\.\d+)?)\s*(usd)?\b/);
  if (money && hasCue) return Number(money[1]);

  // last resort: clearly not age
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

  // Age: accept small numbers
  if (s.age == null) {
    const n = extractNumber(t);
    if (n != null && n >= 0 && n <= 120) s.age = n;
  }

  // Employment
  if (s.employment == null) {
    const emp = normalizeEmployment(t);
    if (emp) s.employment = emp;
  }

  // Income
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

/** Numbered intro (no guidance line) and returns actions for UI buttons */
function formatIntro() {
  const list = cards.slice(0, 3).map((c, i) => {
    const perks = (c.benefits || []).join(", ");
    return `${i + 1}. ${c.name} — ${perks || "Standard benefits"}`;
  });
  return ["I can help you find the right card. Here are your options:", ...list].join("\n\n");
}

/** pick a card by number (1–3), "card 2", or full/partial name */
function pickCardFromText(text: string) {
  const t = text.trim().toLowerCase();

  // numbers: "1", "2", "3", or "card 2"
  const num = t.match(/(?:^|\b)(?:card\s*)?([1-3])(?:\b|$)/);
  if (num) return cards[Number(num[1]) - 1];

  // by name (ignore leading numbering/punctuation)
  const name = t.replace(/^\s*\d+\s*[.)-]?\s*/, "");
  return cards.find(
    (c) =>
      c.name.toLowerCase() === name ||
      c.name.toLowerCase().includes(name) ||
      name.includes(c.name.toLowerCase())
  );
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
    const { message, slots: incomingSlots, firstTurn, context: incomingCtx } = await req.json();
    const text = (message || "").toLowerCase();

    const slots: Slots = {
      income: incomingSlots?.income ?? null,
      age: incomingSlots?.age ?? null,
      employment: incomingSlots?.employment ?? null,
      preference: incomingSlots?.preference ?? null,
      hasCosigner: incomingSlots?.hasCosigner ?? null,
    };

    let context: Context = incomingCtx || {};

    // First turn intro → numbered + actions for your 3 buttons
    if (firstTurn) {
      return NextResponse.json({
        reply: formatIntro(),
        slots,
        done: false,
        context,
        actions: ["recommend", "learn", "compare"], // ← render these as buttons in your UI
      });
    }

    // If we are already in a compare flow, keep slot-filling until done
    if (context.mode === "compare" && context.compare?.a && context.compare?.b) {
      const updatedSlots = updateSlotsFromMessage(slots, message);
      const missing = nextMissingSlot(updatedSlots);
      if (missing) {
        return NextResponse.json({ reply: askFor(missing), slots: updatedSlots, done: false, context });
      }
      const cardA = cards.find((c) => c.name === context.compare!.a)!;
      const cardB = cards.find((c) => c.name === context.compare!.b)!;
      const resultA = scoreCard(cardA as any, updatedSlots as any);
      const resultB = scoreCard(cardB as any, updatedSlots as any);

      const reply = [
        `⚖️ Comparison for your profile:`,
        `- **${cardA.name}**: ${resultA.reasons.length ? resultA.reasons.join("; ") : resultA.failures.join("; ")}`,
        `- **${cardB.name}**: ${resultB.reasons.length ? resultB.reasons.join("; ") : resultB.failures.join("; ")}`,
        (resultA.score > resultB.score)
          ? `👉 Best for you: **${cardA.name}**`
          : (resultB.score > resultA.score)
            ? `👉 Best for you: **${cardB.name}**`
            : `Both cards are equally suitable based on your profile.`
      ].join("\n");

      return NextResponse.json({ reply, slots: updatedSlots, done: true, context: {} });
    }

    // Compare intent (accept numbers or names)
    const compareMatch = text.match(/compare\s+(.+?)\s+vs\s+(.+)/i);
    if (compareMatch) {
      const aTok = compareMatch[1].trim();
      const bTok = compareMatch[2].trim();
      const cardA = pickCardFromText(aTok);
      const cardB = pickCardFromText(bTok);

      if (!cardA || !cardB) {
        return NextResponse.json({
          reply: "I couldn’t find one or both cards to compare. Use the numbers (1–3) or full names.",
          slots,
          done: false,
          context,
        });
      }

      const updatedSlots = updateSlotsFromMessage(slots, message);
      const missing = nextMissingSlot(updatedSlots);
      if (missing) {
        context = { mode: "compare", compare: { a: cardA.name, b: cardB.name } }; // persist intent
        return NextResponse.json({ reply: askFor(missing), slots: updatedSlots, done: false, context });
      }

      // All slots present → run compare now
      const resultA = scoreCard(cardA as any, updatedSlots as any);
      const resultB = scoreCard(cardB as any, updatedSlots as any);

      const reply = [
        `⚖️ Comparison for your profile:`,
        `- **${cardA.name}**: ${resultA.reasons.length ? resultA.reasons.join("; ") : resultA.failures.join("; ")}`,
        `- **${cardB.name}**: ${resultB.reasons.length ? resultB.reasons.join("; ") : resultB.failures.join("; ")}`,
        (resultA.score > resultB.score)
          ? `👉 Best for you: **${cardA.name}**`
          : (resultB.score > resultA.score)
            ? `👉 Best for you: **${cardB.name}**`
            : `Both cards are equally suitable based on your profile.`
      ].join("\n");

      return NextResponse.json({ reply, slots: updatedSlots, done: true, context: {} });
    }

    // Learn more prompt
    if (/learn more/.test(text)) {
      context = { mode: "learn" };
      return NextResponse.json({
        reply: "Which card would you like to learn more about? Reply with the number (1, 2, 3) or the name.",
        slots,
        done: false,
        context,
      });
    }

    // Learn-more selection (by number OR name)
    if (context.mode === "learn" || /details|about/.test(text) || /^[1-3]$/.test(text)) {
      const selected = pickCardFromText(text);
      if (selected) {
        return NextResponse.json({
          reply:
            `${selected.name} — ${(selected.benefits || []).join(", ")}\n` +
            `Min income: $${selected.minIncome}\n` +
            `Age: ${selected.eligibleAges.join("-")}\n` +
            `Employment: ${selected.employmentTypes.join(", ")}`,
          slots,
          done: false,
          context: {}, // clear learn mode after answering
        });
      }
    }

    // Recommend flow (slot filling)
    if (text.includes("recommend")) {
      const updatedSlots = updateSlotsFromMessage(slots, message);
      const missing = nextMissingSlot(updatedSlots);
      if (missing) {
        return NextResponse.json({ reply: askFor(missing), slots: updatedSlots, done: false, context: {} });
      }
      const engineResult = runEngine({
        income: Number(updatedSlots.income),
        age: Number(updatedSlots.age),
        employment: String(updatedSlots.employment),
        preference: updatedSlots.preference ?? null,
        hasCosigner: updatedSlots.hasCosigner === true,
      } as any);
      return NextResponse.json({ reply: renderEngineReply(engineResult), slots: updatedSlots, done: true, context: {} });
    }

    // Fallback
    return NextResponse.json({
      reply: "I’m here to help with cards. Use the buttons: Recommend, Learn More, or Compare.",
      slots,
      done: false,
      context,
    });
  } catch (err) {
    console.error("API ERROR:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
