export default function Loading() {
  return (
    <div className="min-h-screen bg-kb-gray-100 dark:bg-kb-black animate-pulse">
      <div className="border-b border-kb-gray-200 bg-white px-6 py-3 dark:border-zinc-800 dark:bg-kb-black">
        <div className="h-9 w-28 rounded bg-kb-gray-200 dark:bg-zinc-800" />
      </div>
      <div className="mx-auto max-w-5xl px-6 py-8">
        <div className="mb-8 grid grid-cols-2 gap-4 sm:grid-cols-5">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-24 rounded-xl border border-kb-gray-200 bg-white dark:border-zinc-800 dark:bg-zinc-900" />
          ))}
        </div>
        <div className="space-y-2">
          {Array.from({ length: 6 }).map((_, i) => (
            <div key={i} className="h-14 rounded-lg bg-white dark:bg-zinc-900 border border-kb-gray-100 dark:border-zinc-800" />
          ))}
        </div>
      </div>
    </div>
  )
}
