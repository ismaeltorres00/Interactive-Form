'use client'

import { useState, useEffect } from 'react'

interface Entry {
  creo: string
  somos: string
  frase: string
}

const DEFAULT_ENTRIES: Entry[] = Array.from({ length: 4 }, () => ({
  creo: '',
  somos: '',
  frase: '',
}))

const FRASE_PROMPT =
  'Genera una frase de valor breve, directa e impactante (máximo 10 palabras) que encapsule la creencia y la identidad descritas. Solo devuelve la frase, sin explicaciones ni comillas.'

interface Props {
  value: string
  onChange: (value: string) => void
  disabled?: boolean
  aiEnabled?: boolean
}

export function CreenciasValores({ value, onChange, disabled, aiEnabled }: Props) {
  const [entries, setEntries] = useState<Entry[]>(() => {
    try {
      const parsed = JSON.parse(value)
      return Array.isArray(parsed) ? parsed : DEFAULT_ENTRIES
    } catch {
      return DEFAULT_ENTRIES
    }
  })

  const [generatingIndex, setGeneratingIndex] = useState<number | null>(null)
  const [errors, setErrors] = useState<Record<number, string>>({})

  useEffect(() => {
    try {
      const parsed = JSON.parse(value)
      if (Array.isArray(parsed)) setEntries(parsed)
    } catch {}
  }, [value])

  const update = (index: number, field: keyof Entry, val: string) => {
    const next = entries.map((e, i) => (i === index ? { ...e, [field]: val } : e))
    setEntries(next)
    onChange(JSON.stringify(next))
  }

  const generateFrase = async (index: number) => {
    const entry = entries[index]
    setGeneratingIndex(index)
    setErrors((prev) => { const e = { ...prev }; delete e[index]; return e })

    try {
      const context = [
        entry.creo  ? `Creencia: ${entry.creo}` : '',
        entry.somos ? `Identidad: ${entry.somos}` : '',
      ].filter(Boolean).join('\n')

      const res = await fetch('/api/ai-inline', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ prompt: FRASE_PROMPT, context }),
      })

      if (!res.ok) throw new Error('Error en la respuesta')

      const { value: frase } = await res.json()
      update(index, 'frase', frase.trim())
    } catch {
      setErrors((prev) => ({ ...prev, [index]: 'Error al generar. Inténtalo de nuevo.' }))
    } finally {
      setGeneratingIndex(null)
    }
  }

  const inputClass = 'min-w-[180px] flex-1 border-0 border-b border-dotted border-zinc-400 bg-transparent pb-0.5 text-base text-zinc-800 focus:border-yellow-400 focus:outline-none transition-colors disabled:opacity-50 dark:border-zinc-600 dark:text-zinc-200 dark:focus:border-yellow-400'

  return (
    <div className="w-full space-y-8">
      {entries.map((entry, i) => {
        const canGenerate = !!(entry.creo.trim() || entry.somos.trim())
        const isGenerating = generatingIndex === i

        return (
          <div key={i}>
            <div className="flex flex-wrap items-baseline gap-x-2 gap-y-2">
              <span className="text-base font-medium text-zinc-800 whitespace-nowrap dark:text-zinc-200">
                {i + 1}. Creemos que
              </span>
              <input
                value={entry.creo}
                onChange={(e) => update(i, 'creo', e.target.value)}
                disabled={disabled}
                className={inputClass}
              />
              <span className="text-base font-medium text-zinc-800 whitespace-nowrap ml-6 dark:text-zinc-200">
                Por tanto somos
              </span>
              <input
                value={entry.somos}
                onChange={(e) => update(i, 'somos', e.target.value)}
                disabled={disabled}
                className={inputClass}
              />
            </div>

            <div className="mt-2 flex items-center gap-x-2 pl-5">
              <span className="text-base text-zinc-800 whitespace-nowrap shrink-0 dark:text-zinc-200">Frase valor:</span>
              <input
                value={entry.frase}
                onChange={(e) => update(i, 'frase', e.target.value)}
                disabled={disabled}
                className={`flex-1 border-0 border-b border-dotted border-zinc-400 bg-transparent pb-0.5 text-base text-zinc-800 focus:border-yellow-400 focus:outline-none transition-colors disabled:opacity-50 dark:border-zinc-600 dark:text-zinc-200`}
              />
              {aiEnabled && (
                <button
                  type="button"
                  onClick={() => generateFrase(i)}
                  disabled={isGenerating || !canGenerate}
                  title={canGenerate ? 'Generar con IA' : 'Rellena la creencia o identidad primero'}
                  className="shrink-0 flex items-center gap-1 rounded-md bg-kb-accent px-2.5 py-1 text-xs font-bold text-kb-black hover:bg-kb-accent-dark transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {isGenerating ? (
                    <>
                      <svg className="h-3 w-3 animate-spin" viewBox="0 0 24 24" fill="none">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                      </svg>
                      Generando
                    </>
                  ) : (
                    <>
                      <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                          d="M5 3l1.5 4.5L11 9l-4.5 1.5L5 15l-1.5-4.5L-1 9l4.5-1.5L5 3z" />
                      </svg>
                      IA
                    </>
                  )}
                </button>
              )}
            </div>

            {errors[i] && (
              <p className="mt-1 pl-5 text-xs text-red-500">{errors[i]}</p>
            )}
          </div>
        )
      })}
    </div>
  )
}
