export default function Loading() {
  return (
    <div className="min-h-screen bg-kb-gray-100 dark:bg-kb-black animate-pulse">
      {/* Nav skeleton */}
      <div className="border-b border-kb-gray-200 bg-white px-6 py-3 dark:border-zinc-800 dark:bg-kb-black">
        <div className="h-9 w-28 rounded bg-kb-gray-200 dark:bg-zinc-800" />
      </div>

      <div className="mx-auto max-w-3xl px-6 py-8">
        {/* Back link */}
        <div className="mb-6 h-4 w-24 rounded bg-kb-gray-200 dark:bg-zinc-800" />

        {/* Header */}
        <div className="mb-6 flex items-start justify-between">
          <div className="space-y-2">
            <div className="h-6 w-48 rounded bg-kb-gray-200 dark:bg-zinc-800" />
            <div className="h-4 w-32 rounded bg-kb-gray-100 dark:bg-zinc-800" />
          </div>
          <div className="flex gap-2">
            <div className="h-7 w-20 rounded-full bg-kb-gray-200 dark:bg-zinc-800" />
            <div className="h-7 w-28 rounded-lg bg-kb-gray-200 dark:bg-zinc-800" />
          </div>
        </div>

        {/* Progress bar */}
        <div className="mb-8 h-2 w-full rounded-full bg-kb-gray-200 dark:bg-zinc-700" />

        {/* Cards */}
        <div className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i} className="h-16 rounded-lg bg-white dark:bg-zinc-900 border border-kb-gray-100 dark:border-zinc-800" />
          ))}
        </div>
      </div>
    </div>
  )
}
