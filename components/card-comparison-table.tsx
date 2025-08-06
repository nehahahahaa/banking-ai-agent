export function CardComparisonTable({ userContext }: { userContext: any }) {
  if (!userContext) return null;

  const scoredCards = cards.map((card) => {
    const { score, reasons } = scoreCard(card, userContext);
    return { ...card, score, reasons };
  });

  const bestScore = Math.max(...scoredCards.map((c) => c.score));
  const recommended = scoredCards.filter((c) => c.score === bestScore);

  return (
    <div className="max-w-6xl mx-auto mt-10">
      <h2 className="text-2xl font-bold text-center text-blue-800 mb-2">
        Find Your Perfect Credit Card
      </h2>
      <p className="text-center text-gray-600 mb-8">
        Compare cards, check eligibility, and get personalized recommendations with our AI-powered banking assistant
      </p>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {scoredCards.map((card, index) => {
          const isRecommended = recommended.some((r) => r.name === card.name);

          return (
            <Card
              key={index}
              className={`rounded-xl border-2 transition ${
                isRecommended ? "border-blue-500 shadow-lg" : "border-gray-200"
              }`}
            >
              <CardHeader className="bg-blue-50 rounded-t-xl">
                <CardTitle className="text-lg font-semibold text-blue-900">
                  {card.name}
                </CardTitle>
              </CardHeader>
              <CardContent className="p-4 space-y-2 text-sm">
                <p><strong>Features:</strong> {card.features}</p>
                <p><strong>Min Income:</strong> ${card.minIncome}</p>
                <p><strong>Min Age:</strong> {card.minAge ? `${card.minAge}+` : "+"}</p>
                <p><strong>Employment:</strong> {card.employment || "Any"}</p>

                {isRecommended && (
                  <div className="mt-2 text-blue-600">
                    <p className="text-sm font-semibold">Why we recommend this:</p>
                    <ul className="list-disc list-inside text-xs text-gray-700">
                      {card.reasons.map((r: string, i: number) => (
                        <li key={i}>✓ {r}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
