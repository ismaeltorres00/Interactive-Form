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
  completed: 'bg-green-100 text-green-700',
  in_progress: 'bg-violet-100 text-violet-700',
  pending_ai_review: 'bg-amber-100 text-amber-700',
  pending: 'bg-zinc-100 text-zinc-500',
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
      className={`border-b border-zinc-50 last:border-0 transition ${
        muted ? 'opacity-60' : 'hover:bg-zinc-50'
      }`}
    >
      <td className="px-5 py-4">
        <div className={`font-medium ${muted ? 'text-zinc-500' : 'text-zinc-800'}`}>
          {s.client_name}
        </div>
        {s.client_email && (
          <div className="text-xs text-zinc-400">{s.client_email}</div>
        )}
      </td>

      <td className="px-5 py-4">
        <span className={`rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_CLASS[s.status] ?? STATUS_CLASS.pending}`}>
          {STATUS_LABEL[s.status] ?? s.status}
        </span>
      </td>

      <td className="px-5 py-4">
        <div className="flex items-center gap-2">
          <div className="h-1.5 w-24 overflow-hidden rounded-full bg-zinc-200">
            <div
              className={`h-full rounded-full ${s.status === 'completed' ? 'bg-green-500' : 'bg-violet-500'}`}
              style={{ width: `${s.progress}%` }}
            />
          </div>
          <span className="text-xs text-zinc-400">{s.progress}%</span>
        </div>
      </td>

      <td className="px-5 py-4 text-xs text-zinc-400">
        <RelativeDate iso={s.updated_at} />
      </td>

      {/* Actions */}
      <td className="px-5 py-4">
        <div className="flex items-center gap-3">
          {!muted && (
            <>
              <Link href={`/sessions/${s.id}`} className="text-xs font-medium text-violet-600 hover:underline">
                Ver respuestas
              </Link>
              <a
                href={`/form/${s.id}`}
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-zinc-400 hover:underline"
              >
                Formulario
              </a>
            </>
          )}

          {/* Restore (archived rows) */}
          {muted && onRestore && (
            <button
              onClick={onRestore}
              className="text-xs font-medium text-zinc-500 hover:text-violet-600 transition"
            >
              Restaurar
            </button>
          )}

          {/* Archive (active rows) */}
          {onArchive && (
            <button
              onClick={onArchive}
              title="Archivar"
              className="rounded p-1 text-zinc-300 hover:bg-zinc-100 hover:text-zinc-500 transition"
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
              <span className="text-xs text-zinc-500">¿Eliminar?</span>
              <button
                onClick={() => { setConfirmDelete(false); onDelete() }}
                className="rounded bg-red-500 px-2 py-0.5 text-xs font-medium text-white hover:bg-red-600 transition"
              >
                Sí
              </button>
              <button
                onClick={() => setConfirmDelete(false)}
                className="rounded border border-zinc-200 px-2 py-0.5 text-xs text-zinc-500 hover:bg-zinc-50 transition"
              >
                No
              </button>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDelete(true)}
              title="Eliminar"
              className="rounded p-1 text-zinc-300 hover:bg-red-50 hover:text-red-400 transition"
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
      <tr className="border-b border-zinc-100 bg-zinc-50 text-left text-xs font-medium uppercase tracking-wide text-zinc-400">
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
      {/* Active sessions */}
      <div className="overflow-hidden rounded-xl border border-zinc-200 bg-white">
        {activeRows.length === 0 ? (
          <div className="py-16 text-center text-zinc-400">
            <p className="text-lg font-medium">Sin clientes aún</p>
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
        <div className="overflow-hidden rounded-xl border border-zinc-100 bg-white">
          <button
            onClick={() => setArchiveOpen((v) => !v)}
            className="flex w-full items-center justify-between px-5 py-3 text-left hover:bg-zinc-50 transition"
          >
            <div className="flex items-center gap-2 text-sm font-medium text-zinc-400">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                  d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
              </svg>
              Archivados
              <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-xs">
                {archivedRows.length}
              </span>
            </div>
            <svg
              className={`h-4 w-4 text-zinc-300 transition-transform duration-200 ${archiveOpen ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>

          {archiveOpen && archivedRows.length > 0 && (
            <div className="border-t border-zinc-100">
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
            <p className="border-t border-zinc-50 px-5 py-4 text-sm text-zinc-300">
              No hay sesiones archivadas
            </p>
          )}
        </div>
      )}
    </div>
  )
}
