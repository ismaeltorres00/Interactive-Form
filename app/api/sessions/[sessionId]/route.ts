import { NextRequest, NextResponse } from 'next/server'
import sql from '@/lib/db'

export async function PATCH(
  req: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  const body = await req.json()

  if ('is_deleted' in body) {
    await sql`UPDATE sessions SET is_deleted = ${body.is_deleted} WHERE id = ${params.sessionId}`
  }
  if ('is_archived' in body) {
    await sql`UPDATE sessions SET is_archived = ${body.is_archived} WHERE id = ${params.sessionId}`
  }

  return NextResponse.json({ ok: true })
}
