import { NextRequest, NextResponse } from 'next/server'
import sql from '@/lib/db'

export async function GET() {
  const [formTypes, ftBlocks, exclusions] = await Promise.all([
    sql`SELECT * FROM form_types ORDER BY "order"`,
    sql`SELECT form_type_id, block_id FROM form_type_blocks`,
    sql`SELECT form_type_id, question_id FROM form_type_question_exclusions`,
  ])

  const result = formTypes.map((ft) => ({
    ...ft,
    blockIds: ftBlocks
      .filter((ftb) => ftb.form_type_id === ft.id)
      .map((ftb) => ftb.block_id),
    excludedQuestionIds: exclusions
      .filter((e) => e.form_type_id === ft.id)
      .map((e) => e.question_id),
  }))

  return NextResponse.json(result)
}

export async function POST(req: NextRequest) {
  const { name, description } = await req.json()

  if (!name?.trim()) {
    return NextResponse.json({ error: 'name is required' }, { status: 400 })
  }

  const [maxOrder] = await sql`SELECT COALESCE(MAX("order"), 0) AS max FROM form_types`
  const nextOrder = (maxOrder.max as number) + 1

  const [row] = await sql`
    INSERT INTO form_types (name, description, "order")
    VALUES (${name.trim()}, ${description ?? null}, ${nextOrder})
    RETURNING *
  `

  return NextResponse.json({ ...row, blockIds: [], excludedQuestionIds: [] }, { status: 201 })
}
