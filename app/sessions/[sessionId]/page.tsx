import { notFound } from 'next/navigation'
import Link from 'next/link'
import sql from '@/lib/db'
import { AdminNav } from '@/components/AdminNav'
import { SessionDetail } from '@/components/dashboard/SessionDetail'
import { ExportActions } from '@/components/dashboard/ExportActions'
import { isDriveConnected } from '@/lib/drive'
import { Block, Question, Answer } from '@/lib/types'

interface Props {
  params: { sessionId: string }
}

export default async function SessionPage({ params }: Props) {
  const [session] = await sql`
    SELECT * FROM sessions WHERE id = ${params.sessionId}
  `
  if (!session) notFound()

  const [blocks, questions, answersRaw, driveConnected] = await Promise.all([
    sql`SELECT * FROM blocks ORDER BY "order"`,
    sql`SELECT * FROM questions ORDER BY "order"` as Promise<Question[]>,
    sql`SELECT * FROM answers WHERE session_id = ${params.sessionId}`,
    isDriveConnected(),
  ])
  const answers = answersRaw

  const blocksWithQuestions: Block[] = (blocks as unknown as Omit<Block, 'questions'>[]).map((b) => ({
    ...b,
    questions: questions.filter((q) => q.block_id === b.id),
  }))

  const totalVisible = questions.filter((q) => q.is_active && q.type !== 'ai_assisted').length
  const answered = answers.filter((a) => a.value && a.value.trim() !== '').length

  return (
    <div className="min-h-screen bg-zinc-50">
      <AdminNav active="clients" />

      <div className="mx-auto max-w-3xl px-6 py-8">
        {/* Header */}
        <div className="mb-6">
          <Link href="/" className="text-xs text-zinc-400 hover:text-zinc-600 transition">
            ← Volver al panel
          </Link>
          <div className="mt-3 flex items-start justify-between">
            <div>
              <h1 className="text-xl font-bold text-zinc-800">{session.client_name}</h1>
              {session.client_email && (
                <p className="text-sm text-zinc-400">{session.client_email}</p>
              )}
            </div>
            <div className="flex items-center gap-3">
              <span className={`rounded-full px-3 py-1 text-xs font-medium ${
                session.status === 'completed'         ? 'bg-green-100 text-green-700' :
                session.status === 'in_progress'       ? 'bg-violet-100 text-violet-700' :
                session.status === 'pending_ai_review' ? 'bg-amber-100 text-amber-700' :
                'bg-zinc-100 text-zinc-500'
              }`}>
                {session.status === 'completed'         ? 'Completado' :
                 session.status === 'in_progress'       ? 'En progreso' :
                 session.status === 'pending_ai_review' ? 'Revisar IA' : 'Pendiente'}
              </span>
              <a
                href={`/form/${session.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50 transition"
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

          {/* Progress bar */}
          {(() => {
            const pct = totalVisible > 0 ? Math.round((answered / totalVisible) * 100) : 0
            return (
              <div className="mt-4 flex items-center gap-3">
                <div className="h-2 flex-1 overflow-hidden rounded-full bg-zinc-200">
                  <div
                    className={`h-full rounded-full transition-all ${session.status === 'completed' ? 'bg-green-500' : 'bg-violet-500'}`}
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="text-xs text-zinc-500">{answered} / {totalVisible} preguntas</span>
              </div>
            )
          })()}
        </div>

        <SessionDetail
          sessionId={params.sessionId}
          blocks={blocksWithQuestions}
          answers={answers as unknown as Answer[]}
        />
      </div>
    </div>
  )
}
