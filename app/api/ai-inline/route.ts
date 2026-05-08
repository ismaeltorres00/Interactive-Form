import { NextRequest, NextResponse } from 'next/server'
import { generateText } from '@/lib/ai'

export async function POST(req: NextRequest) {
  const { prompt, context } = await req.json()

  if (!prompt) {
    return NextResponse.json({ error: 'Missing prompt' }, { status: 400 })
  }

  const content = context ? `${prompt}\n\nContexto:\n${context}` : prompt
  const value = await generateText(content, 512)
  return NextResponse.json({ ok: true, value })
}
