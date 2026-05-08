import sql from '@/lib/db'
import { AdminNav } from '@/components/AdminNav'
import { FormConfig } from '@/components/dashboard/FormConfig'
import { Block, Question } from '@/lib/types'

export default async function ConfigPage() {
  const blocks = await sql`SELECT * FROM blocks ORDER BY "order"`
  const questions = await sql`SELECT * FROM questions ORDER BY "order"` as Question[]

  const blocksWithQuestions: Block[] = (blocks as unknown as Omit<Block, 'questions'>[]).map((b) => ({
    ...b,
    questions: questions.filter((q) => q.block_id === b.id),
  }))

  const totalActive = blocksWithQuestions.reduce(
    (acc, b) => acc + b.questions.filter((q) => q.is_active).length,
    0
  )

  return (
    <div className="min-h-screen bg-zinc-50">
      <AdminNav active="config" />

      <div className="mx-auto max-w-3xl px-6 py-8">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-zinc-800">Configuración del formulario</h1>
          <p className="mt-1 text-sm text-zinc-400">
            {blocksWithQuestions.filter((b) => b.is_active).length} bloques activos ·{' '}
            {totalActive} preguntas activas
            <span className="ml-2 text-xs text-violet-400">Clic en cualquier texto para editarlo</span>
          </p>
        </div>

        <FormConfig initialBlocks={blocksWithQuestions} />
      </div>
    </div>
  )
}
