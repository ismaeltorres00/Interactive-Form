import Link from 'next/link'

export function AdminNav({ active }: { active: 'clients' | 'config' }) {
  return (
    <nav className="border-b border-zinc-200 bg-white px-6 py-3 flex items-center justify-between">
      <span className="font-semibold text-zinc-800 tracking-tight">MarkeFlow</span>
      <div className="flex gap-1">
        <Link
          href="/"
          className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
            active === 'clients'
              ? 'bg-violet-50 text-violet-700'
              : 'text-zinc-500 hover:text-zinc-800'
          }`}
        >
          Clientes
        </Link>
        <Link
          href="/config"
          className={`rounded-md px-3 py-1.5 text-sm font-medium transition ${
            active === 'config'
              ? 'bg-violet-50 text-violet-700'
              : 'text-zinc-500 hover:text-zinc-800'
          }`}
        >
          Formulario
        </Link>
      </div>
      <Link
        href="/new-session"
        className="rounded-lg bg-violet-600 px-3 py-1.5 text-sm font-semibold text-white hover:bg-violet-700 transition"
      >
        + Nuevo cliente
      </Link>
    </nav>
  )
}
