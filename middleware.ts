import { NextRequest, NextResponse } from 'next/server'
import { verifySessionCookie, COOKIE_NAME } from '@/lib/admin-auth'

const PUBLIC_PREFIXES = [
  '/form/',
  '/login',
  '/api/auth/admin/login',
]

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl

  if (PUBLIC_PREFIXES.some((p) => pathname.startsWith(p))) {
    return NextResponse.next()
  }

  const cookie = req.cookies.get(COOKIE_NAME)?.value
  const valid = await verifySessionCookie(cookie)

  if (!valid) {
    const loginUrl = new URL('/login', req.url)
    loginUrl.searchParams.set('from', pathname)
    return NextResponse.redirect(loginUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/((?!_next/static|_next/image|favicon.ico|kinton-logo.png).*)',
  ],
}
