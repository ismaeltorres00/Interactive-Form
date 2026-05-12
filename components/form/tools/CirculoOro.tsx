'use client'

import { useState, useEffect } from 'react'

interface Data {
  que: string
  como: string
  porque: string
}

const EMPTY: Data = { que: '', como: '', porque: '' }

const FIELDS = [
  {
    key: 'que' as keyof Data,
    label: '¿Qué?',
    sublabel: 'Tu producto o servicio',
    hint: 'Describe qué hace tu empresa…',
    r: 108,
    ringLabel: 'QUÉ',
    labelY: 22,
  },
  {
    key: 'como' as keyof Data,
    label: '¿Cómo?',
    sublabel: 'Tu proceso o diferencial',
    hint: 'Cómo lo llevas a cabo, qué te diferencia…',
    r: 72,
    ringLabel: 'CÓMO',
    labelY: 58,
  },
  {
    key: 'porque' as keyof Data,
    label: '¿Por qué?',
    sublabel: 'Tu propósito',
    hint: 'La razón de existir de tu empresa…',
    r: 36,
    ringLabel: 'POR QUÉ',
    labelY: 116,
  },
]

const CX = 120
const CY = 120

interface Props {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}

function GoldenCircleSvg({
  active,
  filled,
}: {
  active: keyof Data | null
  filled: Record<keyof Data, boolean>
}) {
  const getColors = (key: keyof Data) => {
    const isDone = filled[key]
    const isActive = active === key

    if (key === 'porque') {
      return {
        fill: isDone ? '#22c55e' : isActive ? '#FFD600' : '#FFD60033',
        stroke: isDone ? '#16a34a' : isActive ? '#b45309' : '#e4d000',
        textFill: isDone ? '#fff' : isActive ? '#78350f' : '#a16207',
      }
    }
    if (key === 'como') {
      return {
        fill: isDone ? '#bbf7d0' : isActive ? '#FEF08A' : '#fefce8',
        stroke: isDone ? '#4ade80' : isActive ? '#ca8a04' : '#fde68a',
        textFill: isDone ? '#15803d' : isActive ? '#92400e' : '#d97706',
      }
    }
    // que — outer
    return {
      fill: isDone ? '#dcfce7' : isActive ? '#f4f4f5' : '#fafafa',
      stroke: isDone ? '#86efac' : isActive ? '#a1a1aa' : '#e4e4e7',
      textFill: isDone ? '#15803d' : isActive ? '#3f3f46' : '#a1a1aa',
    }
  }

  const que = getColors('que')
  const como = getColors('como')
  const porque = getColors('porque')

  return (
    <svg viewBox="0 0 240 240" className="w-full h-full drop-shadow-sm">
      {/* Outer — ¿Qué? */}
      <circle cx={CX} cy={CY} r={108} fill={que.fill} stroke={que.stroke} strokeWidth={active === 'que' ? 2.5 : 1.5} className="transition-all duration-400" />
      {/* Middle — ¿Cómo? */}
      <circle cx={CX} cy={CY} r={72} fill={como.fill} stroke={como.stroke} strokeWidth={active === 'como' ? 2.5 : 1.5} className="transition-all duration-400" />
      {/* Inner — ¿Por qué? */}
      <circle cx={CX} cy={CY} r={36} fill={porque.fill} stroke={porque.stroke} strokeWidth={active === 'porque' ? 2.5 : 1.5} className="transition-all duration-400" />

      {/* Labels — positioned in the center of each annular ring */}
      {/* ¿Qué? label: midpoint radius = (108+72)/2 = 90, top */}
      <text x={CX} y={CY - 90 + 5} textAnchor="middle" dominantBaseline="central"
        fontSize="10" fontWeight="700" letterSpacing="1.5" fill={que.textFill}
        className="transition-all duration-400 select-none uppercase">
        Qué
      </text>

      {/* ¿Cómo? label: midpoint radius = (72+36)/2 = 54, top */}
      <text x={CX} y={CY - 54 + 5} textAnchor="middle" dominantBaseline="central"
        fontSize="10" fontWeight="700" letterSpacing="1.5" fill={como.textFill}
        className="transition-all duration-400 select-none uppercase">
        Cómo
      </text>

      {/* ¿Por qué? label: center */}
      <text x={CX} y={CY - 6} textAnchor="middle" dominantBaseline="central"
        fontSize="9" fontWeight="700" letterSpacing="1" fill={porque.textFill}
        className="transition-all duration-400 select-none uppercase">
        Por qué
      </text>
      <text x={CX} y={CY + 8} textAnchor="middle" dominantBaseline="central"
        fontSize="8" fontWeight="500" fill={porque.textFill}
        opacity="0.7"
        className="transition-all duration-400 select-none">
        propósito
      </text>

      {/* Active ring pulse ring */}
      {active && (
        <circle
          cx={CX}
          cy={CY}
          r={FIELDS.find((f) => f.key === active)!.r}
          fill="none"
          stroke="#FFD600"
          strokeWidth="4"
          opacity="0.2"
          className="animate-ping"
          style={{ transformOrigin: `${CX}px ${CY}px` }}
        />
      )}
    </svg>
  )
}

export function CirculoOro({ value, onChange, disabled }: Props) {
  const [data, setData] = useState<Data>(() => {
    try { return { ...EMPTY, ...JSON.parse(value) } } catch { return EMPTY }
  })
  const [active, setActive] = useState<keyof Data | null>(null)

  useEffect(() => {
    try { setData({ ...EMPTY, ...JSON.parse(value) }) } catch {}
  }, [value])

  const update = (field: keyof Data, val: string) => {
    const next = { ...data, [field]: val }
    setData(next)
    onChange(JSON.stringify(next))
  }

  const filled: Record<keyof Data, boolean> = {
    que: data.que.trim() !== '',
    como: data.como.trim() !== '',
    porque: data.porque.trim() !== '',
  }

  const allDone = Object.values(filled).every(Boolean)

  return (
    <div className="w-full">
      <p className="mb-6 text-sm text-kb-gray-600 dark:text-zinc-400">
        El <span className="font-semibold text-kb-black dark:text-white">Círculo de Oro</span> de Simon Sinek.
        Las empresas que inspiran empiezan por el{' '}
        <span className="font-semibold text-kb-accent-dark dark:text-kb-accent">¿Por qué?</span>
      </p>

      <div className="flex flex-col gap-6 lg:flex-row lg:items-start">
        {/* SVG — sticky on desktop */}
        <div className="mx-auto w-52 flex-shrink-0 lg:sticky lg:top-24 lg:w-56">
          <GoldenCircleSvg active={active} filled={filled} />
        </div>

        {/* Fields */}
        <div className="flex-1 space-y-3">
          {FIELDS.map(({ key, label, sublabel, hint }, i) => {
            const isActive = active === key
            const isDone = filled[key]
            const isCore = key === 'porque'

            return (
              <div
                key={key}
                onClick={() => !disabled && setActive(key)}
                className={`cursor-pointer rounded-xl border transition-all duration-300 overflow-hidden ${
                  isCore && (isActive || isDone)
                    ? 'border-kb-accent/40 bg-gradient-to-br from-[#fefae6] to-white shadow-md dark:from-[#2a2000] dark:to-zinc-900'
                    : isActive
                    ? 'border-kb-gray-300 bg-white shadow-sm dark:border-zinc-600 dark:bg-zinc-800'
                    : isDone
                    ? 'border-kb-gray-200 bg-white dark:border-zinc-700 dark:bg-zinc-800/60'
                    : 'border-kb-gray-200 bg-white dark:border-zinc-700 dark:bg-zinc-800/40'
                }`}
              >
                {/* Colored left accent bar */}
                <div className={`flex gap-0`}>
                  <div className={`w-1 flex-shrink-0 rounded-l-xl transition-all duration-300 ${
                    isDone ? 'bg-green-400' :
                    isActive && isCore ? 'bg-kb-accent' :
                    isActive ? 'bg-kb-gray-400 dark:bg-zinc-500' :
                    'bg-transparent'
                  }`} />

                  <div className="flex-1 px-4 py-4">
                    {/* Header */}
                    <div className="mb-2 flex items-center justify-between">
                      <div>
                        <span className={`text-sm font-bold ${
                          isActive && isCore ? 'text-kb-accent-dark dark:text-kb-accent' :
                          isActive ? 'text-kb-black dark:text-white' :
                          isDone ? 'text-green-600 dark:text-green-400' :
                          'text-kb-gray-600 dark:text-zinc-400'
                        }`}>
                          {label}
                        </span>
                        <span className="ml-2 text-xs text-kb-gray-600 dark:text-zinc-500">{sublabel}</span>
                      </div>
                      {isCore && (
                        <span className="rounded-full bg-kb-accent/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-kb-accent-dark dark:text-kb-accent">
                          Propósito
                        </span>
                      )}
                      {isDone && !isActive && (
                        <svg className="h-4 w-4 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                      )}
                    </div>

                    {/* Textarea */}
                    <textarea
                      value={data[key]}
                      onChange={(e) => { e.stopPropagation(); update(key, e.target.value) }}
                      onFocus={() => setActive(key)}
                      onBlur={() => setActive(null)}
                      disabled={disabled}
                      placeholder={hint}
                      rows={3}
                      className="w-full resize-none bg-transparent text-sm text-kb-black placeholder:text-kb-gray-200 focus:outline-none disabled:opacity-50 dark:text-white dark:placeholder:text-zinc-600"
                    />

                    {/* Progress bar — always rendered to avoid layout shift */}
                    <div className="mt-2 h-0.5 w-full rounded-full bg-kb-gray-100 dark:bg-zinc-700">
                      <div
                        className="h-full rounded-full bg-kb-accent transition-all duration-500"
                        style={{ width: isActive ? `${Math.min((data[key].length / 100) * 100, 100)}%` : '0%' }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Completion callout */}
      {allDone && (
        <div className="mt-6 rounded-xl border border-kb-accent/30 bg-[#fefae6] px-5 py-4 dark:border-kb-accent/20 dark:bg-[#2a2000]">
          <p className="mb-1 text-xs font-bold uppercase tracking-wide text-kb-accent-dark dark:text-kb-accent">
            Tu propósito
          </p>
          <p className="text-sm font-semibold text-kb-black dark:text-white">{data.porque}</p>
        </div>
      )}
    </div>
  )
}
