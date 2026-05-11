'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'

export default function NewSessionPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [company, setCompany] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [created, setCreated] = useState<{ sessionId: string } | null>(null)
  const [copied, setCopied] = useState(false)

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    const res = await fetch('/api/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ clientName: name, clientEmail: email || null, companyName: company || null }),
    })

    const data = await res.json()
    setLoading(false)

    if (!res.ok) {
      setError(data.error || 'Error al crear la sesión')
      return
    }

    setCreated({ sessionId: data.sessionId })
  }

  const formUrl = created ? `${window.location.origin}/form/${created.sessionId}` : ''

  const handleCopy = async () => {
    await navigator.clipboard.writeText(formUrl)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  const inputClass = 'w-full rounded-lg border border-kb-gray-200 bg-white px-4 py-2.5 text-sm text-kb-black focus:outline-none focus:ring-2 focus:ring-kb-accent dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:placeholder-zinc-500'
  const labelClass = 'mb-1.5 block text-sm font-semibold text-kb-black dark:text-zinc-300'

  return (
    <div className="min-h-screen bg-kb-gray-100 flex items-center justify-center px-4 dark:bg-kb-black">
      <div className="w-full max-w-md rounded-xl border border-kb-gray-200 bg-white p-8 dark:border-zinc-800 dark:bg-zinc-900">
        <h1 className="mb-1 text-xl font-bold text-kb-black dark:text-white">Nuevo cliente</h1>
        <p className="mb-6 text-sm text-kb-gray-600 dark:text-zinc-400">Crea una sesión y comparte el enlace con tu cliente.</p>

        {!created ? (
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className={labelClass}>
                Nombre del cliente <span className="text-kb-accent-dark">*</span>
              </label>
              <input type="text" value={name} onChange={(e) => setName(e.target.value)}
                required placeholder="Ej: María García" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Nombre de empresa (opcional)</label>
              <input type="text" value={company} onChange={(e) => setCompany(e.target.value)}
                placeholder="Ej: Acme Studio" className={inputClass} />
            </div>
            <div>
              <label className={labelClass}>Email (opcional)</label>
              <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                placeholder="cliente@ejemplo.com" className={inputClass} />
            </div>
            {error && <p className="text-sm text-red-500">{error}</p>}
            <div className="flex gap-3 pt-2">
              <button type="button" onClick={() => router.push('/')}
                className="flex-1 rounded-lg border border-kb-gray-200 py-2.5 text-sm font-semibold text-kb-gray-600 hover:bg-kb-gray-100 transition dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800">
                Cancelar
              </button>
              <button type="submit" disabled={loading || !name.trim()}
                className="flex-1 rounded-lg bg-kb-accent py-2.5 text-sm font-bold text-kb-black hover:bg-kb-accent-dark transition disabled:opacity-40">
                {loading ? 'Creando...' : 'Crear sesión'}
              </button>
            </div>
          </form>
        ) : (
          <div className="space-y-5">
            <div className="flex items-center gap-3 rounded-lg bg-green-50 border border-green-200 px-4 py-3 dark:bg-green-900/20 dark:border-green-800">
              <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/50">
                <svg className="h-4 w-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div>
                <p className="text-sm font-semibold text-green-700 dark:text-green-400">Sesión creada para <span className="font-bold">{name}</span></p>
                <p className="text-xs text-green-600 dark:text-green-500">Comparte el enlace con tu cliente</p>
              </div>
            </div>

            <div>
              <p className="mb-2 text-xs font-bold uppercase tracking-wide text-kb-gray-600 dark:text-zinc-500">Enlace del formulario</p>
              <button onClick={handleCopy}
                className="group w-full rounded-lg border border-kb-gray-200 bg-kb-gray-100 px-4 py-3 text-left transition hover:border-kb-accent hover:bg-[#fefae6] dark:border-zinc-700 dark:bg-zinc-800 dark:hover:border-kb-accent">
                <p className="mb-1 truncate text-sm text-kb-gray-600 group-hover:text-kb-accent-dark dark:text-zinc-300">{formUrl}</p>
                <p className={`text-xs font-semibold transition ${copied ? 'text-green-600' : 'text-kb-gray-600 group-hover:text-kb-accent-dark dark:text-zinc-500'}`}>
                  {copied ? '✓ Copiado al portapapeles' : 'Clic para copiar'}
                </p>
              </button>
            </div>

            <div className="flex gap-3">
              <button onClick={() => router.push('/')}
                className="flex-1 rounded-lg border border-kb-gray-200 py-2.5 text-sm font-semibold text-kb-gray-600 hover:bg-kb-gray-100 transition dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800">
                Volver al panel
              </button>
              <a href={formUrl} target="_blank" rel="noopener noreferrer"
                className="flex-1 rounded-lg bg-kb-accent py-2.5 text-center text-sm font-bold text-kb-black hover:bg-kb-accent-dark transition">
                Abrir formulario →
              </a>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
