import Link from 'next/link'
import sql from '@/lib/db'
import { AdminNav } from '@/components/AdminNav'
import { ClientTable } from '@/components/dashboard/ClientTable'

export default async function Home() {
  const [stats] = await sql`
    SELECT
      COUNT(*) FILTER (WHERE NOT is_deleted)                                              AS total,
      COUNT(*) FILTER (WHERE status = 'completed'         AND NOT is_deleted)            AS completed,
      COUNT(*) FILTER (WHERE status = 'in_progress'       AND NOT is_deleted)            AS in_progress,
      COUNT(*) FILTER (WHERE status = 'pending_ai_review' AND NOT is_deleted)            AS pending_ai_review,
      COUNT(*) FILTER (WHERE status = 'pending'           AND NOT is_deleted)            AS pending
    FROM sessions
  `

  const active = await sql`
    SELECT id, client_name, client_email, status, progress, updated_at
    FROM sessions
    WHERE NOT is_deleted AND NOT is_archived
    ORDER BY updated_at DESC
    LIMIT 100
  `

  const archived = await sql`
    SELECT id, client_name, client_email, status, progress, updated_at
    FROM sessions
    WHERE NOT is_deleted AND is_archived
    ORDER BY updated_at DESC
    LIMIT 100
  `

  const statCards = [
    { label: 'Total clientes',  value: stats.total,              color: 'text-zinc-800' },
    { label: 'Completados',     value: stats.completed,          color: 'text-green-600' },
    { label: 'En progreso',     value: stats.in_progress,        color: 'text-violet-600' },
    { label: 'Revisar IA',      value: stats.pending_ai_review,  color: 'text-amber-600' },
    { label: 'Pendientes',      value: stats.pending,            color: 'text-zinc-400' },
  ]

  return (
    <div className="min-h-screen bg-zinc-50">
      <AdminNav active="clients" />

      <div className="mx-auto max-w-5xl px-6 py-8">
        {/* Stats */}
        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-5">
          {statCards.map((s) => (
            <div key={s.label} className="rounded-xl border border-zinc-200 bg-white p-5">
              <p className="text-sm text-zinc-400">{s.label}</p>
              <p className={`mt-1 text-3xl font-bold ${s.color}`}>{String(s.value)}</p>
            </div>
          ))}
        </div>

        <ClientTable
          active={active as any[]}
          archived={archived as any[]}
        />
      </div>
    </div>
  )
}
