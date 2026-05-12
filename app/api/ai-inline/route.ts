import { NextRequest, NextResponse } from 'next/server'
import { generateText } from '@/lib/ai'

export async function POST(req: NextRequest) {
  const { prompt, context } = await req.json()

  if (!prompt) {
    return NextResponse.json({ error: 'Missing prompt' }, { status: 400 })
  }

  const content = context ? `${prompt}\n\nContexto:\n${context}` : prompt

  let value: string
  try {
    value = await generateText(content, 512)
  } catch (err: unknown) {
    console.error('[ai-inline] Error completo:', err)
    const msg = err instanceof Error ? err.message : String(err)
    return NextResponse.json({ error: `Error de IA: ${msg.substring(0, 300)}` }, { status: 502 })
  }

  return NextResponse.json({ ok: true, value })
}
