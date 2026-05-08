import { NextRequest, NextResponse } from 'next/server'
import { google } from 'googleapis'
import { saveDriveTokens } from '@/lib/drive'

export async function GET(req: NextRequest) {
  const code = req.nextUrl.searchParams.get('code')
  if (!code) {
    return NextResponse.redirect(new URL('/?drive=error', req.url))
  }

  const client = new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID!,
    process.env.GOOGLE_CLIENT_SECRET!,
    process.env.GOOGLE_REDIRECT_URI!,
  )

  const { tokens } = await client.getToken(code)
  await saveDriveTokens(tokens)

  return NextResponse.redirect(new URL('/?drive=connected', req.url))
}
