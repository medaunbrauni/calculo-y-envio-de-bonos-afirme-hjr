import { buildMimeMessage, toBase64Url, type EmailDraft } from './mime'

export class GmailSendError extends Error {}

export async function sendGmailMessage(accessToken: string, draft: EmailDraft): Promise<void> {
  const raw = toBase64Url(buildMimeMessage(draft))

  const res = await fetch('https://gmail.googleapis.com/gmail/v1/users/me/messages/send', {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${accessToken}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ raw }),
  })

  if (!res.ok) {
    let detail = ''
    try {
      const body = (await res.json()) as { error?: { message?: string } }
      detail = body.error?.message ?? ''
    } catch {
      // respuesta sin JSON parseable; usamos solo el status.
    }
    throw new GmailSendError(
      `Gmail respondió con error ${res.status}${detail ? `: ${detail}` : ''}.`,
    )
  }
}
