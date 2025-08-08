import { NextRequest, NextResponse } from "next/server"
import { cards } from "@/lib/utils/cardsData"
import { handleChatQuery as runEngine } from "@/lib/utils/scoreCard"

type Slots = {
  income?: number | null
  age?: number | null
  employment?: string | null
  preference?: string | null
  hasCosigner?: boolean | null
}

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
}

function normalizeEmployment(text: string): string | null {
  const t = text.toLowerCase()
  for (const [k, v] of Object.entries(EMPLOYMENT_ALIASES)) {
    if (t.includes(k)) return v
  }
  return null
}

function extractNumber(n: string): number | null {
  const m = n.replace(/[,]/g, "").match(/-?\d+(\.\d+)?/)
  return m ? Number(m[0]) : null
}

function detectPreference(text: string): string | null {
  const t = text.toLowerCase()
  if (t.includes("travel")) return "travel"
  if (t.includes("cashback") || t.includes("cash back")) return "cashback"
  if (t.includes("no annual fee")) return "no annual fee"
  if (t.includes("premium")) return "premium"
  if (t.includes("student")) return "student"
  return null
}

function nextMissingSlot(slots: Slots): keyof Slots | null {
  if (slots.age == null) return "age"
  if (slots.employment == null || slots.employment === "") return "employment"
  if (slots.income == null) return "income"
  // Only ask cosigner if student 18–25 and income > 5000
  if (
    slots.employment === "student" &&
    typeof slots.age === "number" &&
    slots.age >= 18 &&
    slots.age <= 25 &&
    typeof slots.income === "number" &&
    slots.income > 5000 &&
    slots.hasCosigner == null
  ) {
    return "hasCosigner"
  }
  return null
}

function askFor(slot: keyof Slots): string {
  switch (slot) {
    case "age":
      return "What is your age?"
    case "employment":
      return "What is your employment type? (salaried, self-employed, student, retired)"
    case "income":
      return "What is your monthly income (USD)?"
    case "hasCosigner":
      return "Do you have a qualified cosigner? (yes/no)"
    default:
      return "Tell me about your preference (e.g., travel, cashback, no annual fee), or say 'recommend a card'."
  }
}

function updateSlotsFromMessage(slots: Slots, message: string): Slots {
  const t = message.toLowerCase()
  const s: Slots = { ...slots }

  // Try to fill what user likely answered last asked
  if (s.age == null) {
    const n = extractNumber(t)
    if (n != null && n >= 0 && n <= 120) s.age = n
  }

  if (s.employment == null) {
    const emp = normalizeEmployment(t)
    if (emp) s.employment = emp
  }

  if (s.income == null) {
    const n = extractNumber(t)
    // treat any number >= 0 as income if it wasn't age just set
    if (n != null) {
      // crude disambiguation: if we already captured age this turn, prefer income now
      if (!(n >= 0 && n <= 120 && String(t).includes("age"))) s.income = n
    }
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
    if (/\b(yes|yep|yeah|true)\b/i.test(message)) s.hasCosigner = true
    if (/\b(no|nope|nah|false)\b/i.test(message)) s.hasCosigner = false
  }

  // Preference (optional)
  if (s.preference == null) {
    const pref = detectPreference(t)
    if (pref) s.preference = pref
  }

  return s
}

function renderEngineReply(engine: any, slots: Slots): string {
  // Match your UI copy closely
  if (engine.type === "full-match") {
    const names = (engine.recommendedCards || []).join(", ")
    return [
      "🧠 Builds trust by showing logic clearly",
      engine.message,
      names ? `Recommended: ${names}${needsCosignerTag(slots, names)}` : undefined,
    ]
      .filter(Boolean)
      .join("\n")
  }

  if (engine.type === "multiple-match") {
    const names = (engine.recommendedCards || []).join(", ")
    return [
      "🟢 Transparent + ranked choices",
      engine.message,
      names ? `Recommended: ${names}${needsCosignerTag(slots, names)}` : undefined,
    ]
      .filter(Boolean)
      .join("\n")
  }

  if (engine.type === "partial-match") {
    const failures: string[] = engine.failures || []
    // Group like your UI (Card: then items)
    let out = ["⚠️ Partial match – explained clearly", engine.message]
    let current: string | null = null
    failures.forEach((line) => {
      if (line.endsWith(":")) {
        current = line.slice(0, -1)
        out.push(`\n${current}:`)
      } else {
        out.push(`- ${line.replace(/^[-•]\s*/, "")}`)
      }
    })
    return out.filter(Boolean).join("\n")
  }

  // no-match
  return `❌ No card matches your inputs right now.\nTry adjusting income, age, or employment type to see more options.`
}

function needsCosignerTag(slots: Slots, namesCSV: string): string {
  const names = namesCSV.split(",").map((s) => s.trim().toLowerCase())
  const includesStudent = names.some((n) => n.includes("student essentials"))
  const showTag =
    includesStudent &&
    slots.employment === "student" &&
    typeof slots.age === "number" &&
    slots.age >= 18 &&
    slots.age <= 25 &&
    typeof slots.income === "number" &&
    slots.income > 5000 &&
    slots.hasCosigner === true
  return showTag ? " (Student Essentials Card with cosigner)" : ""
}

export async function POST(req: NextRequest) {
  try {
    const { message, slots: incomingSlots } = await req.json()
    const initialSlots: Slots = {
      income: incomingSlots?.income ?? null,
      age: incomingSlots?.age ?? null,
      employment: incomingSlots?.employment ?? null,
      preference: incomingSlots?.preference ?? null,
      hasCosigner: incomingSlots?.hasCosigner ?? null,
    }

    // Update slots based on this user message
    const slots = updateSlotsFromMessage(initialSlots, message || "")

    // If anything still missing, ask only the next one
    const missing = nextMissingSlot(slots)
    if (missing) {
      return NextResponse.json({
        reply: askFor(missing),
        slots,
        done: false,
      })
    }

    // All required slots present → run your existing engine
    const engineResult = runEngine({
      income: Number(slots.income),
      age: Number(slots.age),
      employment: String(slots.employment),
      preference: slots.preference ?? null,
      hasCosigner: slots.hasCosigner === true,
    } as any)

    const reply = renderEngineReply(engineResult, slots)
    return NextResponse.json({
      reply,
      slots,
      done: true,
      engine: engineResult, // (optional: remove if you don’t want to expose)
    })
  } catch (err: any) {
    console.error("API ERROR:", err)
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 })
  }
}
