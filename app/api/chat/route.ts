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
  mode?:
    | "learn"
    | "compare"
    | "compare_post"     // after compare result, awaiting learn-more choice
    | "learn_one_shot"   // collect age+employment+income in one go for selected card
    | "recommend";
  selectedCard?: string;
  compare?: { a: string; b: string };
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

function askFor(slot: keyof Slots): string {
  switch (slot) {
    case "age": return "What is your age?";
    case "employment": return "What is your employment type? (salaried, self-employed, student, retired)";
    case "income": return "What is your monthly income (USD)?";
    case "hasCosigner": return "Do you have a qualified cosigner? (yes/no)";
    default: return "Tell me about your preference (e.g., travel, cashback, no annual fee).";
  }
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

/** Numbered intro + (your UI shows buttons from actions[]) */
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

function renderEngineReply(engine: any): string {
  if (engine?.type === "full-match") return `🧠 Builds trust by showing logic clearly\n${engine.message}`;
  if (engine?.type === "multiple-match") return `🟢 Transparent + ranked choices\n${engine.message}`;
  if (engine?.type === "partial-match") {
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
  return engine?.message || "❌ No card matches your inputs right now.";
}

/* ========= Route ========= */
export async function POST(req: NextRequest) {
  try {
    const { message, slots: incomingSlots, firstTurn, context: incomingCtx } = await req.json();
    const text = String(message || "").toLowerCase();

    const slots: Slots = {
      income: incomingSlots?.income ?? null,
      age: incomingSlots?.age ?? null,
      employment: incomingSlots?.employment ?? null,
      preference: incomingSlots?.preference ?? null,
      hasCosigner: incomingSlots?.hasCosigner ?? null,
    };

    let context: Context = incomingCtx || {};

    /* 1) Intro ALWAYS on first turn */
    if (firstTurn) {
      return NextResponse.json({
        reply: formatIntro(),
        slots,
        done: false,
        context,
        actions: ["recommend", "learn", "compare"], // UI renders these buttons
      });
    }

    /* 2) PERSISTED COMPARE: if we asked for a missing slot, resume compare after we capture it */
    if (context.mode === "compare" && context.compare?.a && context.compare?.b) {
      const s = updateSlotsFromMessage(slots, message);
      const missing = nextMissingSlot(s);
      if (missing) {
        return NextResponse.json({ reply: askFor(missing), slots: s, done: false, context });
      }
      const cardA = cards.find((c) => c.name === context.compare!.a)!;
      const cardB = cards.find((c) => c.name === context.compare!.b)!;

      // Side-by-side snapshot (no eligibility claims here)
      const reply = [
        `⚖️ Comparison:`,
        `• ${cardA.name} — ${(cardA.benefits || []).join(", ")}`,
        `  Min income: $${cardA.minIncome} · Age: ${cardA.eligibleAges.join("-")} · Employment: ${cardA.employmentTypes.join(", ")}`,
        `• ${cardB.name} — ${(cardB.benefits || []).join(", ")}`,
        `  Min income: $${cardB.minIncome} · Age: ${cardB.eligibleAges.join("-")} · Employment: ${cardB.employmentTypes.join(", ")}`,
        ``,
        `What next?`,
        `[Learn more about ${cardA.name}] [Learn more about ${cardB.name}]`,
      ].join("\n");

      return NextResponse.json({
        reply,
        slots: s,
        done: false,
        context: { mode: "compare_post", compare: { a: cardA.name, b: cardB.name } }, // await one-shot learn-more pick
        actions: ["learn_A", "learn_B"], // UI can map to labels above
      });
    }

    /* 3) COMPARE: "compare A vs B" (numbers or names) */
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

      const s = updateSlotsFromMessage(slots, message);
      const missing = nextMissingSlot(s);
      if (missing) {
        context = { mode: "compare", compare: { a: cardA.name, b: cardB.name } }; // persist intent
        return NextResponse.json({ reply: askFor(missing), slots: s, done: false, context });
      }

      // Side-by-side snapshot (no eligibility claims here)
      const reply = [
        `⚖️ Comparison:`,
        `• ${cardA.name} — ${(cardA.benefits || []).join(", ")}`,
        `  Min income: $${cardA.minIncome} · Age: ${cardA.eligibleAges.join("-")} · Employment: ${cardA.employmentTypes.join(", ")}`,
        `• ${cardB.name} — ${(cardB.benefits || []).join(", ")}`,
        `  Min income: $${cardB.minIncome} · Age: ${cardB.eligibleAges.join("-")} · Employment: ${cardB.employmentTypes.join(", ")}`,
        ``,
        `What next?`,
        `[Learn more about ${cardA.name}] [Learn more about ${cardB.name}]`,
      ].join("\n");

      return NextResponse.json({
        reply,
        slots: s,
        done: false,
        context: { mode: "compare_post", compare: { a: cardA.name, b: cardB.name } },
        actions: ["learn_A", "learn_B"],
      });
    }

    /* 4) COMPARE: "compare with <card>" (button text from UI after Learn More) */
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

      const s = updateSlotsFromMessage(slots, message);
      const missing = nextMissingSlot(s);
      if (missing) {
        context = { mode: "compare", compare: { a: baseCard.name, b: otherCard.name } };
        return NextResponse.json({ reply: askFor(missing), slots: s, done: false, context });
      }

      // Side-by-side snapshot only
      const reply = [
        `⚖️ Comparison:`,
        `• ${baseCard.name} — ${(baseCard.benefits || []).join(", ")}`,
        `  Min income: $${baseCard.minIncome} · Age: ${baseCard.eligibleAges.join("-")} · Employment: ${baseCard.employmentTypes.join(", ")}`,
        `• ${otherCard.name} — ${(otherCard.benefits || []).join(", ")}`,
        `  Min income: $${otherCard.minIncome} · Age: ${otherCard.eligibleAges.join("-")} · Employment: ${otherCard.employmentTypes.join(", ")}`,
        ``,
        `What next?`,
        `[Learn more about ${baseCard.name}] [Learn more about ${otherCard.name}]`,
      ].join("\n");

      return NextResponse.json({
        reply,
        slots: s,
        done: false,
        context: { mode: "compare_post", compare: { a: baseCard.name, b: otherCard.name } },
        actions: ["learn_A", "learn_B"],
      });
    }

    /* 5) AFTER COMPARE: learn-more selection → switch to one-shot capture */
    if (context.mode === "compare_post" && context.compare?.a && context.compare?.b) {
      // e.g., "learn more about Professional Plus" or just "learn Professional Plus"
      const learnSel =
        text.match(/learn(?:\s+more)?\s+about\s+(.+)/i)?.[1] ??
        text.match(/^learn(?:\s+more)?\s+(.+)/i)?.[1];

      if (learnSel) {
        const picked =
          pickCardFromText(learnSel) ||
          [context.compare.a, context.compare.b].map(n => cards.find(c => c.name === n)).find(Boolean);

        if (picked) {
          context = { mode: "learn_one_shot", selectedCard: picked.name };
          return NextResponse.json({
            reply:
              `Great — **${picked.name}**.\n` +
              `Please reply with your **age**, **employment type** (salaried, self-employed, student, retired), and **monthly income (USD)**.\n\n` +
              `Example: "Age 30, salaried, $8,000"`,
            slots,
            done: false,
            context,
            actions: [], // no extra buttons at this prompt
          });
        }
      }
    }

    /* 6) ONE-SHOT ELIGIBILITY for the selected card (age + employment + income in one turn) */
    if (context.mode === "learn_one_shot" && context.selectedCard) {
      let s = { ...slots };

      // Parse all three from a single user reply
      const ageInline = (() => {
        const m = message.match(/\bage\s*:?\.?\s*(\d{1,2})\b/i) || message.match(/\b(\d{1,2})\s*(years|yrs|yo)\b/i) || message.match(/\b(\d{1,2})\b/);
        return m ? Number(m[1]) : undefined;
      })();
      const empInline = normalizeEmployment(message);
      const incInline = parseIncomeFromText(message);

      if (typeof ageInline === "number") s.age = ageInline;
      if (empInline) s.employment = empInline;
      if (typeof incInline === "number") s.income = incInline;

      // If still missing, ask for the missing piece (keep it simple: one question at a time)
      const missing = nextMissingSlot(s);
      if (missing) {
        return NextResponse.json({
          reply: askFor(missing),
          slots: s,
          done: false,
          context, // still in learn_one_shot
        });
      }

      // All present → score the selected card
      const selected = cards.find((c) => c.name === context.selectedCard)!;
      const { score, reasons, failures } = scoreCard(selected as any, s as any);

      if (failures.length === 0 && score >= 3) {
        return NextResponse.json({
          reply: `✅ You’re eligible for **${selected.name}**. Apply now?`,
          slots: s,
          done: false,
          context, // keep context until user applies or leaves
          actions: ["apply"],
        });
      } else {
        // Offer student card or agent if not eligible
        const studentCard = cards.find(c => /student/i.test(c.name));
        const learnAlt =
          selected.name.toLowerCase().includes("student")
            ? "" // already on student; no alt student button
            : studentCard
            ? ` [Learn about ${studentCard.name}]`
            : "";

        const agentLine = ` [Talk to Agent]`;
        const body =
          `❌ You’re not eligible for **${selected.name}**.\n\n` +
          (failures.length ? failures.join("\n") : "") +
          (reasons.length ? `\n\n${reasons.join("\n")}` : "");

        return NextResponse.json({
          reply: `${body}\n\nWould you like to explore an alternative or talk to an agent?${learnAlt}${agentLine}`,
          slots: s,
          done: false,
          context,
          actions: [
            ...(learnAlt ? ["learn_student"] as const : []),
            "agent",
          ],
        });
      }
    }

    /* 7) AGENT handoff (simple) */
    if (/\btalk to agent\b|\bagent\b/.test(text)) {
      return NextResponse.json({
        reply: "Connecting you to an agent. Please call our toll-free number: **1-800-555-1234**.",
        slots,
        done: true,
        context: {},
        actions: [],
      });
    }

    /* 8) LEARN MORE (original flow still supported) */
    if (/learn more/.test(text)) {
      context = { mode: "learn" };
      return NextResponse.json({
        reply: "Which card would you like to learn more about? Reply with the number (1, 2, 3) or the name.",
        slots,
        done: false,
        context,
      });
    }

    if (context.mode === "learn" || /(details|about)\b/.test(text) || /^[1-3]$/.test(text)) {
      if (!context.selectedCard) {
        const selected = pickCardFromText(message);
        if (selected) {
          context.selectedCard = selected.name;

          const details =
            `${selected.name} — ${(selected.benefits || []).join(", ")}\n` +
            `Min income: $${selected.minIncome}\n` +
            `Age: ${selected.eligibleAges.join("-")}\n` +
            `Employment: ${selected.employmentTypes.join(", ")}`;

          const tip =
            "💡 Tip: You can also ask:\n" +
            `• \"Compare with Student Essentials\"\n` +
            `• \"Am I eligible with $8,000 income and age 30?\"\n` +
            `• \"Apply now\"`;

          return NextResponse.json({
            reply: `${details}\n\nWhat would you like to do next?`,
            slots,
            done: false,
            context, // keep learn mode + selectedCard
            actions: ["apply", "compare", "check_eligibility"],
            tip,
          });
        }
      }
    }

    /* 9) LEARN MORE: "Am I eligible ..." (legacy per-card eligibility) */
    if (context.mode === "learn" && context.selectedCard && /eligible/.test(text)) {
      const selected = cards.find((c) => c.name === context.selectedCard);
      if (selected) {
        const incomeInline = parseIncomeFromText(message);
        const ageInline = (() => {
          const m = message.match(/\b(\d{1,2})\b/);
          return m ? Number(m[1]) : undefined;
        })();

        let s = { ...slots };
        if (typeof incomeInline === "number") s.income = incomeInline;
        if (typeof ageInline === "number") s.age = ageInline;

        const missing = nextMissingSlot(s);
        if (missing) {
          return NextResponse.json({
            reply: askFor(missing),
            slots: s,
            done: false,
            context, // keep learn mode + selectedCard
          });
        }

        const { score, reasons, failures } = scoreCard(selected as any, s as any);
        let r: string;
        if (failures.length === 0 && score >= 3) {
          r = `✅ You are eligible for the ${selected.name}!\n${reasons.length ? reasons.join("\n") : ""}`;
        } else {
          r =
            `❌ You are not eligible for the ${selected.name}.\n\n` +
            (failures.length ? failures.join("\n") : "") +
            (reasons.length ? `\n\n${reasons.join("\n")}` : "");
        }
        return NextResponse.json({
          reply: `${r}\n\nWould you like to apply, compare with another card, or get a recommendation?`,
          slots: s,
          done: false,
          context,
          actions: ["apply", "compare", "recommend"],
        });
      }
    }

    /* 10) LEARN MORE: capture employment mid-eligibility (legacy) */
    if (context.mode === "learn" && context.selectedCard && !slots.employment) {
      const emp = normalizeEmployment(message);
      if (emp) {
        const s = { ...slots, employment: emp };
        const missing = nextMissingSlot(s);
        if (missing) {
          return NextResponse.json({ reply: askFor(missing), slots: s, done: false, context });
        }
        const selected = cards.find((c) => c.name === context.selectedCard)!;
        const { score, reasons, failures } = scoreCard(selected as any, s as any);
        let r: string;
        if (failures.length === 0 && score >= 3) {
          r = `✅ You are eligible for the ${selected.name}!\n${reasons.length ? reasons.join("\n") : ""}`;
        } else {
          r =
            `❌ You are not eligible for the ${selected.name}.\n\n` +
            (failures.length ? failures.join("\n") : "") +
            (reasons.length ? `\n\n${reasons.join("\n")}` : "");
        }
        return NextResponse.json({
          reply: `${r}\n\nWould you like to apply, compare with another card, or get a recommendation?`,
          slots: s,
          done: false,
          context,
          actions: ["apply", "compare", "recommend"],
        });
      }
    }

    /* 11) Quick intents */
    if (/apply now|apply|continue/.test(text)) {
      return NextResponse.json({
        reply: "Great! You can start your application in the app. Want me to pre-check eligibility first?",
        slots,
        done: false,
        context,
      });
    }

    if (/check.*eligible|^eligible$/.test(text)) {
      const s = updateSlotsFromMessage(slots, message);
      const missing = nextMissingSlot(s);
      if (missing) {
        return NextResponse.json({ reply: askFor(missing), slots: s, done: false, context });
      }
      // Use aggregator for general recommendation across all cards
      const engine = runEngine({
        income: Number(s.income),
        age: Number(s.age),
        employment: String(s.employment),
        preference: s.preference ?? null,
        hasCosigner: s.hasCosigner === true,
      } as any);
      return NextResponse.json({
        reply: renderEngineReply(engine),
        slots: s,
        done: true,
        context,
      });
    }

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
      return NextResponse.json({
        reply: renderEngineReply(engine),
        slots: s,
        done: true,
        context,
      });
    }

    /* 12) Fallback */
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
