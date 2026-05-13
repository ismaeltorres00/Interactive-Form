// Uses Web Crypto API (available in both Edge runtime and Node.js 18+)

const COOKIE_NAME = 'admin_session'
const COOKIE_MAX_AGE = 60 * 60 * 24 * 30 // 30 días

async function expectedToken(): Promise<string> {
  const secret = process.env.ADMIN_SECRET ?? 'fallback-secret'
  const password = process.env.ADMIN_PASSWORD ?? ''
  const enc = new TextEncoder()
  const key = await crypto.subtle.importKey(
    'raw', enc.encode(secret), { name: 'HMAC', hash: 'SHA-256' }, false, ['sign']
  )
  const sig = await crypto.subtle.sign('HMAC', key, enc.encode(password))
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

export async function verifySessionCookie(cookieValue: string | undefined): Promise<boolean> {
  if (!cookieValue) return false
  const expected = await expectedToken()
  return cookieValue === expected
}

export async function makeSessionCookie(): Promise<string> {
  const token = await expectedToken()
  return `${COOKIE_NAME}=${token}; HttpOnly; SameSite=Lax; Path=/; Max-Age=${COOKIE_MAX_AGE}`
}

export function clearSessionCookie(): string {
  return `${COOKIE_NAME}=; HttpOnly; SameSite=Lax; Path=/; Max-Age=0`
}

export { COOKIE_NAME }
