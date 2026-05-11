'use client'

import { Block } from '@/lib/types'

interface Props {
  blocks: Block[]
  currentBlockIndex: number
  answeredByBlock: Record<string, number>
  onNavigate: (index: number) => void
}

export function BlockProgress({ blocks, currentBlockIndex, answeredByBlock, onNavigate }: Props) {
  return (
    <div className="space-y-1.5">
      {blocks.map((block, i) => {
        const total = block.questions.filter((q) => q.is_active).length
        const answered = answeredByBlock[block.id] ?? 0
        const pct = total > 0 ? Math.round((answered / total) * 100) : 0
        const isCurrent = i === currentBlockIndex
        const isDone = answered === total && total > 0

        return (
          <button
            key={block.id}
            type="button"
            onClick={() => onNavigate(i)}
            className={`w-full rounded-lg p-3 text-left transition-all ${
              isCurrent
                ? 'bg-violet-50 border border-violet-200 shadow-sm dark:bg-violet-900/20 dark:border-violet-800'
                : 'bg-zinc-50 hover:bg-zinc-100 border border-transparent dark:bg-zinc-800/50 dark:hover:bg-zinc-800'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className={`text-sm font-medium leading-tight ${
                isCurrent
                  ? 'text-violet-700 dark:text-violet-400'
                  : 'text-zinc-500 dark:text-zinc-400'
              }`}>
                <span className="mr-1 opacity-50">{i + 1}.</span>
                {block.title}
              </span>
              <span className={`ml-2 flex-shrink-0 text-xs font-medium ${
                isDone ? 'text-green-600 dark:text-green-400' :
                isCurrent ? 'text-violet-500 dark:text-violet-400' :
                'text-zinc-400 dark:text-zinc-500'
              }`}>
                {isDone ? '✓' : `${pct}%`}
              </span>
            </div>
            <div className="h-1 rounded-full bg-zinc-200 overflow-hidden dark:bg-zinc-700">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  isDone ? 'bg-green-500' : isCurrent ? 'bg-violet-500' : 'bg-zinc-300 dark:bg-zinc-600'
                }`}
                style={{ width: `${pct}%` }}
              />
            </div>
          </button>
        )
      })}
    </div>
  )
}
