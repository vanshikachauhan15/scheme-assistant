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

/** Sorted unique State values from the dataset (for dropdowns). */
export function uniqueStatesFromRows(rows) {
  const set = new Set()
  for (const row of rows) {
    const v = String(row[COL.state] ?? '').trim()
    if (v) set.add(v)
  }
  return [...set].sort((a, b) => {
    const rank = (s) => (s === 'All India' ? 0 : s === 'State Specific' ? 1 : 2)
    const ra = rank(a)
    const rb = rank(b)
    if (ra !== rb) return ra - rb
    return a.localeCompare(b)
  })
}

function rowTextBlob(row) {
  return SEARCH_KEYS.map((k) => String(row[k] ?? '')).join('\n')
}

/** Women / girls focused wording in scheme text (heuristic). */
const WOMEN_RE =
  /women|woman|\bgirls?\b|\bdaughters?\b|\bfemales?\b|mothers?|widows?|lady\b|ladies|sukanya|girl child|girl's|for girls|woman entrepreneurs|women entrepreneurs|girl students|beti|mahila|kanya/i

/** Men / boys focused wording (heuristic). */
const MEN_RE =
  /\bmales?\b|\bfor men\b|\bfor boys\b|\bboys?\b|fathers?|husbands?|\bsons?\b|male applicants|male students|male entrepreneurs|purush/i

export function rowMatchesState(row, selectedState) {
  if (!selectedState) return true
  const s = String(row[COL.state] ?? '').trim().toLowerCase()
  const sel = selectedState.trim().toLowerCase()
  if (!s) return false
  if (sel === 'all india') return s === 'all india'
  if (s === 'all india') return true
  if (s === 'state specific') return true
  return s === sel || s.includes(sel)
}

export function rowMatchesGender(row, gender) {
  if (!gender || gender === 'any') return true
  const blob = rowTextBlob(row)
  if (gender === 'women') return WOMEN_RE.test(blob)
  if (gender === 'men') {
    if (WOMEN_RE.test(blob) && !MEN_RE.test(blob)) return false
    return MEN_RE.test(blob) || /\bmen\b/i.test(blob)
  }
  return true
}

/** Match needle (lowercase substring) in given column keys only. */
export function rowMatchesInColumns(row, needle, keys) {
  const hay = String(needle ?? '').trim().toLowerCase()
  if (!hay) return true
  for (const key of keys) {
    const v = row[key]
    if (v != null && String(v).toLowerCase().includes(hay)) return true
  }
  return false
}

function ageInNumericRange(row, target) {
  const min = parseFloat(row[COL.minAge])
  const max = parseFloat(row[COL.maxAge])
  if (Number.isFinite(min) && Number.isFinite(max) && max >= min) {
    return target >= min && target <= max
  }
  if (Number.isFinite(max) && target <= max) return true
  if (Number.isFinite(min) && target >= min) return true
  return false
}

/** Age dropdown: preset keys map to text + optional Min/Max age columns. */
export function rowMatchesAgeFacet(row, ageKey) {
  if (!ageKey) return true
  const blob = rowTextBlob(row).toLowerCase()
  switch (ageKey) {
    case '60':
      return (
        blob.includes('60') ||
        blob.includes('senior') ||
        /\bage\s*60|60\s*years|above\s*60|elderly/i.test(blob) ||
        ageInNumericRange(row, 60)
      )
    case '18':
      return (
        /\b18\b/.test(blob) ||
        blob.includes('youth') ||
        /\b18\s*-\s*35|18 to 35|young adult/i.test(blob)
      )
    case 'student':
      return /student|scholarship|education|school|college|university|academic|undergraduate/i.test(
        rowTextBlob(row),
      )
    case 'child':
      return /child|children|minor|below 18|under 18|girl child|adolescent|juvenile/i.test(
        rowTextBlob(row),
      )
    default:
      return schemeMatchesQuery(row, ageKey)
  }
}

/**
 * @param {Record<string, string>[]} rows
 * @param {{
 *   query?: string
 *   minQueryLen?: number
 *   state?: string
 *   gender?: string
 *   pension?: string
 *   age?: string
 *   income?: string
 *   document?: string
 *   schemeName?: string
 *   benefit?: string
 * }} opts
 */
export function filterSchemesAdvanced(rows, opts) {
  const {
    query = '',
    minQueryLen = 2,
    state = '',
    gender = '',
    pension = '',
    age = '',
    income = '',
    document = '',
    schemeName = '',
    benefit = '',
  } = opts

  const q = query.trim()
  const hasText = q.length >= minQueryLen
  const hasState = Boolean(state)
  const hasGender = Boolean(gender && gender !== 'any')
  const hasPension = Boolean(pension)
  const hasAge = Boolean(age)
  const hasIncome = Boolean(income)
  const hasDocument = Boolean(document)
  const hasSchemeName = Boolean(schemeName)
  const hasBenefit = Boolean(benefit)

  if (
    !hasText &&
    !hasState &&
    !hasGender &&
    !hasPension &&
    !hasAge &&
    !hasIncome &&
    !hasDocument &&
    !hasSchemeName &&
    !hasBenefit
  ) {
    return []
  }

  const pensionKeys = [COL.benefits, COL.fullText, COL.name, COL.occupation]
  const incomeKeys = SEARCH_KEYS
  const documentKeys = [COL.documents, COL.fullText, COL.benefits, COL.name]
  const benefitKeys = [COL.benefits, COL.fullText, COL.name, COL.occupation]

  let list = rows
  if (hasState) list = list.filter((row) => rowMatchesState(row, state))
  if (hasGender) list = list.filter((row) => rowMatchesGender(row, gender))
  if (hasPension) list = list.filter((row) => rowMatchesInColumns(row, pension, pensionKeys))
  if (hasAge) list = list.filter((row) => rowMatchesAgeFacet(row, age))
  if (hasIncome) list = list.filter((row) => rowMatchesInColumns(row, income, incomeKeys))
  if (hasDocument) list = list.filter((row) => rowMatchesInColumns(row, document, documentKeys))
  if (hasSchemeName) list = list.filter((row) => rowMatchesInColumns(row, schemeName, [COL.name]))
  if (hasBenefit) list = list.filter((row) => rowMatchesInColumns(row, benefit, benefitKeys))
  if (hasText) list = list.filter((row) => schemeMatchesQuery(row, q))
  return list
}

/**
 * When a state/UT is selected (not "All India"), put rows for that state first,
 * then "All India", then "State Specific" at the end.
 * @param {Record<string, string>[]} rows
 * @param {string} selectedState
 */
export function sortSchemesStateOrder(rows, selectedState) {
  const sel = String(selectedState ?? '').trim().toLowerCase()
  if (!sel || sel === 'all india') return rows

  const rank = (row) => {
    const s = String(row[COL.state] ?? '').trim().toLowerCase()
    if (s === 'state specific') return 2
    if (s === 'all india') return 1
    return 0
  }

  return [...rows].sort((a, b) => {
    const ra = rank(a)
    const rb = rank(b)
    if (ra !== rb) return ra - rb
    const na = String(a[COL.name] ?? '')
    const nb = String(b[COL.name] ?? '')
    return na.localeCompare(nb)
  })
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
