'use client'

import { useState } from 'react'
import { Block, FormTypeWithBlocks } from '@/lib/types'

interface Props {
  blocks: Block[]
  initialFormTypes: FormTypeWithBlocks[]
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition ${
        checked ? 'bg-kb-accent' : 'bg-kb-gray-200 dark:bg-zinc-700'
      }`}
    >
      <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition ${
        checked ? 'translate-x-4' : 'translate-x-1'
      }`} />
    </button>
  )
}

function InlineEdit({
  value,
  sub,
  onSave,
}: {
  value: string
  sub?: string | null
  onSave: (name: string, description: string) => void
}) {
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState(value)
  const [desc, setDesc] = useState(sub ?? '')

  if (!editing) {
    return (
      <button className="text-left group" onClick={() => setEditing(true)} title="Clic para editar">
        <p className="text-sm font-semibold text-kb-black group-hover:text-kb-accent-dark transition dark:text-white">
          {name}
        </p>
        {desc && <p className="text-xs text-kb-gray-600 dark:text-zinc-500">{desc}</p>}
      </button>
    )
  }

  return (
    <div className="flex flex-col gap-1.5 flex-1">
      <input
        autoFocus
        value={name}
        onChange={(e) => setName(e.target.value)}
        className="rounded border border-kb-accent px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-kb-accent dark:border-kb-accent dark:bg-zinc-800 dark:text-white"
      />
      <input
        value={desc}
        onChange={(e) => setDesc(e.target.value)}
        placeholder="Descripción (opcional)"
        className="rounded border border-kb-gray-200 px-2 py-1 text-xs text-kb-gray-600 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400 dark:placeholder-zinc-600"
      />
      <div className="flex gap-2">
        <button
          onClick={() => { onSave(name, desc); setEditing(false) }}
          className="rounded bg-kb-accent px-2 py-0.5 text-xs font-bold text-kb-black hover:bg-kb-accent-dark"
        >
          Guardar
        </button>
        <button
          onClick={() => { setName(value); setDesc(sub ?? ''); setEditing(false) }}
          className="rounded border border-kb-gray-200 px-2 py-0.5 text-xs text-kb-gray-600 hover:bg-kb-gray-100 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
        >
          Cancelar
        </button>
      </div>
    </div>
  )
}

export function FormTypeConfig({ blocks, initialFormTypes }: Props) {
  const [formTypes, setFormTypes] = useState<FormTypeWithBlocks[]>(initialFormTypes)
  const [expandedBlocks, setExpandedBlocks] = useState<Record<string, Set<string>>>({})
  const [creating, setCreating] = useState(false)
  const [newName, setNewName] = useState('')
  const [newDesc, setNewDesc] = useState('')
  const [saving, setSaving] = useState(false)
  const [deleteError, setDeleteError] = useState<string | null>(null)

  const toggleExpand = (formTypeId: string, blockId: string) => {
    setExpandedBlocks((prev) => {
      const current = new Set(prev[formTypeId] ?? [])
      if (current.has(blockId)) current.delete(blockId)
      else current.add(blockId)
      return { ...prev, [formTypeId]: current }
    })
  }

  const isExpanded = (formTypeId: string, blockId: string) =>
    expandedBlocks[formTypeId]?.has(blockId) ?? false

  const updateType = async (id: string, patch: Partial<FormTypeWithBlocks>) => {
    setFormTypes((prev) => prev.map((ft) => (ft.id === id ? { ...ft, ...patch } : ft)))
    await fetch(`/api/config/form-types/${id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(patch),
    })
  }

  const toggleBlock = async (formTypeId: string, blockId: string, assign: boolean) => {
    setFormTypes((prev) =>
      prev.map((ft) =>
        ft.id !== formTypeId ? ft : {
          ...ft,
          blockIds: assign
            ? [...ft.blockIds, blockId]
            : ft.blockIds.filter((id) => id !== blockId),
          // When removing a block, also clear its question exclusions from local state
          excludedQuestionIds: assign
            ? ft.excludedQuestionIds
            : ft.excludedQuestionIds.filter((qId) => {
                const block = blocks.find((b) => b.id === blockId)
                return !block?.questions.some((q) => q.id === qId)
              }),
        }
      )
    )

    if (assign) {
      await fetch(`/api/config/form-types/${formTypeId}/blocks`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ blockId }),
      })
    } else {
      await fetch(`/api/config/form-types/${formTypeId}/blocks/${blockId}`, {
        method: 'DELETE',
      })
      // Collapse the block if it was expanded
      setExpandedBlocks((prev) => {
        const current = new Set(prev[formTypeId] ?? [])
        current.delete(blockId)
        return { ...prev, [formTypeId]: current }
      })
    }
  }

  const toggleQuestion = async (formTypeId: string, questionId: string, exclude: boolean) => {
    setFormTypes((prev) =>
      prev.map((ft) =>
        ft.id !== formTypeId ? ft : {
          ...ft,
          excludedQuestionIds: exclude
            ? [...ft.excludedQuestionIds, questionId]
            : ft.excludedQuestionIds.filter((id) => id !== questionId),
        }
      )
    )

    if (exclude) {
      await fetch(`/api/config/form-types/${formTypeId}/exclusions`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ questionId }),
      })
    } else {
      await fetch(`/api/config/form-types/${formTypeId}/exclusions/${questionId}`, {
        method: 'DELETE',
      })
    }
  }

  const createType = async () => {
    if (!newName.trim()) return
    setSaving(true)
    const res = await fetch('/api/config/form-types', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ name: newName.trim(), description: newDesc.trim() || null }),
    })
    const data = await res.json()
    setSaving(false)
    if (res.ok) {
      setFormTypes((prev) => [...prev, data])
      setNewName('')
      setNewDesc('')
      setCreating(false)
    }
  }

  const deleteType = async (id: string) => {
    setDeleteError(null)
    const res = await fetch(`/api/config/form-types/${id}`, { method: 'DELETE' })
    if (res.ok) {
      setFormTypes((prev) => prev.filter((ft) => ft.id !== id))
    } else {
      const data = await res.json()
      setDeleteError(data.error ?? 'Error al eliminar')
    }
  }

  return (
    <div className="space-y-4">
      {formTypes.map((ft) => {
        const assignedBlocks = blocks.filter((b) => ft.blockIds.includes(b.id))
        const unassignedBlocks = blocks.filter((b) => !ft.blockIds.includes(b.id))

        return (
          <div
            key={ft.id}
            className={`rounded-xl border overflow-hidden transition ${
              ft.is_active
                ? 'border-kb-gray-200 bg-white dark:border-zinc-700 dark:bg-zinc-900'
                : 'border-kb-gray-100 bg-white opacity-60 dark:border-zinc-800 dark:bg-zinc-900'
            }`}
          >
            {/* Header */}
            <div className="flex items-center gap-4 px-5 py-4 border-b border-kb-gray-100 dark:border-zinc-800">
              <div className="flex-1 min-w-0">
                <InlineEdit
                  value={ft.name}
                  sub={ft.description}
                  onSave={(name, description) => updateType(ft.id, { name, description })}
                />
              </div>
              <div className="flex items-center gap-3 shrink-0">
                <button
                  onClick={() => deleteType(ft.id)}
                  className="text-xs text-kb-gray-200 hover:text-red-500 transition dark:text-zinc-700 dark:hover:text-red-400"
                  title="Eliminar tipo"
                >
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                      d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                  </svg>
                </button>
                <Toggle checked={ft.is_active} onChange={(v) => updateType(ft.id, { is_active: v })} />
              </div>
            </div>

            <div className="px-5 py-4 space-y-4">
              {/* Assigned blocks with question accordion */}
              {assignedBlocks.length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-kb-gray-600 dark:text-zinc-500">
                    Bloques incluidos
                  </p>
                  <div className="space-y-2">
                    {assignedBlocks.map((b) => {
                      const expanded = isExpanded(ft.id, b.id)
                      const activeQuestions = b.questions.filter((q) => q.is_active)
                      const includedCount = activeQuestions.filter(
                        (q) => !ft.excludedQuestionIds.includes(q.id)
                      ).length

                      return (
                        <div
                          key={b.id}
                          className="rounded-lg border border-kb-accent/30 bg-[#fefae6] dark:border-kb-accent/20 dark:bg-kb-accent/5"
                        >
                          {/* Block row */}
                          <div className="flex items-center gap-3 px-3 py-2">
                            <span className="text-xs text-kb-accent-dark dark:text-kb-accent">✓</span>
                            <span className="flex-1 text-sm font-medium text-kb-black dark:text-white">
                              {b.title}
                            </span>
                            <span className="text-xs text-kb-gray-600 dark:text-zinc-500">
                              {includedCount}/{activeQuestions.length} preguntas
                            </span>
                            {activeQuestions.length > 0 && (
                              <button
                                onClick={() => toggleExpand(ft.id, b.id)}
                                className="text-kb-gray-600 hover:text-kb-accent-dark transition dark:text-zinc-500 dark:hover:text-kb-accent"
                                title={expanded ? 'Colapsar' : 'Ver preguntas'}
                              >
                                <svg
                                  className={`h-4 w-4 transition-transform ${expanded ? 'rotate-180' : ''}`}
                                  fill="none" stroke="currentColor" viewBox="0 0 24 24"
                                >
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                                </svg>
                              </button>
                            )}
                            <button
                              onClick={() => toggleBlock(ft.id, b.id, false)}
                              className="text-kb-gray-200 hover:text-red-400 transition dark:text-zinc-600 dark:hover:text-red-400"
                              title="Quitar bloque"
                            >
                              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                              </svg>
                            </button>
                          </div>

                          {/* Questions accordion */}
                          {expanded && activeQuestions.length > 0 && (
                            <div className="border-t border-kb-accent/20 px-3 py-2 space-y-1 dark:border-kb-accent/10">
                              {activeQuestions.map((q) => {
                                const included = !ft.excludedQuestionIds.includes(q.id)
                                return (
                                  <label
                                    key={q.id}
                                    className="flex items-center gap-2.5 cursor-pointer group py-0.5"
                                  >
                                    <input
                                      type="checkbox"
                                      checked={included}
                                      onChange={() => toggleQuestion(ft.id, q.id, included)}
                                      className="h-3.5 w-3.5 rounded border-kb-gray-200 accent-kb-accent-dark cursor-pointer"
                                    />
                                    <span className={`text-xs transition ${
                                      included
                                        ? 'text-kb-black dark:text-zinc-200'
                                        : 'text-kb-gray-200 line-through dark:text-zinc-600'
                                    }`}>
                                      {q.label}
                                    </span>
                                    <span className="ml-auto text-xs text-kb-gray-200 dark:text-zinc-700">
                                      {q.type === 'ai_assisted' ? 'IA' : q.type}
                                    </span>
                                  </label>
                                )
                              })}
                            </div>
                          )}
                        </div>
                      )
                    })}
                  </div>
                </div>
              )}

              {/* Unassigned blocks */}
              {unassignedBlocks.length > 0 && (
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-kb-gray-600 dark:text-zinc-500">
                    {assignedBlocks.length > 0 ? 'Añadir más bloques' : 'Bloques disponibles'}
                  </p>
                  <div className="flex flex-wrap gap-2">
                    {unassignedBlocks.map((b) => (
                      <button
                        key={b.id}
                        onClick={() => toggleBlock(ft.id, b.id, true)}
                        className="flex items-center gap-1.5 rounded-lg border border-kb-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-kb-gray-600 hover:border-kb-accent/50 hover:text-kb-accent-dark transition dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400 dark:hover:border-kb-accent/50 dark:hover:text-kb-accent"
                      >
                        <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                        </svg>
                        {b.title}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          </div>
        )
      })}

      {deleteError && <p className="text-sm text-red-500">{deleteError}</p>}

      {/* Create new type */}
      {creating ? (
        <div className="rounded-xl border border-dashed border-kb-accent/40 bg-white p-5 dark:bg-zinc-900">
          <p className="mb-3 text-sm font-semibold text-kb-black dark:text-white">Nuevo tipo</p>
          <div className="space-y-2">
            <input
              autoFocus
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              placeholder="Nombre del tipo"
              className="w-full rounded border border-kb-accent px-3 py-1.5 text-sm focus:outline-none focus:ring-1 focus:ring-kb-accent dark:border-kb-accent dark:bg-zinc-800 dark:text-white dark:placeholder-zinc-500"
            />
            <input
              value={newDesc}
              onChange={(e) => setNewDesc(e.target.value)}
              placeholder="Descripción (opcional)"
              className="w-full rounded border border-kb-gray-200 px-3 py-1.5 text-xs text-kb-gray-600 focus:outline-none dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400 dark:placeholder-zinc-600"
            />
            <div className="flex gap-2 pt-1">
              <button
                onClick={createType}
                disabled={saving || !newName.trim()}
                className="rounded-lg bg-kb-accent px-3 py-1.5 text-xs font-bold text-kb-black hover:bg-kb-accent-dark disabled:opacity-40"
              >
                {saving ? 'Creando…' : 'Crear'}
              </button>
              <button
                onClick={() => { setCreating(false); setNewName(''); setNewDesc('') }}
                className="rounded-lg border border-kb-gray-200 px-3 py-1.5 text-xs text-kb-gray-600 hover:bg-kb-gray-100 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
              >
                Cancelar
              </button>
            </div>
          </div>
        </div>
      ) : (
        <button
          onClick={() => setCreating(true)}
          className="flex items-center gap-2 rounded-xl border border-dashed border-kb-gray-200 px-5 py-3.5 text-sm text-kb-gray-600 hover:border-kb-accent/50 hover:text-kb-accent-dark transition w-full dark:border-zinc-700 dark:text-zinc-500 dark:hover:border-kb-accent/50"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Añadir tipo de formulario
        </button>
      )}
    </div>
  )
}
