'use client'

import { useState, useEffect } from 'react'

interface Data {
  hoy: string
  y10: string
  y15: string
  y20: string
}

const EMPTY: Data = { hoy: '', y10: '', y15: '', y20: '' }

const PERIODS = [
  {
    key: 'hoy' as keyof Data,
    label: 'Hoy',
    sublabel: 'Punto de partida',
    hint: 'Situación actual de la empresa…',
    isStart: true,
  },
  {
    key: 'y10' as keyof Data,
    label: '10 años',
    sublabel: 'Primer hito',
    hint: '¿Qué habrás conseguido?…',
    isStart: false,
  },
  {
    key: 'y15' as keyof Data,
    label: '15 años',
    sublabel: 'Crecimiento',
    hint: '¿Cómo se verá la empresa?…',
    isStart: false,
  },
  {
    key: 'y20' as keyof Data,
    label: '20 años',
    sublabel: 'Visión final',
    hint: '¿Cuál es tu visión a largo plazo?…',
    isStart: false,
  },
]

// Timeline node x positions (viewBox 0 0 560 56)
const NODE_XS = [56, 196, 336, 476]
const LINE_Y = 32

interface Props {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}

export function HojaRuta({ value, onChange, disabled }: Props) {
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

  const filled = (k: keyof Data) => data[k].trim() !== ''
  const activeIndex = active ? PERIODS.findIndex((p) => p.key === active) : -1

  return (
    <div className="w-full">
      <p className="mb-6 text-sm text-kb-gray-600 dark:text-zinc-400">
        Define tu <span className="font-semibold text-kb-black dark:text-white">visión a largo plazo</span>. ¿Dónde está tu empresa hoy y adónde quieres llegar?
      </p>

      {/* ── Timeline SVG ── */}
      <div className="mb-4 px-1">
        <svg viewBox="0 0 560 56" className="w-full overflow-visible">
          {/* Base line */}
          <line x1={NODE_XS[0]} y1={LINE_Y} x2={NODE_XS[3] + 24} y2={LINE_Y}
            stroke="#e4e4e7" strokeWidth="3" strokeLinecap="round"
            className="dark:stroke-zinc-700" />

          {/* Filled progress line */}
          {activeIndex >= 0 && (
            <line
              x1={NODE_XS[0]}
              y1={LINE_Y}
              x2={NODE_XS[activeIndex]}
              y2={LINE_Y}
              stroke="#FFD600"
              strokeWidth="3"
              strokeLinecap="round"
              className="transition-all duration-500"
            />
          )}
          {/* Filled segments for done periods */}
          {PERIODS.map((p, i) => {
            if (i === 0 || !filled(PERIODS[i - 1].key)) return null
            return (
              <line key={p.key}
                x1={NODE_XS[i - 1]} y1={LINE_Y}
                x2={NODE_XS[i]} y2={LINE_Y}
                stroke={filled(p.key) ? '#4ade80' : '#FFD600'}
                strokeWidth="3" strokeLinecap="round"
                className="transition-all duration-500"
              />
            )
          })}

          {/* Arrow tip */}
          <polyline
            points={`${NODE_XS[3] + 16},${LINE_Y - 7} ${NODE_XS[3] + 26},${LINE_Y} ${NODE_XS[3] + 16},${LINE_Y + 7}`}
            fill="none" stroke="#e4e4e7" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"
            className="dark:stroke-zinc-700"
          />

          {/* Nodes */}
          {PERIODS.map((p, i) => {
            const isFilled = filled(p.key)
            const isActive = active === p.key

            return (
              <g key={p.key}>
                {/* Pulse ring for active */}
                {isActive && (
                  <circle cx={NODE_XS[i]} cy={LINE_Y} r="14"
                    fill="none" stroke="#FFD600" strokeWidth="3" opacity="0.25"
                    className="animate-ping"
                    style={{ transformOrigin: `${NODE_XS[i]}px ${LINE_Y}px` }}
                  />
                )}

                {/* Node circle */}
                <circle
                  cx={NODE_XS[i]} cy={LINE_Y} r="9"
                  fill={isFilled ? '#22c55e' : isActive ? '#FFD600' : '#fff'}
                  stroke={isFilled ? '#16a34a' : isActive ? '#b45309' : '#d4d4d8'}
                  strokeWidth="2.5"
                  className="transition-all duration-300 cursor-pointer"
                  onClick={() => !disabled && document.getElementById(`hoja-${p.key}`)?.focus()}
                />

                {/* Check icon for filled */}
                {isFilled && (
                  <polyline
                    points={`${NODE_XS[i] - 4},${LINE_Y} ${NODE_XS[i] - 1},${LINE_Y + 3} ${NODE_XS[i] + 5},${LINE_Y - 4}`}
                    fill="none" stroke="white" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
                  />
                )}

                {/* Label above */}
                <text
                  x={NODE_XS[i]} y={LINE_Y - 17}
                  textAnchor="middle" dominantBaseline="central"
                  fontSize="11" fontWeight="700"
                  fill={isActive ? '#92400e' : isFilled ? '#15803d' : '#71717a'}
                  className="transition-all duration-300 select-none dark:fill-zinc-400"
                >
                  {p.label}
                </text>
              </g>
            )
          })}
        </svg>
      </div>

      {/* ── Cards grid ── */}
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        {PERIODS.map((p) => {
          const isActive = active === p.key
          const isFilled = filled(p.key)
          const isLast = p.key === 'y20'

          return (
            <div
              key={p.key}
              className={`group relative flex flex-col rounded-xl border transition-all duration-300 overflow-hidden ${
                isLast && (isActive || isFilled)
                  ? 'border-kb-accent/40 bg-gradient-to-b from-[#fefae6] to-white shadow-md dark:from-[#2a2000] dark:to-zinc-900'
                  : isActive
                  ? 'border-kb-gray-300 bg-white shadow-md dark:border-zinc-600 dark:bg-zinc-800'
                  : isFilled
                  ? 'border-green-200 bg-white dark:border-green-900 dark:bg-zinc-800/60'
                  : 'border-kb-gray-200 bg-white dark:border-zinc-700 dark:bg-zinc-800/40'
              }`}
            >
              {/* Top bar */}
              <div className={`h-1 w-full transition-all duration-300 ${
                isFilled ? 'bg-green-400' :
                isActive ? 'bg-kb-accent' :
                'bg-transparent'
              }`} />

              <div className="flex flex-1 flex-col p-4">
                {/* Header */}
                <div className="mb-3 flex items-start justify-between">
                  <div>
                    <p className={`text-sm font-bold transition-colors duration-300 ${
                      isActive
                        ? isLast ? 'text-kb-accent-dark dark:text-kb-accent' : 'text-kb-black dark:text-white'
                        : isFilled ? 'text-green-700 dark:text-green-400'
                        : 'text-kb-gray-600 dark:text-zinc-400'
                    }`}>
                      {p.label}
                    </p>
                    <p className="text-xs text-kb-gray-600 dark:text-zinc-500">{p.sublabel}</p>
                  </div>
                  {isLast && (
                    <span className="rounded-full bg-kb-accent/15 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-kb-accent-dark dark:text-kb-accent">
                      Visión
                    </span>
                  )}
                  {isFilled && !isActive && (
                    <svg className="h-4 w-4 flex-shrink-0 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                    </svg>
                  )}
                </div>

                {/* Textarea */}
                <textarea
                  id={`hoja-${p.key}`}
                  value={data[p.key]}
                  onChange={(e) => update(p.key, e.target.value)}
                  onFocus={() => setActive(p.key)}
                  onBlur={() => setActive(null)}
                  disabled={disabled}
                  placeholder={p.hint}
                  rows={5}
                  className="flex-1 w-full resize-none bg-transparent text-sm text-kb-black placeholder:text-kb-gray-200 focus:outline-none disabled:opacity-50 dark:text-white dark:placeholder:text-zinc-600"
                />
              </div>

              {/* Bottom progress bar — always rendered to avoid layout shift */}
              <div className="h-0.5 w-full bg-kb-gray-100 dark:bg-zinc-700">
                <div
                  className="h-full bg-kb-accent transition-all duration-500"
                  style={{ width: isActive ? `${Math.min((data[p.key].length / 120) * 100, 100)}%` : '0%' }}
                />
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
