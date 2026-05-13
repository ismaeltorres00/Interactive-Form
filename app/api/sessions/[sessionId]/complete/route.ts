import { NextRequest, NextResponse } from 'next/server'
import sql from '@/lib/db'

export async function POST(
  _req: NextRequest,
  { params }: { params: { sessionId: string } }
) {
  // Determine status: pending_ai_review if any ai_assisted questions haven't been generated yet
  const [{ count }] = await sql`
    SELECT COUNT(*) AS count
    FROM questions q
    WHERE q.type = 'ai_assisted' AND q.is_active = true
      AND NOT EXISTS (
        SELECT 1 FROM answers a
        WHERE a.session_id = ${params.sessionId}
          AND a.question_id = q.id
          AND a.value IS NOT NULL
          AND a.value <> ''
      )
  `

  const status = Number(count) > 0 ? 'pending_ai_review' : 'completed'

  // Calculate actual progress from answers (exclude ai_assisted from denominator)
  const [{ total }] = await sql`
    SELECT COUNT(*) AS total FROM questions WHERE is_active = true AND type != 'ai_assisted'
  `
  const [{ answered }] = await sql`
    SELECT COUNT(*) AS answered
    FROM answers a
    JOIN questions q ON q.id = a.question_id
    WHERE a.session_id = ${params.sessionId}
      AND a.value IS NOT NULL AND a.value != ''
      AND q.type != 'ai_assisted'
      AND q.is_active = true
  `
  const progress = Number(total) > 0 ? Math.round((Number(answered) / Number(total)) * 100) : 0

  await sql`
    UPDATE sessions SET status = ${status}, progress = ${progress}
    WHERE id = ${params.sessionId}
  `
  return NextResponse.json({ ok: true, status, progress })
}
