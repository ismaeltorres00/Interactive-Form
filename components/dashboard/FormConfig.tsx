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
        checked ? 'bg-kb-accent' : 'bg-kb-gray-200 dark:bg-zinc-700'
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
        <p className="text-sm font-semibold text-kb-black group-hover:text-kb-accent-dark transition dark:text-white">{label}</p>
        {helper && <p className="text-xs text-kb-gray-600 dark:text-zinc-500">{helper}</p>}
      </button>
    )
  }

  return (
    <div className="flex flex-col gap-1.5 flex-1">
      <input
        autoFocus
        value={label}
        onChange={(e) => setLabel(e.target.value)}
        className="rounded border border-kb-accent px-2 py-1 text-sm focus:outline-none focus:ring-1 focus:ring-kb-accent dark:border-kb-accent dark:bg-zinc-800 dark:text-white"
      />
      <input
        value={helper}
        onChange={(e) => setHelper(e.target.value)}
        placeholder="Texto de ayuda (opcional)"
        className="rounded border border-kb-gray-200 px-2 py-1 text-xs text-kb-gray-600 focus:outline-none focus:ring-1 focus:ring-kb-accent/50 dark:border-zinc-700 dark:bg-zinc-800 dark:text-zinc-400 dark:placeholder-zinc-600"
      />
      <div className="flex gap-2">
        <button
          onClick={() => { onSave(label, helper); setEditing(false) }}
          className="rounded bg-kb-accent px-2 py-0.5 text-xs font-bold text-kb-black hover:bg-kb-accent-dark"
        >
          Guardar
        </button>
        <button
          onClick={() => { setLabel(value); setHelper(sub ?? ''); setEditing(false) }}
          className="rounded border border-kb-gray-200 px-2 py-0.5 text-xs text-kb-gray-600 hover:bg-kb-gray-100 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
        >
          Cancelar
        </button>
      </div>
    </div>
  )
}

function EditablePrompt({
  questionId,
  initialPrompt,
  onSaved,
}: {
  questionId: string
  initialPrompt: string | null | undefined
  onSaved: (prompt: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [prompt, setPrompt] = useState(initialPrompt ?? '')
  const [saving, setSaving] = useState(false)

  const save = async () => {
    setSaving(true)
    await fetch(`/api/config/questions/${questionId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ai_prompt: prompt }),
    })
    setSaving(false)
    onSaved(prompt)
    setOpen(false)
  }

  return (
    <div className="mt-1">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-1 text-xs text-kb-accent-dark hover:underline"
      >
        <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
            d="M5 3l1.5 4.5L11 9l-4.5 1.5L5 15l-1.5-4.5L-1 9l4.5-1.5L5 3z" />
        </svg>
        {open ? 'Cerrar prompt IA' : 'Editar prompt IA'}
      </button>
      {open && (
        <div className="mt-2 flex flex-col gap-2">
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            rows={3}
            className="w-full rounded border border-kb-accent px-2 py-1.5 text-xs text-kb-black focus:outline-none focus:ring-1 focus:ring-kb-accent dark:border-kb-accent dark:bg-zinc-800 dark:text-white resize-none"
          />
          <div className="flex gap-2">
            <button
              onClick={save}
              disabled={saving}
              className="rounded bg-kb-accent px-2 py-0.5 text-xs font-bold text-kb-black hover:bg-kb-accent-dark disabled:opacity-50"
            >
              {saving ? 'Guardando…' : 'Guardar'}
            </button>
            <button
              onClick={() => { setPrompt(initialPrompt ?? ''); setOpen(false) }}
              className="rounded border border-kb-gray-200 px-2 py-0.5 text-xs text-kb-gray-600 hover:bg-kb-gray-100 dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}
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

  const saveQuestionPrompt = (blockId: string, questionId: string, prompt: string) => {
    setBlocks((prev) =>
      prev.map((b) =>
        b.id === blockId
          ? { ...b, questions: b.questions.map((q) => (q.id === questionId ? { ...q, ai_prompt: prompt } : q)) }
          : b
      )
    )
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
          className={`rounded-xl border overflow-hidden transition ${
            block.is_active
              ? 'border-kb-gray-200 bg-white dark:border-zinc-700 dark:bg-zinc-900'
              : 'border-kb-gray-100 bg-white opacity-60 dark:border-zinc-800 dark:bg-zinc-900'
          }`}
        >
          {/* Block header */}
          <div className="flex items-center gap-4 px-5 py-4 border-b border-kb-gray-100 dark:border-zinc-800">
            <span className="text-xs font-mono text-kb-gray-200 w-5 dark:text-zinc-600">{bi + 1}</span>
            <div className="flex-1 min-w-0">
              <EditableLabel
                value={block.title}
                sub={block.description}
                onSave={(title, desc) => saveBlockLabel(block.id, title, desc)}
              />
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-xs text-kb-gray-600 dark:text-zinc-500">{block.questions.length} preguntas</span>
              <Toggle
                checked={block.is_active}
                onChange={(v) => toggleBlock(block.id, v)}
              />
            </div>
          </div>

          {/* Questions */}
          <div className="divide-y divide-kb-gray-100 dark:divide-zinc-800">
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
                  <span className={`rounded px-1.5 py-0.5 text-xs font-semibold ${
                    q.type === 'ai_assisted'
                      ? 'bg-[#fefae6] text-kb-accent-dark'
                      : 'bg-kb-gray-100 text-kb-gray-600 dark:bg-zinc-800 dark:text-zinc-500'
                  }`}>
                    {typeLabels[q.type] ?? q.type}
                  </span>
                  {q.required && (
                    <span className="text-xs text-kb-gray-200 dark:text-zinc-600">Requerida</span>
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
