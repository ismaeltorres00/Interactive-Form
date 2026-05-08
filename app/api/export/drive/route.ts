import { NextRequest, NextResponse } from 'next/server'
import sql from '@/lib/db'
import { generateWord } from '@/lib/export/generateWord'
import { uploadWordToDrive } from '@/lib/drive'
import { Question } from '@/lib/types'

export async function POST(req: NextRequest) {
  const { sessionId } = await req.json()
  if (!sessionId) return NextResponse.json({ error: 'Missing sessionId' }, { status: 400 })

  const [session] = await sql`SELECT * FROM sessions WHERE id = ${sessionId}`
  if (!session) return NextResponse.json({ error: 'Session not found' }, { status: 404 })

  const blocks = await sql`SELECT * FROM blocks WHERE is_active = true ORDER BY "order"`
  const questions = await sql`SELECT * FROM questions WHERE is_active = true ORDER BY "order"` as Question[]
  const rawAnswers = await sql`
    SELECT * FROM answers WHERE session_id = ${sessionId} AND is_active = true
  `

  const answerMap = Object.fromEntries(
    (rawAnswers as unknown as { question_id: string; value: string; ai_generated: boolean }[])
      .map((a) => [a.question_id, a])
  )

  const blocksWithQuestions = (blocks as unknown as { id: string; title: string; order: number }[]).map((b) => ({
    ...b,
    questions: questions.filter((q) => q.block_id === b.id),
  }))

  const buffer = await generateWord(
    {
      client_name: session.client_name as string,
      client_email: session.client_email as string | null,
      company_name: session.company_name as string | null,
    },
    blocksWithQuestions,
    answerMap,
  )

  const name = (session.company_name ?? session.client_name) as string
  const safeName = name.replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚüÜñÑ\s]/g, '').trim()
  const fileName = `${safeName}_briefing.docx`

  try {
    const result = await uploadWordToDrive({
      buffer,
      fileName,
      sessionId,
      clientName: session.client_name as string,
      companyName: session.company_name as string | null,
    })
    return NextResponse.json({ ok: true, ...result })
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Error desconocido'
    return NextResponse.json({ error: message }, { status: 500 })
  }
}
