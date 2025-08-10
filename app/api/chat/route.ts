/* ✅ NEW: plain "compare" with no args */
if (/^\s*compare\s*$/i.test(text)) {
  // If we already have a selected card from Learn More, ask for the other card
  if (context.selectedCard) {
    const list = cards.slice(0, 3).map((c, i) => `${i + 1}. ${c.name}`).join("\n");
    context = { mode: "compare", compare: { a: context.selectedCard } }; // partial compare
    return NextResponse.json({
      reply: `Which card would you like to compare with **${context.selectedCard}**?\nReply with the number (1–3) or the name:\n\n${list}`,
      slots,
      done: false,
      context,
    });
  }
  // No base selected — ask for the first card
  const list = cards.slice(0, 3).map((c, i) => `${i + 1}. ${c.name}`).join("\n");
  context = { mode: "compare" };
  return NextResponse.json({
    reply: `Which two cards should I compare?\nStart by choosing the first card. Reply with the number (1–3) or the name:\n\n${list}`,
    slots,
    done: false,
    context,
  });
}

/* ✅ UPDATED: "compare with" (works with or without a target) */
const compareWithLoose = /\bcompare\s+with\b/i.test(text);
if (compareWithLoose) {
  const baseName = context.selectedCard;
  const baseCard = baseName ? cards.find((c) => c.name === baseName) : undefined;

  // If no base selected, ask for it first
  if (!baseCard) {
    const list = cards.slice(0, 3).map((c, i) => `${i + 1}. ${c.name}`).join("\n");
    context = { mode: "compare" };
    return NextResponse.json({
      reply: `Which card should we start from?\nReply with the number (1–3) or the name:\n\n${list}`,
      slots,
      done: false,
      context,
    });
  }

  // If the user supplied a second token (e.g., "compare with 1" or name), resolve it
  const tokenMatch = text.match(/compare\s+with\s+(.+)/i);
  if (tokenMatch && tokenMatch[1]) {
    const other = pickCardFromText(tokenMatch[1].trim());
    if (!other) {
      const list = cards.slice(0, 3).map((c, i) => `${i + 1}. ${c.name}`).join("\n");
      context = { mode: "compare", compare: { a: baseCard.name } };
      return NextResponse.json({
        reply: `I couldn’t find that card. Reply with the number (1–3) or the name:\n\n${list}`,
        slots,
        done: false,
        context,
      });
    }
    // We have both cards → run compare (with slot-fill if needed)
    const s = updateSlotsFromMessage(slots, message);
    const missing = nextMissingSlot(s);
    if (missing) {
      context = { mode: "compare", compare: { a: baseCard.name, b: other.name } };
      return NextResponse.json({ reply: askFor(missing), slots: s, done: false, context });
    }
    const resA = scoreCard(baseCard as any, s as any);
    const resB = scoreCard(other as any, s as any);
    const reply = [
      `⚖️ Comparison for your profile:`,
      `- **${baseCard.name}**: ${resA.reasons.length ? resA.reasons.join("; ") : resA.failures.join("; ")}`,
      `- **${other.name}**: ${resB.reasons.length ? resB.reasons.join("; ") : resB.failures.join("; ")}`,
      resA.score > resB.score
        ? `👉 Best for you: **${baseCard.name}**`
        : resB.score > resA.score
        ? `👉 Best for you: **${other.name}**`
        : `Both cards are equally suitable based on your profile.`,
    ].join("\n");
    return NextResponse.json({ reply, slots: s, done: true, context: {} });
  }

  // No second token → set partial compare and prompt for the second card
  const list = cards.slice(0, 3).map((c, i) => `${i + 1}. ${c.name}`).join("\n");
  context = { mode: "compare", compare: { a: baseCard.name } };
  return NextResponse.json({
    reply: `Which card would you like to compare with **${baseCard.name}**?\nReply with the number (1–3) or the name:\n\n${list}`,
    slots,
    done: false,
    context,
  });
}
