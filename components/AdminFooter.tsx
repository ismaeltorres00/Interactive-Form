export function AdminFooter() {
  const year = new Date().getFullYear()

  return (
    <footer className="mt-16 border-t border-kb-gray-200 bg-white px-6 py-5 dark:border-zinc-800 dark:bg-kb-black">
      <div className="mx-auto flex max-w-5xl flex-wrap items-center justify-between gap-3 text-xs text-kb-gray-600 dark:text-zinc-500">
        <div className="flex items-center gap-3">
          <span className="rounded-full border border-kb-accent/40 bg-kb-accent/10 px-2.5 py-0.5 text-[10px] font-bold uppercase tracking-widest text-kb-accent-dark dark:text-kb-accent">
            Alpha
          </span>
          <span>MarkeFlow — versión en desarrollo. Puede contener errores.</span>
        </div>
        <span>© {year} Frok. Todos los derechos reservados.</span>
      </div>
    </footer>
  )
}
