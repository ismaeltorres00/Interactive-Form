import { NextRequest, NextResponse } from 'next/server'
import sql from '@/lib/db'

interface Params {
  params: { formTypeId: string; questionId: string }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  await sql`
    DELETE FROM form_type_question_exclusions
    WHERE form_type_id = ${params.formTypeId}
      AND question_id  = ${params.questionId}
  `
  return NextResponse.json({ ok: true })
}
