import { useDeferredValue, useEffect, useMemo, useState } from 'react'
import {
  ArrowRight,
  Banknote,
  Database,
  FileText,
  IndianRupee,
  Loader2,
  MapPin,
  Search,
  Sparkles,
  Tag,
  UserCircle,
  Users,
} from 'lucide-react'
import { Link } from 'react-router-dom'
import { motion as Motion, useReducedMotion } from 'framer-motion'
import SchemeDetailModal from '../components/SchemeDetailModal.jsx'
import { COL, filterSchemes, loadSchemesFromCsv, previewText } from '../lib/schemesCsv.js'

const QUICK_TAGS = ['Agriculture', 'Health', 'Education', 'Housing', 'Women', 'Student']

/** Ways to search — tap to fill the search box (same idea as popular topics). */
const SEARCH_IDEAS = [
  {
    label: 'State or UT',
    description: 'Schemes for a region — try a state name or “All India”.',
    query: 'Maharashtra',
    Icon: MapPin,
  },
  {
    label: 'Pension & seniors',
    description: 'Old age pension, retirement, and senior benefits.',
    query: 'pension',
    Icon: Banknote,
  },
  {
    label: 'Age',
    description: 'Min / max age in eligibility — e.g. 18, 60, student.',
    query: '60',
    Icon: UserCircle,
  },
  {
    label: 'Income & limits',
    description: 'Income caps, BPL, EWS, or “income limit”.',
    query: 'income',
    Icon: IndianRupee,
  },
  {
    label: 'Women & girls',
    description: 'Gender-focused schemes and girl-child programmes.',
    query: 'women',
    Icon: Users,
  },
  {
    label: 'Documents & apply',
    description: 'What to submit — Aadhaar, certificate, application steps.',
    query: 'aadhaar',
    Icon: FileText,
  },
  {
    label: 'Scheme name',
    description: 'Part of the official title — keywords work too.',
    query: 'PM-KISAN',
    Icon: Tag,
  },
  {
    label: 'Benefit type',
    description: 'Scholarship, loan, subsidy, housing, insurance…',
    query: 'scholarship',
    Icon: Sparkles,
  },
]

const MIN_QUERY_LEN = 2
const MAX_RESULTS = 200

const easeOut = [0.22, 1, 0.36, 1]

export default function Home() {
  const reduceMotion = useReducedMotion()
  const [query, setQuery] = useState('')
  const deferredQuery = useDeferredValue(query.trim())
  const [rows, setRows] = useState([])
  const [loadState, setLoadState] = useState('loading')
  const [loadError, setLoadError] = useState(null)
  const [selected, setSelected] = useState(null)

  useEffect(() => {
    let cancelled = false
    loadSchemesFromCsv()
      .then((data) => {
        if (!cancelled) {
          setRows(Array.isArray(data) ? data : [])
          setLoadState('ready')
        }
      })
      .catch((e) => {
        if (!cancelled) {
          setLoadError(e instanceof Error ? e.message : 'Failed to load data')
          setLoadState('error')
        }
      })
    return () => {
      cancelled = true
    }
  }, [])

  const filtered = useMemo(() => {
    if (deferredQuery.length < MIN_QUERY_LEN) return []
    return filterSchemes(rows, deferredQuery)
  }, [rows, deferredQuery])

  const visible = useMemo(() => filtered.slice(0, MAX_RESULTS), [filtered])
  const totalMatches = filtered.length
  const isStale = query.trim() !== deferredQuery

  return (
    <div className="scheme-app scheme-app--home">
      <SchemeDetailModal scheme={selected} onClose={() => setSelected(null)} />

      <section className="home-hero" aria-labelledby="home-hero-title">
        <div
          className="home-hero__media"
          role="img"
          aria-label="Community — illustrative background"
        />
        <div className="home-hero__scrim" aria-hidden />
        <div className="home-hero__grain" aria-hidden />
        <Motion.div
          className="home-hero__content"
          initial={reduceMotion ? false : { opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: reduceMotion ? 0 : 0.5, ease: easeOut }}
        >
          <div className="home-hero__badge">
            <Sparkles size={14} strokeWidth={2} aria-hidden />
            <span>Live dataset</span>
          </div>
          <h1 id="home-hero-title">What can we help you find?</h1>
          <p className="home-hero__tagline">Search thousands of schemes — instant results below.</p>

          <div className="home-hero__search">
            <label className="scheme-search scheme-search--hero" htmlFor="scheme-q">
              <Search className="scheme-search-icon" size={20} strokeWidth={2} aria-hidden />
              <input
                id="scheme-q"
                type="search"
                placeholder="Try &quot;farmer&quot;, &quot;Delhi&quot;, or &quot;pension&quot;…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                autoComplete="off"
                disabled={loadState !== 'ready'}
              />
            </label>
          </div>

          <p className="home-hero__chips-label">Popular topics</p>
          <div className="home-hero__chips" role="group" aria-label="Quick topics">
            {QUICK_TAGS.map((tag) => (
              <button
                key={tag}
                type="button"
                className="home-hero__chip"
                onClick={() => setQuery(tag)}
                disabled={loadState !== 'ready'}
              >
                {tag}
              </button>
            ))}
          </div>

          <div className="home-hero__links">
            <Link to="/chatbot" className="home-hero__pill">
              Chatbot
            </Link>
            <Link to="/features" className="home-hero__pill home-hero__pill--ghost">
              Features
            </Link>
          </div>
        </Motion.div>
      </section>

      <div className="home-below">
        <section className="home-ideas" aria-labelledby="home-ideas-title">
          <div className="home-ideas__head">
            <p className="home-ideas__eyebrow">Search ideas</p>
            <h2 id="home-ideas-title" className="home-ideas__title">
              What you can search for
            </h2>
            <p className="home-ideas__sub">
              Same as popular topics — tap any card to try an example query. Search runs across name,
              state, sector, age, income, benefits, documents, and full details.
            </p>
          </div>
          <ul className="home-ideas__grid">
            {SEARCH_IDEAS.map((idea) => {
              const { label, description, query: exampleQuery, Icon: IdeaIcon } = idea
              return (
              <li key={label}>
                <button
                  type="button"
                  className="home-idea-card"
                  onClick={() => setQuery(exampleQuery)}
                  disabled={loadState !== 'ready'}
                >
                  <span className="home-idea-card__icon" aria-hidden>
                    <IdeaIcon size={20} strokeWidth={2} />
                  </span>
                  <span className="home-idea-card__body">
                    <span className="home-idea-card__label">{label}</span>
                    <span className="home-idea-card__desc">{description}</span>
                    <span className="home-idea-card__try">
                      Try: <em>{exampleQuery}</em>
                    </span>
                  </span>
                </button>
              </li>
              )
            })}
          </ul>
        </section>

        <section className="scheme-section scheme-section--tight" aria-label="Search results">
          {loadState === 'loading' && (
            <div className="scheme-panel scheme-panel--glass">
              <div className="scheme-panel__row">
                <div className="scheme-panel__icon scheme-panel__icon--pulse">
                  <Loader2 size={22} className="home-spin" aria-hidden />
                </div>
                <div className="scheme-panel__body">
                  <p className="scheme-panel__title">Loading dataset</p>
                  <p className="scheme-panel__text">
                    Fetching scheme records — usually just a moment.
                  </p>
                </div>
              </div>
              <div className="home-skeleton" aria-hidden>
                <div className="home-skeleton__bar home-skeleton__bar--lg" />
                <div className="home-skeleton__bar" />
                <div className="home-skeleton__bar home-skeleton__bar--sm" />
              </div>
            </div>
          )}

          {loadState === 'error' && (
            <div className="scheme-panel scheme-panel--error scheme-panel--glass">
              <p className="scheme-panel__title">Could not load schemes</p>
              <p className="scheme-panel__text">{loadError}</p>
            </div>
          )}

          {loadState === 'ready' && deferredQuery.length < MIN_QUERY_LEN && (
            <div className="scheme-panel scheme-panel--glass scheme-panel--accent-edge">
              <div className="scheme-panel__row">
                <div className="scheme-panel__icon">
                  <Database size={22} strokeWidth={2} aria-hidden />
                </div>
                <div className="scheme-panel__body">
                  <p className="scheme-panel__title">You&apos;re all set</p>
                  <p className="scheme-panel__text">
                    <strong className="scheme-panel__stat">{rows.length.toLocaleString()}</strong>{' '}
                    schemes indexed. Type at least {MIN_QUERY_LEN} characters or tap a topic — results
                    show up here. Open any card for full details.
                  </p>
                </div>
              </div>
            </div>
          )}

          {loadState === 'ready' && deferredQuery.length >= MIN_QUERY_LEN && totalMatches === 0 && (
            <div className="scheme-panel scheme-panel--muted scheme-panel--glass">
              <p className="scheme-panel__title">No matches yet</p>
              <p className="scheme-panel__text">
                Broaden your search — we match name, state, sector, benefits, documents, and full
                text.
              </p>
            </div>
          )}

          {loadState === 'ready' && deferredQuery.length >= MIN_QUERY_LEN && totalMatches > 0 && (
            <>
              <div className="scheme-section__head scheme-section__head--modern">
                <div>
                  <p className="scheme-section__eyebrow">Directory</p>
                  <h2 className="scheme-section-title">Results</h2>
                </div>
                <span className="scheme-section__count scheme-section__count--pill">
                  {isStale ? (
                    '…'
                  ) : (
                    <>
                      {totalMatches.toLocaleString()} match{totalMatches === 1 ? '' : 'es'}
                      {totalMatches > MAX_RESULTS ? ` · top ${MAX_RESULTS}` : ''}
                    </>
                  )}
                </span>
              </div>
              <ul className="scheme-list scheme-list--results">
                {visible.map((row, i) => (
                  <li key={`${i}-${row[COL.name]?.slice(0, 40) ?? i}`}>
                    <button
                      type="button"
                      className="scheme-result-card"
                      onClick={() => setSelected(row)}
                    >
                      <div className="scheme-result-card__main">
                        <div className="scheme-result-card__top">
                          <span className="scheme-result-card__name">
                            {row[COL.name] || 'Untitled scheme'}
                          </span>
                          {row[COL.state] ? (
                            <span className="scheme-pill scheme-pill--muted">{row[COL.state]}</span>
                          ) : null}
                        </div>
                        {row[COL.occupation] ? (
                          <p className="scheme-result-card__meta">{row[COL.occupation]}</p>
                        ) : null}
                        <p className="scheme-result-card__preview">{previewText(row)}</p>
                      </div>
                      <span className="scheme-result-card__arrow" aria-hidden>
                        <ArrowRight size={18} strokeWidth={2} />
                      </span>
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
      </div>
    </div>
  )
}
