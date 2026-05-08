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

  const blocks = await sql`
    SELECT * FROM blocks WHERE is_active = true ORDER BY "order"
  `
  const questions = await sql`
    SELECT * FROM questions WHERE is_active = true ORDER BY "order"
  ` as Question[]

  const answers = await sql`
    SELECT * FROM answers WHERE session_id = ${params.sessionId}
  `

  const blocksWithQuestions: Block[] = (blocks as unknown as Omit<Block, 'questions'>[]).map((b) => ({
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
