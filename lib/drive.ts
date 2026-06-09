import { google } from 'googleapis'
import { Readable } from 'stream'
import { unstable_cache, revalidateTag } from 'next/cache'
import sql from '@/lib/db'

export const DRIVE_STATUS_TAG = 'drive-status'

function getOAuth2Client() {
  return new google.auth.OAuth2(
    process.env.GOOGLE_CLIENT_ID!,
    process.env.GOOGLE_CLIENT_SECRET!,
    process.env.GOOGLE_REDIRECT_URI!,
  )
}

export function getDriveAuthUrl(): string {
  const client = getOAuth2Client()
  return client.generateAuthUrl({
    access_type: 'offline',
    scope: ['https://www.googleapis.com/auth/drive.file'],
    prompt: 'consent',
  })
}

export async function saveDriveTokens(tokens: object): Promise<void> {
  await sql`
    INSERT INTO settings (key, value)
    VALUES ('google_tokens', ${JSON.stringify(tokens)})
    ON CONFLICT (key) DO UPDATE SET value = EXCLUDED.value, updated_at = now()
  `
  revalidateTag(DRIVE_STATUS_TAG)
}

export const isDriveConnected = unstable_cache(
  async (): Promise<boolean> => {
    const [row] = await sql`SELECT key FROM settings WHERE key = 'google_tokens'`
    return !!row
  },
  [DRIVE_STATUS_TAG],
  { tags: [DRIVE_STATUS_TAG] },
)

async function getAuthorizedDrive() {
  const [row] = await sql`SELECT value FROM settings WHERE key = 'google_tokens'`
  if (!row) throw new Error('Google Drive no conectado. Autoriza el acceso desde el panel.')

  const tokens = JSON.parse(row.value as string)
  const client = getOAuth2Client()
  client.setCredentials(tokens)

  client.on('tokens', async (refreshed) => {
    await saveDriveTokens({ ...tokens, ...refreshed })
  })

  return google.drive({ version: 'v3', auth: client })
}

export async function uploadWordToDrive(options: {
  buffer: Buffer
  fileName: string
  sessionId: string
  clientName: string
  companyName: string | null
}): Promise<{ fileUrl: string; folderId: string; folderUrl: string }> {
  const { buffer, fileName, sessionId, clientName, companyName } = options
  const drive = await getAuthorizedDrive()

  // Reuse existing Drive folder for this session if it exists
  const [session] = await sql`SELECT drive_folder_id FROM sessions WHERE id = ${sessionId}`
  let folderId = (session?.drive_folder_id as string | null) ?? null

  if (!folderId) {
    const date = new Date().toISOString().slice(0, 10)
    const folderName = `${companyName ?? clientName} · ${date}`
    const folder = await drive.files.create({
      requestBody: { name: folderName, mimeType: 'application/vnd.google-apps.folder' },
      fields: 'id',
    })
    folderId = folder.data.id!
    await sql`UPDATE sessions SET drive_folder_id = ${folderId} WHERE id = ${sessionId}`
  }

  // Delete previous version of the same file if it exists
  const existing = await drive.files.list({
    q: `name='${fileName}' and '${folderId}' in parents and trashed=false`,
    fields: 'files(id)',
  })
  for (const f of existing.data.files ?? []) {
    await drive.files.delete({ fileId: f.id! }).catch(() => null)
  }

  // Upload new file
  const stream = new Readable()
  stream.push(buffer)
  stream.push(null)

  const file = await drive.files.create({
    requestBody: { name: fileName, parents: [folderId] },
    media: {
      mimeType: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      body: stream,
    },
    fields: 'id, webViewLink',
  })

  return {
    fileUrl: file.data.webViewLink!,
    folderId,
    folderUrl: `https://drive.google.com/drive/folders/${folderId}`,
  }
}
