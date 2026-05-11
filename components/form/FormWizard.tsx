'use client'

import { useState, useCallback, useRef } from 'react'
import { Block, Answer, TOOL_TYPES } from '@/lib/types'
import { QuestionRenderer } from './QuestionRenderer'
import { BlockProgress } from './BlockProgress'

interface Props {
  sessionId: string
  blocks: Block[]
  initialAnswers: Answer[]
  initialBlock: number
  companyName?: string | null
}

export function FormWizard({ sessionId, blocks, initialAnswers, initialBlock, companyName }: Props) {
  const [currentBlockIndex, setCurrentBlockIndex] = useState(initialBlock)
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0)
  const [answers, setAnswers] = useState<Record<string, string>>(
    Object.fromEntries(initialAnswers.map((a) => [a.question_id, a.value]))
  )
  const [saving, setSaving] = useState<Record<string, boolean>>({})
  const [completed, setCompleted] = useState(false)
  const debounceTimers = useRef<Record<string, ReturnType<typeof setTimeout>>>({})

  const visibleBlocks = blocks.filter((b) => b.is_active)
  const currentBlock = visibleBlocks[currentBlockIndex]

  // All non-AI questions in current block
  const blockQuestions = currentBlock?.questions.filter(
    (q) => q.is_active && q.type !== 'ai_assisted'
  ) ?? []

  const currentQuestion = blockQuestions[currentQuestionIndex]
  const isTool = currentQuestion ? TOOL_TYPES.includes(currentQuestion.type) : false

  const isLastBlock = currentBlockIndex === visibleBlocks.length - 1
  const isLastQuestion = currentQuestionIndex === blockQuestions.length - 1
  const isLastStep = isLastBlock && isLastQuestion

  // Only block the Next button if the current question is required and unanswered
  const currentRequired = !!currentQuestion?.required && !isTool
  const currentAnswered =
    !currentRequired ||
    (!!answers[currentQuestion?.id] && answers[currentQuestion?.id].trim() !== '')

  // ── Persistence ──────────────────────────────────────────────────────────
  const saveAnswer = useCallback(
    async (questionId: string, value: string) => {
      setSaving((s) => ({ ...s, [questionId]: true }))
      await fetch('/api/answers', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId, questionId, value }),
      })
      setSaving((s) => ({ ...s, [questionId]: false }))
    },
    [sessionId]
  )

  const handleChange = useCallback(
    (questionId: string, value: string) => {
      setAnswers((prev) => ({ ...prev, [questionId]: value }))
      clearTimeout(debounceTimers.current[questionId])
      debounceTimers.current[questionId] = setTimeout(() => {
        saveAnswer(questionId, value)
      }, 500)
    },
    [saveAnswer]
  )

  const handleChangeImmediate = useCallback(
    (questionId: string, value: string) => {
      setAnswers((prev) => ({ ...prev, [questionId]: value }))
      saveAnswer(questionId, value)
    },
    [saveAnswer]
  )

  // ── Navigation ────────────────────────────────────────────────────────────
  const handleNext = async () => {
    if (!isLastQuestion) {
      setCurrentQuestionIndex((i) => i + 1)
      return
    }
    if (!isLastBlock) {
      setCurrentBlockIndex((i) => i + 1)
      setCurrentQuestionIndex(0)
      return
    }
    // Complete
    await fetch('/api/answers', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sessionId, questionId: '__complete__', value: 'true' }),
    }).catch(() => {})
    await fetch(`/api/sessions/${sessionId}/complete`, { method: 'POST' }).catch(() => {})
    setCompleted(true)
  }

  const handlePrev = () => {
    if (currentQuestionIndex > 0) {
      setCurrentQuestionIndex((i) => i - 1)
      return
    }
    if (currentBlockIndex > 0) {
      const prevBlock = visibleBlocks[currentBlockIndex - 1]
      const prevQs = prevBlock.questions.filter(
        (q) => q.is_active && q.type !== 'ai_assisted'
      )
      setCurrentBlockIndex((i) => i - 1)
      setCurrentQuestionIndex(Math.max(prevQs.length - 1, 0))
    }
  }

  const navigateToBlock = (blockIndex: number) => {
    setCurrentBlockIndex(blockIndex)
    setCurrentQuestionIndex(0)
  }

  // ── Sidebar progress ─────────────────────────────────────────────────────
  const answeredByBlock: Record<string, number> = {}
  for (const block of visibleBlocks) {
    answeredByBlock[block.id] = block.questions.filter(
      (q) => q.is_active && answers[q.id] && answers[q.id].trim() !== ''
    ).length
  }

  const totalQuestions = visibleBlocks.flatMap((b) =>
    b.questions.filter((q) => q.is_active && q.type !== 'ai_assisted')
  ).length
  const totalAnswered = Object.values(answers).filter((v) => v && v.trim() !== '').length
  const globalProgress =
    totalQuestions > 0 ? Math.round((totalAnswered / totalQuestions) * 100) : 0

  // ── Completed screen ─────────────────────────────────────────────────────
  if (completed) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-zinc-50 px-4 dark:bg-zinc-950">
        <div className="max-w-md text-center">
          <div className="mb-6 text-6xl">🎉</div>
          <h1 className="mb-3 text-2xl font-bold text-zinc-800 dark:text-zinc-100">¡Formulario completado!</h1>
          <p className="text-zinc-500 dark:text-zinc-400">
            Gracias por tu tiempo. Tu diseñador revisará toda la información y se pondrá en
            contacto contigo pronto.
          </p>
        </div>
      </div>
    )
  }

  // ── Nav buttons (shared) ─────────────────────────────────────────────────
  const hasPrev = currentBlockIndex > 0 || currentQuestionIndex > 0

  const navButtons = (
    <div className={`flex items-center justify-between ${isTool ? 'mt-6' : 'mt-10'}`}>
      {hasPrev ? (
        <button
          onClick={handlePrev}
          className="rounded-lg border border-zinc-200 bg-white px-5 py-2.5 text-sm font-medium text-zinc-600 hover:bg-zinc-50 transition dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800"
        >
          ← Anterior
        </button>
      ) : (
        <div />
      )}
      <button
        onClick={handleNext}
        disabled={!currentAnswered}
        className="rounded-lg bg-violet-600 px-6 py-2.5 text-sm font-semibold text-white hover:bg-violet-700 transition disabled:opacity-40 disabled:cursor-not-allowed"
      >
        {isLastStep ? 'Finalizar' : 'Siguiente →'}
      </button>
    </div>
  )

  // ── Step dots within block ────────────────────────────────────────────────
  const stepDots =
    blockQuestions.length > 1 ? (
      <div className="mb-6 flex items-center gap-1.5">
        {blockQuestions.map((q, i) => {
          const done = !!answers[q.id] && answers[q.id].trim() !== ''
          const active = i === currentQuestionIndex
          return (
            <div
              key={q.id}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                active
                  ? 'w-5 bg-violet-500'
                  : done
                  ? 'w-1.5 bg-green-400'
                  : 'w-1.5 bg-zinc-200 dark:bg-zinc-700'
              }`}
            />
          )
        })}
        <span className="ml-2 text-xs text-zinc-400 dark:text-zinc-500">
          {currentQuestionIndex + 1} / {blockQuestions.length}
        </span>
      </div>
    ) : null

  // ── Render ────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-zinc-50 dark:bg-zinc-950">
      {/* Global progress header */}
      <div className="sticky top-0 z-10 border-b border-zinc-200 bg-white px-4 py-3 dark:border-zinc-800 dark:bg-zinc-900">
        <div className="mx-auto flex max-w-6xl items-center justify-between">
          {companyName ? (
            <span className="text-sm font-semibold text-zinc-800 tracking-tight dark:text-zinc-100">{companyName}</span>
          ) : (
            <span className="text-sm font-medium text-zinc-400 dark:text-zinc-500">Formulario</span>
          )}
          <div className="flex items-center gap-3">
            <div className="h-2 w-40 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-700">
              <div
                className="h-full rounded-full bg-violet-500 transition-all duration-500"
                style={{ width: `${globalProgress}%` }}
              />
            </div>
            <span className="text-sm font-semibold text-violet-600 dark:text-violet-400">{globalProgress}%</span>
          </div>
        </div>
      </div>

      {/* Body */}
      <div className="mx-auto max-w-6xl px-4 py-8 lg:grid lg:gap-8 lg:grid-cols-[260px_1fr]">
        {/* Sidebar */}
        <aside className="mb-8 lg:mb-0">
          <BlockProgress
            blocks={visibleBlocks}
            currentBlockIndex={currentBlockIndex}
            answeredByBlock={answeredByBlock}
            onNavigate={navigateToBlock}
          />
        </aside>

        {/* Main */}
        <main>
          {isTool ? (
            /* ── Worksheet card ── */
            <>
              <div className="rounded-lg border border-zinc-200 bg-white p-8 shadow-sm dark:border-zinc-700 dark:bg-zinc-900">
                <div className="mb-8 flex items-center justify-between">
                  <h1 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{currentBlock?.title}</h1>
                  <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded bg-zinc-900 dark:bg-zinc-700">
                    <div className="h-5 w-6 rounded-full bg-yellow-400" />
                  </div>
                </div>
                {currentQuestion && (
                  <>
                    <QuestionRenderer
                      question={currentQuestion}
                      value={answers[currentQuestion.id] ?? ''}
                      onChange={(v) => handleChange(currentQuestion.id, v)}
                    />
                    {saving[currentQuestion.id] && (
                      <p className="mt-2 text-xs text-zinc-400 dark:text-zinc-500">Guardando...</p>
                    )}
                  </>
                )}
              </div>
              {navButtons}
            </>
          ) : (
            /* ── Standard question ── */
            <>
              {/* Block + question header */}
              <div className="mb-6">
                <p className="mb-1 text-xs font-semibold uppercase tracking-wide text-violet-500">
                  {currentBlock?.title}
                </p>
                {stepDots}
                <h1 className="text-2xl font-bold text-zinc-800 dark:text-zinc-100">
                  {currentQuestion?.label}
                  {currentQuestion?.required && (
                    <span className="ml-1 text-violet-400">*</span>
                  )}
                </h1>
                {currentQuestion?.helper_text && (
                  <p className="mt-2 text-zinc-500 dark:text-zinc-400">{currentQuestion.helper_text}</p>
                )}
              </div>

              {/* Answer input */}
              {currentQuestion && (
                <div>
                  <QuestionRenderer
                    question={currentQuestion}
                    value={answers[currentQuestion.id] ?? ''}
                    onChange={(v) => {
                      const immediate = ['select', 'multiselect', 'boolean'].includes(
                        currentQuestion.type
                      )
                      if (immediate) handleChangeImmediate(currentQuestion.id, v)
                      else handleChange(currentQuestion.id, v)
                    }}
                  />
                  {saving[currentQuestion.id] && (
                    <p className="mt-1 text-xs text-zinc-400 dark:text-zinc-500">Guardando...</p>
                  )}
                </div>
              )}

              {navButtons}
            </>
          )}
        </main>
      </div>
    </div>
  )
}
