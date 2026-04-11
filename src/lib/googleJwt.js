/** Decode Google Sign-In JWT payload (UTF-8 safe; client-side display only). */
export function parseGoogleCredentialJwt(credential) {
  if (!credential || typeof credential !== 'string') return null
  try {
    const parts = credential.split('.')
    if (parts.length < 2) return null
    const b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/')
    const pad = b64.length % 4
    const padded = b64 + (pad ? '='.repeat(4 - pad) : '')
    const binary = atob(padded)
    const bytes = new Uint8Array(binary.length)
    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i)
    return JSON.parse(new TextDecoder().decode(bytes))
  } catch {
    return null
  }
}
