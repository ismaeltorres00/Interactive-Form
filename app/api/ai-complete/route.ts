import { NextRequest, NextResponse } from 'next/server'
import sql from '@/lib/db'
import { generateText } from '@/lib/ai'

export async function POST(req: NextRequest) {
  const { sessionId, questionId } = await req.json()

  if (!sessionId || !questionId) {
    return NextResponse.json({ error: 'Missing fields' }, { status: 400 })
  }

  const [question] = await sql`
    SELECT * FROM questions WHERE id = ${questionId} AND type = 'ai_assisted'
  `
  if (!question) {
    return NextResponse.json({ error: 'Question not found' }, { status: 404 })
  }
  if (!question.ai_prompt) {
    return NextResponse.json({ error: 'No prompt configured for this question' }, { status: 400 })
  }

  const contextRows = await sql`
    SELECT q.label, a.value
    FROM answers a
    JOIN questions q ON q.id = a.question_id
    WHERE a.session_id = ${sessionId}
      AND a.value IS NOT NULL
      AND a.value <> ''
    ORDER BY q."order"
  `

  const contextString = (contextRows as unknown as { label: string; value: string }[])
    .map((r) => `${r.label}: ${r.value}`)
    .join('\n')

  const prompt = `${question.ai_prompt}\n\nContexto del cliente:\n${contextString}`

  let value: string
  try {
    value = await generateText(prompt, 1024)
  } catch (err: unknown) {
    const msg = err instanceof Error ? err.message : String(err)
    const quotaMatch = msg.includes('429') || msg.toLowerCase().includes('quota')
    return NextResponse.json(
      { error: quotaMatch ? 'Límite de la API de IA alcanzado. Inténtalo en unos minutos.' : `Error de IA: ${msg.substring(0, 200)}` },
      { status: 502 }
    )
  }

  await sql`
    INSERT INTO answers (session_id, question_id, value, ai_generated)
    VALUES (${sessionId}, ${questionId}, ${value}, true)
    ON CONFLICT (session_id, question_id)
    DO UPDATE SET value = EXCLUDED.value, ai_generated = true, updated_at = now()
  `

  // Si la sesión estaba en pending_ai_review, comprobar si ya están todas las IA generadas
  const [session] = await sql`SELECT status FROM sessions WHERE id = ${sessionId}`
  if (session?.status === 'pending_ai_review') {
    const [{ count }] = await sql`
      SELECT COUNT(*) AS count
      FROM questions q
      WHERE q.type = 'ai_assisted' AND q.is_active = true
        AND NOT EXISTS (
          SELECT 1 FROM answers a
          WHERE a.session_id = ${sessionId}
            AND a.question_id = q.id
            AND a.value IS NOT NULL
            AND a.value <> ''
        )
    `
    if (Number(count) === 0) {
      await sql`UPDATE sessions SET status = 'completed' WHERE id = ${sessionId}`
    }
  }

  return NextResponse.json({ ok: true, value })
}
