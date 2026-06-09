import { NextRequest, NextResponse } from 'next/server'
import sql from '@/lib/db'

interface Params {
  params: { formTypeId: string; blockId: string }
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  await sql`
    DELETE FROM form_type_blocks
    WHERE form_type_id = ${params.formTypeId}
      AND block_id     = ${params.blockId}
  `
  return NextResponse.json({ ok: true })
}
