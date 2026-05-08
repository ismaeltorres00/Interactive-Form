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

  // AI generation state
  const [generatingId, setGeneratingId] = useState<string | null>(null)
  const [generateError, setGenerateError] = useState<string | null>(null)

  // Prompt editing state
  const [editingPromptId, setEditingPromptId] = useState<string | null>(null)
  const [promptValues, setPromptValues] = useState<Record<string, string>>({})
  const [savingPrompt, setSavingPrompt] = useState(false)

  // answerMap merges initial with any locally generated values
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
        const data = await res.json()
        setGenerateError(data.error ?? 'Error al generar')
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
    await fetch(`/api/config/questions/${questionId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ ai_prompt: promptValues[questionId] ?? '' }),
    })
    setSavingPrompt(false)
    setEditingPromptId(null)
  }

  const visibleBlocks = blocks.filter((b) => b.is_active)

  return (
    <div className="space-y-10">
      {visibleBlocks.map((block) => {
        const visibleQuestions = block.questions.filter((q) => q.is_active)
        if (visibleQuestions.length === 0) return null

        return (
          <section key={block.id}>
            <h2 className="mb-4 border-b border-zinc-100 pb-2 text-base font-semibold text-zinc-800">
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
                  const currentPrompt = promptValues[question.id] ?? question.ai_prompt ?? ''
                  const wasAiGenerated = aiGeneratedIds.has(question.id)

                  return (
                    <div
                      key={question.id}
                      className="rounded-lg border border-violet-100 bg-violet-50/30 p-4"
                    >
                      {/* Header */}
                      <div className="mb-3 flex flex-wrap items-center gap-1.5">
                        <p className="text-xs font-medium text-zinc-500">{question.label}</p>
                        <span className="flex items-center gap-1 rounded bg-violet-100 px-1.5 py-0.5 text-xs font-medium text-violet-600">
                          <IconSparkle />
                          IA
                        </span>
                        {!hasValue && (
                          <span className="rounded bg-amber-100 px-1.5 py-0.5 text-xs font-medium text-amber-700">
                            Pendiente de revisión
                          </span>
                        )}
                        {hasValue && wasAiGenerated && (
                          <span className="rounded bg-green-100 px-1.5 py-0.5 text-xs text-green-700">
                            Generado
                          </span>
                        )}
                      </div>

                      {/* Prompt editor */}
                      {isEditingThisPrompt ? (
                        <div className="space-y-2">
                          <p className="text-xs font-medium text-zinc-400">Prompt de la IA</p>
                          <textarea
                            value={currentPrompt}
                            onChange={(e) =>
                              setPromptValues((prev) => ({ ...prev, [question.id]: e.target.value }))
                            }
                            rows={5}
                            className="w-full rounded-md border border-violet-200 bg-white p-2.5 text-sm text-zinc-700 focus:outline-none focus:ring-1 focus:ring-violet-300"
                            placeholder="Escribe aquí el prompt que usará la IA…"
                          />
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleSavePrompt(question.id)}
                              disabled={savingPrompt}
                              className="rounded-md bg-violet-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-violet-700 transition disabled:opacity-50"
                            >
                              {savingPrompt ? 'Guardando...' : 'Guardar prompt'}
                            </button>
                            <button
                              onClick={() => setEditingPromptId(null)}
                              className="rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50 transition"
                            >
                              Cancelar
                            </button>
                          </div>
                        </div>
                      ) : (
                        <>
                          {/* Value display */}
                          <div className={`min-h-[48px] rounded-md border bg-white p-3 text-sm ${
                            hasValue
                              ? 'border-zinc-200 text-zinc-700'
                              : 'border-dashed border-zinc-200 italic text-zinc-300'
                          }`}>
                            {hasValue ? currentValue : 'Sin respuesta aún — usa el botón para generar'}
                          </div>

                          {generateError && generatingId !== question.id && (
                            <p className="mt-1 text-xs text-red-500">{generateError}</p>
                          )}

                          {/* Action buttons */}
                          <div className="mt-3 flex flex-wrap items-center gap-2">
                            <button
                              onClick={() => handleGenerateAi(question.id)}
                              disabled={isGenerating}
                              className="flex items-center gap-1.5 rounded-md bg-violet-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-violet-700 transition disabled:opacity-50"
                            >
                              <IconSparkle />
                              {isGenerating
                                ? 'Generando...'
                                : hasValue
                                ? 'Regenerar con IA'
                                : 'Generar con IA'}
                            </button>
                            <button
                              onClick={() => {
                                setPromptValues((prev) => ({
                                  ...prev,
                                  [question.id]: question.ai_prompt ?? '',
                                }))
                                setEditingPromptId(question.id)
                              }}
                              className="rounded-md border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50 transition"
                            >
                              Editar prompt
                            </button>
                          </div>
                        </>
                      )}
                    </div>
                  )
                }

                // ── Tool question card ──────────────────────────────────
                if (isTool) {
                  return (
                    <div
                      key={question.id}
                      className={`rounded-lg border bg-white transition-all ${
                        !isActive ? 'opacity-50' : ''
                      } ${isEditing ? 'border-violet-200 shadow-sm' : 'border-zinc-200'}`}
                    >
                      {/* Tool card header */}
                      <div className="flex items-center justify-between border-b border-zinc-100 px-6 py-3">
                        <div className="flex items-center gap-2">
                          <span className="text-sm font-semibold text-zinc-800">{question.label}</span>
                          {!isActive && (
                            <span className="rounded bg-orange-50 px-1.5 py-0.5 text-xs font-medium text-orange-500">
                              Desactivada
                            </span>
                          )}
                          {!hasValue && isActive && (
                            <span className="rounded bg-zinc-50 px-1.5 py-0.5 text-xs text-zinc-400">
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
                                className="rounded-md p-1.5 text-zinc-300 hover:bg-zinc-50 hover:text-violet-500 transition"
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
                                    ? 'text-zinc-300 hover:bg-orange-50 hover:text-orange-400'
                                    : 'text-orange-400 hover:bg-orange-50 hover:text-orange-600'
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
                        />
                      </div>

                      {/* Save / Cancel in edit mode */}
                      {isEditing && (
                        <div className="flex items-center gap-2 border-t border-zinc-100 px-6 py-3">
                          <button
                            onClick={() => handleSave(question.id)}
                            disabled={saving}
                            className="rounded-md bg-violet-600 px-4 py-1.5 text-xs font-medium text-white hover:bg-violet-700 transition disabled:opacity-50"
                          >
                            {saving ? 'Guardando...' : 'Guardar cambios'}
                          </button>
                          <button
                            onClick={() => handleCancel(question.id)}
                            className="rounded-md border border-zinc-200 px-4 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50 transition"
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
                    className={`rounded-lg border bg-white p-4 transition-all ${
                      !isActive ? 'border-zinc-100 opacity-50' : 'border-zinc-100'
                    }`}
                  >
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="mb-1 flex flex-wrap items-center gap-1.5">
                          <p className="text-xs font-medium text-zinc-400">{question.label}</p>
                          {answer?.ai_generated && (
                            <span className="rounded bg-violet-50 px-1.5 py-0.5 text-xs text-violet-500">IA</span>
                          )}
                          {!isActive && (
                            <span className="rounded bg-orange-50 px-1.5 py-0.5 text-xs font-medium text-orange-500">
                              Desactivada
                            </span>
                          )}
                          {!hasValue && isActive && (
                            <span className="text-xs text-zinc-300">Sin respuesta</span>
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
                                className="rounded-md bg-violet-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-violet-700 transition disabled:opacity-50"
                              >
                                {saving ? 'Guardando...' : 'Guardar'}
                              </button>
                              <button
                                onClick={() => handleCancel(question.id)}
                                className="rounded-md border border-zinc-200 px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50 transition"
                              >
                                Cancelar
                              </button>
                            </div>
                          </div>
                        ) : (
                          <p className={`text-sm ${
                            !hasValue       ? 'italic text-zinc-300' :
                            !isActive       ? 'text-zinc-400 line-through' :
                                              'text-zinc-700'
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
                              className="rounded-md p-1.5 text-zinc-300 hover:bg-zinc-50 hover:text-zinc-500 transition"
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
                                  ? 'text-zinc-300 hover:bg-orange-50 hover:text-orange-400'
                                  : 'text-orange-400 hover:bg-orange-50 hover:text-orange-600'
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
