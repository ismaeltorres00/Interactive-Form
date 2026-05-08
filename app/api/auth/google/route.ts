import { NextResponse } from 'next/server'
import { getDriveAuthUrl } from '@/lib/drive'

export async function GET() {
  const url = getDriveAuthUrl()
  return NextResponse.redirect(url)
}
