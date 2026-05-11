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

const COLOR_PALETTE = [
  { bg: '#ede9fe', border: '#7c3aed', dot: '#7c3aed' },
  { bg: '#fef3c7', border: '#d97706', dot: '#d97706' },
  { bg: '#d1fae5', border: '#059669', dot: '#059669' },
  { bg: '#fce7f3', border: '#db2777', dot: '#db2777' },
  { bg: '#dbeafe', border: '#2563eb', dot: '#2563eb' },
  { bg: '#ffedd5', border: '#ea580c', dot: '#ea580c' },
  { bg: '#f0fdf4', border: '#16a34a', dot: '#16a34a' },
  { bg: '#fdf4ff', border: '#a21caf', dot: '#a21caf' },
]

const DEFAULT_LABELS = ['Tu marca', 'Competidor principal', 'Referente del sector', 'Posicionamiento ideal']

interface Axes { top: string; bottom: string; left: string; right: string }
const DEFAULT_AXES: Axes = { top: 'Premium', bottom: 'Accesible', left: 'Tradicional', right: 'Moderno' }

const SPREAD_POSITIONS: Pos[] = [
  { x: 28, y: 32 },
  { x: 70, y: 28 },
  { x: 65, y: 68 },
  { x: 30, y: 68 },
  { x: 50, y: 20 },
  { x: 80, y: 50 },
  { x: 50, y: 78 },
  { x: 20, y: 55 },
]

function makeId() {
  return `item_${Date.now()}_${Math.random().toString(36).slice(2, 7)}`
}

function buildItem(label: string, index: number, id?: string): ItemDef {
  const c = COLOR_PALETTE[index % COLOR_PALETTE.length]
  return { id: id ?? makeId(), label, ...c }
}

function defaultItems(): ItemDef[] {
  return DEFAULT_LABELS.map((label, i) => buildItem(label, i))
}

function serialize(items: ItemDef[], positions: Record<string, Pos>, axes: Axes): string {
  return JSON.stringify({
    axes,
    items: items.map((it, i) => ({
      id: it.id,
      label: it.label,
      x: Math.round((positions[it.id]?.x ?? SPREAD_POSITIONS[i % SPREAD_POSITIONS.length].x) * 10) / 10,
      y: Math.round((positions[it.id]?.y ?? SPREAD_POSITIONS[i % SPREAD_POSITIONS.length].y) * 10) / 10,
    })),
  })
}

function deserialize(raw: string): { items: ItemDef[]; positions: Record<string, Pos>; axes: Axes } | null {
  try {
    const d = JSON.parse(raw)
    if (Array.isArray(d?.items) && d.items.length) {
      const items: ItemDef[] = (d.items as { id: string; label: string; x: number; y: number }[]).map(
        (it, i) => buildItem(it.label, i, it.id)
      )
      const positions: Record<string, Pos> = {}
      ;(d.items as { id: string; x: number; y: number }[]).forEach(
        (it) => { positions[it.id] = { x: it.x, y: it.y } }
      )
      const axes: Axes = { ...DEFAULT_AXES, ...(d.axes ?? {}) }
      return { items, positions, axes }
    }
  } catch {}
  return null
}

interface Props {
  value: string
  onChange: (v: string) => void
  disabled?: boolean
}

export function EjeXY({ value, onChange, disabled }: Props) {
  const [items, setItems] = useState<ItemDef[]>(() => deserialize(value)?.items ?? defaultItems())
  const [positions, setPositions] = useState<Record<string, Pos>>(() => deserialize(value)?.positions ?? {})
  const [axes, setAxes] = useState<Axes>(() => deserialize(value)?.axes ?? DEFAULT_AXES)
  const [dragging, setDragging] = useState<string | null>(null)
  const boardRef = useRef<HTMLDivElement>(null)
  const itemsRef = useRef(items)
  const axesRef = useRef(axes)
  useEffect(() => { itemsRef.current = items }, [items])
  useEffect(() => { axesRef.current = axes }, [axes])

  useEffect(() => {
    if (!value) return
    const parsed = deserialize(value)
    if (parsed) { setItems(parsed.items); setPositions(parsed.positions); setAxes(parsed.axes) }
  }, [value])

  const getPos = (id: string, index: number): Pos =>
    positions[id] ?? SPREAD_POSITIONS[index % SPREAD_POSITIONS.length]

  const onPointerMove = useCallback((e: React.PointerEvent) => {
    if (!dragging || !boardRef.current) return
    const rect = boardRef.current.getBoundingClientRect()
    const x = Math.min(92, Math.max(8, ((e.clientX - rect.left) / rect.width) * 100))
    const y = Math.min(92, Math.max(8, ((e.clientY - rect.top) / rect.height) * 100))
    setPositions((prev) => ({ ...prev, [dragging]: { x, y } }))
  }, [dragging])

  const stopDrag = useCallback(() => {
    if (!dragging) return
    setDragging(null)
    setPositions((prev) => {
      onChange(serialize(itemsRef.current, prev, axesRef.current))
      return prev
    })
  }, [dragging, onChange])

  const updateLabel = useCallback((id: string, label: string) => {
    setItems((prev) => {
      const next = prev.map((it) => it.id === id ? { ...it, label } : it)
      setPositions((pos) => {
        onChange(serialize(next, pos, axesRef.current))
        return pos
      })
      return next
    })
  }, [onChange])

  const updateAxis = useCallback((key: keyof Axes, val: string) => {
    setAxes((prev) => {
      const next = { ...prev, [key]: val }
      setPositions((pos) => {
        onChange(serialize(itemsRef.current, pos, next))
        return pos
      })
      return next
    })
  }, [onChange])

  const addItem = useCallback(() => {
    const newItem = buildItem('Nueva etiqueta', items.length)
    const newPos = SPREAD_POSITIONS[items.length % SPREAD_POSITIONS.length]
    setItems((prev) => {
      const next = [...prev, newItem]
      setPositions((prevPos) => {
        const nextPos = { ...prevPos, [newItem.id]: newPos }
        onChange(serialize(next, nextPos, axesRef.current))
        return nextPos
      })
      return next
    })
  }, [items.length, onChange])

  const removeItem = useCallback((id: string) => {
    if (items.length <= 1) return
    setItems((prev) => {
      const next = prev.filter((it) => it.id !== id)
      setPositions((prevPos) => {
        const nextPos = { ...prevPos }
        delete nextPos[id]
        onChange(serialize(next, nextPos, axesRef.current))
        return nextPos
      })
      return next
    })
  }, [items.length, onChange])

  return (
    <div className="select-none">
      <div className="flex gap-5 items-start">
        {/* Canvas column */}
        <div className="flex-1 min-w-0">
          {/* Top axis label */}
          <div className="mb-3 flex items-center justify-center gap-2">
            <span className="h-px w-8 bg-zinc-300 dark:bg-zinc-600" />
            <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-400 dark:text-zinc-500">{axes.top}</span>
            <span className="h-px w-8 bg-zinc-300 dark:bg-zinc-600" />
          </div>

          <div className="flex items-center gap-3">
            {/* Left label */}
            <span
              className="shrink-0 text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-400 dark:text-zinc-500"
              style={{ writingMode: 'vertical-rl', transform: 'rotate(180deg)' }}
            >
              {axes.left}
            </span>

            {/* Canvas */}
            <div
              ref={boardRef}
              onPointerMove={onPointerMove}
              onPointerUp={stopDrag}
              onPointerLeave={stopDrag}
              className="relative flex-1 overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-700"
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
              {items.map((item, index) => {
                const pos = getPos(item.id, index)
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
                      <span className="text-zinc-800">{item.label || '…'}</span>
                    </div>
                  </div>
                )
              })}
            </div>

            {/* Right label */}
            <span
              className="shrink-0 text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-400 dark:text-zinc-500"
              style={{ writingMode: 'vertical-rl' }}
            >
              {axes.right}
            </span>
          </div>

          {/* Bottom axis label */}
          <div className="mt-3 flex items-center justify-center gap-2">
            <span className="h-px w-8 bg-zinc-300 dark:bg-zinc-600" />
            <span className="text-[11px] font-bold uppercase tracking-[0.18em] text-zinc-400 dark:text-zinc-500">{axes.bottom}</span>
            <span className="h-px w-8 bg-zinc-300 dark:bg-zinc-600" />
          </div>

          {!disabled && (
            <p className="mt-2 text-center text-[11px] text-zinc-400 dark:text-zinc-500">
              Arrastra cada elemento hasta la posición que mejor represente tu marca
            </p>
          )}
        </div>

        {/* Labels panel */}
        <div className="w-52 shrink-0 pt-10">
          <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-400 dark:text-zinc-500">
            Etiquetas
          </p>
          <div className="space-y-2">
            {items.map((item) => (
              <div key={item.id} className="flex items-center gap-2">
                <span
                  className="h-2.5 w-2.5 shrink-0 rounded-full"
                  style={{ background: item.dot }}
                />
                {disabled ? (
                  <span className="flex-1 text-sm text-zinc-700 dark:text-zinc-300">{item.label}</span>
                ) : (
                  <input
                    type="text"
                    value={item.label}
                    onChange={(e) => updateLabel(item.id, e.target.value)}
                    className="flex-1 min-w-0 rounded-lg border border-zinc-200 bg-white px-2.5 py-1 text-sm text-zinc-800 placeholder-zinc-400 focus:border-violet-400 focus:outline-none focus:ring-1 focus:ring-violet-300 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                    placeholder="Etiqueta"
                  />
                )}
                {!disabled && (
                  <button
                    type="button"
                    onClick={() => removeItem(item.id)}
                    disabled={items.length <= 1}
                    className="shrink-0 text-base leading-none text-zinc-300 transition-colors hover:text-red-400 disabled:cursor-not-allowed disabled:opacity-30"
                    title="Eliminar"
                  >
                    ×
                  </button>
                )}
              </div>
            ))}
          </div>

          {!disabled && (
            <button
              type="button"
              onClick={addItem}
              className="mt-3 flex items-center gap-1.5 text-sm font-medium text-violet-600 transition-colors hover:text-violet-700 dark:text-violet-400 dark:hover:text-violet-300"
            >
              <span className="text-base leading-none">+</span> Añadir etiqueta
            </button>
          )}

          {/* Axes section */}
          <div className="mt-5">
            <p className="mb-2 text-[10px] font-bold uppercase tracking-[0.15em] text-zinc-400 dark:text-zinc-500">
              Ejes
            </p>
            <div className="space-y-2">
              {([
                { key: 'top',    arrow: '↑' },
                { key: 'bottom', arrow: '↓' },
                { key: 'left',   arrow: '←' },
                { key: 'right',  arrow: '→' },
              ] as { key: keyof Axes; arrow: string }[]).map(({ key, arrow }) => (
                <div key={key} className="flex items-center gap-2">
                  <span className="shrink-0 w-4 text-center text-xs text-zinc-400">{arrow}</span>
                  {disabled ? (
                    <span className="flex-1 text-sm text-zinc-700 dark:text-zinc-300">{axes[key]}</span>
                  ) : (
                    <input
                      type="text"
                      value={axes[key]}
                      onChange={(e) => updateAxis(key, e.target.value)}
                      className="flex-1 min-w-0 rounded-lg border border-zinc-200 bg-white px-2.5 py-1 text-sm text-zinc-800 placeholder-zinc-400 focus:border-violet-400 focus:outline-none focus:ring-1 focus:ring-violet-300 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100"
                      placeholder={key}
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
