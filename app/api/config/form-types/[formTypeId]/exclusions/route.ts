import { NextRequest, NextResponse } from 'next/server'
import sql from '@/lib/db'

interface Params {
  params: { formTypeId: string }
}

export async function POST(req: NextRequest, { params }: Params) {
  const { questionId } = await req.json()

  if (!questionId) {
    return NextResponse.json({ error: 'questionId is required' }, { status: 400 })
  }

  await sql`
    INSERT INTO form_type_question_exclusions (form_type_id, question_id)
    VALUES (${params.formTypeId}, ${questionId})
    ON CONFLICT DO NOTHING
  `

  return NextResponse.json({ ok: true })
}
