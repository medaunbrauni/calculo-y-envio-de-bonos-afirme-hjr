export interface EmailAttachment {
  filename: string
  mimeType: string
  content: Uint8Array
}

export interface EmailDraft {
  to: string
  subject: string
  bodyText: string
  attachments: EmailAttachment[]
}

function toBase64(bytes: Uint8Array): string {
  let binary = ''
  const chunkSize = 0x8000
  for (let i = 0; i < bytes.length; i += chunkSize) {
    binary += String.fromCharCode(...bytes.subarray(i, i + chunkSize))
  }
  return btoa(binary)
}

function chunkBase64(base64: string): string {
  return base64.match(/.{1,76}/g)?.join('\r\n') ?? base64
}

function encodeUtf8Header(text: string): string {
  return `=?UTF-8?B?${toBase64(new TextEncoder().encode(text))}?=`
}

function makeBoundary(): string {
  return `bonos_afirme_${crypto.randomUUID().replace(/-/g, '')}`
}

/** Arma el mensaje MIME (RFC 2822) crudo: texto plano + adjuntos en base64. */
export function buildMimeMessage(draft: EmailDraft): string {
  const boundary = makeBoundary()
  const lines: string[] = [
    `To: ${draft.to}`,
    `Subject: ${encodeUtf8Header(draft.subject)}`,
    'MIME-Version: 1.0',
    `Content-Type: multipart/mixed; boundary="${boundary}"`,
    '',
    `--${boundary}`,
    'Content-Type: text/plain; charset="UTF-8"',
    'Content-Transfer-Encoding: base64',
    '',
    chunkBase64(toBase64(new TextEncoder().encode(draft.bodyText))),
  ]

  for (const attachment of draft.attachments) {
    lines.push(
      `--${boundary}`,
      `Content-Type: ${attachment.mimeType}; name="${attachment.filename}"`,
      'Content-Transfer-Encoding: base64',
      `Content-Disposition: attachment; filename="${attachment.filename}"`,
      '',
      chunkBase64(toBase64(attachment.content)),
    )
  }

  lines.push(`--${boundary}--`)
  return lines.join('\r\n')
}

/** Base64url sin padding, como lo requiere el campo "raw" de la API de Gmail. */
export function toBase64Url(rawMessage: string): string {
  const base64 = toBase64(new TextEncoder().encode(rawMessage))
  return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
}
