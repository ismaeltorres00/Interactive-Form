import { notFound } from 'next/navigation'
import sql from '@/lib/db'
import { FormWizard } from '@/components/form/FormWizard'
import { Block, Question, Answer } from '@/lib/types'

interface Props {
  params: { sessionId: string }
}

export default async function FormPage({ params }: Props) {
  const [session] = await sql`
    SELECT * FROM sessions WHERE id = ${params.sessionId}
  `
  if (!session) notFound()

  let blocksRaw
  let excludedQuestionIds: string[] = []

  if (session.form_type_id) {
    const [blocks, exclusions] = await Promise.all([
      sql`
        SELECT b.* FROM blocks b
        INNER JOIN form_type_blocks ftb ON ftb.block_id = b.id
        WHERE ftb.form_type_id = ${session.form_type_id} AND b.is_active = true
        ORDER BY b."order"
      `,
      sql`
        SELECT question_id FROM form_type_question_exclusions
        WHERE form_type_id = ${session.form_type_id}
      `,
    ])
    blocksRaw = blocks
    excludedQuestionIds = exclusions.map((r) => r.question_id as string)
  } else {
    blocksRaw = await sql`
      SELECT * FROM blocks WHERE is_active = true ORDER BY "order"
    `
  }

  const allQuestions = await sql`
    SELECT * FROM questions WHERE is_active = true ORDER BY "order"
  ` as Question[]

  const questions = excludedQuestionIds.length > 0
    ? allQuestions.filter((q) => !excludedQuestionIds.includes(q.id))
    : allQuestions

  const answers = await sql`
    SELECT * FROM answers WHERE session_id = ${params.sessionId}
  `

  const blocksWithQuestions: Block[] = (blocksRaw as unknown as Omit<Block, 'questions'>[]).map((b) => ({
    ...b,
    questions: questions.filter((q) => q.block_id === b.id),
  }))

  return (
    <FormWizard
      sessionId={params.sessionId}
      blocks={blocksWithQuestions}
      initialAnswers={answers as unknown as Answer[]}
      initialBlock={session.current_block ?? 0}
      companyName={session.company_name ?? null}
    />
  )
}
