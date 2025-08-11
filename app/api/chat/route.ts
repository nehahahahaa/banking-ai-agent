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
  avoidCard?: string; // remember last failing card in recommend flow
};

// ---------------- Helpers ----------------

// Remove “self-employed” everywhere (aliases pruned)
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

// Accepts k/m suffixes, money cues, and bare numbers (>=100) as income
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

  // Bare number fallback for income (avoid ages like 18/22)
  const bare = text.match(/^\d+(?:\.\d+)?$/);
  if (bare) {
    const val = Number(bare[0]);
    if (!Number.isNaN(val) && val >= 100) return val;
  }

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

// capture order for LEARN/RECOMMEND: income → age → employment → cosigner (if needed)
function nextMissingSlot(
  slots: Slots,
  _selected?: { minIncome: number; eligibleAges: [number, number]; employmentTypes: string[] }
): keyof Slots | null {
  if (slots.income == null) return "income";
  if (slots.age == null) return "age";
  if (slots.employment == null || slots.employment === "") return "employment";

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

// askFor (employment branch puts Hint: on its own line so UI shows chip)
function askFor(
  slot: keyof Slots,
  card?: { name: string; minIncome: number; eligibleAges: [number, number]; employmentTypes: string[] }
): string {
  if (slot === "income") {
    const hint = card ? ` Hint: minimum $${card.minIncome}.` : "";
    return `What is your monthly income (USD)?${hint}`;
  }
  if (slot === "age") {
    const hint = card ? ` Hint: ${card.name} requires age ${card.eligibleAges[0]}–${card.eligibleAges[1]}.` : "";
    return `What is your age?${hint}`;
  }
  if (slot === "employment") {
    const arr = (card?.employmentTypes || ["salaried", "student", "retired"]).filter(
      (t) => t.toLowerCase() !== "self-employed"
    );
    const hint = arr.length === 1 ? arr[0] : arr.join(", ");
    return `What is your employment type?\nHint: ${hint}`;
  }
  if (slot === "hasCosigner") return "Do you have a qualified cosigner? (yes/no)";
  return "Tell me your preference (e.g., travel, cashback).";
}

// ---- UPDATED: do not parse age from the same message that set income unless there's an explicit age cue
function updateSlotsFromMessage(slots: Slots, message: string): Slots {
  const t = message.toLowerCase();
  const s: Slots = { ...slots };

  // Track if this message set income
  let justSetIncome = false;

  // Income first
  if (s.income == null) {
    const income = parseIncomeFromText(t);
    if (income != null) {
      s.income = income;
      justSetIncome = true;
    }
  }

  // Age (<=120) — don't read age from the same message that set income,
  // unless there is an explicit age cue.
  if (s.age == null && (!justSetIncome || /\bage\b|\byears?\b/.test(t))) {
    const n = extractNumber(t);
    if (n != null && n >= 0 && n <= 120) s.age = n;
  }

  // Employment
  if (s.employment == null || s.employment === "") {
    const emp = normalizeEmployment(t);
    if (emp) s.employment = emp;
  }

  // Cosigner
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

// ---------- pickCardFromText with "learn (more) about" stripping ----------
function pickCardFromText(text: string) {
  // NEW: strip "learn (more) about"
  let t = text.trim().toLowerCase().replace(/^learn(\s+more)?\s+about\s+/, "");
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

// formatEmploymentList filters out “self-employed”
function formatEmploymentList(list: string[] = []) {
  return list.filter((t) => t.toLowerCase() !== "self-employed").join(", ");
}

function formatIntro() {
  const lines = cards.slice(0, 3).map((c, i) => {
    const perks = (c.benefits || []).join(", ");
    return `${i + 1}. ${c.name} — ${perks || "Standard benefits"}`;
  });
  return ["I can help you find the right card. Here are your options:", ...lines].join("\n");
}

// Try to infer a card name from engine output or fields
function inferRecommendedCardName(engine: any, message: string): string | null {
  const direct = engine?.bestCard?.name || engine?.bestCard || engine?.card || engine?.cardName || null;
  if (typeof direct === "string" && direct.trim()) return direct;

  const lower = (message || "").toLowerCase();
  for (const c of cards) {
    if (lower.includes(c.name.toLowerCase())) return c.name;
  }
  return null;
}

// build clear failure reasons even if scoreCard didn't return them
function computeFailuresFallback(
  card: { name: string; minIncome: number; eligibleAges: [number, number]; employmentTypes: string[] },
  s: Slots,
  res: { failures?: string[] }
): string[] {
  const out = new Set<string>();
  (res.failures || []).forEach((f) => out.add(f));

  if (typeof s.income === "number" && s.income < card.minIncome) {
    out.add("✗ Income below minimum requirement");
  }

  const [minA, maxA] = card.eligibleAges || [0, 999];
  if (typeof s.age === "number" && !(s.age >= minA && s.age <= maxA)) {
    out.add("✗ Age not within eligible range");
  }

  if (s.employment && !card.employmentTypes.includes(String(s.employment))) {
    out.add("✗ Employment type not eligible");
  }

  if (
    s.employment === "student" &&
    typeof s.age === "number" &&
    s.age >= 18 &&
    s.age <= 25 &&
    typeof s.income === "number" &&
    s.income > 5000 &&
    s.hasCosigner !== true
  ) {
    out.add("✗ For student income above $5,000, a cosigner is required to be eligible.");
  }

  return Array.from(out);
}

// ---------------- Route ----------------

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const message: string = body?.message ?? "";
    const incomingSlots: Slots = body?.slots ?? {};
    const firstTurn: boolean = !!body?.firstTurn;
    const incomingContext: Ctx = body?.context ?? {};
    const text = (message || "").toLowerCase();

    // normalize incoming "zeros"/empties to null-ish
    const slots: Slots = {
      income: incomingSlots?.income ?? null,
      age: incomingSlots?.age ?? null,
      employment: incomingSlots?.employment ?? null,
      preference: incomingSlots?.preference ?? null,
      hasCosigner: incomingSlots?.hasCosigner ?? null,
    };
    let context: Ctx = { ...incomingContext };

    // First turn intro
    if (firstTurn) {
      return NextResponse.json({
        reply: formatIntro(),
        slots,
        done: false,
        context: {},
        actions: ["recommend", "learn", "compare"],
      });
    }

    // Bare compare → prompt
    if (/^compare$/.test(text.trim())) {
      const list = cards
        .slice(0, 3)
        .map((c, i) => `${i + 1}. ${c.name}`)
        .join("\n");
      return NextResponse.json({
        reply:
          `Which two cards would you like to compare?\n` +
          `Reply like "1, 2" or "Professional Plus vs Student Essentials".\n\n${list}\n` +
          `Hint: Reply "1, 2" or "A vs B".`,
        slots,
        done: false,
        context: { mode: "learn" },
        actions: ["recommend", "learn"],
      });
    }

    // Compare A vs B
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
          context,
          actions: ["recommend", "learn"],
        });
      }

      const s = updateSlotsFromMessage(slots, message);
      const resultA = scoreCard(cardA as any, s as any);
      const resultB = scoreCard(cardB as any, s as any);

      const left = (resultA.reasons?.length ? resultA.reasons.join("; ") : resultA.failures?.join("; ")) || "—";
      const right = (resultB.reasons?.length ? resultB.reasons.join("; ") : resultB.failures?.join("; ")) || "—";

      const reply = [`⚖️ Comparison for your profile:`, `- **${cardA.name}**: ${left}`, `- **${cardB.name}**: ${right}`].join(
        "\n"
      );

      return NextResponse.json({
        reply,
        slots: s,
        done: false,
        context: { mode: "learn", learnOptions: { a: cardA.name, b: cardB.name } },
        actions: [`Learn more about ${cardA.name}`, `Learn more about ${cardB.name}`], // human-readable
      });
    }

    // Two-pick learn: "1, 2"
    const twoPick = text.match(/^\s*([1-3])\s*,\s*([1-3])\s*$/);
    if (twoPick) {
      const A = cards[Number(twoPick[1]) - 1];
      const B = cards[Number(twoPick[2]) - 1];
      if (!A || !B) {
        return NextResponse.json({
          reply: "Please choose valid numbers between 1–3.",
          slots,
          done: false,
          context,
          actions: ["recommend", "learn"],
        });
      }
      return NextResponse.json({
        reply:
          `Here’s a quick look at both:\n\n` +
          `**${A.name}** — ${(A.benefits || []).join(", ") || "Standard benefits"}\n` +
          `**${B.name}** — ${(B.benefits || []).join(", ") || "Standard benefits"}`,
        slots,
        done: false,
        context: { mode: "learn", learnOptions: { a: A.name, b: B.name } },
        actions: [`Learn more about ${A.name}`, `Learn more about ${B.name}`], // human-readable
      });
    }

    // Learn selection by number or name (single) — reset capture, ask INCOME first
    const picked = pickCardFromText(message);
    if (picked && context.mode === "learn" && !context.selectedCard) {
      const resetSlots: Slots = {
        ...slots,
        income: null,
        age: null,
        employment: null,
        hasCosigner: null,
      };
      return NextResponse.json({
        reply:
          `**${picked.name}** — ${(picked.benefits || []).join(", ") || "Standard benefits"}\n` +
          `Min income: $${picked.minIncome}\n` +
          `Age: ${picked.eligibleAges.join("-")}\n` +
          `Employment: ${formatEmploymentList(picked.employmentTypes)}\n\n` +
          `Let’s check your eligibility.\n` +
          askFor("income", picked),
        slots: resetSlots,
        done: false,
        context: { mode: "learn", selectedCard: picked.name, learnOptions: context.learnOptions },
        actions: [],
      });
    }

    // Learn entry: accept ONLY bare "learn" / "learn more" (anchored)
    if (/^\s*learn(\s+more)?\s*$/i.test(message)) {
      return NextResponse.json({
        reply: "Which card would you like to learn more about? Reply with the number (1, 2, 3) or the name.",
        slots,
        done: false,
        context: { mode: "learn" },
        actions: ["recommend", "learn"],
      });
    }

    // learn_A / learn_B explicit buttons — reset capture, ask INCOME first (fallback support)
    if (context.mode === "learn" && (text === "learn_a" || text === "learn_b")) {
      const nm = text === "learn_a" ? context.learnOptions?.a : context.learnOptions?.b;
      const pickedBtn = cards.find((c) => c.name === nm) || cards[0];

      const resetSlots: Slots = {
        ...slots,
        income: null,
        age: null,
        employment: null,
        hasCosigner: null,
      };

      return NextResponse.json({
        reply:
          `**${pickedBtn.name}** — ${(pickedBtn.benefits || []).join(", ") || "Standard benefits"}\n` +
          `Min income: $${pickedBtn.minIncome}\n` +
          `Age: ${pickedBtn.eligibleAges.join("-")}\n` +
          `Employment: ${formatEmploymentList(pickedBtn.employmentTypes)}\n\n` +
          `Let’s check your eligibility.\n` +
          askFor("income", pickedBtn),
        slots: resetSlots,
        done: false,
        context: { mode: "learn", selectedCard: pickedBtn.name, learnOptions: context.learnOptions },
        actions: [],
      });
    }

    // learn_other — reset capture (including cosigner), ask INCOME first (legacy fallback)
    if (text === "learn_other") {
      const otherName =
        (context.learnOptions &&
          [context.learnOptions.a, context.learnOptions.b].find((nm) => nm && nm !== context.selectedCard)) ||
        "Student Essentials Card";
      const pickedOther = cards.find((c) => c.name === otherName) || cards[1] || cards[0];
      const resetSlots: Slots = {
        ...slots,
        income: null,
        age: null,
        employment: null,
        hasCosigner: null,
      };
      return NextResponse.json({
        reply:
          `**${pickedOther.name}** — ${(pickedOther.benefits || []).join(", ") || "Standard benefits"}\n` +
          `Min income: $${pickedOther.minIncome}\n` +
          `Age: ${pickedOther.eligibleAges.join("-")}\n` +
          `Employment: ${formatEmploymentList(pickedOther.employmentTypes)}\n\n` +
          `Let’s check your eligibility.\n` +
          askFor("income", pickedOther),
        slots: resetSlots,
        done: false,
        context: { mode: "learn", selectedCard: pickedOther.name, learnOptions: context.learnOptions },
        actions: [],
      });
    }

    // ----- LEARN STEP (income → age → employment → cosigner); score once after all captured
    if (context.mode === "learn" && context.selectedCard) {
      const selected = cards.find((c) => c.name === context.selectedCard) || cards[0];
      const s = updateSlotsFromMessage(slots, message);

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

      // All captured → score ONCE
      const res = scoreCard(selected as any, {
        income: Number(s.income),
        age: Number(s.age),
        employment: String(s.employment),
        preference: s.preference ?? null,
        hasCosigner: s.hasCosigner === true,
      } as any);

      // Safety-net reasons + eligibility decision
      const failures = computeFailuresFallback(selected, s, res);
      if (failures.length === 0 && (typeof (res as any).score === "number" ? (res as any).score >= 3 : true)) {
        return NextResponse.json({
          reply: `✅ You’re eligible for the **${selected.name}**.\nHint: Click the Apply button below.`,
          slots: s,
          done: false,
          context: {},
          actions: ["apply"],
        });
      }

      // NOT ELIGIBLE → show reasons + let user pick another card (no Student default)
      const list = cards
        .slice(0, 3)
        .map((c, i) => `${i + 1}. ${c.name}`)
        .join("\n");

      return NextResponse.json({
        reply:
          `❌ You are not eligible for the **${selected.name}**.\n` +
          failures.join("\n") +
          `\n\nWould you like to learn about another card? Reply with the number (1, 2, 3) or the card name:\n${list}`,
        slots: s,
        done: false,
        context: { mode: "learn", selectedCard: undefined },
        actions: ["learn", "talk_agent"],
        meta: {},
      });
    }

    // ----- APPLY (move above RECOMMEND) -----
    if (text === "apply") {
      return NextResponse.json({
        reply: "Great! You can start your application in the app/portal.",
        slots,
        done: true,
        context: {},
        actions: [],
      });
    }

    // ----- TALK TO AGENT (move above RECOMMEND) -----
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

    // ----- RECOMMEND FLOW (with CTAs) -----
    if (/^\s*recommend(ed)?\b/i.test(text) || (context.mode === "recommend" && text !== "talk_agent" && text !== "apply")) {
      const s = updateSlotsFromMessage(slots, message);
      const missing = nextMissingSlot(s);
      if (missing) {
        return NextResponse.json({
          reply: askFor(missing),
          slots: s,
          done: false,
          context: { ...context, mode: "recommend" },
          actions: [],
        });
      }

      // If we were asked to recommend again, avoid the last failing card and try an eligible alternative first
      if (context.avoidCard) {
        const ranked = cards
          .filter((c) => c.name !== context.avoidCard) // exclude last failing card
          .map((c) => ({ c, r: scoreCard(c as any, s as any) }))
          .sort((a, b) => (b.r?.score ?? 0) - (a.r?.score ?? 0));

        // Prefer the first card with no failures
        const candidate = ranked.find(({ c, r }) => computeFailuresFallback(c, s, r).length === 0);

        if (candidate) {
          const chosen = candidate.c;
          return NextResponse.json({
            reply: `Based on your inputs, you may be eligible for the **${chosen.name}**.\n\nHint: Click the Apply button below.`,
            slots: s,
            done: false,
            context: {}, // clear the avoid flag on success
            actions: ["apply"],
          });
        }
        // else: fall through to engine for messaging with reasons
      }

      const engine: any = runEngine({
        income: Number(s.income),
        age: Number(s.age),
        employment: String(s.employment),
        preference: s.preference ?? null,
        hasCosigner: s.hasCosigner === true,
      } as any);

      // tighten eligibility detection (avoid "to become eligible" / "not eligible")
      const msg = String(engine?.message || "");
      const eligible =
        engine?.eligible === true ||
        engine?.anyEligible === true ||
        (/\beligible\b/i.test(msg) &&
          !/\bnot\s+eligible\b/i.test(msg) &&
          !/\bbecome\s+eligible\b/i.test(msg) &&
          !/\bineligible\b/i.test(msg));

      if (eligible) {
        return NextResponse.json({
          reply: `${msg.replace(/\s*Would you like to apply\?\s*$/i, "")}\n\nHint: Click the Apply button below.`,
          slots: s,
          done: false,
          context: {},
          actions: ["apply"],
        });
      }

      // ---- NOT ELIGIBLE -> append concrete reasons before we reply ----
      let replyText = msg || "Here are your recommendations.";

      // Try to infer which card the engine is talking about
      let targetCard = cards.find((c) => c.name === inferRecommendedCardName(engine, replyText)) || null;

      // If we can't infer, pick the best-scoring card for this user
      const ranked = cards
        .map((c) => ({ c, r: scoreCard(c as any, s as any) }))
        .sort((a, b) => (b.r?.score ?? 0) - (a.r?.score ?? 0));
      if (!targetCard) targetCard = ranked[0]?.c || null;

      // Append fallback failure reasons (e.g., student needs cosigner)
      if (targetCard) {
        const res2 = scoreCard(targetCard as any, s as any);
        const fails = computeFailuresFallback(targetCard, s, res2);
        if (fails.length) replyText += `\n` + fails.join("\n");
      }

      // 👉 If user clicks "Recommend" again, avoid recommending the same failing card
      return NextResponse.json({
        reply: `${replyText}\n\nWould you like me to recommend another card or talk to an agent?`,
        slots: s,
        done: false,
        context: { mode: "recommend", avoidCard: targetCard?.name || undefined },
        actions: ["recommend", "talk_agent"], // right CTAs
      });
    }

    // Fallback
    return NextResponse.json({
      reply: "I’m here to help with cards. Try: “recommend”, “learn”, or “compare”.",
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
