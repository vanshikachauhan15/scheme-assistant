/** Vite injects env at build time; normalize common .env mistakes (spaces, quotes). */
export function getGoogleClientId() {
  const raw = import.meta.env.VITE_GOOGLE_CLIENT_ID
  if (raw == null) return ''
  return String(raw)
    .trim()
    .replace(/^['"]|['"]$/g, '')
}

export function hasGoogleClientId() {
  return getGoogleClientId().length > 0
}
