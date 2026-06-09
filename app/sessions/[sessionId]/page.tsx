import { notFound } from 'next/navigation'
import { Suspense } from 'react'
import Link from 'next/link'
import sql from '@/lib/db'
import { getCachedFormConfig } from '@/lib/form-config'
import { AdminNav } from '@/components/AdminNav'
import { AdminFooter } from '@/components/AdminFooter'
import { SessionDetail } from '@/components/dashboard/SessionDetail'
import { ExportActions } from '@/components/dashboard/ExportActions'
import { isDriveConnected } from '@/lib/drive'
import { Block, Answer } from '@/lib/types'

export const dynamic = 'force-dynamic'

interface Props {
  params: { sessionId: string }
}

// Skeleton shown while SessionDetail streams in
function DetailSkeleton() {
  return (
    <div className="animate-pulse space-y-3">
      {Array.from({ length: 8 }).map((_, i) => (
        <div key={i} className="h-14 rounded-lg border border-kb-gray-100 bg-white dark:border-zinc-800 dark:bg-zinc-900" />
      ))}
    </div>
  )
}

async function SessionDetailLoader({ sessionId, blocksWithQuestions, answers }: {
  sessionId: string
  blocksWithQuestions: Block[]
  answers: Answer[]
}) {
  return (
    <SessionDetail
      sessionId={sessionId}
      blocks={blocksWithQuestions}
      answers={answers}
    />
  )
}

export default async function SessionPage({ params }: Props) {
  // blocks+questions come from cache (invalidated only on config edits)
  // session + answers always fresh; all three start in parallel
  const sessionPromise  = sql`SELECT * FROM sessions WHERE id = ${params.sessionId}`
  const answersPromise  = sql`SELECT * FROM answers WHERE session_id = ${params.sessionId}`
  const configPromise   = getCachedFormConfig()
  const drivePromise    = isDriveConnected()

  // Await session first only to check notFound — others keep running
  const [session] = await sessionPromise
  if (!session) notFound()

  const [blocksWithQuestions, answersRaw, driveConnected] = await Promise.all([
    configPromise,
    answersPromise,
    drivePromise,
  ])

  const answers = answersRaw as unknown as Answer[]
  const questions = blocksWithQuestions.flatMap((b) => b.questions)

  const totalVisible = questions.filter((q) => q.is_active && q.type !== 'ai_assisted').length
  const answeredQuestionIds = new Set(questions.filter((q) => q.type !== 'ai_assisted').map((q) => q.id))
  const answered = answers.filter((a) => answeredQuestionIds.has(a.question_id) && a.value && a.value.trim() !== '').length
  const pct = totalVisible > 0 ? Math.round((answered / totalVisible) * 100) : 0

  return (
    <div className="min-h-screen flex flex-col bg-kb-gray-100 dark:bg-kb-black">
      <AdminNav active="clients" />

      <div className="mx-auto max-w-3xl px-6 py-8">
        {/* Header — renders immediately */}
        <div className="mb-6">
          <Link href="/" className="text-xs text-kb-gray-600 hover:text-kb-black transition dark:text-zinc-500 dark:hover:text-zinc-300">
            ← Volver al panel
          </Link>
          <div className="mt-3 flex items-start justify-between">
            <div>
              <h1 className="text-xl font-bold text-kb-black dark:text-white">{session.client_name}</h1>
              {session.client_email && (
                <p className="text-sm text-kb-gray-600 dark:text-zinc-500">{session.client_email}</p>
              )}
            </div>
            <div className="flex items-center gap-3">
              <span className={`rounded-full px-3 py-1 text-xs font-semibold ${
                session.status === 'completed'         ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' :
                session.status === 'in_progress'       ? 'bg-[#fefae6] text-kb-accent-dark' :
                session.status === 'pending_ai_review' ? 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400' :
                'bg-kb-gray-100 text-kb-gray-600 dark:bg-zinc-800 dark:text-zinc-400'
              }`}>
                {session.status === 'completed'         ? 'Completado' :
                 session.status === 'in_progress'       ? 'En progreso' :
                 session.status === 'pending_ai_review' ? 'Revisar IA' : 'Pendiente'}
              </span>
              <a
                href={`/form/${session.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg border border-kb-gray-200 bg-white px-3 py-1.5 text-xs font-semibold text-kb-gray-600 hover:bg-kb-gray-100 transition dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800"
              >
                Ver formulario
              </a>
              <ExportActions
                sessionId={session.id}
                clientName={session.client_name}
                clientEmail={session.client_email ?? null}
                companyName={session.company_name ?? null}
                formUrl={`${process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000'}/form/${session.id}`}
                driveConnected={driveConnected}
                driveFolderId={session.drive_folder_id ?? null}
              />
            </div>
          </div>

          <div className="mt-4 flex items-center gap-3">
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-kb-gray-200 dark:bg-zinc-700">
              <div
                className={`h-full rounded-full transition-all ${session.status === 'completed' ? 'bg-green-500' : 'bg-kb-accent'}`}
                style={{ width: `${pct}%` }}
              />
            </div>
            <span className="text-xs text-kb-gray-600 dark:text-zinc-400">{answered} / {totalVisible} preguntas</span>
          </div>
        </div>

        {/* Content streams in behind a skeleton */}
        <Suspense fallback={<DetailSkeleton />}>
          <SessionDetailLoader
            sessionId={params.sessionId}
            blocksWithQuestions={blocksWithQuestions}
            answers={answers}
          />
        </Suspense>
      </div>

      <AdminFooter />
    </div>
  )
}
