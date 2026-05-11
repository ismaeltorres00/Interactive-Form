'use client'

import { useState, useEffect } from 'react'

interface Data {
  que: string
  como: string
  porque: string
}

const EMPTY: Data = { que: '', como: '', porque: '' }

const FIELDS = [
  { key: 'que' as keyof Data, label: '¿Qué hace tu compañía?' },
  { key: 'como' as keyof Data, label: '¿Cómo lo hace?' },
  { key: 'porque' as keyof Data, label: '¿Por qué lo hace?' },
]

interface Props {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
}

export function CirculoOro({ value, onChange, disabled }: Props) {
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
    <div className="flex items-start gap-10">
      {/* SVG — Golden Circle */}
      <div className="flex-shrink-0" style={{ width: 300, height: 300 }}>
        <svg viewBox="0 0 300 300" className="w-full h-full">
          {/* ¿Qué? — outer gray ring */}
          <circle cx="150" cy="150" r="142" fill="#e8e8e8" stroke="#444" strokeWidth="1.5" />
          {/* ¿Cómo? — yellow ring */}
          <circle cx="150" cy="150" r="96" fill="#FFD700" stroke="#444" strokeWidth="1.5" />
          {/* ¿Por qué? — inner dark yellow */}
          <circle cx="150" cy="150" r="52" fill="#F5C400" stroke="#444" strokeWidth="1.5" />

          <text x="150" y="36" textAnchor="middle" fill="#666" fontSize="16" fontWeight="500" fontFamily="sans-serif">
            ¿Qué?
          </text>
          <text x="150" y="80" textAnchor="middle" fill="#333" fontSize="15" fontWeight="500" fontFamily="sans-serif">
            ¿Cómo?
          </text>
          <text x="150" y="146" textAnchor="middle" fill="#222" fontSize="14" fontWeight="700" fontFamily="sans-serif">
            ¿Por qué?
          </text>
        </svg>
      </div>

      {/* Input fields */}
      <div className="flex-1 flex flex-col">
        {FIELDS.map(({ key, label }, i) => (
          <div
            key={key}
            className={`border border-zinc-300 focus-within:border-yellow-400 transition-colors dark:border-zinc-700 dark:focus-within:border-yellow-400 ${i > 0 ? 'border-t-0 dark:border-t-0' : ''}`}
          >
            <p className="px-3 pt-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">{label}</p>
            <textarea
              value={data[key]}
              onChange={(e) => update(key, e.target.value)}
              disabled={disabled}
              rows={4}
              className="w-full resize-none bg-transparent px-3 pb-2 text-sm text-zinc-700 focus:outline-none disabled:opacity-50 dark:text-zinc-300"
            />
          </div>
        ))}
      </div>
    </div>
  )
}
