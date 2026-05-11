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

const WHYS = [
  { key: 'why1' as keyof Data, label: 'Why 1' },
  { key: 'why2' as keyof Data, label: 'Why 2' },
  { key: 'why3' as keyof Data, label: 'Why 3' },
  { key: 'why4' as keyof Data, label: 'Why 4' },
  { key: 'why5' as keyof Data, label: 'Why 5' },
]

// SVG config (viewBox 0 0 420 370, circle center at 145, 185)
const CX = 145
const CY = 185
const RADII = [122, 98, 74, 50, 28]
const FILLS = ['#f0f0f0', '#e0e0e0', '#FFD700', '#F5C400', '#FFD700']

// Dot angles (degrees from east axis, positive = clockwise/down)
const DOT_ANGLES = [-45, -18, 6, 32, 62]

function toRad(deg: number) {
  return (deg * Math.PI) / 180
}

// Right-side label Y targets (evenly spaced, line fans out from dots)
const LABEL_YS = [90, 145, 190, 238, 286]
const LINE_X = 295

interface Props {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}

export function CincoWhys({ value, onChange, disabled }: Props) {
  const [data, setData] = useState<Data>(() => {
    try { return { ...EMPTY, ...JSON.parse(value) } } catch { return EMPTY }
  })

  useEffect(() => {
    try { setData({ ...EMPTY, ...JSON.parse(value) }) } catch {}
  }, [value])

  const update = (field: keyof Data, val: string) => {
    const next = { ...data, [field]: val }
    setData(next)
    onChange(JSON.stringify(next))
  }

  return (
    <div className="flex items-start gap-8">
      {/* SVG — 5 Why's concentric diagram */}
      <div className="flex-shrink-0" style={{ width: 380, height: 370 }}>
        <svg viewBox="0 0 420 370" className="w-full h-full">
          {/* Circles drawn largest → smallest so inner ones are on top */}
          {[...RADII].reverse().map((r, revIdx) => {
            const i = RADII.length - 1 - revIdx
            return (
              <circle
                key={r}
                cx={CX}
                cy={CY}
                r={r}
                fill={FILLS[i]}
                stroke="#666"
                strokeWidth="1.5"
              />
            )
          })}
          {/* Black center dot */}
          <circle cx={CX} cy={CY} r={7} fill="#111" />

          {/* Dots + connector lines */}
          {RADII.map((r, i) => {
            const dotX = CX + r * Math.cos(toRad(DOT_ANGLES[i]))
            const dotY = CY + r * Math.sin(toRad(DOT_ANGLES[i]))
            const labelY = LABEL_YS[i]
            return (
              <g key={i}>
                <line
                  x1={dotX}
                  y1={dotY}
                  x2={LINE_X}
                  y2={labelY}
                  stroke="#666"
                  strokeWidth="1"
                />
                <circle cx={dotX} cy={dotY} r={4} fill="#555" />
              </g>
            )
          })}
        </svg>
      </div>

      {/* Input fields */}
      <div className="flex-1 flex flex-col gap-2">
        {WHYS.map(({ key, label }) => (
          <div key={key} className="border border-zinc-300 focus-within:border-yellow-400 transition-colors dark:border-zinc-700 dark:focus-within:border-yellow-400">
            <p className="px-3 pt-2 text-sm font-medium text-zinc-600 dark:text-zinc-400">{label}</p>
            <textarea
              value={data[key]}
              onChange={(e) => update(key, e.target.value)}
              disabled={disabled}
              rows={3}
              className="w-full resize-none bg-transparent px-3 pb-2 text-sm text-zinc-700 focus:outline-none disabled:opacity-50 dark:text-zinc-300"
            />
          </div>
        ))}
      </div>
    </div>
  )
}
