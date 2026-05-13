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
    SELECT q.label, q.type, a.value
    FROM answers a
    JOIN questions q ON q.id = a.question_id
    JOIN blocks b ON b.id = q.block_id
    WHERE a.session_id = ${sessionId}
      AND a.value IS NOT NULL
      AND a.value <> ''
      AND q.type NOT IN ('ai_assisted', 'hoja_ruta', 'circulo_oro', 'cinco_whys', 'eje_xy')
      AND q.id != ${questionId}
    ORDER BY b."order", q."order"
  `

  type Row = { label: string; type: string; value: string }

  const contextLines = (contextRows as unknown as Row[]).flatMap((r) => {
    if (r.type === 'creencias_valores') {
      try {
        const entries = JSON.parse(r.value) as { creo: string; somos: string; frase: string }[]
        return entries
          .filter((e) => e.creo || e.somos || e.frase)
          .map((e, i) => {
            const parts = [
              e.creo  ? `Creemos que: ${e.creo}` : '',
              e.somos ? `Por tanto somos: ${e.somos}` : '',
              e.frase ? `Frase valor: ${e.frase}` : '',
            ].filter(Boolean).join(' | ')
            return `- Creencia ${i + 1}: ${parts}`
          })
      } catch {
        return []
      }
    }
    return [`- ${r.label}: ${r.value}`]
  })

  const contextString = contextLines.join('\n')

  const prompt = `${question.ai_prompt}\n\nRespuestas del cliente:\n${contextString}`

  console.log('\n─── [ai-complete] Prompt enviado a la IA ───────────────────────')
  console.log(prompt)
  console.log('────────────────────────────────────────────────────────────────\n')

  let value: string
  try {
    value = await generateText(prompt, 1024)
  } catch (err: unknown) {
    console.error('[ai-complete] Error completo:', err)
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
