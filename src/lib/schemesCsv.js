import Papa from 'papaparse'

export const CSV_URL = '/cleaned_schemes.csv'

/** Column headers as in cleaned_schemes.csv */
export const COL = {
  name: 'Scheme Name',
  minAge: 'Min Age',
  maxAge: 'Max Age',
  occupation: 'Occupation',
  incomeLimit: 'Income Limit',
  state: 'State',
  benefits: 'Benefits',
  documents: 'Documents',
  fullText: 'Full Text',
}

const SEARCH_KEYS = Object.values(COL)

/**
 * @returns {Promise<Record<string, string>[]>}
 */
export function loadSchemesFromCsv(url = CSV_URL) {
  return fetch(url)
    .then((res) => {
      if (!res.ok) throw new Error(`Failed to load schemes (${res.status})`)
      return res.text()
    })
    .then(
      (text) =>
        new Promise((resolve, reject) => {
          Papa.parse(text, {
            header: true,
            skipEmptyLines: true,
            complete: (results) => resolve(results.data),
            error: (err) => reject(err),
          })
        }),
    )
}

export function schemeMatchesQuery(row, q) {
  const hay = q.trim().toLowerCase()
  if (!hay) return false
  for (const key of SEARCH_KEYS) {
    const v = row[key]
    if (v != null && String(v).toLowerCase().includes(hay)) return true
  }
  return false
}

export function filterSchemes(rows, q) {
  const hay = q.trim().toLowerCase()
  if (!hay) return []
  return rows.filter((row) => schemeMatchesQuery(row, hay))
}

export function previewText(row, maxLen = 140) {
  const benefits = row[COL.benefits]
  const name = row[COL.name]
  if (benefits && String(benefits).trim()) {
    const s = String(benefits).replace(/\s+/g, ' ').trim()
    return s.length <= maxLen ? s : `${s.slice(0, maxLen)}…`
  }
  if (name) return String(name).slice(0, maxLen)
  return 'View details'
}
