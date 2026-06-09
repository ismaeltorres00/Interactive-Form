import { NextRequest, NextResponse } from 'next/server'
import { revalidateTag } from 'next/cache'
import sql from '@/lib/db'
import { FORM_CONFIG_TAG } from '@/lib/form-config'

export async function PATCH(
  req: NextRequest,
  { params }: { params: { blockId: string } }
) {
  const body = await req.json()
  const allowed = ['is_active', 'title', 'description'] as const

  const updates: Record<string, unknown> = {}
  for (const key of allowed) {
    if (key in body) updates[key] = body[key]
  }

  if (Object.keys(updates).length === 0) {
    return NextResponse.json({ error: 'No valid fields' }, { status: 400 })
  }

  if ('is_active' in updates && !('title' in updates)) {
    await sql`UPDATE blocks SET is_active = ${updates.is_active as boolean} WHERE id = ${params.blockId}`
  } else if ('title' in updates) {
    await sql`
      UPDATE blocks
      SET title = ${updates.title as string}, description = ${(updates.description ?? null) as string | null}
      WHERE id = ${params.blockId}
    `
  }

  revalidateTag(FORM_CONFIG_TAG)
  return NextResponse.json({ ok: true })
}
