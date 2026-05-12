'use client'

import { useState, useEffect, useRef } from 'react'
import { Block } from '@/lib/types'

interface Props {
  blocks: Block[]
  currentBlockIndex: number
  currentQuestionIndex: number
  answeredByBlock: Record<string, number>
  answers: Record<string, string>
  onNavigate: (blockIndex: number) => void
  onNavigateToQuestion: (blockIndex: number, questionIndex: number) => void
}

export function BlockProgress({
  blocks,
  currentBlockIndex,
  currentQuestionIndex,
  answeredByBlock,
  answers,
  onNavigate,
  onNavigateToQuestion,
}: Props) {
  const [expanded, setExpanded] = useState<Record<number, boolean>>(
    { [currentBlockIndex]: true }
  )
  const prevBlockIndex = useRef(currentBlockIndex)

  useEffect(() => {
    const prev = prevBlockIndex.current
    if (prev !== currentBlockIndex) {
      setExpanded((old) => ({ ...old, [prev]: false, [currentBlockIndex]: true }))
      prevBlockIndex.current = currentBlockIndex
    }
  }, [currentBlockIndex])

  const toggle = (i: number, e: React.MouseEvent) => {
    e.stopPropagation()
    setExpanded((prev) => ({ ...prev, [i]: !prev[i] }))
  }

  return (
    <div className="space-y-1.5">
      {blocks.map((block, i) => {
        const questions = block.questions.filter(
          (q) => q.is_active && q.type !== 'ai_assisted'
        )
        const total = questions.length
        const answered = answeredByBlock[block.id] ?? 0
        const pct = total > 0 ? Math.round((answered / total) * 100) : 0
        const isCurrent = i === currentBlockIndex
        const isDone = answered === total && total > 0
        const isExpanded = !!expanded[i]
        const hasQuestions = questions.length > 0

        return (
          <div key={block.id}>
            {/* Block row */}
            <div
              className={`rounded-lg transition-all ${
                isExpanded && hasQuestions ? 'rounded-b-none' : ''
              } ${
                isCurrent
                  ? 'bg-[#fefae6] border border-kb-accent/40 shadow-sm dark:bg-[#2a2000] dark:border-kb-accent/30'
                  : 'bg-kb-gray-100 border border-transparent dark:bg-zinc-800/50'
              }`}
            >
              <div className="flex items-center gap-1 p-3">
                {/* Chevron toggle */}
                <button
                  type="button"
                  onClick={(e) => toggle(i, e)}
                  className={`flex-shrink-0 rounded p-0.5 transition-colors ${
                    hasQuestions
                      ? 'text-kb-gray-600 hover:text-kb-accent dark:text-zinc-500 dark:hover:text-kb-accent'
                      : 'invisible'
                  }`}
                >
                  <svg
                    className={`h-3 w-3 transition-transform duration-200 ${isExpanded ? 'rotate-90' : ''}`}
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" />
                  </svg>
                </button>

                {/* Block title button */}
                <button
                  type="button"
                  onClick={() => onNavigate(i)}
                  className="flex flex-1 min-w-0 items-center justify-between"
                >
                  <span
                    className={`text-sm font-semibold leading-tight truncate ${
                      isCurrent
                        ? 'text-kb-accent-dark dark:text-kb-accent'
                        : 'text-kb-gray-600 dark:text-zinc-400'
                    }`}
                  >
                    <span className="mr-1 opacity-50">{i + 1}.</span>
                    {block.title}
                  </span>
                  <span
                    className={`ml-2 flex-shrink-0 text-xs font-bold ${
                      isDone
                        ? 'text-green-600 dark:text-green-400'
                        : isCurrent
                        ? 'text-kb-accent-dark dark:text-kb-accent'
                        : 'text-kb-gray-600 dark:text-zinc-500'
                    }`}
                  >
                    {isDone ? '✓' : `${pct}%`}
                  </span>
                </button>
              </div>

              {/* Progress bar */}
              <div className="mx-3 mb-3 h-1 rounded-full bg-kb-gray-200 overflow-hidden dark:bg-zinc-700">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    isDone ? 'bg-green-500' : isCurrent ? 'bg-kb-accent' : 'bg-kb-gray-200 dark:bg-zinc-600'
                  }`}
                  style={{ width: `${pct}%` }}
                />
              </div>
            </div>

            {/* Questions list — always in DOM, shown/hidden with CSS only */}
            {hasQuestions && (
              <div
                className={`rounded-b-lg border border-t-0 overflow-hidden transition-all duration-200 ${
                  isCurrent
                    ? 'border-kb-accent/40 dark:border-kb-accent/30'
                    : 'border-kb-gray-200 dark:border-zinc-700'
                } ${isExpanded ? 'max-h-[600px] opacity-100' : 'max-h-0 opacity-0 border-0'}`}
              >
                {questions.map((q, qi) => {
                  const isCurrentQ = isCurrent && qi === currentQuestionIndex
                  const isAnswered = !!answers[q.id] && answers[q.id].trim() !== ''

                  return (
                    <button
                      key={q.id}
                      type="button"
                      onClick={() => onNavigateToQuestion(i, qi)}
                      className={`w-full flex items-center gap-2.5 px-3 py-2 text-left transition-colors border-b border-kb-gray-100 last:border-b-0 dark:border-zinc-800 ${
                        isCurrentQ
                          ? 'bg-kb-accent/10 dark:bg-kb-accent/10'
                          : 'hover:bg-kb-gray-100 dark:hover:bg-zinc-800'
                      }`}
                    >
                      <span
                        className={`flex-shrink-0 h-1.5 w-1.5 rounded-full ${
                          isCurrentQ
                            ? 'bg-kb-accent'
                            : isAnswered
                            ? 'bg-green-400'
                            : 'bg-kb-gray-200 dark:bg-zinc-600'
                        }`}
                      />
                      <span
                        className={`text-xs leading-snug ${
                          isCurrentQ
                            ? 'font-semibold text-kb-accent-dark dark:text-kb-accent'
                            : isAnswered
                            ? 'text-kb-gray-600 dark:text-zinc-400'
                            : 'text-kb-gray-600 dark:text-zinc-500'
                        }`}
                      >
                        {q.label}
                      </span>
                    </button>
                  )
                })}
              </div>
            )}
          </div>
        )
      })}
    </div>
  )
}
