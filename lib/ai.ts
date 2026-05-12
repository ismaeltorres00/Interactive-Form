import Anthropic from '@anthropic-ai/sdk'
import { GoogleGenerativeAI } from '@google/generative-ai'

const SYSTEM = 'Eres un asistente especializado en branding y diseño. Responde de forma concisa y profesional.'

// AI_PROVIDER values: 'gemini' | 'claude' | 'ollama' | 'mock'
export async function generateText(prompt: string, maxTokens = 1024): Promise<string> {
  const provider = process.env.AI_PROVIDER ?? 'gemini'

  // ── Mock ──────────────────────────────────────────────────────────────────
  if (provider === 'mock') {
    await new Promise((r) => setTimeout(r, 700))
    const sample = [
      'Construimos marcas que conectan de verdad.',
      'La autenticidad es nuestro diferencial.',
      'Diseño con propósito, impacto con intención.',
      'Cada proyecto es una historia que merece contarse bien.',
    ]
    return sample[Math.floor(Math.random() * sample.length)]
  }

  // ── Ollama ────────────────────────────────────────────────────────────────
  if (provider === 'ollama') {
    const ollamaUrl = process.env.OLLAMA_URL ?? 'http://localhost:11434'
    const model = process.env.OLLAMA_MODEL ?? 'llama3.2'

    const res = await fetch(`${ollamaUrl}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model,
        messages: [
          { role: 'system', content: SYSTEM },
          { role: 'user', content: prompt },
        ],
        stream: false,
        options: { num_predict: maxTokens },
      }),
    })

    if (!res.ok) throw new Error(`Ollama error: ${res.status}`)
    const data = await res.json()
    return data.message?.content ?? ''
  }

  // ── Gemini (Google AI Studio) ─────────────────────────────────────────────
  if (provider === 'gemini') {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY!)
    const model = genAI.getGenerativeModel({
      model: process.env.GEMINI_MODEL ?? 'gemini-2.0-flash-lite',
      systemInstruction: SYSTEM,
    })
    const result = await model.generateContent({
      contents: [{ role: 'user', parts: [{ text: prompt }] }],
      generationConfig: { maxOutputTokens: maxTokens },
    })
    return result.response.text()
  }

  // ── Claude ────────────────────────────────────────────────────────────────
  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY })
  const response = await client.messages.create({
    model: 'claude-sonnet-4-20250514',
    max_tokens: maxTokens,
    system: SYSTEM,
    messages: [{ role: 'user', content: prompt }],
  })
  return response.content[0].type === 'text' ? response.content[0].text : ''
}
