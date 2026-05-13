'use client'

import { useState } from 'react'
import { Block, TOOL_TYPES } from '@/lib/types'
import { QuestionRenderer } from '@/components/form/QuestionRenderer'

interface AnswerRow {
  id: string
  question_id: string
  value: string | null
  ai_generated: boolean
  is_active: boolean
}

interface Props {
  sessionId: string
  blocks: Block[]
  answers: AnswerRow[]
}

// ── Icons ──────────────────────────────────────────────────────────────────
function IconEdit() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M15.232 5.232l3.536 3.536m-2.036-5.036a2.5 2.5 0 113.536 3.536L6.5 21.036H3v-3.572L16.732 3.732z" />
    </svg>
  )
}
function IconEyeOff() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
    </svg>
  )
}
function IconEye() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
  )
}
function IconSparkle() {
  return (
    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
        d="M5 3l1.5 4.5L11 9l-4.5 1.5L5 15l-1.5-4.5L-1 9l4.5-1.5L5 3zm13 9l.75 2.25L21 15l-2.25.75L18 18l-.75-2.25L15 15l2.25-.75L18 12z" />
    </svg>
  )
}

export function SessionDetail({ sessionId, blocks, answers }: Props) {
  const initialAnswerMap = Object.fromEntries(answers.map((a) => [a.question_id, a]))

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editValues, setEditValues] = useState<Record<string, string>>(
    Object.fromEntries(answers.map((a) => [a.question_id, a.value ?? '']))
  )
  const [activeState, setActiveState] = useState<Record<string, boolean>>(
    Object.fromEntries(answers.map((a) => [a.question_id, a.is_active]))
  )
  const [aiGeneratedIds, setAiGeneratedIds] = useState<Set<string>>(
    new Set(answers.filter((a) => a.ai_generated).map((a) => a.question_id))
  )
  const [saving, setSaving] = useState(false)

  const [generatingId, setGeneratingId] = useState<string | null>(null)
  const [generateError, setGenerateError] = useState<string | null>(null)

  const [editingPromptId, setEditingPromptId] = useState<string | null>(null)
  const [promptValues, setPromptValues] = useState<Record<string, string>>({})
  const [savedPrompts, setSavedPrompts] = useState<Record<string, string>>({})
  const [savingPrompt, setSavingPrompt] = useState(false)

  const answerMap = { ...initialAnswerMap }

  const handleSave = async (questionId: string) => {
    setSaving(true)
    await fetch('/api/answers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, questionId, value: editValues[questionId] ?? '' }),
    })
    setSaving(false)
    setEditingId(null)
  }

  const handleCancel = (questionId: string) => {
    const original = answerMap[questionId]?.value ?? ''
    setEditValues((prev) => ({ ...prev, [questionId]: original }))
    setEditingId(null)
  }

  const handleToggleActive = async (questionId: string) => {
    const answer = answerMap[questionId]
    if (!answer?.id) return
    const next = !activeState[questionId]
    setActiveState((prev) => ({ ...prev, [questionId]: next }))
    await fetch(`/api/answers/${answer.id}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ is_active: next }),
    })
  }

  const handleGenerateAi = async (questionId: string) => {
    setGeneratingId(questionId)
    setGenerateError(null)
    try {
      const res = await fetch('/api/ai-complete', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, questionId }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setGenerateError(data.error ?? `Error del servidor (${res.status})`)
        return
      }
      const { value } = await res.json()
      setEditValues((prev) => ({ ...prev, [questionId]: value }))
      setAiGeneratedIds((prev) => { const s = new Set(prev); s.add(questionId); return s })
    } catch {
      setGenerateError('Error de red al llamar a la IA')
    } finally {
      setGeneratingId(null)
    }
  }

  const handleSavePrompt = async (questionId: string) => {
    setSavingPrompt(true)
    try {
      const res = await fetch(`/api/config/questions/${questionId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ai_prompt: promptValues[questionId] ?? '' }),
      })
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        setGenerateError(data.error ?? `Error al guardar el prompt (${res.status})`)
        return
      }
      setSavedPrompts((prev) => ({ ...prev, [questionId]: promptValues[questionId] ?? '' }))
    } catch {
      setGenerateError('Error de red al guardar el prompt')
    } finally {
      setSavingPrompt(false)
    }
  }

  const visibleBlocks = blocks.filter((b) => b.is_active)

  return (
    <div className="space-y-10">
      {visibleBlocks.map((block) => {
        const visibleQuestions = block.questions.filter((q) => q.is_active)
        if (visibleQuestions.length === 0) return null

        return (
          <section key={block.id}>
            <h2 className="mb-4 border-b border-kb-gray-200 pb-2 text-base font-bold text-kb-black dark:border-zinc-800 dark:text-white">
              {block.title}
            </h2>
            <div className="space-y-3">
              {visibleQuestions.map((question) => {
                const answer = answerMap[question.id]
                const isEditing = editingId === question.id
                const currentValue = editValues[question.id] ?? ''
                const hasValue = currentValue.trim() !== ''
                const isActive = activeState[question.id] ?? true
                const isTool = TOOL_TYPES.includes(question.type)
                const isAiAssisted = question.type === 'ai_assisted'

                // ── AI-assisted question card ───────────────────────────
                if (isAiAssisted) {
                  const isGenerating = generatingId === question.id
                  const isEditingThisPrompt = editingPromptId === question.id
                  const currentPrompt = promptValues[question.id] ?? savedPrompts[question.id] ?? question.ai_prompt ?? ''

                  return (
                    <div
                      key={question.id}
                      className="rounded-lg border border-kb-accent/30 bg-[#fefae6]/30 dark:border-kb-accent/20 dark:bg-[#2a2000]/20 overflow-hidden"
                    >
                      {/* Header */}
                      <div className="flex flex-wrap items-center gap-1.5 px-4 py-3">
                        <p className="text-xs font-semibold text-kb-gray-600 dark:text-zinc-400">{question.label}</p>
                        <span className="flex items-center gap-1 rounded bg-[#fefae6] px-1.5 py-0.5 text-xs font-bold text-kb-accent-dark">
                          <IconSparkle />
                          IA
                        </span>
                        <button
                          onClick={() => {
                            setPromptValues((prev) => ({ ...prev, [question.id]: currentPrompt }))
                            setEditingPromptId(isEditingThisPrompt ? null : question.id)
                          }}
                          className="ml-auto text-xs text-kb-accent-dark hover:underline dark:text-kb-accent"
                        >
                          {isEditingThisPrompt ? 'Cerrar prompt' : 'Editar prompt'}
                        </button>
                      </div>

                      {/* Prompt — colapsable */}
                      {isEditingThisPrompt && (
                        <div className="border-t border-kb-accent/20 px-4 py-3 dark:border-kb-accent/10">
                          <textarea
                            value={currentPrompt}
                            onChange={(e) =>
                              setPromptValues((prev) => ({ ...prev, [question.id]: e.target.value }))
                            }
                            rows={4}
                            className="w-full resize-none rounded-md border border-kb-accent/30 bg-white/70 p-2.5 text-sm text-kb-gray-800 focus:outline-none focus:ring-1 focus:ring-kb-accent dark:border-kb-accent/20 dark:bg-zinc-900/60 dark:text-zinc-300"
                            placeholder="Escribe aquí el prompt que usará la IA…"
                          />
                          <div className="mt-2 flex gap-2">
                            <button
                              onClick={() => handleSavePrompt(question.id)}
                              disabled={savingPrompt}
                              className="rounded-md bg-kb-accent px-3 py-1.5 text-xs font-bold text-kb-black hover:bg-kb-accent-dark transition disabled:opacity-50"
                            >
                              {savingPrompt ? 'Guardando...' : 'Guardar prompt'}
                            </button>
                            <button
                              onClick={() => setEditingPromptId(null)}
                              className="rounded-md border border-kb-gray-200 px-3 py-1.5 text-xs text-kb-gray-600 hover:bg-kb-gray-100 transition dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )
                }

                // ── Tool question card ──────────────────────────────────
                if (isTool) {
                  return (
                    <div
                      key={question.id}
                      className={`rounded-lg border transition-all dark:bg-zinc-900 ${
                        !isActive ? 'opacity-50' : ''
                      } ${isEditing
                          ? 'border-kb-accent/40 shadow-sm dark:border-kb-accent/30'
                          : 'border-kb-gray-200 bg-white dark:border-zinc-700'
                      }`}
                    >
                      {/* Tool card header */}
                      <div className="flex items-center justify-between border-b border-kb-gray-100 px-6 py-3 dark:border-zinc-800">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-bold text-kb-black dark:text-white">{question.label}</span>
                          {!isActive && (
                            <span className="rounded bg-orange-50 px-1.5 py-0.5 text-xs font-semibold text-orange-500 dark:bg-orange-900/20 dark:text-orange-400">
                              Desactivada
                            </span>
                          )}
                          {!hasValue && isActive && (
                            <span className="rounded bg-kb-gray-100 px-1.5 py-0.5 text-xs text-kb-gray-600 dark:bg-zinc-800 dark:text-zinc-500">
                              Sin completar
                            </span>
                          )}
                        </div>
                        {!isEditing && (
                          <div className="flex items-center gap-1">
                            {isActive && (
                              <button
                                onClick={() => {
                                  setEditValues((prev) => ({ ...prev, [question.id]: answer?.value ?? '' }))
                                  setEditingId(question.id)
                                }}
                                className="rounded-md p-1.5 text-kb-gray-200 hover:bg-kb-gray-100 hover:text-kb-accent-dark transition dark:text-zinc-600 dark:hover:bg-zinc-800"
                                title="Editar"
                              >
                                <IconEdit />
                              </button>
                            )}
                            {answer && (
                              <button
                                onClick={() => handleToggleActive(question.id)}
                                className={`rounded-md p-1.5 transition ${
                                  isActive
                                    ? 'text-kb-gray-200 hover:bg-orange-50 hover:text-orange-400 dark:text-zinc-600 dark:hover:bg-orange-900/20'
                                    : 'text-orange-400 hover:bg-orange-50 hover:text-orange-600 dark:hover:bg-orange-900/20'
                                }`}
                                title={isActive ? 'Desactivar' : 'Reactivar'}
                              >
                                {isActive ? <IconEyeOff /> : <IconEye />}
                              </button>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Tool visual */}
                      <div className="overflow-x-auto px-6 py-6">
                        <QuestionRenderer
                          question={question}
                          value={currentValue}
                          onChange={(v) => setEditValues((prev) => ({ ...prev, [question.id]: v }))}
                          disabled={!isEditing || !isActive}
                          aiEnabled={isEditing && isActive}
                          aiPrompt={block.questions.find((q) => q.type === 'ai_assisted')?.ai_prompt ?? null}
                        />
                      </div>

                      {/* Save / Cancel in edit mode */}
                      {isEditing && (
                        <div className="flex items-center gap-2 border-t border-kb-gray-100 px-6 py-3 dark:border-zinc-800">
                          <button
                            onClick={() => handleSave(question.id)}
                            disabled={saving}
                            className="rounded-md bg-kb-accent px-4 py-1.5 text-xs font-bold text-kb-black hover:bg-kb-accent-dark transition disabled:opacity-50"
                          >
                            {saving ? 'Guardando...' : 'Guardar cambios'}
                          </button>
                          <button
                            onClick={() => handleCancel(question.id)}
                            className="rounded-md border border-kb-gray-200 px-4 py-1.5 text-xs font-semibold text-kb-gray-600 hover:bg-kb-gray-100 transition dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
                          >
                            Cancelar
                          </button>
                        </div>
                      )}
                    </div>
                  )
                }

                // ── Regular question card ───────────────────────────────
                return (
                  <div
                    key={question.id}
                    className={`rounded-lg border p-4 transition-all dark:bg-zinc-900 ${
                      !isActive
                        ? 'border-kb-gray-100 bg-white opacity-50 dark:border-zinc-800'
                        : 'border-kb-gray-100 bg-white dark:border-zinc-800'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="mb-1 flex flex-wrap items-center gap-1.5">
                          <p className="text-xs font-semibold text-kb-gray-600 dark:text-zinc-500">{question.label}</p>
                          {answer?.ai_generated && (
                            <span className="rounded bg-[#fefae6] px-1.5 py-0.5 text-xs font-bold text-kb-accent-dark">IA</span>
                          )}
                          {!isActive && (
                            <span className="rounded bg-orange-50 px-1.5 py-0.5 text-xs font-semibold text-orange-500 dark:bg-orange-900/20 dark:text-orange-400">
                              Desactivada
                            </span>
                          )}
                          {!hasValue && isActive && (
                            <span className="text-xs text-kb-gray-200 dark:text-zinc-600">Sin respuesta</span>
                          )}
                        </div>

                        {isEditing ? (
                          <div className="mt-2 space-y-2">
                            <QuestionRenderer
                              question={question}
                              value={currentValue}
                              onChange={(v) => setEditValues((prev) => ({ ...prev, [question.id]: v }))}
                            />
                            <div className="flex gap-2">
                              <button
                                onClick={() => handleSave(question.id)}
                                disabled={saving}
                                className="rounded-md bg-kb-accent px-3 py-1.5 text-xs font-bold text-kb-black hover:bg-kb-accent-dark transition disabled:opacity-50"
                              >
                                {saving ? 'Guardando...' : 'Guardar'}
                              </button>
                              <button
                                onClick={() => handleCancel(question.id)}
                                className="rounded-md border border-kb-gray-200 px-3 py-1.5 text-xs font-semibold text-kb-gray-600 hover:bg-kb-gray-100 transition dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
                              >
                                Cancelar
                              </button>
                            </div>
                          </div>
                        ) : (
                          <p className={`text-sm ${
                            !hasValue       ? 'italic text-kb-gray-200 dark:text-zinc-600' :
                            !isActive       ? 'text-kb-gray-600 line-through dark:text-zinc-500' :
                                              'text-kb-gray-800 dark:text-zinc-300'
                          }`}>
                            {hasValue ? currentValue : 'Sin respuesta'}
                          </p>
                        )}
                      </div>

                      {!isEditing && (
                        <div className="flex shrink-0 items-center gap-1">
                          {isActive && (
                            <button
                              onClick={() => {
                                setEditValues((prev) => ({ ...prev, [question.id]: answer?.value ?? '' }))
                                setEditingId(question.id)
                              }}
                              className="rounded-md p-1.5 text-kb-gray-200 hover:bg-kb-gray-100 hover:text-kb-gray-600 transition dark:text-zinc-600 dark:hover:bg-zinc-800 dark:hover:text-zinc-400"
                              title="Editar respuesta"
                            >
                              <IconEdit />
                            </button>
                          )}
                          {answer && (
                            <button
                              onClick={() => handleToggleActive(question.id)}
                              className={`rounded-md p-1.5 transition ${
                                isActive
                                  ? 'text-kb-gray-200 hover:bg-orange-50 hover:text-orange-400 dark:text-zinc-600 dark:hover:bg-orange-900/20'
                                  : 'text-orange-400 hover:bg-orange-50 hover:text-orange-600 dark:hover:bg-orange-900/20'
                              }`}
                              title={isActive ? 'Desactivar respuesta' : 'Reactivar respuesta'}
                            >
                              {isActive ? <IconEyeOff /> : <IconEye />}
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                )
              })}
            </div>
          </section>
        )
      })}
    </div>
  )
}
