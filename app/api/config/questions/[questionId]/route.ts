import { NextRequest, NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import sql from '@/lib/db'
import { FORM_CONFIG_TAG } from '@/lib/form-config'

export async function PATCH(
  req: NextRequest,
  { params }: { params: { questionId: string } }
) {
  const body = await req.json()

  if ('is_active' in body && Object.keys(body).length === 1) {
    await sql`UPDATE questions SET is_active = ${body.is_active} WHERE id = ${params.questionId}`
  } else if ('label' in body) {
    await sql`
      UPDATE questions
      SET label = ${body.label}, helper_text = ${body.helper_text ?? null}
      WHERE id = ${params.questionId}
    `
  } else if ('ai_prompt' in body) {
    await sql`UPDATE questions SET ai_prompt = ${body.ai_prompt ?? null} WHERE id = ${params.questionId}`
  } else {
    return NextResponse.json({ error: 'No valid fields' }, { status: 400 })
  }

  revalidateTag(FORM_CONFIG_TAG)
  return NextResponse.json({ ok: true })
}
