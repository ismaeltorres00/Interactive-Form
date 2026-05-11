'use client'

import { Question } from '@/lib/types'
import { CreenciasValores } from './tools/CreenciasValores'
import { HojaRuta } from './tools/HojaRuta'
import { CirculoOro } from './tools/CirculoOro'
import { CincoWhys } from './tools/CincoWhys'
import { EjeXY } from './tools/EjeXY'

interface Props {
  question: Question
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  aiEnabled?: boolean
}

export function QuestionRenderer({ question, value, onChange, disabled, aiEnabled }: Props) {
  const base = 'w-full rounded-lg border border-zinc-200 bg-white px-4 py-3 text-zinc-800 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-violet-500 transition disabled:opacity-50 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-100 dark:placeholder-zinc-500'

  if (question.type === 'text') {
    return (
      <input
        type="text"
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        placeholder="Escribe tu respuesta..."
        className={base}
      />
    )
  }

  if (question.type === 'textarea') {
    return (
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        rows={4}
        placeholder="Escribe tu respuesta..."
        className={`${base} resize-none`}
      />
    )
  }

  if (question.type === 'select' && question.options) {
    return (
      <select
        value={value}
        onChange={(e) => onChange(e.target.value)}
        disabled={disabled}
        className={base}
      >
        <option value="">Selecciona una opción...</option>
        {question.options.map((opt) => (
          <option key={opt} value={opt}>{opt}</option>
        ))}
      </select>
    )
  }

  if (question.type === 'multiselect' && question.options) {
    const selected = value ? value.split(',').map((v) => v.trim()).filter(Boolean) : []
    const toggle = (opt: string) => {
      const next = selected.includes(opt)
        ? selected.filter((s) => s !== opt)
        : [...selected, opt]
      onChange(next.join(', '))
    }
    return (
      <div className="flex flex-wrap gap-2">
        {question.options.map((opt) => (
          <button
            key={opt}
            type="button"
            disabled={disabled}
            onClick={() => toggle(opt)}
            className={`rounded-full border px-4 py-2 text-sm font-medium transition ${
              selected.includes(opt)
                ? 'border-violet-500 bg-violet-500 text-white'
                : 'border-zinc-200 bg-white text-zinc-700 hover:border-violet-300 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-violet-600'
            } disabled:opacity-50`}
          >
            {opt}
          </button>
        ))}
      </div>
    )
  }

  if (question.type === 'boolean') {
    return (
      <div className="flex gap-3">
        {['Sí', 'No'].map((opt) => (
          <button
            key={opt}
            type="button"
            disabled={disabled}
            onClick={() => onChange(opt)}
            className={`flex-1 rounded-lg border px-4 py-3 text-sm font-medium transition ${
              value === opt
                ? 'border-violet-500 bg-violet-500 text-white'
                : 'border-zinc-200 bg-white text-zinc-700 hover:border-violet-300 dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-300 dark:hover:border-violet-600'
            } disabled:opacity-50`}
          >
            {opt}
          </button>
        ))}
      </div>
    )
  }

  if (question.type === 'creencias_valores') {
    return <CreenciasValores value={value} onChange={onChange} disabled={disabled} aiEnabled={aiEnabled} />
  }

  if (question.type === 'hoja_ruta') {
    return <HojaRuta value={value} onChange={onChange} disabled={disabled} />
  }

  if (question.type === 'circulo_oro') {
    return <CirculoOro value={value} onChange={onChange} disabled={disabled} />
  }

  if (question.type === 'cinco_whys') {
    return <CincoWhys value={value} onChange={onChange} disabled={disabled} />
  }

  if (question.type === 'eje_xy') {
    return <EjeXY value={value} onChange={onChange} disabled={disabled} />
  }

  return null
}
