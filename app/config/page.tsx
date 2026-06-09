import sql from '@/lib/db'
import { AdminNav } from '@/components/AdminNav'
import { AdminFooter } from '@/components/AdminFooter'
import { ConfigTabs } from '@/components/dashboard/ConfigTabs'
import { Block, Question, FormTypeWithBlocks } from '@/lib/types'

export default async function ConfigPage() {
  const blocks = await sql`SELECT * FROM blocks ORDER BY "order"`
  const questions = await sql`SELECT * FROM questions ORDER BY "order"` as Question[]
  const formTypesRaw = await sql`SELECT * FROM form_types ORDER BY "order"`
  const ftBlocks = await sql`SELECT form_type_id, block_id FROM form_type_blocks`
  const ftExclusions = await sql`SELECT form_type_id, question_id FROM form_type_question_exclusions`

  const blocksWithQuestions: Block[] = (blocks as unknown as Omit<Block, 'questions'>[]).map((b) => ({
    ...b,
    questions: questions.filter((q) => q.block_id === b.id),
  }))

  const formTypes: FormTypeWithBlocks[] = formTypesRaw.map((ft) => ({
    id: ft.id as string,
    name: ft.name as string,
    description: ft.description as string | null,
    is_active: ft.is_active as boolean,
    order: ft.order as number,
    created_at: ft.created_at as string,
    blockIds: ftBlocks
      .filter((ftb) => ftb.form_type_id === ft.id)
      .map((ftb) => ftb.block_id as string),
    excludedQuestionIds: ftExclusions
      .filter((e) => e.form_type_id === ft.id)
      .map((e) => e.question_id as string),
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
            {totalActive} preguntas activas ·{' '}
            {formTypes.filter((ft) => ft.is_active).length} tipos de formulario
            <span className="ml-2 text-xs text-kb-accent-dark">Clic en cualquier texto para editarlo</span>
          </p>
        </div>

        <ConfigTabs blocks={blocksWithQuestions} formTypes={formTypes} />
      </div>

      <AdminFooter />
    </div>
  )
}
