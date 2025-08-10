import { NextRequest, NextResponse } from "next/server";
import { cards } from "@/lib/utils/cardsData";
import { scoreCard, handleChatQuery as runEngine } from "@/lib/utils/scoreCard";

/* ========= Types ========= */
type Slots = {
  income?: number | null;
  age?: number | null;
  employment?: string | null;
  preference?: string | null;
  hasCosigner?: boolean | null;
};

type Context = {
  mode?: "learn" | "compare" | "recommend";
  selectedCard?: string;
  learnOptions?: { a: string; b: string };
};

/* ========= Helpers ========= */
// Display-only filter: hide "self-employed" from chat blurbs
function formatEmploymentList(list: string[] = []) {
  return list.filter((x) => !/self-employed/i.test(x)).join(", ");
}

// 🔧 No self-employed in parser (MVP)
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

  const cues = ["income", "$", "usd", "per month", "per year", "salary", "earn"];
  const hasCue = cues.some((c) => text.includes(c));
  const money = text.match(/\$?\s*(\d+(?:\.\d+)?)\s*(usd)?\b/);
  if (money && hasCue) return Number(money[1]);

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

/** slot order: age → employment → income → cosigner if student */
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

function askFor(
  slot: keyof Slots,
  card?: { name: string; minIncome: number; eligibleAges: [number, number]; employmentTypes: string[] }
): string {
  const name = card?.name || "this card";
  if (slot === "age") {
    const [minA, maxA] = card?.eligibleAges || [18, 99];
    return `What is your age?\nHint: ${name} requires ${minA}–${maxA}.`;
  }
  if (slot === "employment") {
    // UPDATED: card-specific allowed list + hint; hides self-employed in label
    const list = formatEmploymentList(card?.employmentTypes || ["salaried", "student", "retired"]);
    const allowed = list || "salaried, student, retired";
    const only = allowed.split(/\s*,\s*/).filter(Boolean);
    const hint = only.length === 1 ? ` Hint: choose ${only[0]}.` : "";
    return `What is your employment type? (${allowed})${hint}`;
  }
  if (slot === "income") {
    const annual = card?.minIncome ?? 0;
    const monthlyApprox = Math.round(annual / 12);
    return `What is your monthly income (USD)?\nHint: ${name} minimum is ~$${annual} annual ≈ $${monthlyApprox}/mo.`;
  }
  if (slot === "hasCosigner") {
    return "Do you have a qualified cosigner? (yes/no)";
  }
  return "Tell me about your preference (e.g., travel, cashback, no annual fee).";
}

function updateSlotsFromMessage(slots: Slots, message: string): Slots {
  const t = message.toLowerCase();
  const s: Slots = { ...slots };

  if (s.age == null) {
    const n = extractNumber(t);
    if (n != null && n >= 0 && n <= 120) s.age = n;
  }
  if (s.employment == null || s.employment === "") {
    const emp = normalizeEmployment(t);
    if (emp) s.employment = emp;
  }
  // UPDATED: be permissive for income once age & employment known
  if (s.income == null) {
    const income = parseIncomeFromText(t);
    if (income != null) {
      s.income = income;
    } else if (s.age != null && s.employment) {
      const n = extractNumber(t);
      if (n != null) s.income = n; // allows small numbers like 100
    }
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
  const list = cards.slice(0, 3).map((c, i) => {
    const perks = (c.benefits || []).join(", ");
    return `${i + 1}. ${c.name} — ${perks || "Standard benefits"}`;
  });
  return ["I can help you find the right card. Here are your options:", ...list].join("\n\n");
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

/* ========= Route ========= */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { message, slots: incomingSlots, firstTurn, context: incomingCtx } = body as {
      message: string;
      slots: Slots;
      firstTurn: boolean;
      context?: Context;
    };

    const text = String(message || "").toLowerCase();

    // 🔧 Sanitize incoming zeros/empty to null so we ask questions
    const slots: Slots = {
      income: incomingSlots?.income && incomingSlots.income > 0 ? incomingSlots.income : null,
      age: incomingSlots?.age && incomingSlots.age > 0 ? incomingSlots.age : null,
      employment: incomingSlots?.employment?.trim() ? incomingSlots.employment : null,
      preference: incomingSlots?.preference ?? null,
      hasCosigner: incomingSlots?.hasCosigner ?? null,
    };

    let context: Context = incomingCtx || {};

    /* 1) Intro on first turn — 3 buttons */
    if (firstTurn) {
      return NextResponse.json({
        reply: formatIntro(),
        slots,
        done: false,
        context,
        actions: ["recommend", "learn", "compare"],
      });
    }

    /* 1b) Resume RECOMMEND mode if mid-capture */
    if (context.mode === "recommend") {
      const s = updateSlotsFromMessage(slots, message);
      const missing = nextMissingSlot(s);
      if (missing) {
        return NextResponse.json({ reply: askFor(missing), slots: s, done: false, context });
      }
      const engine = runEngine({
        income: Number(s.income),
        age: Number(s.age),
        employment: String(s.employment),
        preference: s.preference ?? null,
        hasCosigner: s.hasCosigner === true,
      } as any);
      // UPDATED: add CTA apply
      const msg = (engine?.message || "Here are your recommendations.") + "\n\nWould you like to apply?";
      return NextResponse.json({
        reply: msg,
        slots: s,
        done: false,
        context: {},
        actions: ["apply"],
      });
    }

    /* Bare "compare" → prompt for two (trimmed) */
    if (/^compare$/.test(text.trim())) {
      const list = cards
        .slice(0, 3)
        .map((c, i) => `${i + 1}. ${c.name}`)
        .join("\n");
      return NextResponse.json({
        reply:
          `Which two cards would you like to compare?\n` +
          `Reply like "1, 2" or "Professional Plus vs Student Essentials".\n\n${list}`,
        slots,
        done: false,
        context: { mode: "learn" },
      });
    }

    /* 2) Compare A vs B */
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

      const reply =
        `**${cardA.name}** — ${(cardA.benefits || []).join(", ")}\n` +
        `Min income: $${cardA.minIncome} · Age: ${cardA.eligibleAges.join("-")} · Employment: ${formatEmploymentList(cardA.employmentTypes)}\n\n` +
        `**${cardB.name}** — ${(cardB.benefits || []).join(", ")}\n` +
        `Min income: $${cardB.minIncome} · Age: ${cardB.eligibleAges.join("-")} · Employment: ${formatEmploymentList(cardB.employmentTypes)}`;

      return NextResponse.json({
        reply,
        slots,
        done: false,
        context: { mode: "learn", learnOptions: { a: cardA.name, b: cardB.name } },
        actions: ["learn_A", "learn_B"],
        meta: { learnA: cardA.name, learnB: cardB.name },
      });
    }

    /* 3) Compare with <card> (after Learn) */
    const compareWithMatch = text.match(/compare\s+with\s+(.+)/i);
    if (compareWithMatch && context.selectedCard) {
      const baseCard = cards.find((c) => c.name === context.selectedCard);
      const otherCard = pickCardFromText(compareWithMatch[1]);
      if (!baseCard || !otherCard) {
        return NextResponse.json({
          reply: "I couldn’t find that card to compare. Use 1–3 or the full name.",
          slots,
          done: false,
          context,
        });
      }

      const reply =
        `**${baseCard.name}** — ${(baseCard.benefits || []).join(", ")}\n` +
        `Min income: $${baseCard.minIncome} · Age: ${baseCard.eligibleAges.join("-")} · Employment: ${formatEmploymentList(baseCard.employmentTypes)}\n\n` +
        `**${otherCard.name}** — ${(otherCard.benefits || []).join(", ")}\n` +
        `Min income: $${otherCard.minIncome} · Age: ${otherCard.eligibleAges.join("-")} · Employment: ${formatEmploymentList(otherCard.employmentTypes)}`;

      return NextResponse.json({
        reply,
        slots,
        done: false,
        context: { mode: "learn", learnOptions: { a: baseCard.name, b: otherCard.name } },
        actions: ["learn_A", "learn_B"],
        meta: { learnA: baseCard.name, learnB: otherCard.name },
      });
    }

    /* 4) Learn more → prompt (forgiving regex) */
    if (/\blearn\s+more\b/i.test(message.trim())) {
      context = { mode: "learn", selectedCard: undefined, learnOptions: undefined };
      return NextResponse.json({
        reply: "Which card would you like to learn more about? Reply with the number (1, 2, 3) or the name.",
        slots,
        done: false,
        context,
      });
    }

    /* 5) Learn: user picked two (e.g., "1, 2") */
    if (context.mode === "learn" && /[,]/.test(text)) {
      const tokens = text.split(/[,]/).map((s: string) => s.trim()).filter(Boolean);
      const picks = tokens.slice(0, 2).map(pickCardFromText).filter(Boolean) as typeof cards;
      if (picks.length === 2) {
        const [A, B] = picks;
        const reply =
          `You picked two cards:\n\n` +
          `**${A.name}** — ${(A.benefits || []).join(", ")}\n` +
          `**${B.name}** — ${(B.benefits || []).join(", ")}`;
        return NextResponse.json({
          reply,
          slots,
          done: false,
          context: { mode: "learn", learnOptions: { a: A.name, b: B.name } },
          actions: ["learn_A", "learn_B"],
          meta: { learnA: A.name, learnB: B.name },
        });
      }
    }

    /* 6) Learn_A / Learn_B buttons (PRESERVE learnOptions) */
    if (/^learn[_\s]?a$/i.test(text) || /^learn more about a$/i.test(text)) {
      const name = context.learnOptions?.a;
      const picked = name ? cards.find((c) => c.name === name) : undefined;
      if (picked) {
        // UPDATED: preserve learnOptions
        context = { mode: "learn", selectedCard: picked.name, learnOptions: context.learnOptions };
        return NextResponse.json({
          reply:
            `**${picked.name}** — ${(picked.benefits || []).join(", ")}\n` +
            `Min income: $${picked.minIncome} · Age: ${picked.eligibleAges.join("-")} · Employment: ${formatEmploymentList(picked.employmentTypes)}\n\n` +
            `Let’s check your eligibility.\n` + askFor("age", picked),
          slots,
          done: false,
          context,
          actions: [],
        });
      }
    }
    if (/^learn[_\s]?b$/i.test(text) || /^learn more about b$/i.test(text)) {
      const name = context.learnOptions?.b;
      const picked = name ? cards.find((c) => c.name === name) : undefined;
      if (picked) {
        // UPDATED: preserve learnOptions
        context = { mode: "learn", selectedCard: picked.name, learnOptions: context.learnOptions };
        return NextResponse.json({
          reply:
            `**${picked.name}** — ${(picked.benefits || []).join(", ")}\n` +
            `Min income: $${picked.minIncome} · Age: ${picked.eligibleAges.join("-")} · Employment: ${formatEmploymentList(picked.employmentTypes)}\n\n` +
            `Let’s check your eligibility.\n` + askFor("age", picked),
          slots,
          done: false,
          context,
          actions: [],
        });
      }
    }

    /* 7) Learn: single selection → step-by-step with hints */
    if (context.mode === "learn" && !context.selectedCard) {
      const selected = pickCardFromText(message);
      if (selected) {
        context = { mode: "learn", selectedCard: selected.name, learnOptions: undefined };
        return NextResponse.json({
          reply:
            `**${selected.name}** — ${(selected.benefits || []).join(", ")}\n` +
            `Min income: $${selected.minIncome} · Age: ${selected.eligibleAges.join("-")} · Employment: ${formatEmploymentList(selected.employmentTypes)}\n\n` +
            `Let’s check your eligibility.\n` + askFor("age", selected),
          slots,
          done: false,
          context,
          actions: [],
        });
      }
    }

    /* 8) Learn: step-by-step capture, then eligibility */
    if (context.mode === "learn" && context.selectedCard) {
      const selected = cards.find((c) => c.name === context.selectedCard)!;

      let s = updateSlotsFromMessage(slots, message);
      const missing = nextMissingSlot(s);
      if (missing) {
        return NextResponse.json({
          reply: askFor(missing, selected),
          slots: s,
          done: false,
          context,
          actions: [],
        });
      }
      // Guard: ensure income exists before scoring
      if (s.income == null) {
        return NextResponse.json({
          reply: askFor("income", selected),
          slots: s,
          done: false,
          context,
          actions: [],
        });
      }

      const { score, reasons, failures } = scoreCard(selected as any, s as any);

      if (failures.length === 0 && score >= 3) {
        return NextResponse.json({
          reply: `✅ You’re eligible for the **${selected.name}**.\nWould you like to apply?`,
          slots: s,
          done: false,
          context: {},
          actions: ["apply"],
        });
      }

      const otherName =
        context.learnOptions?.a && context.learnOptions?.a !== selected.name
          ? context.learnOptions.a
          : context.learnOptions?.b && context.learnOptions?.b !== selected.name
          ? context.learnOptions.b
          : "Student Essentials Card";

      return NextResponse.json({
        reply:
          `❌ You are not eligible for the **${selected.name}**.\n\n` +
          (failures.length ? failures.join("\n") : "") +
          `\n\nWould you like to learn about the **${otherName}** or talk to an agent?`,
        slots: s,
        done: false,
        // keep "other" in context so learn_other uses it
        context: { mode: "learn", selectedCard: undefined, learnOptions: { a: otherName, b: otherName } },
        actions: ["learn_other", "talk_agent"],
        meta: { otherCardName: otherName }, // UPDATED: provide label for UI
      });
    }

    /* 9) Apply / Learn other / Talk to Agent */
    if (text === "apply" || /apply now|apply|continue/.test(text)) {
      return NextResponse.json({
        reply: "Great! You can start your application in the app/portal.",
        slots,
        done: true,
        context: {},
      });
    }

    if (text === "learn_other") {
      // Force re-capture: start questions fresh for the new card
      const name = context.learnOptions?.a || context.learnOptions?.b || "Student Essentials Card";
      const picked =
        cards.find((c) => c.name === name) ||
        cards.find((c) => /student essentials/i.test(c.name));

      if (picked) {
        const resetSlots: Slots = { ...slots, age: null, employment: null, income: null };
        return NextResponse.json({
          reply:
            `**${picked.name}** — ${(picked.benefits || []).join(", ")}\n` +
            `Min income: $${picked.minIncome} · Age: ${picked.eligibleAges.join("-")} · Employment: ${formatEmploymentList(picked.employmentTypes)}\n\n` +
            `Let’s check your eligibility.\n` + askFor("age", picked),
          slots: resetSlots,
          done: false,
          context: { mode: "learn", selectedCard: picked.name, learnOptions: undefined },
          actions: [],
        });
      }
    }

    if (text === "talk_agent" || /talk to agent|agent/i.test(text)) {
      const AGENT_PHONE = process.env.AGENT_PHONE || "1-800-XXXX-XXXX";
      return NextResponse.json({
        reply: `Please call us at **${AGENT_PHONE}**.`,
        slots,
        done: true,
        context: {},
      });
    }

    /* 10) Recommend flow */
    if (text.includes("recommend")) {
      const s = updateSlotsFromMessage(slots, message);
      const missing = nextMissingSlot(s);
      if (missing) {
        return NextResponse.json({
          reply: askFor(missing),
          slots: s,
          done: false,
          context: { ...context, mode: "recommend" },
        });
      }
      const engine = runEngine({
        income: Number(s.income),
        age: Number(s.age),
        employment: String(s.employment),
        preference: s.preference ?? null,
        hasCosigner: s.hasCosigner === true,
      } as any);
      // UPDATED: add CTA apply
      const msg = (engine?.message || "Here are your recommendations.") + "\n\nWould you like to apply?";
      return NextResponse.json({
        reply: msg,
        slots: s,
        done: false,
        context: {},
        actions: ["apply"],
      });
    }

    /* 11) Fallback */
    return NextResponse.json({
      reply:
        "I’m here to help with cards. Use the buttons: Recommend a card for me, Learn more, or Compare with another card.",
      slots,
      done: false,
      context,
    });
  } catch (err) {
    console.error("API ERROR:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}

