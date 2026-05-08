import { NextRequest, NextResponse } from 'next/server'
import sql from '@/lib/db'

export async function PATCH(
  req: NextRequest,
  { params }: { params: { questionId: string } }
) {
  const body = await req.json()

  if ('is_active' in body && Object.keys(body).length === 1) {
    await sql`UPDATE questions SET is_active = ${body.is_active} WHERE id = ${params.questionId}`
    return NextResponse.json({ ok: true })
  }

  if ('label' in body) {
    await sql`
      UPDATE questions
      SET label = ${body.label}, helper_text = ${body.helper_text ?? null}
      WHERE id = ${params.questionId}
    `
    return NextResponse.json({ ok: true })
  }

  if ('ai_prompt' in body) {
    await sql`
      UPDATE questions SET ai_prompt = ${body.ai_prompt ?? null} WHERE id = ${params.questionId}
    `
    return NextResponse.json({ ok: true })
  }

  return NextResponse.json({ error: 'No valid fields' }, { status: 400 })
}
