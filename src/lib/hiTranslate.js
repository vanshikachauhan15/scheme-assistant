/** Browser EN→HI for scheme text (transformers.js + quantized opus-mt). */

const MODEL_ID = 'Xenova/opus-mt-en-hi'
const MAX_CHUNK = 380

/** @type {Promise<unknown> | null} */
let translatorPromise = null

/** @type {Set<(s: { loading: boolean }) => void>} */
const statusListeners = new Set()

/** @type {Map<string, string>} */
const cache = new Map()
const MAX_CACHE_ENTRIES = 1200

function emitStatus(loading) {
  for (const fn of statusListeners) {
    try {
      fn({ loading })
    } catch {
      /* ignore */
    }
  }
}

export function subscribeTranslatorStatus(fn) {
  statusListeners.add(fn)
  return () => statusListeners.delete(fn)
}

function stableCacheKey(text) {
  if (text.length <= 500) return text
  let h = 2166136261
  for (let i = 0; i < text.length; i++) h = Math.imul(h ^ text.charCodeAt(i), 16777619)
  return `${h}:${text.length}`
}

export function isLikelyAlreadyHindi(text) {
  const s = String(text ?? '')
  if (s.length < 2) return false
  const dev = (s.match(/[\u0900-\u097F]/g) || []).length
  const latin = (s.match(/[A-Za-z]/g) || []).length
  return dev > Math.max(2, latin * 0.35)
}

export function shouldSkipTranslate(text) {
  const t = String(text ?? '').trim()
  if (!t || t === '—') return true
  if (isLikelyAlreadyHindi(t)) return true
  if (/^[\d\s.,\-–—]+$/.test(t)) return true
  return false
}

function splitChunks(text) {
  if (text.length <= MAX_CHUNK) return [text]
  const chunks = []
  let start = 0
  while (start < text.length) {
    let end = Math.min(start + MAX_CHUNK, text.length)
    if (end < text.length) {
      const slice = text.slice(start, end)
      const breakAt = Math.max(
        slice.lastIndexOf('\n\n'),
        slice.lastIndexOf('. '),
        slice.lastIndexOf('। '),
        slice.lastIndexOf('\n'),
      )
      if (breakAt > MAX_CHUNK * 0.35) end = start + breakAt + 1
    }
    const piece = text.slice(start, end).trim()
    if (piece) chunks.push(piece)
    start = end
  }
  return chunks.length ? chunks : [text]
}

function translationOutputText(out) {
  if (Array.isArray(out)) return out[0]?.translation_text ?? ''
  return out?.translation_text ?? ''
}

function getTranslator() {
  if (!translatorPromise) {
    emitStatus(true)
    translatorPromise = import('@huggingface/transformers')
      .then(async ({ pipeline }) => {
        const pipe = await pipeline('translation', MODEL_ID, {
          dtype: 'q8',
          progress_callback: () => {
            /* optional: could forward file progress */
          },
        })
        emitStatus(false)
        return pipe
      })
      .catch((err) => {
        translatorPromise = null
        emitStatus(false)
        throw err
      })
  }
  return translatorPromise
}

export function preloadHiTranslator() {
  return getTranslator().catch(() => undefined)
}

/** @type {Promise<void>} */
let queueTail = Promise.resolve()

/**
 * @param {string} text
 * @returns {Promise<string>}
 */
export function translateEnToHi(text) {
  const raw = String(text ?? '')
  const trimmed = raw.trim()
  if (shouldSkipTranslate(trimmed)) return Promise.resolve(raw)

  const key = stableCacheKey(trimmed)
  const hit = cache.get(key)
  if (hit) return Promise.resolve(hit)

  const job = async () => {
    let pipe
    try {
      pipe = await getTranslator()
    } catch {
      return trimmed
    }
    const chunks = splitChunks(trimmed)
    const parts = []
    for (const ch of chunks) {
      if (shouldSkipTranslate(ch)) {
        parts.push(ch)
        continue
      }
      try {
        const out = await pipe(ch)
        parts.push(translationOutputText(out) || ch)
      } catch {
        parts.push(ch)
      }
    }
    const joined = parts.join(' ').trim() || trimmed
    if (cache.size >= MAX_CACHE_ENTRIES) cache.clear()
    cache.set(key, joined)
    return joined
  }

  const run = queueTail.then(job, job)
  queueTail = run.catch(() => {})
  return run
}
