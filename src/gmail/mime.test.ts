import { describe, expect, it } from 'vitest'
import { buildMimeMessage, toBase64Url, type EmailDraft } from './mime'

function decodeBase64Url(value: string): string {
  const padded = value.replace(/-/g, '+').replace(/_/g, '/').padEnd(Math.ceil(value.length / 4) * 4, '=')
  return Buffer.from(padded, 'base64').toString('utf-8')
}

describe('buildMimeMessage / toBase64Url', () => {
  const draft: EmailDraft = {
    to: 'destino@ejemplo.com',
    subject: 'Bono JIRO CHIH - MAYO 2026',
    bodyText: 'Hola,\n\nAdjunto el reporte con acentos: ñ á é í ó ú.',
    attachments: [
      { filename: 'reporte.pdf', mimeType: 'application/pdf', content: new Uint8Array([1, 2, 3, 4]) },
    ],
  }

  it('incluye To y un Subject codificado en UTF-8', () => {
    const raw = buildMimeMessage(draft)
    expect(raw).toContain('To: destino@ejemplo.com')
    expect(raw).toContain('Subject: =?UTF-8?B?')
    expect(raw).toContain('Content-Type: multipart/mixed; boundary="')
  })

  it('incluye el adjunto con su nombre y tipo MIME', () => {
    const raw = buildMimeMessage(draft)
    expect(raw).toContain('Content-Type: application/pdf; name="reporte.pdf"')
    expect(raw).toContain('Content-Disposition: attachment; filename="reporte.pdf"')
  })

  it('toBase64Url produce base64 url-safe sin padding y decodifica al mismo contenido', () => {
    const raw = buildMimeMessage(draft)
    const encoded = toBase64Url(raw)

    expect(encoded).not.toMatch(/[+/=]/)
    expect(decodeBase64Url(encoded)).toBe(raw)
  })
})
