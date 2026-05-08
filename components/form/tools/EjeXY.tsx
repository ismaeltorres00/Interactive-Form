'use client'

import { useState, useRef, useCallback, useEffect } from 'react'

interface ItemDef {
  id: string
  label: string
  bg: string
  border: string
  dot: string
}

interface Pos { x: number; y: number }

const ITEMS: ItemDef[] = [
  { id: 'tu_marca',   label: 'Tu marca',              bg: '#ede9fe', border: '#7c3aed', dot: '#7c3aed' },
  { id: 'competidor', label: 'Competidor principal',  bg: '#fef3c7', border: '#d97706', dot: '#d97706' },
  { id: 'referente',  label: 'Referente del sector',  bg: '#d1fae5', border: '#059669', dot: '#059669' },
  { id: 'ideal',      label: 'Posicionamiento ideal', bg: '#fce7f3', border: '#db2777', dot: '#db2777' },
]

const DEFAULTS: Record<string, Pos> = {
  tu_marca:   { x: 28, y: 32 },
  competidor: { x: 70, y: 28 },
  referente:  { x: 65, y: 68 },
  ideal:      { x: 30, y: 68 },
}

interface Props {
  value: string
  onChange: (v: string) => void
  disabled?: boolean
}

function serialize(pos: Record<string, Pos>): string {
  return JSON.stringify({
    items: ITEMS.map((it) => ({
      id: it.id,
      label: it.label,
      x: Math.round((pos[it.id]?.x ?? DEFAULTS[it.id].x) * 10) / 10,
      y: Math.round((pos[it.id]?.y ?? DEFAULTS[it.id].y) * 10) / 10,
    })),
  })
}

function deserialize(value: string): Record<string, Pos> {
  try {
    const d = JSON.parse(value)
    if (d?.items) {
      const m: Record<string, Pos> = {}
      ;(d.items as { id: string; x: number; y: number }[]).forEach(
        (it) => { m[it.id] = { x: it.x, y: it.y } }
      )
      return m
    }
  } catch {}
  return { ...DEFAULTS }
}

export function EjeXY({ value, onChange, disabled }: Props) {
  const [positions, setPositions] = useState<Record<string, Pos>>(() => deserialize(value))
  const [dragging, setDragging] = useState<string | null>(null)
  const boardRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (value) setPositions(deserialize(value))
  }, [value])

  const onPointerMove = useCallback(
    (e: React.PointerEvent) => {
      if (!dragging || !boardRef.current) return
      const rect = boardRef.current.getBoundingClientRect()
      const x = Math.min(92, Math.max(8, ((e.clientX - rect.left) / rect.width) * 100))
      const y = Math.min(92, Math.max(8, ((e.clientY - rect.top) / rect.height) * 100))
      setPositions((prev) => ({ ...prev, [dragging]: { x, y } }))
    },
    [dragging]
  )

  const stopDrag = useCallback(() => {
    if (!dragging) return
    setDragging(null)
    setPositions((prev) => {
      onChange(serialize(prev))
      return prev
    })
  }, [dragging, onChange])

  return (
    <div className="select-none">
      {/* Top axis label */}
      <div className="mb-3 flex items-center justify-center gap-2">
        <span className="h-px w-8 bg-zinc-300" />
        <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-400">Premium</span>
        <span className="h-px w-8 bg-zinc-300" />
      </div>

      <div className="flex items-center gap-3">
        {/* Left label */}
        <span
          className="shrink-0 text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-400"
          style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
        >
          Tradicional
        </span>

        {/* Canvas */}
        <div
          ref={boardRef}
          onPointerMove={onPointerMove}
          onPointerUp={stopDrag}
          onPointerLeave={stopDrag}
          className="relative flex-1 overflow-hidden rounded-2xl border border-zinc-200"
          style={{
            aspectRatio: '4/3',
            backgroundImage: 'radial-gradient(circle, #d4d4d8 1.5px, transparent 1.5px)',
            backgroundSize: '30px 30px',
            backgroundColor: '#f9f9fb',
            boxShadow: 'inset 0 2px 8px rgba(0,0,0,0.04)',
            cursor: dragging ? 'grabbing' : 'default',
          }}
        >
          {/* Quadrant tints */}
          <div className="pointer-events-none absolute inset-0">
            <div className="absolute left-0 top-0 h-1/2 w-1/2 rounded-tl-2xl bg-indigo-50/50" />
            <div className="absolute right-0 top-0 h-1/2 w-1/2 rounded-tr-2xl bg-violet-50/50" />
            <div className="absolute bottom-0 left-0 h-1/2 w-1/2 rounded-bl-2xl bg-amber-50/40" />
            <div className="absolute bottom-0 right-0 h-1/2 w-1/2 rounded-br-2xl bg-emerald-50/40" />
          </div>

          {/* Center lines */}
          <div className="pointer-events-none absolute inset-x-6 top-1/2 h-px -translate-y-px bg-zinc-300/70" />
          <div className="pointer-events-none absolute inset-y-6 left-1/2 w-px -translate-x-px bg-zinc-300/70" />

          {/* Center dot */}
          <div className="pointer-events-none absolute left-1/2 top-1/2 h-3 w-3 -translate-x-1/2 -translate-y-1/2 rounded-full border-2 border-zinc-300 bg-white shadow-sm" />

          {/* Quadrant corner micro-labels */}
          <div className="pointer-events-none absolute inset-0">
            <span className="absolute left-5 top-5 text-[9px] font-semibold uppercase tracking-wider text-zinc-300">Exclusivo · Clásico</span>
            <span className="absolute right-5 top-5 text-right text-[9px] font-semibold uppercase tracking-wider text-zinc-300">Exclusivo · Moderno</span>
            <span className="absolute bottom-5 left-5 text-[9px] font-semibold uppercase tracking-wider text-zinc-300">Popular · Clásico</span>
            <span className="absolute bottom-5 right-5 text-right text-[9px] font-semibold uppercase tracking-wider text-zinc-300">Popular · Moderno</span>
          </div>

          {/* Chips */}
          {ITEMS.map((item) => {
            const pos = positions[item.id] ?? DEFAULTS[item.id]
            const active = dragging === item.id
            return (
              <div
                key={item.id}
                className="absolute"
                style={{
                  left: `${pos.x}%`,
                  top: `${pos.y}%`,
                  transform: `translate(-50%, -50%) scale(${active ? 1.12 : 1})`,
                  transition: active ? 'none' : 'transform 0.18s ease',
                  zIndex: active ? 20 : 2,
                  cursor: disabled ? 'default' : active ? 'grabbing' : 'grab',
                  touchAction: 'none',
                }}
                onPointerDown={(e) => {
                  if (disabled) return
                  e.preventDefault()
                  setDragging(item.id)
                }}
              >
                <div
                  style={{
                    background: item.bg,
                    borderColor: active ? item.border : `${item.border}bb`,
                    boxShadow: active
                      ? `0 12px 32px -4px ${item.dot}55, 0 0 0 4px ${item.dot}20`
                      : `0 2px 10px -2px ${item.dot}45`,
                    transition: active ? 'none' : 'box-shadow 0.2s ease, border-color 0.2s ease',
                  }}
                  className="flex items-center gap-2 rounded-full border-2 py-1.5 pl-2.5 pr-3.5 text-xs font-semibold whitespace-nowrap"
                >
                  <span
                    className="h-2 w-2 shrink-0 rounded-full"
                    style={{ background: item.dot, boxShadow: `0 0 0 2px ${item.dot}30` }}
                  />
                  <span className="text-zinc-800">{item.label}</span>
                </div>
              </div>
            )
          })}
        </div>

        {/* Right label */}
        <span
          className="shrink-0 text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-400"
          style={{ writingMode: 'vertical-rl' }}
        >
          Moderno
        </span>
      </div>

      {/* Bottom axis label */}
      <div className="mt-3 flex items-center justify-center gap-2">
        <span className="h-px w-8 bg-zinc-300" />
        <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-400">Accesible</span>
        <span className="h-px w-8 bg-zinc-300" />
      </div>

      {/* Legend */}
      <div className="mt-5 flex flex-wrap justify-center gap-5">
        {ITEMS.map((item) => (
          <div key={item.id} className="flex items-center gap-2">
            <span className="h-2.5 w-2.5 shrink-0 rounded-full" style={{ background: item.dot }} />
            <span className="text-xs text-zinc-500">{item.label}</span>
          </div>
        ))}
      </div>

      {!disabled && (
        <p className="mt-2 text-center text-[11px] text-zinc-400">
          Arrastra cada elemento hasta la posición que mejor represente tu marca
        </p>
      )}
    </div>
  )
}
