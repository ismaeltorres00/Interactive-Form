import Link from 'next/link'
import sql from '@/lib/db'
import { AdminNav } from '@/components/AdminNav'
import { AdminFooter } from '@/components/AdminFooter'
import { ClientTable } from '@/components/dashboard/ClientTable'

export const dynamic = 'force-dynamic'

export default async function Home() {
  const [active, archived] = await Promise.all([
    sql`
      SELECT id, client_name, client_email, status, progress, updated_at
      FROM sessions
      WHERE NOT is_deleted AND NOT is_archived
      ORDER BY updated_at DESC
      LIMIT 100
    `,
    sql`
      SELECT id, client_name, client_email, status, progress, updated_at
      FROM sessions
      WHERE NOT is_deleted AND is_archived
      ORDER BY updated_at DESC
      LIMIT 100
    `,
  ])

  return (
    <div className="min-h-screen flex flex-col bg-kb-gray-100 dark:bg-kb-black">
      <AdminNav active="clients" />

      <div className="mx-auto max-w-5xl px-6 py-8">
        <ClientTable
          active={active as any[]}
          archived={archived as any[]}
        />
      </div>

      <AdminFooter />
    </div>
  )
}
