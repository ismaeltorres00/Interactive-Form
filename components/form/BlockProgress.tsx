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
                ? 'bg-violet-50 border border-violet-200 shadow-sm'
                : 'bg-zinc-50 hover:bg-zinc-100 border border-transparent'
            }`}
          >
            <div className="flex items-center justify-between mb-1.5">
              <span className={`text-sm font-medium leading-tight ${isCurrent ? 'text-violet-700' : 'text-zinc-500'}`}>
                <span className="mr-1 opacity-50">{i + 1}.</span>
                {block.title}
              </span>
              <span className={`ml-2 flex-shrink-0 text-xs font-medium ${isDone ? 'text-green-600' : isCurrent ? 'text-violet-500' : 'text-zinc-400'}`}>
                {isDone ? '✓' : `${pct}%`}
              </span>
            </div>
            <div className="h-1 rounded-full bg-zinc-200 overflow-hidden">
              <div
                className={`h-full rounded-full transition-all duration-500 ${
                  isDone ? 'bg-green-500' : isCurrent ? 'bg-violet-500' : 'bg-zinc-300'
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
