import Link from 'next/link'
import sql from '@/lib/db'
import { AdminNav } from '@/components/AdminNav'
import { AdminFooter } from '@/components/AdminFooter'
import { ClientTable } from '@/components/dashboard/ClientTable'

export const dynamic = 'force-dynamic'

export default async function Home() {
  const [[stats], active, archived] = await Promise.all([
    sql`
      SELECT
        COUNT(*) FILTER (WHERE NOT is_deleted)                                              AS total,
        COUNT(*) FILTER (WHERE status = 'completed'         AND NOT is_deleted)            AS completed,
        COUNT(*) FILTER (WHERE status = 'in_progress'       AND NOT is_deleted)            AS in_progress,
        COUNT(*) FILTER (WHERE status = 'pending_ai_review' AND NOT is_deleted)            AS pending_ai_review,
        COUNT(*) FILTER (WHERE status = 'pending'           AND NOT is_deleted)            AS pending
      FROM sessions
    `,
    sql`
      SELECT id, client_name, client_email, status, progress, updated_at
      FROM sessions
      WHERE NOT is_deleted AND NOT is_archived
      ORDER BY updated_at DESC
      LIMIT 100
    `,
    sql`
      SELECT id, client_name, client_email, status, progress, updated_at
      FROM sessions
      WHERE NOT is_deleted AND is_archived
      ORDER BY updated_at DESC
      LIMIT 100
    `,
  ])

  const statCards = [
    { label: 'Total clientes',  value: stats.total,              color: 'text-kb-black dark:text-white' },
    { label: 'Completados',     value: stats.completed,          color: 'text-green-600' },
    { label: 'En progreso',     value: stats.in_progress,        color: 'text-kb-accent-dark' },
    { label: 'Revisar IA',      value: stats.pending_ai_review,  color: 'text-amber-600' },
    { label: 'Pendientes',      value: stats.pending,            color: 'text-kb-gray-600' },
  ]

  return (
    <div className="min-h-screen bg-kb-gray-100 dark:bg-kb-black">
      <AdminNav active="clients" />

      <div className="mx-auto max-w-5xl px-6 py-8">
        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-5">
          {statCards.map((s) => (
            <div key={s.label} className="rounded-xl border border-kb-gray-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
              <p className="text-sm text-kb-gray-600 dark:text-zinc-500">{s.label}</p>
              <p className={`mt-1 text-3xl font-bold ${s.color}`}>{String(s.value)}</p>
            </div>
          ))}
        </div>

        <ClientTable
          active={active as any[]}
          archived={archived as any[]}
        />
      </div>

      <AdminFooter />
    </div>
  )
}
