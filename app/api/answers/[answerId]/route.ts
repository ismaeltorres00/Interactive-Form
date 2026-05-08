import { NextRequest, NextResponse } from 'next/server'
import sql from '@/lib/db'

export async function PATCH(req: NextRequest, { params }: { params: { answerId: string } }) {
  const { is_active } = await req.json()
  if (typeof is_active !== 'boolean') {
    return NextResponse.json({ error: 'is_active must be boolean' }, { status: 400 })
  }
  await sql`
    UPDATE answers SET is_active = ${is_active}, updated_at = now()
    WHERE id = ${params.answerId}
  `
  return NextResponse.json({ ok: true })
}
