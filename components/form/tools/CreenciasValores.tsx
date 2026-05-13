'use client'

import { useState, useEffect } from 'react'

function CopyButton({ text }: { text: string }) {
  const [copied, setCopied] = useState(false)
  const copy = () => {
    navigator.clipboard.writeText(text).then(() => {
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    })
  }
  return (
    <button
      type="button"
      onClick={copy}
      className="flex items-center gap-0.5 text-[10px] text-zinc-400 hover:text-zinc-600 transition dark:text-zinc-600 dark:hover:text-zinc-400"
    >
      {copied ? (
        <>
          <svg className="h-2.5 w-2.5 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
          </svg>
          <span className="text-green-500">Copiado</span>
        </>
      ) : (
        <>
          <svg className="h-2.5 w-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
          </svg>
          Copiar
        </>
      )}
    </button>
  )
}

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
  aiPrompt?: string | null
}

export function CreenciasValores({ value, onChange, disabled, aiEnabled, aiPrompt }: Props) {
  const [entries, setEntries] = useState<Entry[]>(() => {
    try {
      const parsed = JSON.parse(value)
      return Array.isArray(parsed) ? parsed : DEFAULT_ENTRIES
    } catch {
      return DEFAULT_ENTRIES
    }
  })

  const [generatingIndex, setGeneratingIndex] = useState<number | null>(null)
  const [generatingAll, setGeneratingAll] = useState(false)
  const [errors, setErrors] = useState<Record<number, string>>({})
  const [expandedFrase, setExpandedFrase] = useState<Record<number, boolean>>({})

  const callAI = async (entry: Entry): Promise<string> => {
    const context = [
      entry.creo  ? `Creencia: ${entry.creo}` : '',
      entry.somos ? `Identidad: ${entry.somos}` : '',
    ].filter(Boolean).join('\n')

    const res = await fetch('/api/ai-inline', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ prompt: aiPrompt ?? FRASE_PROMPT, context }),
    })
    if (!res.ok) {
      const body = await res.json().catch(() => ({}))
      throw new Error(body.error ?? `Error ${res.status}`)
    }
    const { value: frase } = await res.json()
    return frase.trim()
  }

  const generateAll = async () => {
    setGeneratingAll(true)
    setErrors({})
    let current = [...entries]
    for (let i = 0; i < current.length; i++) {
      const entry = current[i]
      if (!entry.creo.trim() && !entry.somos.trim()) continue
      setGeneratingIndex(i)
      try {
        const frase = await callAI(entry)
        current = current.map((e, idx) => idx === i ? { ...e, frase } : e)
        setEntries([...current])
        onChange(JSON.stringify(current))
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Error al generar.'
        setErrors((prev) => ({ ...prev, [i]: msg }))
      }
    }
    setGeneratingIndex(null)
    setGeneratingAll(false)
  }

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
    setGeneratingIndex(index)
    setErrors((prev) => { const e = { ...prev }; delete e[index]; return e })
    try {
      const frase = await callAI(entries[index])
      update(index, 'frase', frase)
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : 'Error al generar.'
      const isQuota = msg.includes('429') || msg.toLowerCase().includes('quota') || msg.toLowerCase().includes('too many')
      setErrors((prev) => ({
        ...prev,
        [index]: isQuota ? 'Límite de peticiones alcanzado. Espera unos segundos e inténtalo de nuevo.' : msg,
      }))
    } finally {
      setGeneratingIndex(null)
    }
  }

  const inputClass = 'min-w-[180px] flex-1 border-0 border-b border-dotted border-zinc-400 bg-transparent pb-0.5 text-base text-zinc-800 focus:border-yellow-400 focus:outline-none transition-colors disabled:opacity-50 dark:border-zinc-600 dark:text-zinc-200 dark:focus:border-yellow-400'

  const canGenerateAll = entries.some((e) => e.creo.trim() || e.somos.trim())

  return (
    <div className="w-full space-y-8">
      {aiEnabled && (
        <div className="flex justify-end">
          <button
            type="button"
            onClick={generateAll}
            disabled={generatingAll || !canGenerateAll}
            className="flex items-center gap-1.5 rounded-md bg-kb-accent px-3 py-1.5 text-xs font-bold text-kb-black hover:bg-kb-accent-dark transition disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {generatingAll ? (
              <>
                <svg className="h-3 w-3 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                </svg>
                Generando...
              </>
            ) : (
              <>
                <svg className="h-3 w-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                    d="M5 3l1.5 4.5L11 9l-4.5 1.5L5 15l-1.5-4.5L-1 9l4.5-1.5L5 3z" />
                </svg>
                Generar todo con IA
              </>
            )}
          </button>
        </div>
      )}
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

            <div className="mt-3 pl-5">
              <div className={`relative rounded-lg border transition-all ${
                entry.frase
                  ? 'border-yellow-300 bg-yellow-50/60 dark:border-yellow-500/30 dark:bg-yellow-900/10'
                  : 'border-dashed border-zinc-300 bg-zinc-50/50 dark:border-zinc-700 dark:bg-zinc-800/30'
              }`}>
                <div className="flex items-center justify-between px-3 pt-2.5">
                  <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-400 dark:text-zinc-500">
                    Frase valor
                  </span>
                  {aiEnabled && (
                    <button
                      type="button"
                      onClick={() => generateFrase(i)}
                      disabled={isGenerating || !canGenerate}
                      title={canGenerate ? 'Generar con IA' : 'Rellena la creencia o identidad primero'}
                      className="flex items-center gap-1 rounded bg-kb-accent px-2 py-0.5 text-[10px] font-bold text-kb-black hover:bg-kb-accent-dark transition disabled:opacity-40 disabled:cursor-not-allowed"
                    >
                      {isGenerating ? (
                        <>
                          <svg className="h-2.5 w-2.5 animate-spin" viewBox="0 0 24 24" fill="none">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                          </svg>
                          Generando
                        </>
                      ) : (
                        <>
                          <svg className="h-2.5 w-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                              d="M5 3l1.5 4.5L11 9l-4.5 1.5L5 15l-1.5-4.5L-1 9l4.5-1.5L5 3z" />
                          </svg>
                          IA
                        </>
                      )}
                    </button>
                  )}
                </div>
                {expandedFrase[i] ? (
                  <div className="px-3 pb-1 pt-1">
                    <p className="text-sm font-medium italic text-zinc-700 dark:text-zinc-200 whitespace-pre-wrap">
                      {entry.frase}
                    </p>
                  </div>
                ) : (
                  <p className="px-3 pb-1 pt-1 text-sm font-medium italic text-zinc-700 line-clamp-1 dark:text-zinc-200">
                    {entry.frase || <span className="text-zinc-300 dark:text-zinc-600">La frase aparecerá aquí…</span>}
                  </p>
                )}
                {entry.frase && (
                  <div className="flex items-center gap-3 px-3 pb-2">
                    <button
                      type="button"
                      onClick={() => setExpandedFrase((prev) => ({ ...prev, [i]: !prev[i] }))}
                      className="flex items-center gap-0.5 text-[10px] text-zinc-400 hover:text-zinc-600 transition dark:text-zinc-600 dark:hover:text-zinc-400"
                    >
                      {expandedFrase[i] ? (
                        <>
                          <svg className="h-2.5 w-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 15l7-7 7 7" />
                          </svg>
                          Contraer
                        </>
                      ) : (
                        <>
                          <svg className="h-2.5 w-2.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                          </svg>
                          Ver todo
                        </>
                      )}
                    </button>
                    {expandedFrase[i] && (
                      <CopyButton text={entry.frase} />
                    )}
                  </div>
                )}
              </div>
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
