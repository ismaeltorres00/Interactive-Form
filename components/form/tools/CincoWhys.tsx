'use client'

import { useState, useEffect } from 'react'

interface Data {
  why1: string
  why2: string
  why3: string
  why4: string
  why5: string
}

const EMPTY: Data = { why1: '', why2: '', why3: '', why4: '', why5: '' }
const KEYS = ['why1', 'why2', 'why3', 'why4', 'why5'] as (keyof Data)[]

const STEPS = [
  { key: 'why1' as keyof Data, num: 1, hint: 'El motivo principal que ves…' },
  { key: 'why2' as keyof Data, num: 2, hint: '¿Y por qué ocurre eso?' },
  { key: 'why3' as keyof Data, num: 3, hint: 'Sigue profundizando…' },
  { key: 'why4' as keyof Data, num: 4, hint: 'Cada vez más cerca de la raíz…' },
  { key: 'why5' as keyof Data, num: 5, hint: 'La causa raíz que explica todo lo anterior…' },
]

interface Props {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}

export function CincoWhys({ value, onChange, disabled }: Props) {
  const [data, setData] = useState<Data>(() => {
    try { return { ...EMPTY, ...JSON.parse(value) } } catch { return EMPTY }
  })

  const [active, setActive] = useState<number>(() => {
    try {
      const parsed = { ...EMPTY, ...JSON.parse(value) }
      const first = KEYS.findIndex((k) => !parsed[k] || parsed[k].trim() === '')
      return first === -1 ? 4 : first
    } catch { return 0 }
  })

  useEffect(() => {
    try { setData({ ...EMPTY, ...JSON.parse(value) }) } catch {}
  }, [value])

  const update = (field: keyof Data, val: string) => {
    const next = { ...data, [field]: val }
    setData(next)
    onChange(JSON.stringify(next))
  }

  const handleBlur = (i: number) => {
    if (data[KEYS[i]].trim() && i < 4) {
      const next = KEYS.findIndex((k, idx) => idx > i && !data[k].trim())
      if (next !== -1) setActive(next)
    }
  }

  const filled = KEYS.map((k) => data[k].trim() !== '')
  const allDone = filled.every(Boolean)

  return (
    <div className="w-full">
      <p className="mb-7 text-sm text-kb-gray-600 dark:text-zinc-400">
        Pregúntate <span className="font-semibold text-kb-black dark:text-white">«¿por qué?»</span> cinco veces seguidas para llegar a la{' '}
        <span className="font-semibold text-kb-accent-dark dark:text-kb-accent">causa raíz</span>.
      </p>

      <div className="relative">
        {/* Vertical timeline line */}
        <div className="absolute left-[17px] top-0 bottom-0 w-px bg-kb-gray-200 dark:bg-zinc-700" />

        <div className="space-y-3">
          {STEPS.map(({ key, num, hint }, i) => {
            const isFilled = filled[i]
            const isActive = active === i
            const isLast = i === 4
            const prevFilled = i === 0 || filled[i - 1]

            return (
              <div key={key} className="relative flex gap-4">
                {/* Timeline circle */}
                <div
                  className={`relative z-10 flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-full border-2 text-sm font-bold transition-all duration-300 ${
                    isFilled
                      ? 'border-green-500 bg-green-500 text-white shadow-sm shadow-green-200 dark:shadow-green-900'
                      : isActive
                      ? 'border-kb-accent bg-kb-accent text-kb-black shadow-sm shadow-kb-accent/30'
                      : 'border-kb-gray-200 bg-white text-kb-gray-600 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-500'
                  }`}
                >
                  {isFilled ? (
                    <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  ) : num}
                </div>

                {/* Card */}
                <div className={`flex-1 mb-3 rounded-xl border transition-all duration-300 overflow-hidden ${
                  isLast && (isActive || isFilled)
                    ? 'border-kb-accent/40 bg-gradient-to-br from-[#fefae6] to-white shadow-md dark:from-[#2a2000] dark:to-zinc-900'
                    : isActive
                    ? 'border-kb-gray-300 bg-white shadow-sm dark:border-zinc-600 dark:bg-zinc-800'
                    : isFilled
                    ? 'border-kb-gray-200 bg-white dark:border-zinc-700 dark:bg-zinc-800/60'
                    : 'border-transparent bg-kb-gray-100/50 dark:bg-zinc-800/20'
                }`}>
                  {/* Header */}
                  <div
                    className="flex cursor-pointer items-center justify-between px-4 pt-3 pb-1"
                    onClick={() => !disabled && setActive(i)}
                  >
                    <div className="flex items-center gap-2">
                      <span className={`text-xs font-bold uppercase tracking-wider ${
                        isActive
                          ? 'text-kb-accent-dark dark:text-kb-accent'
                          : isFilled
                          ? 'text-green-600 dark:text-green-400'
                          : 'text-kb-gray-600 dark:text-zinc-500'
                      }`}>
                        {isLast ? 'Causa raíz' : `Why ${num}`}
                      </span>
                      {isLast && (
                        <span className="rounded-full bg-kb-accent/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-kb-accent-dark dark:text-kb-accent">
                          ★
                        </span>
                      )}
                    </div>

                    {/* Previous why as context */}
                    {isActive && i > 0 && data[KEYS[i - 1]].trim() && (
                      <span className="ml-4 max-w-[55%] truncate text-right text-xs italic text-kb-gray-600 dark:text-zinc-500">
                        «{data[KEYS[i - 1]]}»
                      </span>
                    )}
                  </div>

                  {/* Body */}
                  <div className="px-4 pb-4">
                    {!isActive && isFilled ? (
                      <button onClick={() => !disabled && setActive(i)} className="w-full text-left">
                        <p className="line-clamp-2 text-sm text-kb-black dark:text-white">{data[key]}</p>
                      </button>
                    ) : !isActive && !isFilled ? (
                      <p className="text-sm text-kb-gray-200 dark:text-zinc-700 select-none">
                        {prevFilled ? 'Pulsa para responder…' : 'Completa el anterior primero'}
                      </p>
                    ) : (
                      <textarea
                        value={data[key]}
                        onChange={(e) => update(key, e.target.value)}
                        onBlur={() => handleBlur(i)}
                        disabled={disabled}
                        placeholder={hint}
                        rows={3}
                        autoFocus
                        className="w-full resize-none rounded-lg bg-transparent text-sm text-kb-black placeholder:text-kb-gray-200 focus:outline-none disabled:opacity-50 dark:text-white dark:placeholder:text-zinc-700"
                      />
                    )}
                  </div>

                  {/* Progress bar — always rendered to avoid layout shift */}
                  <div className="h-0.5 w-full bg-kb-gray-100 dark:bg-zinc-700">
                    <div
                      className="h-full bg-kb-accent transition-all duration-500"
                      style={{ width: isActive ? `${Math.min((data[key].length / 80) * 100, 100)}%` : '0%' }}
                    />
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Completion summary */}
      {allDone && (
        <div className="mt-4 rounded-xl border border-green-200 bg-green-50 px-5 py-4 dark:border-green-800 dark:bg-green-950/30">
          <p className="mb-1 text-xs font-bold uppercase tracking-wide text-green-700 dark:text-green-400">
            Causa raíz identificada
          </p>
          <p className="text-sm font-semibold text-kb-black dark:text-white">{data.why5}</p>
        </div>
      )}
    </div>
  )
}
