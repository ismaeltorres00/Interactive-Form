'use client'

import Link from 'next/link'
import Image from 'next/image'
import { useRouter } from 'next/navigation'
import { ThemeToggle } from './ThemeToggle'

export function AdminNav({ active }: { active: 'clients' | 'config' }) {
  const router = useRouter()

  const handleLogout = async () => {
    await fetch('/api/auth/admin/logout', { method: 'POST' })
    router.push('/login')
  }

  return (
    <nav className="border-b border-kb-gray-200 bg-white px-6 py-3 flex items-center justify-between dark:border-zinc-800 dark:bg-kb-black">
      <Link href="/">
        <Image src="/kinton-logo.png" alt="Kinton" width={110} height={36} className="h-9 w-auto object-contain dark:rounded dark:bg-white dark:px-1.5 dark:py-0.5" priority />
      </Link>
      <div className="flex gap-1">
        <Link
          href="/"
          className={`rounded-md px-3 py-1.5 text-sm font-semibold transition ${
            active === 'clients'
              ? 'bg-[#fefae6] text-kb-accent-dark'
              : 'text-kb-gray-600 hover:text-kb-black dark:text-zinc-400 dark:hover:text-white'
          }`}
        >
          Clientes
        </Link>
        <Link
          href="/config"
          className={`rounded-md px-3 py-1.5 text-sm font-semibold transition ${
            active === 'config'
              ? 'bg-[#fefae6] text-kb-accent-dark'
              : 'text-kb-gray-600 hover:text-kb-black dark:text-zinc-400 dark:hover:text-white'
          }`}
        >
          Formulario
        </Link>
      </div>
      <div className="flex items-center gap-2">
        <ThemeToggle />
        <Link
          href="/new-session"
          className="rounded-lg bg-kb-accent px-3 py-1.5 text-sm font-bold text-kb-black hover:bg-kb-accent-dark transition"
        >
          + Nuevo cliente
        </Link>
        <button
          onClick={handleLogout}
          title="Cerrar sesión"
          className="rounded-md p-1.5 text-kb-gray-600 hover:bg-kb-gray-100 hover:text-kb-black transition dark:text-zinc-400 dark:hover:bg-zinc-800 dark:hover:text-white"
        >
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </button>
      </div>
    </nav>
  )
}
