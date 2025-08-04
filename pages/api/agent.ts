import type { NextApiRequest, NextApiResponse } from "next"

const TOGETHER_API_KEY = process.env.TOGETHER_API_KEY

async function callTogetherAI(messages: any[]) {
  const response = await fetch("https://api.together.xyz/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${TOGETHER_API_KEY}`,
    },
    body: JSON.stringify({
      model: "mistralai/Mixtral-8x7B-Instruct-v0.1",
      messages: [
        {
          role: "system",
          content:
            "You are a helpful banking assistant. Recommend the best credit card based on user eligibility. Keep answers simple and relevant to card comparison, benefits, and application help only. If the question is unrelated to cards, politely decline and suggest speaking to a live agent.",
        },
        ...messages,
      ],
      temperature: 0.7,
    }),
  })

  const data = await response.json()
  return data?.choices?.[0]?.message
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" })
  }

  const { messages } = req.body

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ message: "Invalid request - messages missing" })
  }

  try {
    const reply = await callTogetherAI(messages)
    if (!reply) throw new Error("No reply from AI")

    return res.status(200).json({ message: reply.content })
  } catch (error) {
    console.error("AI call failed:", error)
    return res.status(500).json({ message: "Something went wrong with the AI agent" })
  }
}
