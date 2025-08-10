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
  // store two-card choices for follow-up Learn buttons (from compare OR "1, 2" selection)
  learnOptions?: { a: string; b: string };
};

/* ========= Helpers ========= */
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

// robust income parser: cues + k/m suffix; avoids confusing age with income
function parseIncomeFromText(t: string): number | null {
  const text = t.toLowerCase().replace(/[,]/g, "").trim();

  // 5k / 0.9m
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

/** slot order per spec: age → employment → income → (cosigner if student) */
function nextMissingSlot(slots: Slots): keyof Slots | null {
  if (slots.age == null) return "age";
  if (slots.employment == null || slots.employment === "") return "employment";
  if (slots.income == null) return "income";
  // student cosigner rule
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

/** Hinted prompts (card-aware). The word "Hint" per your request. */
function askFor(slot: keyof Slots, card?: { name: string; minIncome: number; eligibleAges: [number, number]; employmentTypes: string[] }): string {
  const name = card?.name || "this card";
  if (slot === "age") {
    const [minA, maxA] = card?.eligibleAges || [18, 99];
    return `What is your age?\nHint: ${name} requires ${minA}–${maxA}.`;
  }
  if (slot === "employment") {
    const allowed = card?.employmentTypes?.join(", ") || "salaried, self-employed, student, retired";
    const hrHint = card?.employmentTypes?.includes("salaried") ? " Hint: choose salaried." : "";
    return `What is your employment type? (${allowed})${hrHint}`;
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

  // Age
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
  // Cosigner rule
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
  // Preference
  if (s.preference == null) {
    const pref = detectPreference(t);
    if (pref) s.preference = pref;
  }

  return s;
}

/** Numbered intro + only 3 actions on first message */
function formatIntro() {
  const list = cards.slice(0, 3).map((c, i) => {
    const perks = (c.benefits || []).join(", ");
    return `${i + 1}. ${c.name} — ${perks || "Standard benefits"}`;
  });
  return ["I can help you find the right card. Here are your options:", ...list].join("\n\n");
}

/** Resolve card by number (1–3), "card 2", or (partial) name */
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

    const slots: Slots = {
      income: incomingSlots?.income ?? null,
      age: incomingSlots?.age ?? null,
      employment: incomingSlots?.employment ?? null,
      preference: incomingSlots?.preference ?? null,
      hasCosigner: incomingSlots?.hasCosigner ?? null,
    };

    let context: Context = incomingCtx || {};

    /* 1) Intro ALWAYS on first turn — 3 buttons only */
    if (firstTurn) {
      return NextResponse.json({
        reply: formatIntro(),
        slots,
        done: false,
        context,
        actions: ["recommend", "learn", "compare"], // exactly 3
      });
    }

    /* 2) COMPARE: "compare A vs B" (numbers or names). After compare → ONLY two Learn buttons */
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

      // Side-by-side snapshot (no “best/equal” claims)
      const reply =
        `**${cardA.name}** — ${(cardA.benefits || []).join(", ")}\n` +
        `Min income: $${cardA.minIncome} · Age: ${cardA.eligibleAges.join("-")} · Employment: ${cardA.employmentTypes.join(", ")}\n\n` +
        `**${cardB.name}** — ${(cardB.benefits || []).join(", ")}\n` +
        `Min income: $${cardB.minIncome} · Age: ${cardB.eligibleAges.join("-")} · Employment: ${cardB.employmentTypes.join(", ")}`;

      return NextResponse.json({
        reply,
        slots,
        done: false,
        context: { mode: "learn", learnOptions: { a: cardA.name, b: cardB.name } }, // prepare learn buttons
        actions: ["learn_A", "learn_B"], // only two buttons
      });
    }

    /* 3) COMPARE: "compare with <card>" after a Learn More selection → only two Learn buttons */
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
        `Min income: $${baseCard.minIncome} · Age: ${baseCard.eligibleAges.join("-")} · Employment: ${baseCard.employmentTypes.join(", ")}\n\n` +
        `**${otherCard.name}** — ${(otherCard.benefits || []).join(", ")}\n` +
        `Min income: $${otherCard.minIncome} · Age: ${otherCard.eligibleAges.join("-")} · Employment: ${otherCard.employmentTypes.join(", ")}`;

      return NextResponse.json({
        reply,
        slots,
        done: false,
        context: { mode: "learn", learnOptions: { a: baseCard.name, b: otherCard.name } },
        actions: ["learn_A", "learn_B"],
      });
    }

    /* 4) LEARN MORE: prompt to choose a card (single or two) */
    if (/learn more/.test(text)) {
      context = { mode: "learn", selectedCard: undefined, learnOptions: undefined };
      return NextResponse.json({
        reply: "Which card would you like to learn more about? Reply with the number (1, 2, 3) or the name.",
        slots,
        done: false,
        context,
      });
    }

    /* 5) LEARN MORE: user picks two at once e.g., "1, 2" → show two Learn buttons only */
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
        });
      }
    }

    /* 6) Handle the two Learn buttons after compare or two-pick selection */
    if (/^learn[_\s]?a$/i.test(text) || /^learn more about a$/i.test(text)) {
      const name = context.learnOptions?.a;
      const picked = name ? cards.find(c => c.name === name) : undefined;
      if (picked) {
        context = { mode: "learn", selectedCard: picked.name, learnOptions: undefined };
        return NextResponse.json({
          reply:
            `**${picked.name}** — ${(picked.benefits || []).join(", ")}\n` +
            `Min income: $${picked.minIncome} · Age: ${picked.eligibleAges.join("-")} · Employment: ${picked.employmentTypes.join(", ")}\n\n` +
            `Let’s check your eligibility.\n` + askFor("age", picked),
          slots,
          done: false,
          context,
          actions: [], // step-by-step questions, no extra buttons
        });
      }
    }
    if (/^learn[_\s]?b$/i.test(text) || /^learn more about b$/i.test(text)) {
      const name = context.learnOptions?.b;
      const picked = name ? cards.find(c => c.name === name) : undefined;
      if (picked) {
        context = { mode: "learn", selectedCard: picked.name, learnOptions: undefined };
        return NextResponse.json({
          reply:
            `**${picked.name}** — ${(picked.benefits || []).join(", ")}\n` +
            `Min income: $${picked.minIncome} · Age: ${picked.eligibleAges.join("-")} · Employment: ${picked.employmentTypes.join(", ")}\n\n` +
            `Let’s check your eligibility.\n` + askFor("age", picked),
          slots,
          done: false,
          context,
          actions: [],
        });
      }
    }

    /* 7) LEARN MORE: single selection (number or name) → start hinted step-by-step */
    if (context.mode === "learn" && !context.selectedCard) {
      const selected = pickCardFromText(message);
      if (selected) {
        context = { mode: "learn", selectedCard: selected.name, learnOptions: undefined };
        return NextResponse.json({
          reply:
            `**${selected.name}** — ${(selected.benefits || []).join(", ")}\n` +
            `Min income: $${selected.minIncome} · Age: ${selected.eligibleAges.join("-")} · Employment: ${selected.employmentTypes.join(", ")}\n\n` +
            `Let’s check your eligibility.\n` + askFor("age", selected),
          slots,
          done: false,
          context,
          actions: [],
        });
      }
    }

    /* 8) LEARN MORE: step-by-step slot filling with hints, then immediate eligibility */
    if (context.mode === "learn" && context.selectedCard) {
      const selected = cards.find(c => c.name === context.selectedCard)!;

      // incorporate any inline info from this turn (age/employment/income)
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

      // All present → score THIS card now
      const { score, reasons, failures } = scoreCard(selected as any, s as any);

      if (failures.length === 0 && score >= 3) {
        return NextResponse.json({
          reply: `✅ You’re eligible for the **${selected.name}**.\nWould you like to apply?`,
          slots: s,
          done: false,
          context: {}, // clear mode after decision
          actions: ["apply"], // single Apply button
        });
      }

      // Not eligible → offer learn-other (smart default) or talk to agent
      // Prefer other card if there was a previous two-card context; else suggest Student Essentials
      const otherName =
        context.learnOptions?.a && context.learnOptions?.a !== selected.name
          ? context.learnOptions.a
          : context.learnOptions?.b && context.learnOptions?.b !== selected.name
          ? context.learnOptions.b
          : "Student Essentials Card";

      const AGENT_PHONE = process.env.AGENT_PHONE || "1-800-XXXX-XXXX";
      return NextResponse.json({
        reply:
          `❌ You are not eligible for the **${selected.name}**.\n\n` +
          (failures.length ? failures.join("\n") : "") +
          `\n\nWould you like to learn about the **${otherName}** or talk to an agent?`,
        slots: s,
        done: false,
        context: {}, // clear mode
        actions: ["learn_other", "talk_agent"],
        tip: `📞 Please call us at ${AGENT_PHONE}.`,
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
      const name =
        context.learnOptions?.a || context.learnOptions?.b || "Student Essentials Card";
      const picked = cards.find(c => c.name === name) ||
        cards.find(c => /student essentials/i.test(c.name));
      if (picked) {
        return NextResponse.json({
          reply:
            `**${picked.name}** — ${(picked.benefits || []).join(", ")}\n` +
            `Min income: $${picked.minIncome} · Age: ${picked.eligibleAges.join("-")} · Employment: ${picked.employmentTypes.join(", ")}\n\n` +
            `Let’s check your eligibility.\n` + askFor("age", picked),
          slots,
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

    /* 10) Recommend flow (kept intact; not the MVP focus but still works) */
    if (text.includes("recommend")) {
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
      // Keep your existing engine rendering on client side; here we just return message
      return NextResponse.json({
        reply: engine?.message || "Here are your recommendations.",
        slots: s,
        done: true,
        context: {},
      });
    }

    /* 11) Fallback */
    return NextResponse.json({
      reply: "I’m here to help with cards. Use the buttons: Recommend a card for me, Learn more, or Compare with another card.",
      slots,
      done: false,
      context,
    });
  } catch (err) {
    console.error("API ERROR:", err);
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
