import { NextRequest, NextResponse } from 'next/server'
import sql from '@/lib/db'

export async function POST(req: NextRequest) {
  const { sessionId, questionId, value } = await req.json()

  if (!sessionId || !questionId) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  // Sentinel used by FormWizard on final step — ignore
  if (questionId === '__complete__') {
    return NextResponse.json({ ok: true, progress: 100 })
  }

  await sql`
    INSERT INTO answers (session_id, question_id, value, ai_generated)
    VALUES (${sessionId}, ${questionId}, ${value}, false)
    ON CONFLICT (session_id, question_id)
    DO UPDATE SET value = EXCLUDED.value, updated_at = now()
  `

  const [{ total }] = await sql`
    SELECT COUNT(*) AS total FROM questions WHERE is_active = true AND type != 'ai_assisted'
  `
  const [{ answered }] = await sql`
    SELECT COUNT(*) AS answered FROM answers
    WHERE session_id = ${sessionId} AND value IS NOT NULL AND value != ''
  `

  const progress = Number(total) > 0 ? Math.round((Number(answered) / Number(total)) * 100) : 0

  await sql`
    UPDATE sessions
    SET progress = ${progress}, status = ${progress > 0 ? 'in_progress' : 'pending'}
    WHERE id = ${sessionId}
  `

  return NextResponse.json({ ok: true, progress })
}
