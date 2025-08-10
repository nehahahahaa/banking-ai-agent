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

type Ctx = {
  mode?: "learn" | "recommend";
  selectedCard?: string;
  learnOptions?: { a?: string; b?: string };
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
  if (money && hasCue) return Number(money[1]);
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

function formatEmploymentList(list: string[] = []) {
  return list.filter((x) => !/self-employed/i.test(x)).join(", ");
}

// capture order for LEARN: employment → age → income → cosigner (student)
function nextMissingSlot(
  slots: Slots,
  selectedCard?: { minIncome: number; eligibleAges: [number, number]; employmentTypes: string[] }
) {
  if (slots.employment == null || slots.employment === "") return "employment";
  if (slots.age == null) return "age";
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

function askFor(slot: keyof Slots, card?: any): string {
  if (slot === "employment") {
    const allowed = formatEmploymentList(card?.employmentTypes || ["salaried", "student", "retired"]);
    const only = allowed.split(/\s*,\s*/).filter(Boolean);
    const hint = only.length === 1 ? `\nHint: choose ${only[0]}.` : "";
    return `What is your employment type? (${allowed})${hint}`;
  }
  if (slot === "age") {
    const [min, max] = card?.eligibleAges || [18, 80];
    return `What is your age?\nHint: choose age between ${min}–${max}.`;
  }
  if (slot === "income") {
    const minInc = card?.minIncome ?? 0;
    return `What is your monthly income (USD)?\nHint: minimum income $${minInc}.`;
  }
  if (slot === "hasCosigner") {
    return `Do you have a qualified cosigner? (yes/no)`;
  }
  return `Tell me your preference (travel, cashback, no annual fee), or say 'recommend'.`;
}

function updateSlotsFromMessage(slots: Slots, message: string): Slots {
  const t = message.toLowerCase();
  const s: Slots = { ...slots };

  // employment first
  if (s.employment == null || s.employment === "") {
    const emp = normalizeEmployment(t);
    if (emp) s.employment = emp;
  }

  // age
  if (s.age == null) {
    const n = extractNumber(t);
    if (n != null && n >= 0 && n <= 120) s.age = n;
  }

  // income (permissive once age & employment known)
  if (s.income == null) {
    const inc = parseIncomeFromText(t);
    if (inc != null) s.income = inc;
    else if (s.age != null && s.employment) {
      const n2 = extractNumber(t);
      if (n2 != null) s.income = n2;
    }
  }

  // cosigner if student 18–25 & >5k
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

  // optional pref
  if (s.preference == null) {
    const pref = detectPreference(t);
    if (pref) s.preference = pref;
  }

  return s;
}

function formatIntro(): string {
  const lines = cards.slice(0, 3).map((c, i) => {
    const perks = (c.benefits || []).join(", ");
    return `${i + 1}. ${c.name} — ${perks || "Standard benefits"}`;
  });
  return [`I can help you find the right card. Here are your options:`, ...lines].join("\n");
}

function pickCardFromText(text: string) {
  const t = text.trim().toLowerCase();

  const num = t.match(/(?:^|\b)(?:card\s*)?([1-3])(?:\b|$)/);
  if (num) return cards[Number(num[1]) - 1];

  const name = t.replace(/^\s*\d+\s*[.)-]?\s*/, "");
  return cards.find(
    (c) =>
      c.name.toLowerCase() === name ||
      c.name.toLowerCase().includes(name) ||
      name.includes(c.name.toLowerCase())
  );
}

export async function POST(req: NextRequest) {
  try {
    const { message, slots: incomingSlots, firstTurn, context: incomingContext } = await req.json();
    const text = String(message || "").toLowerCase().trim();
    let context: Ctx = incomingContext || {};

    // sanitize zeros/empty to null
    let slots: Slots = {
      income: incomingSlots?.income && incomingSlots.income > 0 ? incomingSlots.income : null,
      age: incomingSlots?.age && incomingSlots.age > 0 ? incomingSlots.age : null,
      employment: incomingSlots?.employment?.trim() ? incomingSlots.employment : null,
      preference: incomingSlots?.preference ?? null,
      hasCosigner: incomingSlots?.hasCosigner ?? null,
    };

    // First turn → always intro with buttons
    if (firstTurn) {
      return NextResponse.json({
        reply: formatIntro(),
        slots,
        done: false,
        context: {},
        actions: ["recommend", "learn", "compare"],
      });
    }

    // Bare compare prompt
    if (/^compare$/.test(text)) {
      const list = cards.slice(0, 3).map((c, i) => `${i + 1}. ${c.name}`).join("\n");
      return NextResponse.json({
        reply:
          `Which two cards would you like to compare?\n` +
          `Hint: Reply "1, 2" or "Professional Plus vs Student Essentials".\n\n${list}`,
        slots,
        done: false,
        context: { mode: "learn" },
        actions: [],
      });
    }

    // Compare A vs B (names or numbers)
    const compareMatch = text.match(/compare\s+(.+)\s+vs\s+(.+)/i);
    if (compareMatch) {
      const a = compareMatch[1].trim().toLowerCase();
      const b = compareMatch[2].trim().toLowerCase();
      const cardA =
        cards.find((c) => c.name.toLowerCase().includes(a) || a.includes(c.name.toLowerCase())) ||
        pickCardFromText(a);
      const cardB =
        cards.find((c) => c.name.toLowerCase().includes(b) || b.includes(c.name.toLowerCase())) ||
        pickCardFromText(b);

      if (!cardA || !cardB) {
        return NextResponse.json({
          reply: "I couldn’t find one or both cards to compare. Please use full names or 1–3.",
          slots,
          done: false,
          context: { mode: "learn" },
          actions: [],
        });
      }

      const reply =
        `⚖️ Comparison preview:\n` +
        `- ${cardA.name} — ${(cardA.benefits || []).join(", ") || "Standard benefits"}\n` +
        `- ${cardB.name} — ${(cardB.benefits || []).join(", ") || "Standard benefits"}`;

      return NextResponse.json({
        reply,
        slots,
        done: false,
        context: { mode: "learn", learnOptions: { a: cardA.name, b: cardB.name } },
        actions: ["learn_A", "learn_B"],
        meta: { learnA: cardA.name, learnB: cardB.name },
      });
    }

    // Learn entry point (accept "learn more" or "learn")
    if (/\blearn\s+more\b/i.test(message) || /^learn$/i.test(message)) {
      return NextResponse.json({
        reply:
          "Which card would you like to learn more about? Reply with the number (1, 2, 3) or the name.",
        slots,
        done: false,
        context: { mode: "learn" },
        actions: ["compare", "recommend"], // keep some buttons visible
      });
    }

    // Two picks like "1, 2"
    const twoPick = text.match(/^\s*([1-3])\s*[,/&]\s*([1-3])\s*$/);
    if (context.mode === "learn" && twoPick) {
      const A = cards[Number(twoPick[1]) - 1];
      const B = cards[Number(twoPick[2]) - 1];
      const reply =
        `⚖️ Comparison preview:\n` +
        `- ${A.name} — ${(A.benefits || []).join(", ") || "Standard benefits"}\n` +
        `- ${B.name} — ${(B.benefits || []).join(", ") || "Standard benefits"}`;
      return NextResponse.json({
        reply,
        slots,
        done: false,
        context: { mode: "learn", learnOptions: { a: A.name, b: B.name } },
        actions: ["learn_A", "learn_B"],
        meta: { learnA: A.name, learnB: B.name },
      });
    }

    // Learn_A / Learn_B actions (preserve learnOptions so "learn_other" works later)
    if (text === "learn_A" || text === "learn_B") {
      const pick =
        text === "learn_A"
          ? context.learnOptions?.a || cards[0]?.name
          : context.learnOptions?.b || cards[1]?.name;
      const selected = cards.find((c) => c.name === pick) || cards[0];

      return NextResponse.json({
        reply:
          `**${selected.name}** — ${(selected.benefits || []).join(", ") || "Standard benefits"}\n` +
          `Min income: $${selected.minIncome}\n` +
          `Age: ${selected.eligibleAges.join("-")}\n` +
          `Employment: ${formatEmploymentList(selected.employmentTypes)}\n\n` +
          `Let’s check your eligibility.\n` +
          askFor("employment", selected),
        slots,
        done: false,
        context: { mode: "learn", selectedCard: selected.name, learnOptions: context.learnOptions },
        actions: [],
      });
    }

    // Learn-more selection by number or name (outside of learn_A/B)
    if (context.mode === "learn") {
      const chosen = pickCardFromText(text);
      if (chosen) {
        return NextResponse.json({
          reply:
            `**${chosen.name}** — ${(chosen.benefits || []).join(", ") || "Standard benefits"}\n` +
            `Min income: $${chosen.minIncome}\n` +
            `Age: ${chosen.eligibleAges.join("-")}\n` +
            `Employment: ${formatEmploymentList(chosen.employmentTypes)}\n\n` +
            `Let’s check your eligibility.\n` +
            askFor("employment", chosen),
          slots,
          done: false,
          context: { mode: "learn", selectedCard: chosen.name, learnOptions: context.learnOptions },
          actions: [],
        });
      }
    }

    // Learn flow step-by-step: employment → age → income → cosigner (student path)
    if (context.mode === "learn" && context.selectedCard) {
      const selected = cards.find((c) => c.name === context.selectedCard) || cards[0];
      let s = updateSlotsFromMessage(slots, message);

      // 1) Immediate gate: employment not allowed
      if (s.employment && !selected.employmentTypes.includes(String(s.employment))) {
        const reply =
          `❌ You are not eligible for the **${selected.name}**.\n` +
          `✗ Employment type not eligible`;
        const pair = context.learnOptions;
        const otherName =
          (pair && [pair.a, pair.b].find((nm) => nm && nm !== selected.name)) ||
          "Student Essentials Card";
        return NextResponse.json({
          reply:
            reply + `\n\nWould you like to learn about the **${otherName}** or talk to an agent?`,
          slots: s,
          done: false,
          context: {
            mode: "learn",
            selectedCard: undefined,
            learnOptions: { a: otherName, b: otherName },
          },
          actions: ["learn_other", "talk_agent"],
          meta: { otherCardName: otherName },
        });
      }

      // 2) Immediate gate: age out-of-range (do this BEFORE asking income)
      if (typeof s.age === "number") {
        const [minAge, maxAge] = selected.eligibleAges;
        if (!(s.age >= minAge && s.age <= maxAge)) {
          const pair = context.learnOptions;
          const otherName =
            (pair && [pair.a, pair.b].find((nm) => nm && nm !== selected.name)) ||
            "Student Essentials Card";
          return NextResponse.json({
            reply:
              `❌ You are not eligible for the **${selected.name}**.\n` +
              `✗ Age not within eligible range\n\n` +
              `Would you like to learn about the **${otherName}** or talk to an agent?`,
            slots: s,
            done: false,
            context: {
              mode: "learn",
              selectedCard: undefined,
              learnOptions: { a: otherName, b: otherName },
            },
            actions: ["learn_other", "talk_agent"],
            meta: { otherCardName: otherName },
          });
        }
      }

      // 3) Ask next missing (employment → age → income → cosigner)
      const missing = nextMissingSlot(s, selected);
      if (missing) {
        return NextResponse.json({
          reply: askFor(missing, selected),
          slots: s,
          done: false,
          context,
          actions: [],
        });
      }

      // 4) Guard income once more (shouldn’t hit, but safe)
      if (s.income == null) {
        return NextResponse.json({
          reply: askFor("income", selected),
          slots: s,
          done: false,
          context,
          actions: [],
        });
      }

      // 5) Score ONLY the selected card
      const res = scoreCard(selected as any, {
        income: Number(s.income),
        age: Number(s.age),
        employment: String(s.employment),
        preference: s.preference ?? null,
        hasCosigner: s.hasCosigner === true,
      } as any);

      if ((res.failures?.length ?? 0) === 0 && res.score >= 3) {
        return NextResponse.json({
          reply:
            `✅ You’re eligible for the **${selected.name}**.\nHint: Click the Apply button below.`,
          slots: s,
          done: false,
          context: {},
          actions: ["apply"],
        });
      }

      const pair = context.learnOptions;
      const otherName =
        (pair && [pair.a, pair.b].find((nm) => nm && nm !== selected.name)) ||
        "Student Essentials Card";
      const failures = res.failures?.length ? res.failures.join("\n") : "Some requirements not met.";
      return NextResponse.json({
        reply:
          `❌ You are not eligible for the **${selected.name}**.\n` +
          `${failures}\n\n` +
          `Would you like to learn about the **${otherName}** or talk to an agent?`,
        slots: s,
        done: false,
        context: {
          mode: "learn",
          selectedCard: undefined,
          learnOptions: { a: otherName, b: otherName },
        },
        actions: ["learn_other", "talk_agent"],
        meta: { otherCardName: otherName },
      });
    }

    // Learn_other → switch to the other card, reset capture
    if (text === "learn_other") {
      const otherName =
        incomingContext?.learnOptions?.a ||
        incomingContext?.learnOptions?.b ||
        "Student Essentials Card";
      const picked = cards.find((c) => c.name === otherName) || cards[1] || cards[0];
      const resetSlots: Slots = { ...slots, age: null, employment: null, income: null };

      return NextResponse.json({
        reply:
          `**${picked.name}** — ${(picked.benefits || []).join(", ") || "Standard benefits"}\n` +
          `Min income: $${picked.minIncome}\n` +
          `Age: ${picked.eligibleAges.join("-")}\n` +
          `Employment: ${formatEmploymentList(picked.employmentTypes)}\n\n` +
          `Let’s check your eligibility.\n` +
          askFor("employment", picked),
        slots: resetSlots,
        done: false,
        context: { mode: "learn", selectedCard: picked.name, learnOptions: incomingContext?.learnOptions },
        actions: [],
      });
    }

    // Talk to agent → show phone only now
    if (text === "talk_agent" || /talk to agent|agent/i.test(text)) {
      const AGENT_PHONE = process.env.AGENT_PHONE || "1-800-XXXX-XXXX";
      return NextResponse.json({
        reply: `Please call us at **${AGENT_PHONE}**.`,
        slots,
        done: true,
        context: {},
        actions: [],
      });
    }

    // ✅ Apply handler (new)
    if (text === "apply") {
      return NextResponse.json({
        reply: "Great! You can start your application in the app/portal.",
        slots,
        done: true,
        context: {},
        actions: [],
      });
    }

    // Recommend flow
    if (text.includes("recommend")) {
      const s = updateSlotsFromMessage(slots, message);
      const missing = nextMissingSlot(s);
      if (missing) {
        return NextResponse.json({
          reply: askFor(missing),
          slots: s,
          done: false,
          context: { mode: "recommend" },
          actions: [],
        });
      }
      const engine = runEngine({
        income: Number(s.income),
        age: Number(s.age),
        employment: String(s.employment),
        preference: s.preference ?? null,
        hasCosigner: s.hasCosigner === true,
      } as any);
      return NextResponse.json({
        reply: engine?.message || "Here are your recommendations.",
        slots: s,
        done: true,
        context: {},
        actions: [],
      });
    }

    // Continue recommend mode if mid-capture
    if (incomingContext?.mode === "recommend") {
      const s = updateSlotsFromMessage(slots, message);
      const missing = nextMissingSlot(s);
      if (missing) {
        return NextResponse.json({
          reply: askFor(missing),
          slots: s,
          done: false,
          context: incomingContext,
          actions: [],
        });
      }
      const engine = runEngine({
        income: Number(s.income),
        age: Number(s.age),
        employment: String(s.employment),
        preference: s.preference ?? null,
        hasCosigner: s.hasCosigner === true,
      } as any);
      return NextResponse.json({
        reply: engine?.message || "Here are your recommendations.",
        slots: s,
        done: true,
        context: {},
        actions: [],
      });
    }

    // Fallback
    return NextResponse.json({
      reply:
        "I’m here to help with cards. Use the buttons below or try: 'learn', 'recommend', or 'compare'.",
      slots,
      done: false,
      context,
      actions: ["recommend", "learn", "compare"],
    });
  } catch (err) {
    console.error("API ERROR:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
