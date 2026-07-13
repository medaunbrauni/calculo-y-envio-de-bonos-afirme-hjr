// Integración con Google Identity Services (GIS) "Token Client": obtiene un
// access token de corta duración (~1h) 100% desde el navegador, sin backend.
// Ver PRD.md sección 4.5.

interface TokenResponse {
  access_token?: string
  error?: string
  error_description?: string
}

interface TokenClient {
  requestAccessToken: () => void
}

declare global {
  interface Window {
    google?: {
      accounts: {
        oauth2: {
          initTokenClient(config: {
            client_id: string
            scope: string
            callback: (response: TokenResponse) => void
          }): TokenClient
        }
      }
    }
  }
}

const GIS_SCRIPT_SRC = 'https://accounts.google.com/gsi/client'
export const GMAIL_SEND_SCOPE = 'https://www.googleapis.com/auth/gmail.send'

export class GmailAuthError extends Error {}

let gisScriptPromise: Promise<void> | null = null

function loadGisScript(): Promise<void> {
  if (window.google?.accounts?.oauth2) return Promise.resolve()
  if (gisScriptPromise) return gisScriptPromise

  gisScriptPromise = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = GIS_SCRIPT_SRC
    script.async = true
    script.defer = true
    script.onload = () => resolve()
    script.onerror = () =>
      reject(new GmailAuthError('No se pudo cargar Google Identity Services (revisa tu conexión).'))
    document.head.appendChild(script)
  })
  return gisScriptPromise
}

export async function requestGmailAccessToken(clientId: string): Promise<string> {
  await loadGisScript()
  if (!window.google?.accounts?.oauth2) {
    throw new GmailAuthError('Google Identity Services no está disponible.')
  }

  return new Promise<string>((resolve, reject) => {
    const client = window.google!.accounts.oauth2.initTokenClient({
      client_id: clientId,
      scope: GMAIL_SEND_SCOPE,
      callback: (response) => {
        if (response.access_token) {
          resolve(response.access_token)
        } else {
          reject(
            new GmailAuthError(
              response.error_description ?? response.error ?? 'No se pudo autorizar el acceso a Gmail.',
            ),
          )
        }
      },
    })
    client.requestAccessToken()
  })
}
