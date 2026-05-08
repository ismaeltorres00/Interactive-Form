'use client'

import { useState } from 'react'
import { Block } from '@/lib/types'

interface Props {
  initialBlocks: Block[]
}

function Toggle({ checked, onChange }: { checked: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      type="button"
      onClick={() => onChange(!checked)}
      className={`relative inline-flex h-5 w-9 shrink-0 items-center rounded-full transition ${
        checked ? 'bg-violet-600' : 'bg-zinc-200'
      }`}
    >
      <span className={`inline-block h-3.5 w-3.5 transform rounded-full bg-white shadow transition ${
        checked ? 'translate-x-4' : 'translate-x-1'
      }`} />
    </button>
  )
}

function EditableLabel({
  value,
  sub,
  onSave,
}: {
  value: string
  sub?: string | null
  onSave: (label: string, sub: string) => void
}) {
  const [editing, setEditing] = useState(false)
  const [label, setLabel] = useState(value)
  const [helper, setHelper] = useState(sub ?? '')

  if (!editing) {
    return (
      <button
        className="text-left group"
        onClick={() => setEditing(true)}
        title="Clic para editar"
      >
        <p className="text-sm font-medium text-zinc-800 group-hover:text-violet-600 transition">{label}</p>
        {helper && <p className="text-xs text-zinc-400">{helper}</p>}
      </button>
    )
  }

  return (
    <div className="flex flex-col gap-1.5 flex-1">
      <input
        autoFocus
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        className="rounded border border-violet-300 px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-violet-500"
      />
      <input
        value={helper}
        onChange={(e) => setHelper(e.target.value)}
        placeholder="Texto de ayuda (opcional)"
        className="rounded border border-zinc-200 px-2 py-1 text-xs text-zinc-500 focus:outline-none focus:ring-1 focus:ring-violet-300"
      />
      <div className="flex gap-2">
        <button
          onClick={() => { onSave(label, helper); setEditing(false) }}
          className="rounded bg-violet-600 px-2 py-0.5 text-xs font-medium text-white hover:bg-violet-700"
        >
          Guardar
        </button>
        <button
          onClick={() => { setLabel(value); setHelper(sub ?? ''); setEditing(false) }}
          className="rounded border border-zinc-200 px-2 py-0.5 text-xs text-zinc-500 hover:bg-zinc-50"
        >
          Cancelar
        </button>
      </div>
    </div>
  )
}

export function FormConfig({ initialBlocks }: Props) {
  const [blocks, setBlocks] = useState<Block[]>(initialBlocks)

  const toggleBlock = async (blockId: string, value: boolean) => {
    setBlocks((prev) =>
      prev.map((b) => (b.id === blockId ? { ...b, is_active: value } : b))
    )
    await fetch(`/api/config/blocks/${blockId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: value }),
    })
  }

  const toggleQuestion = async (blockId: string, questionId: string, value: boolean) => {
    setBlocks((prev) =>
      prev.map((b) =>
        b.id === blockId
          ? { ...b, questions: b.questions.map((q) => (q.id === questionId ? { ...q, is_active: value } : q)) }
          : b
      )
    )
    await fetch(`/api/config/questions/${questionId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: value }),
    })
  }

  const saveBlockLabel = async (blockId: string, title: string, description: string) => {
    setBlocks((prev) =>
      prev.map((b) => (b.id === blockId ? { ...b, title, description } : b))
    )
    await fetch(`/api/config/blocks/${blockId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ title, description }),
    })
  }

  const saveQuestionLabel = async (blockId: string, questionId: string, label: string, helper_text: string) => {
    setBlocks((prev) =>
      prev.map((b) =>
        b.id === blockId
          ? { ...b, questions: b.questions.map((q) => (q.id === questionId ? { ...q, label, helper_text } : q)) }
          : b
      )
    )
    await fetch(`/api/config/questions/${questionId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ label, helper_text }),
    })
  }

  const typeLabels: Record<string, string> = {
    text: 'Texto',
    textarea: 'Texto largo',
    select: 'Selección',
    multiselect: 'Multi',
    boolean: 'Sí/No',
    ai_assisted: 'IA',
  }

  return (
    <div className="space-y-4">
      {blocks.map((block, bi) => (
        <div
          key={block.id}
          className={`rounded-xl border bg-white overflow-hidden transition ${
            block.is_active ? 'border-zinc-200' : 'border-zinc-100 opacity-60'
          }`}
        >
          {/* Block header */}
          <div className="flex items-center gap-4 px-5 py-4 border-b border-zinc-100">
            <span className="text-xs font-mono text-zinc-300 w-5">{bi + 1}</span>
            <div className="flex-1 min-w-0">
              <EditableLabel
                value={block.title}
                sub={block.description}
                onSave={(title, desc) => saveBlockLabel(block.id, title, desc)}
              />
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs text-zinc-400">{block.questions.length} preguntas</span>
              <Toggle
                checked={block.is_active}
                onChange={(v) => toggleBlock(block.id, v)}
              />
            </div>
          </div>

          {/* Questions */}
          <div className="divide-y divide-zinc-50">
            {block.questions.map((q) => (
              <div
                key={q.id}
                className={`flex items-center gap-4 px-5 py-3 ${!q.is_active ? 'opacity-50' : ''}`}
              >
                <span className="w-5" />
                <div className="flex-1 min-w-0">
                  <EditableLabel
                    value={q.label}
                    sub={q.helper_text}
                    onSave={(label, helper) => saveQuestionLabel(block.id, q.id, label, helper)}
                  />
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <span className={`rounded px-1.5 py-0.5 text-xs font-medium ${
                    q.type === 'ai_assisted'
                      ? 'bg-violet-50 text-violet-500'
                      : 'bg-zinc-100 text-zinc-400'
                  }`}>
                    {typeLabels[q.type] ?? q.type}
                  </span>
                  {q.required && (
                    <span className="text-xs text-zinc-300">Requerida</span>
                  )}
                  <Toggle
                    checked={q.is_active}
                    onChange={(v) => toggleQuestion(block.id, q.id, v)}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      ))}
    </div>
  )
}
