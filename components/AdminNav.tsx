import Link from 'next/link'
import { ThemeToggle } from './ThemeToggle'

export function AdminNav({ active }: { active: 'clients' | 'config' }) {
  return (
    <nav className="border-b border-kb-gray-200 bg-white px-6 py-3 flex items-center justify-between dark:border-zinc-800 dark:bg-kb-black">
      <span className="font-bold text-kb-black tracking-tight dark:text-white" style={{ fontFamily: 'Montserrat, sans-serif', letterSpacing: '-0.02em' }}>MarkeFlow</span>
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
      </div>
    </nav>
  )
}
