import type { NextApiRequest, NextApiResponse } from "next"

// 👇 Replace this with actual call to Together AI or OpenAI
async function callAI(messages: any[], userContext: any) {
  const fakeResponse = {
    role: "assistant",
    content: "Based on your eligibility, the best card for you is the Cashback Saver Card. Would you like to apply or see alternatives?",
  }

  // You can later swap this with a fetch() call to your deployed agent
  return fakeResponse
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") {
    return res.status(405).json({ message: "Method not allowed" })
  }

  const { messages, userContext } = req.body

  if (!messages || !Array.isArray(messages)) {
    return res.status(400).json({ message: "Invalid request - messages missing" })
  }

  try {
    const reply = await callAI(messages, userContext)
    return res.status(200).json({ message: reply.content })
  } catch (error) {
    console.error("AI error:", error)
    return res.status(500).json({ message: "Failed to get response from AI agent" })
  }
}
