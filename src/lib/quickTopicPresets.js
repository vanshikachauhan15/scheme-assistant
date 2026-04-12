/**
 * Popular topics: search query + pin for topic-specific filter layout.
 * Facets default to "Any" — no pre-selection (avoids empty results from AND filters).
 * Values must match `facetValues.js`.
 */
export const QUICK_TOPIC_BASE = {
  state: '',
  pension: '',
  age: '',
  income: '',
  gender: '',
  document: '',
  schemeName: '',
  benefit: '',
}

export const QUICK_TAG_KEYS = ['Agriculture', 'Health', 'Education', 'Housing', 'Women', 'Student']

/** Shown in the search box; English matches scheme text in the CSV (case-insensitive). */
export const QUICK_TOPIC_PRESETS = {
  Agriculture: {
    query: 'Agriculture',
    facets: { ...QUICK_TOPIC_BASE },
  },
  Health: {
    query: 'Health',
    facets: { ...QUICK_TOPIC_BASE },
  },
  Education: {
    query: 'Education',
    facets: { ...QUICK_TOPIC_BASE },
  },
  Housing: {
    query: 'Housing',
    facets: { ...QUICK_TOPIC_BASE },
  },
  Women: {
    query: 'Women',
    facets: { ...QUICK_TOPIC_BASE },
  },
  Student: {
    query: 'Student',
    facets: { ...QUICK_TOPIC_BASE },
  },
}

/**
 * Search box still tied to this topic: exact preset query or same prefix + more words (e.g. "Housing Delhi").
 * @param {string} queryTrim
 * @param {string} topicKey
 */
export function searchStillMatchesTopicQuery(queryTrim, topicKey) {
  const preset = QUICK_TOPIC_PRESETS[topicKey]
  if (!preset || !topicKey) return false
  const pq = String(preset.query ?? '').trim().toLowerCase()
  const ql = String(queryTrim ?? '').trim().toLowerCase()
  if (!pq) return !ql
  return ql === pq || ql.startsWith(`${pq} `)
}

export function getActiveQuickTopicKey(facets, queryTrim) {
  const q = queryTrim.trim().toLowerCase()
  for (const key of QUICK_TAG_KEYS) {
    const preset = QUICK_TOPIC_PRESETS[key]
    const pq = (preset?.query ?? '').trim().toLowerCase()
    if (!preset || !pq || q !== pq) continue
    const f = preset.facets
    const match =
      (facets.state || '') === (f.state || '') &&
      (facets.pension || '') === (f.pension || '') &&
      (facets.age || '') === (f.age || '') &&
      (facets.income || '') === (f.income || '') &&
      (facets.gender || '') === (f.gender || '') &&
      (facets.document || '') === (f.document || '') &&
      (facets.schemeName || '') === (f.schemeName || '') &&
      (facets.benefit || '') === (f.benefit || '')
    if (match) return key
  }
  return null
}
