import Link from 'next/link'
import { ThemeToggle } from './ThemeToggle'

export function AdminNav({ active }: { active: 'clients' | 'config' }) {
  return (
    <nav className="border-b border-zinc-200 bg-white px-6 py-3 flex items-center justify-between dark:border-zinc-800 dark:bg-zinc-900">
      <span className="font-semibold text-zinc-800 tracking-tight dark:text-zinc-100">MarkeFlow</span>
      <div className="flex gap-1">
        <Link
          href="/"
          className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
            active === 'clients'
              ? 'bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300'
              : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-100'
          }`}
        >
          Clientes
        </Link>
        <Link
          href="/config"
          className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
            active === 'config'
              ? 'bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-300'
              : 'text-zinc-500 hover:text-zinc-800 dark:text-zinc-400 dark:hover:text-zinc-100'
          }`}
        >
          Formulario
        </Link>
      </div>
      <div className="flex items-center gap-2">
        <ThemeToggle />
        <Link
          href="/new-session"
          className="rounded-lg bg-violet-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-violet-700 transition"
        >
          + Nuevo cliente
        </Link>
      </div>
    </nav>
  )
}
