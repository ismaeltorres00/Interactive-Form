'use client'

import { useState, useRef, useEffect } from 'react'

interface Props {
  sessionId: string
  clientName: string
  clientEmail: string | null
  companyName: string | null
  formUrl: string
  driveConnected: boolean
  driveFolderId: string | null
}

export function ExportActions({
  sessionId, clientName, clientEmail, companyName, formUrl,
  driveConnected, driveFolderId,
}: Props) {
  const [open, setOpen] = useState(false)
  const [emailOpen, setEmailOpen] = useState(false)
  const [copied, setCopied] = useState(false)
  const [wordLoading, setWordLoading] = useState(false)
  const [driveLoading, setDriveLoading] = useState(false)
  const [driveUrl, setDriveUrl] = useState<string | null>(
    driveFolderId ? `https://drive.google.com/drive/folders/${driveFolderId}` : null
  )
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handler(e: MouseEvent) {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [])

  const handleCopy = async () => {
    await navigator.clipboard.writeText(formUrl)
    setCopied(true)
    setOpen(false)
    setTimeout(() => setCopied(false), 2000)
  }

  const handlePdf = () => {
    window.open(`/sessions/${sessionId}/print`, '_blank')
    setOpen(false)
  }

  const handleWord = async () => {
    setWordLoading(true)
    setOpen(false)
    try {
      const res = await fetch(`/api/export/word?sessionId=${sessionId}`)
      if (!res.ok) throw new Error('Error generando Word')
      const blob = await res.blob()
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${companyName ?? clientName}_briefing.docx`
      a.click()
      URL.revokeObjectURL(url)
    } catch (e) {
      alert('Error al generar el archivo Word. Inténtalo de nuevo.')
    } finally {
      setWordLoading(false)
    }
  }

  const handleDrive = async () => {
    setDriveLoading(true)
    setOpen(false)
    try {
      const res = await fetch('/api/export/drive', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ sessionId }),
      })
      const data = await res.json()
      if (!res.ok) throw new Error(data.error ?? 'Error')
      setDriveUrl(data.folderUrl)
      window.open(data.folderUrl, '_blank')
    } catch (e) {
      alert(e instanceof Error ? e.message : 'Error al subir a Drive.')
    } finally {
      setDriveLoading(false)
    }
  }

  const subject = encodeURIComponent(`Resumen del formulario de branding${companyName ? ` · ${companyName}` : ''}`)
  const emailBody = encodeURIComponent(
    `Hola ${clientName},\n\nTe comparto el resumen del proceso de branding.\n\nPuedes consultar o completar el formulario en:\n${formUrl}\n\nQuedo a tu disposición para cualquier duda.\n\nUn saludo`
  )
  const mailtoHref = `mailto:${clientEmail ?? ''}?subject=${subject}&body=${emailBody}`
  const whatsappHref = `https://wa.me/?text=${encodeURIComponent(
    `Hola ${clientName}, aquí tienes el enlace para tu formulario de branding${companyName ? ` (${companyName})` : ''}:\n\n${formUrl}`
  )}`

  return (
    <div className="flex items-center gap-2">
      {/* Drive shortcut — visible when folder exists */}
      {driveUrl && (
        <a
          href={driveUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50 transition dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800"
          title="Abrir carpeta en Google Drive"
        >
          <svg className="h-3.5 w-3.5 text-[#4285F4]" viewBox="0 0 24 24" fill="currentColor">
            <path d="M6.28 3L1 12.5 6.28 22h11.44L23 12.5 17.72 3z" opacity=".15"/>
            <path d="M17.72 3H6.28L1 12.5h5.28L11.55 3h.9l5.27 9.5H23z" fill="#4285F4"/>
            <path d="M1 12.5l5.28 9.5h11.44L23 12.5H1z" fill="#34A853" opacity=".5"/>
            <path d="M6.28 22h11.44L12 12.5 6.28 22z" fill="#FBBC04" opacity=".7"/>
          </svg>
          Drive
        </a>
      )}

      <div className="relative" ref={ref}>
        <button
          onClick={() => { setOpen((v) => !v); setEmailOpen(false) }}
          className="flex items-center gap-1.5 rounded-lg border border-zinc-200 bg-white px-3 py-1.5 text-xs font-medium text-zinc-600 hover:bg-zinc-50 transition dark:border-zinc-700 dark:bg-zinc-900 dark:text-zinc-400 dark:hover:bg-zinc-800"
        >
          {wordLoading || driveLoading ? 'Generando...' : 'Acciones'}
          <svg className={`h-3.5 w-3.5 transition-transform ${open ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
          </svg>
        </button>

        {open && !emailOpen && (
          <div className="absolute right-0 top-full z-20 mt-1.5 w-56 overflow-hidden rounded-xl border border-zinc-200 bg-white shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
            {/* PDF */}
            <button onClick={handlePdf} className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-zinc-700 hover:bg-zinc-50 transition dark:text-zinc-300 dark:hover:bg-zinc-800">
              <svg className="h-4 w-4 text-zinc-400 dark:text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                  d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              Descargar PDF
            </button>

            {/* Word */}
            <button onClick={handleWord} disabled={wordLoading} className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-zinc-700 hover:bg-zinc-50 transition disabled:opacity-50 dark:text-zinc-300 dark:hover:bg-zinc-800">
              <svg className="h-4 w-4 text-[#2B579A]" viewBox="0 0 24 24" fill="currentColor">
                <path d="M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12a2 2 0 002-2V8l-6-6zm-1 7V3.5L18.5 9H13z"/>
                <path d="M7 13h2l1.5 4 1.5-4h2l-2.5 6H9.5L7 13z" fill="white"/>
              </svg>
              {wordLoading ? 'Generando...' : 'Descargar Word'}
            </button>

            {/* Drive */}
            {driveConnected ? (
              <button onClick={handleDrive} disabled={driveLoading} className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-zinc-700 hover:bg-zinc-50 transition disabled:opacity-50 dark:text-zinc-300 dark:hover:bg-zinc-800">
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <path d="M17.72 3H6.28L1 12.5h5.28L11.55 3h.9l5.27 9.5H23z" fill="#4285F4"/>
                  <path d="M1 12.5l5.28 9.5h11.44L23 12.5H1z" fill="#34A853"/>
                  <path d="M6.28 22h11.44L12 12.5 6.28 22z" fill="#FBBC04"/>
                </svg>
                {driveLoading ? 'Subiendo...' : driveUrl ? 'Actualizar en Drive' : 'Subir a Drive'}
              </button>
            ) : (
              <a
                href="/api/auth/google"
                onClick={() => setOpen(false)}
                className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-zinc-400 hover:bg-zinc-50 transition dark:text-zinc-500 dark:hover:bg-zinc-800"
              >
                <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none">
                  <path d="M17.72 3H6.28L1 12.5h5.28L11.55 3h.9l5.27 9.5H23z" fill="#CBD5E1"/>
                  <path d="M1 12.5l5.28 9.5h11.44L23 12.5H1z" fill="#CBD5E1"/>
                  <path d="M6.28 22h11.44L12 12.5 6.28 22z" fill="#CBD5E1"/>
                </svg>
                Conectar Google Drive
              </a>
            )}

            <div className="border-t border-zinc-100 dark:border-zinc-800" />

            {/* Email */}
            <button onClick={() => { setEmailOpen(true); setOpen(false) }} className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-zinc-700 hover:bg-zinc-50 transition dark:text-zinc-300 dark:hover:bg-zinc-800">
              <svg className="h-4 w-4 text-zinc-400 dark:text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                  d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Enviar por email
            </button>

            {/* WhatsApp */}
            <a href={whatsappHref} target="_blank" rel="noopener noreferrer" onClick={() => setOpen(false)}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-zinc-700 hover:bg-zinc-50 transition dark:text-zinc-300 dark:hover:bg-zinc-800">
              <svg className="h-4 w-4 text-zinc-400 dark:text-zinc-500" fill="currentColor" viewBox="0 0 24 24">
                <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z"/>
              </svg>
              Compartir por WhatsApp
            </a>

            <div className="border-t border-zinc-100 dark:border-zinc-800" />

            {/* Copy link */}
            <button onClick={handleCopy} className="flex w-full items-center gap-3 px-4 py-2.5 text-sm text-zinc-700 hover:bg-zinc-50 transition dark:text-zinc-300 dark:hover:bg-zinc-800">
              <svg className="h-4 w-4 text-zinc-400 dark:text-zinc-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.8}
                  d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
              </svg>
              {copied ? '✓ Enlace copiado' : 'Copiar enlace del formulario'}
            </button>
          </div>
        )}

        {/* Email panel */}
        {emailOpen && (
          <div className="absolute right-0 top-full z-20 mt-1.5 w-80 rounded-xl border border-zinc-200 bg-white p-4 shadow-lg dark:border-zinc-700 dark:bg-zinc-900">
            <div className="mb-3 flex items-center justify-between">
              <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-100">Enviar por email</p>
              <button onClick={() => setEmailOpen(false)} className="text-zinc-300 hover:text-zinc-500 transition dark:text-zinc-600 dark:hover:text-zinc-400">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="mb-3 space-y-1.5 rounded-lg bg-zinc-50 px-3 py-2.5 text-xs text-zinc-500 dark:bg-zinc-800 dark:text-zinc-400">
              <p><span className="font-medium text-zinc-600 dark:text-zinc-300">Para:</span> {clientEmail ?? 'sin email registrado'}</p>
              <p><span className="font-medium text-zinc-600 dark:text-zinc-300">Asunto:</span> Resumen del formulario de branding{companyName ? ` · ${companyName}` : ''}</p>
            </div>
            <p className="mb-3 text-xs text-zinc-400 dark:text-zinc-500">Se abrirá tu cliente de correo con el mensaje pre-rellenado.</p>
            <div className="flex gap-2">
              <a href={mailtoHref} onClick={() => setEmailOpen(false)}
                className="flex-1 rounded-lg bg-violet-600 py-2 text-center text-xs font-semibold text-white hover:bg-violet-700 transition">
                Abrir en correo
              </a>
              <button onClick={() => setEmailOpen(false)}
                className="rounded-lg border border-zinc-200 px-3 py-2 text-xs font-medium text-zinc-500 hover:bg-zinc-50 transition dark:border-zinc-700 dark:text-zinc-400 dark:hover:bg-zinc-800">
                Cancelar
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
