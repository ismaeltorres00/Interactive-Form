import { NextRequest, NextResponse } from 'next/server'
import sql from '@/lib/db'

interface Params {
  params: { formTypeId: string }
}

export async function PATCH(req: NextRequest, { params }: Params) {
  const body = await req.json()
  const { name, description, is_active } = body

  if (name !== undefined) {
    await sql`UPDATE form_types SET name = ${name} WHERE id = ${params.formTypeId}`
  }
  if (description !== undefined) {
    await sql`UPDATE form_types SET description = ${description ?? null} WHERE id = ${params.formTypeId}`
  }
  if (is_active !== undefined) {
    await sql`UPDATE form_types SET is_active = ${is_active} WHERE id = ${params.formTypeId}`
  }

  return NextResponse.json({ ok: true })
}

export async function DELETE(_req: NextRequest, { params }: Params) {
  const [count] = await sql`
    SELECT COUNT(*) AS n FROM sessions WHERE form_type_id = ${params.formTypeId}
  `
  if (Number(count.n) > 0) {
    return NextResponse.json(
      { error: 'No se puede eliminar: hay sesiones que usan este tipo' },
      { status: 409 }
    )
  }

  await sql`DELETE FROM form_types WHERE id = ${params.formTypeId}`
  return NextResponse.json({ ok: true })
}
