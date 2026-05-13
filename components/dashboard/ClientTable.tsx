'use client'

import { useState } from 'react'
import Link from 'next/link'

interface SessionRow {
  id: string
  client_name: string
  client_email: string | null
  status: string
  progress: number
  updated_at: string
}

interface Props {
  active: SessionRow[]
  archived: SessionRow[]
}

const STATUS_LABEL: Record<string, string> = {
  completed: 'Completado',
  in_progress: 'En progreso',
  pending_ai_review: 'Revisar IA',
  pending: 'Pendiente',
}

const STATUS_CLASS: Record<string, string> = {
  completed: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
  in_progress: 'bg-[#fefae6] text-kb-accent-dark',
  pending_ai_review: 'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400',
  pending: 'bg-kb-gray-100 text-kb-gray-600 dark:bg-zinc-800 dark:text-zinc-400',
}

async function patchSession(id: string, body: Record<string, unknown>) {
  await fetch(`/api/sessions/${id}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })
}

function RelativeDate({ iso }: { iso: string }) {
  return (
    <span>
      {new Date(iso).toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'short',
        hour: '2-digit',
        minute: '2-digit',
      })}
    </span>
  )
}

function Row({
  s,
  onArchive,
  onDelete,
  muted = false,
  onRestore,
}: {
  s: SessionRow
  onArchive?: () => void
  onDelete: () => void
  muted?: boolean
  onRestore?: () => void
}) {
  const [confirmDelete, setConfirmDelete] = useState(false)

  return (
    <tr
      className={`border-b border-kb-gray-100 last:border-0 transition dark:border-zinc-800 ${
        muted ? 'opacity-60' : 'hover:bg-kb-gray-100 dark:hover:bg-zinc-800/50'
      }`}
    >
      <td className="px-5 py-4">
        <div className={`font-semibold ${muted ? 'text-kb-gray-600 dark:text-zinc-400' : 'text-kb-black dark:text-white'}`}>
          {s.client_name}
        </div>
        {s.client_email && (
          <div className="text-xs text-kb-gray-600 dark:text-zinc-500">{s.client_email}</div>
        )}
      </td>

      <td className="px-5 py-4">
        <span className={`rounded-full px-2 py-0.5 text-xs font-semibold ${STATUS_CLASS[s.status] ?? STATUS_CLASS.pending}`}>
          {STATUS_LABEL[s.status] ?? s.status}
        </span>
      </td>

      <td className="px-5 py-4">
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-24 overflow-hidden rounded-full bg-kb-gray-200 dark:bg-zinc-700">
            <div
              className={`h-full rounded-full ${s.status === 'completed' ? 'bg-green-500' : 'bg-kb-accent'}`}
              style={{ width: `${s.progress}%` }}
            />
          </div>
          <span className="text-xs text-kb-gray-600 dark:text-zinc-500">{s.progress}%</span>
        </div>
      </td>

      <td className="px-5 py-4 text-xs text-kb-gray-600 dark:text-zinc-500">
        <RelativeDate iso={s.updated_at} />
      </td>

      {/* Actions */}
      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          {!muted && (
            <>
              <Link href={`/sessions/${s.id}`} className="text-xs font-semibold text-kb-accent-dark hover:underline">
                Ver respuestas
              </Link>
              <a
                href={`/form/${s.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-kb-gray-600 hover:underline dark:text-zinc-500"
              >
                Formulario
              </a>
            </>
          )}

          {/* Restore (archived rows) */}
          {muted && onRestore && (
            <button
              onClick={onRestore}
              className="text-xs font-semibold text-kb-gray-600 hover:text-kb-accent-dark transition dark:text-zinc-400"
            >
              Restaurar
            </button>
          )}

          {/* Archive (active rows) */}
          {onArchive && (
            <button
              onClick={onArchive}
              title="Archivar"
              className="rounded p-1 text-kb-gray-200 hover:bg-kb-gray-100 hover:text-kb-gray-600 transition dark:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-400"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                  d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
              </svg>
            </button>
          )}

          {/* Delete with inline confirm */}
          {confirmDelete ? (
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-kb-gray-600 dark:text-zinc-400">¿Eliminar?</span>
              <button
                onClick={() => { setConfirmDelete(false); onDelete() }}
                className="rounded bg-red-500 px-2 py-0.5 text-xs font-semibold text-white hover:bg-red-600 transition"
              >
                Sí
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="rounded border border-kb-gray-200 px-2 py-0.5 text-xs text-kb-gray-600 hover:bg-kb-gray-100 transition dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
              >
                No
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              title="Eliminar"
              className="rounded p-1 text-kb-gray-200 hover:bg-red-50 hover:text-red-400 transition dark:text-zinc-600 dark:hover:bg-red-900/20 dark:hover:text-red-400"
            >
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </button>
          )}
        </div>
      </td>
    </tr>
  )
}

export function ClientTable({ active: initialActive, archived: initialArchived }: Props) {
  const [activeRows, setActiveRows] = useState<SessionRow[]>(initialActive)
  const [archivedRows, setArchivedRows] = useState<SessionRow[]>(initialArchived)
  const [archiveOpen, setArchiveOpen] = useState(false)

  const allRows = [...activeRows, ...archivedRows]
  const stats = {
    total:            allRows.length,
    completed:        allRows.filter((r) => r.status === 'completed').length,
    in_progress:      allRows.filter((r) => r.status === 'in_progress').length,
    pending_ai_review: allRows.filter((r) => r.status === 'pending_ai_review').length,
    pending:          allRows.filter((r) => r.status === 'pending').length,
  }
  const statCards = [
    { label: 'Total clientes', value: stats.total,             color: 'text-kb-black dark:text-white' },
    { label: 'Completados',    value: stats.completed,         color: 'text-green-600' },
    { label: 'En progreso',    value: stats.in_progress,       color: 'text-kb-accent-dark' },
    { label: 'Revisar IA',     value: stats.pending_ai_review, color: 'text-amber-600' },
    { label: 'Pendientes',     value: stats.pending,           color: 'text-kb-gray-600' },
  ]

  const handleArchive = (s: SessionRow) => {
    setActiveRows((prev) => prev.filter((r) => r.id !== s.id))
    setArchivedRows((prev) => [s, ...prev])
    patchSession(s.id, { is_archived: true })
  }

  const handleRestore = (s: SessionRow) => {
    setArchivedRows((prev) => prev.filter((r) => r.id !== s.id))
    setActiveRows((prev) => [s, ...prev])
    patchSession(s.id, { is_archived: false })
  }

  const handleDelete = (id: string) => {
    setActiveRows((prev) => prev.filter((r) => r.id !== id))
    setArchivedRows((prev) => prev.filter((r) => r.id !== id))
    patchSession(id, { is_deleted: true })
  }

  const tableHead = (
    <thead>
      <tr className="border-b border-kb-gray-100 bg-kb-gray-100 text-left text-xs font-bold uppercase tracking-wide text-kb-gray-600 dark:border-zinc-800 dark:bg-zinc-800/50 dark:text-zinc-500">
        <th className="px-5 py-3">Cliente</th>
        <th className="px-5 py-3">Estado</th>
        <th className="px-5 py-3">Progreso</th>
        <th className="px-5 py-3">Última actividad</th>
        <th className="px-5 py-3"></th>
      </tr>
    </thead>
  )

  return (
    <div className="space-y-3">
      {/* Stat cards */}
      <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-5">
        {statCards.map((s) => (
          <div key={s.label} className="rounded-xl border border-kb-gray-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
            <p className="text-sm text-kb-gray-600 dark:text-zinc-500">{s.label}</p>
            <p className={`mt-1 text-3xl font-bold ${s.color}`}>{s.value}</p>
          </div>
        ))}
      </div>
      {/* Active sessions */}
      <div className="overflow-hidden rounded-xl border border-kb-gray-200 bg-white dark:border-zinc-800 dark:bg-zinc-900">
        {activeRows.length === 0 ? (
          <div className="py-16 text-center text-kb-gray-600 dark:text-zinc-500">
            <p className="text-lg font-bold">Sin clientes aún</p>
            <p className="mt-1 text-sm">Crea el primero con el botón de arriba</p>
          </div>
        ) : (
          <table className="w-full text-sm">
            {tableHead}
            <tbody>
              {activeRows.map((s) => (
                <Row
                  key={s.id}
                  s={s}
                  onArchive={() => handleArchive(s)}
                  onDelete={() => handleDelete(s.id)}
                />
              ))}
            </tbody>
          </table>
        )}
      </div>

      {/* Archived section */}
      {(archivedRows.length > 0 || archiveOpen) && (
        <div className="overflow-hidden rounded-xl border border-kb-gray-100 bg-white dark:border-zinc-800 dark:bg-zinc-900">
          <button
            onClick={() => setArchiveOpen((v) => !v)}
            className="flex w-full items-center justify-between px-5 py-3 text-left hover:bg-kb-gray-100 transition dark:hover:bg-zinc-800"
          >
            <div className="flex items-center gap-2 text-sm font-semibold text-kb-gray-600 dark:text-zinc-500">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                  d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
              </svg>
              Archivados
              <span className="rounded-full bg-kb-gray-100 px-2 py-0.5 text-xs dark:bg-zinc-800">
                {archivedRows.length}
              </span>
            </div>
            <svg
              className={`h-4 w-4 text-kb-gray-200 transition-transform duration-200 dark:text-zinc-600 ${archiveOpen ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {archiveOpen && archivedRows.length > 0 && (
            <div className="border-t border-kb-gray-100 dark:border-zinc-800">
              <table className="w-full text-sm">
                {tableHead}
                <tbody>
                  {archivedRows.map((s) => (
                    <Row
                      key={s.id}
                      s={s}
                      muted
                      onRestore={() => handleRestore(s)}
                      onDelete={() => handleDelete(s.id)}
                    />
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {archiveOpen && archivedRows.length === 0 && (
            <p className="border-t border-kb-gray-100 px-5 py-4 text-sm text-kb-gray-200 dark:border-zinc-800 dark:text-zinc-600">
              No hay sesiones archivadas
            </p>
          )}
        </div>
      )}
    </div>
  )
}
