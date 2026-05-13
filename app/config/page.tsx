import sql from '@/lib/db'
import { AdminNav } from '@/components/AdminNav'
import { AdminFooter } from '@/components/AdminFooter'
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
    <div className="min-h-screen flex flex-col bg-kb-gray-100 dark:bg-kb-black">
      <AdminNav active="config" />

      <div className="mx-auto max-w-3xl px-6 py-8">
        <div className="mb-6">
          <h1 className="text-xl font-bold text-kb-black dark:text-white">Configuración del formulario</h1>
          <p className="mt-1 text-sm text-kb-gray-600 dark:text-zinc-500">
            {blocksWithQuestions.filter((b) => b.is_active).length} bloques activos ·{' '}
            {totalActive} preguntas activas
            <span className="ml-2 text-xs text-kb-accent-dark">Clic en cualquier texto para editarlo</span>
          </p>
        </div>

        <FormConfig initialBlocks={blocksWithQuestions} />
      </div>

      <AdminFooter />
    </div>
  )
}
