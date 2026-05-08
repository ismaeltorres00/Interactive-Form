import { NextRequest, NextResponse } from 'next/server'
import sql from '@/lib/db'

export async function POST(req: NextRequest) {
  const { clientName, clientEmail, companyName } = await req.json()

  if (!clientName) {
    return NextResponse.json({ error: 'clientName is required' }, { status: 400 })
  }

  const [data] = await sql`
    INSERT INTO sessions (client_name, client_email, company_name)
    VALUES (${clientName}, ${clientEmail ?? null}, ${companyName ?? null})
    RETURNING id
  `

  return NextResponse.json({ sessionId: data.id })
}

export async function GET() {
  const sessions = await sql`
    SELECT * FROM sessions ORDER BY created_at DESC
  `
  return NextResponse.json(sessions)
}
