export function CardComparisonTable({ userContext }: CardComparisonTableProps) {
  const scored = cards.map((card) => {
    const { score, reasons } = scoreCard(card, userContext)
    return { ...card, score, reasons }
  });

  // Sort and pick the best card
  const sorted = [...scored].sort((a, b) => b.score - a.score);
  const bestCardName = sorted[0]?.name;

  return (
    <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
      {scored.map((card) => (
        <Card
          key={card.name}
          className={`border-2 ${
            card.name === bestCardName ? "border-blue-500 shadow-lg" : "border-gray-200"
          } transition-all duration-300`}
        >
          <CardHeader className="bg-blue-50 py-4 px-6 rounded-t-xl">
            <div className="flex items-center gap-2">
              {card.name === bestCardName && (
                <CheckCircle className="w-5 h-5 text-blue-600" />
              )}
              <CardTitle className="text-lg text-gray-800 font-semibold">{card.name}</CardTitle>
            </div>
          </CardHeader>
          <CardContent className="p-6 space-y-2">
            <p className="text-sm text-gray-700">
              <strong>Features:</strong> {card.benefits?.join(", ") || "Standard Benefits"}
            </p>
            <p className="text-sm text-gray-700">
              <strong>Min Income:</strong> ${card.minIncome}
            </p>
            <p className="text-sm text-gray-700">
              <strong>Min Age:</strong> {card.eligibleAges[0]}+
            </p>
            <p className="text-sm text-gray-700">
              <strong>Employment:</strong> {card.employmentTypes.join(", ")}
            </p>
            {card.name === bestCardName && (
              <div className="mt-4">
                <p className="text-sm text-blue-600 font-medium mb-1">Why we recommend this:</p>
                <ul className="list-disc list-inside text-sm text-gray-600">
                  {card.reasons.map((r, i) => (
                    <li key={i}>✔ {r}</li>
                  ))}
                </ul>
              </div>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}
