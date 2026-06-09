'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { AdminFooter } from '@/components/AdminFooter'
import { FormTypeWithBlocks } from '@/lib/types'

export default function NewSessionPage() {
  const router = useRouter()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [company, setCompany] = useState('')
  const [formTypeId, setFormTypeId] = useState<string>('')
  const [formTypes, setFormTypes] = useState<FormTypeWithBlocks[]>([])
  const [typesLoading, setTypesLoading] = useState(true)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [created, setCreated] = useState<{ sessionId: string } | null>(null)
  const [copied, setCopied] = useState(false)

  useEffect(() => {
    fetch('/api/config/form-types')
      .then((r) => r.json())
      .then((data: FormTypeWithBlocks[]) => {
        const active = data.filter((ft) => ft.is_active)
        setFormTypes(active)
        if (active.length > 0) setFormTypeId(active[0].id)
      })
      .finally(() => setTypesLoading(false))
  }, [])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formTypeId) {
      setError('Selecciona el tipo de formulario')
      return
    }
    setLoading(true)
    setError('')

    const res = await fetch('/api/sessions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        clientName: name,
        clientEmail: email || null,
        companyName: company || null,
        formTypeId,
      }),
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

  const inputClass =
    'w-full rounded-lg border border-kb-gray-200 bg-white px-4 py-2.5 text-sm text-kb-black focus:outline-none focus:ring-2 focus:ring-kb-accent dark:border-zinc-700 dark:bg-zinc-800 dark:text-white dark:placeholder-zinc-500'
  const labelClass = 'mb-1.5 block text-sm font-semibold text-kb-black dark:text-zinc-300'

  return (
    <div className="min-h-screen bg-kb-gray-100 flex flex-col dark:bg-kb-black">
      <div className="flex flex-1 items-center justify-center px-4 py-8">
        <div className="w-full max-w-md rounded-xl border border-kb-gray-200 bg-white p-8 dark:border-zinc-800 dark:bg-zinc-900">
          <div className="mb-6 flex justify-center">
            <Image
              src="/kinton-logo.png"
              alt="Kinton Brands"
              width={120}
              height={40}
              className="h-9 w-auto object-contain dark:rounded dark:bg-white dark:px-1.5 dark:py-0.5"
              priority
            />
          </div>
          <h1 className="mb-1 text-xl font-bold text-kb-black dark:text-white">Nuevo cliente</h1>
          <p className="mb-6 text-sm text-kb-gray-600 dark:text-zinc-400">
            Crea una sesión y comparte el enlace con tu cliente.
          </p>

          {!created ? (
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className={labelClass}>
                  Nombre del cliente <span className="text-kb-accent-dark">*</span>
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  required
                  placeholder="Ej: María García"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Nombre de empresa (opcional)</label>
                <input
                  type="text"
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="Ej: Acme Studio"
                  className={inputClass}
                />
              </div>
              <div>
                <label className={labelClass}>Email (opcional)</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="cliente@ejemplo.com"
                  className={inputClass}
                />
              </div>

              {/* Form type selector */}
              <div>
                <label className={labelClass}>
                  Tipo de formulario <span className="text-kb-accent-dark">*</span>
                </label>
                {typesLoading ? (
                  <div className="flex gap-3">
                    {[0, 1].map((i) => (
                      <div key={i} className="flex-1 h-20 rounded-lg bg-kb-gray-100 animate-pulse dark:bg-zinc-800" />
                    ))}
                  </div>
                ) : formTypes.length === 0 ? (
                  <p className="text-xs text-kb-gray-600 dark:text-zinc-500">
                    No hay tipos de formulario activos. Crea uno en Configuración.
                  </p>
                ) : (
                  <div className="grid grid-cols-2 gap-3">
                    {formTypes.map((ft) => {
                      const selected = formTypeId === ft.id
                      return (
                        <button
                          key={ft.id}
                          type="button"
                          onClick={() => setFormTypeId(ft.id)}
                          className={`rounded-lg border p-3 text-left transition ${
                            selected
                              ? 'border-kb-accent bg-[#fefae6] dark:border-kb-accent dark:bg-kb-accent/10'
                              : 'border-kb-gray-200 bg-white hover:border-kb-accent/50 dark:border-zinc-700 dark:bg-zinc-800 dark:hover:border-kb-accent/50'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <span
                              className={`text-sm font-semibold ${
                                selected
                                  ? 'text-kb-accent-dark dark:text-kb-accent'
                                  : 'text-kb-black dark:text-white'
                              }`}
                            >
                              {ft.name}
                            </span>
                            <span
                              className={`h-3.5 w-3.5 rounded-full border-2 flex-shrink-0 transition ${
                                selected
                                  ? 'border-kb-accent bg-kb-accent dark:border-kb-accent dark:bg-kb-accent'
                                  : 'border-kb-gray-200 dark:border-zinc-600'
                              }`}
                            />
                          </div>
                          {ft.description && (
                            <p className="text-xs text-kb-gray-600 dark:text-zinc-400 leading-snug">
                              {ft.description}
                            </p>
                          )}
                          <p className="mt-1.5 text-xs text-kb-gray-200 dark:text-zinc-600">
                            {ft.blockIds.length} bloques
                          </p>
                        </button>
                      )
                    })}
                  </div>
                )}
              </div>

              {error && <p className="text-sm text-red-500">{error}</p>}
              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => router.push('/')}
                  className="flex-1 rounded-lg border border-kb-gray-200 py-2.5 text-sm font-semibold text-kb-gray-600 hover:bg-kb-gray-100 transition dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={loading || !name.trim() || !formTypeId}
                  className="flex-1 rounded-lg bg-kb-accent py-2.5 text-sm font-bold text-kb-black hover:bg-kb-accent-dark transition disabled:opacity-40"
                >
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
                  <p className="text-sm font-semibold text-green-700 dark:text-green-400">
                    Sesión creada para <span className="font-bold">{name}</span>
                  </p>
                  <p className="text-xs text-green-600 dark:text-green-500">Comparte el enlace con tu cliente</p>
                </div>
              </div>

              <div>
                <p className="mb-2 text-xs font-bold uppercase tracking-wide text-kb-gray-600 dark:text-zinc-500">
                  Enlace del formulario
                </p>
                <button
                  onClick={handleCopy}
                  className="group w-full rounded-lg border border-kb-gray-200 bg-kb-gray-100 px-4 py-3 text-left transition hover:border-kb-accent hover:bg-[#fefae6] dark:border-zinc-700 dark:bg-zinc-800 dark:hover:border-kb-accent"
                >
                  <p className="mb-1 truncate text-sm text-kb-gray-600 group-hover:text-kb-accent-dark dark:text-zinc-300">
                    {formUrl}
                  </p>
                  <p
                    className={`text-xs font-semibold transition ${
                      copied
                        ? 'text-green-600'
                        : 'text-kb-gray-600 group-hover:text-kb-accent-dark dark:text-zinc-500'
                    }`}
                  >
                    {copied ? '✓ Copiado al portapapeles' : 'Clic para copiar'}
                  </p>
                </button>
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => router.push('/')}
                  className="flex-1 rounded-lg border border-kb-gray-200 py-2.5 text-sm font-semibold text-kb-gray-600 hover:bg-kb-gray-100 transition dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800"
                >
                  Volver al panel
                </button>
                <a
                  href={formUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex-1 rounded-lg bg-kb-accent py-2.5 text-center text-sm font-bold text-kb-black hover:bg-kb-accent-dark transition"
                >
                  Abrir formulario →
                </a>
              </div>
            </div>
          )}
        </div>
      </div>

      <AdminFooter />
    </div>
  )
}
