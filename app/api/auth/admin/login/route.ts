import { NextRequest, NextResponse } from 'next/server'
import { makeSessionCookie } from '@/lib/admin-auth'

export async function POST(req: NextRequest) {
  const { password } = await req.json()

  if (!password || password !== process.env.ADMIN_PASSWORD) {
    return NextResponse.json({ error: 'Contraseña incorrecta' }, { status: 401 })
  }

  const res = NextResponse.json({ ok: true })
  res.headers.set('Set-Cookie', await makeSessionCookie())
  return res
}
