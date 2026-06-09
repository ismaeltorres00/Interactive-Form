import { NextRequest, NextResponse } from 'next/server'
import sql from '@/lib/db'

interface Params {
  params: { formTypeId: string }
}

export async function POST(req: NextRequest, { params }: Params) {
  const { blockId } = await req.json()

  if (!blockId) {
    return NextResponse.json({ error: 'blockId is required' }, { status: 400 })
  }

  await sql`
    INSERT INTO form_type_blocks (form_type_id, block_id)
    VALUES (${params.formTypeId}, ${blockId})
    ON CONFLICT DO NOTHING
  `

  return NextResponse.json({ ok: true })
}
