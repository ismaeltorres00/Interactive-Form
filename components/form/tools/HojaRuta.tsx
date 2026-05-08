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
  { key: 'hoy' as keyof Data, label: null },
  { key: 'y10' as keyof Data, label: '10 años' },
  { key: 'y15' as keyof Data, label: '15 años' },
  { key: 'y20' as keyof Data, label: '20 años' },
]

interface Props {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}

export function HojaRuta({ value, onChange, disabled }: Props) {
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
    <div className="w-full">
      {/* Labels row */}
      <div className="mb-1 grid grid-cols-4">
        {PERIODS.map(({ key, label }) => (
          <div key={key} className="text-center text-sm font-medium text-zinc-700">
            {label ?? ''}
          </div>
        ))}
      </div>

      {/* Timeline */}
      <div className="relative mb-5 flex items-center">
        <div className="absolute inset-x-0 top-1/2 h-2.5 -translate-y-1/2 bg-yellow-400" />
        <div className="relative z-10 grid w-full grid-cols-4">
          {PERIODS.map(({ key }) => (
            <div key={key} className="flex justify-center">
              <div className="h-6 w-4 bg-yellow-400 ring-2 ring-yellow-500" />
            </div>
          ))}
        </div>
      </div>

      {/* Cards */}
      <div className="grid grid-cols-4 gap-3">
        {PERIODS.map(({ key }) => (
          <textarea
            key={key}
            value={data[key]}
            onChange={(e) => update(key, e.target.value)}
            disabled={disabled}
            placeholder=""
            className="h-64 w-full resize-none border border-zinc-300 bg-white p-3 text-sm text-zinc-700 focus:border-yellow-400 focus:outline-none transition-colors disabled:opacity-50"
          />
        ))}
      </div>
    </div>
  )
}
