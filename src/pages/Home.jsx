import { useCallback, useDeferredValue, useEffect, useMemo, useRef, useState, startTransition } from 'react'
import { ArrowRight, Database, Loader2, Mic, MicOff, Search, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import { useTranslation } from 'react-i18next'
import TranslatedText from '../components/TranslatedText.jsx'
import { motion as Motion, useReducedMotion } from 'framer-motion'
import SchemeDetailModal from '../components/SchemeDetailModal.jsx'
import {
  COL,
  filterSchemesAdvanced,
  loadSchemesFromCsv,
  previewText,
  sortSchemesStateOrder,
  uniqueStatesFromRows,
} from '../lib/schemesCsv.js'
import { FACET_IDS, FACET_ORDER, FACET_VALUES } from '../lib/facetValues.js'
import {
  getActiveQuickTopicKey,
  QUICK_TAG_KEYS,
  QUICK_TOPIC_BASE,
  QUICK_TOPIC_PRESETS,
  searchStillMatchesTopicQuery,
} from '../lib/quickTopicPresets.js'
import { facetOrderForTopic, facetValuesForTopic } from '../lib/topicFacetUi.js'
import { getSpeechRecognitionConstructor } from '../lib/speechRecognition.js'

const INITIAL_FACETS = { ...QUICK_TOPIC_BASE }

const MIN_QUERY_LEN = 2
const MAX_RESULTS = 200

const easeOut = [0.22, 1, 0.36, 1]

function facetsActive(f) {
  return (
    Boolean(f.state) ||
    Boolean(f.pension) ||
    Boolean(f.age) ||
    Boolean(f.income) ||
    (f.gender === 'women' || f.gender === 'men') ||
    Boolean(f.document) ||
    Boolean(f.schemeName) ||
    Boolean(f.benefit)
  )
}

export default function Home() {
  const { t, i18n } = useTranslation()
  const hi = i18n.language === 'hi'
  const reduceMotion = useReducedMotion()
  const [query, setQuery] = useState('')
  const deferredQuery = useDeferredValue(query.trim())
  const [rows, setRows] = useState([])
  const [loadState, setLoadState] = useState('loading')
  const [loadError, setLoadError] = useState(null)
  const [selected, setSelected] = useState(null)
  const [facets, setFacets] = useState(() => ({ ...INITIAL_FACETS }))
  /** Topic chip pinned until clear-all or search no longer matches that topic's query prefix. */
  const [pinnedQuickTopic, setPinnedQuickTopic] = useState(null)
  const [voiceListening, setVoiceListening] = useState(false)
  const voiceRecRef = useRef(null)

  const speechSupported = useMemo(
    () => typeof window !== 'undefined' && Boolean(getSpeechRecognitionConstructor()),
    [],
  )

  const stopVoice = useCallback(() => {
    try {
      voiceRecRef.current?.stop()
    } catch {
      /* ignore */
    }
    voiceRecRef.current = null
    setVoiceListening(false)
  }, [])

  const startVoice = useCallback(() => {
    const Ctor = getSpeechRecognitionConstructor()
    if (!Ctor) return
    stopVoice()
    const rec = new Ctor()
    rec.lang = hi ? 'hi-IN' : 'en-IN'
    rec.interimResults = false
    rec.continuous = false
    rec.maxAlternatives = 1
    rec.onresult = (event) => {
      for (let i = event.resultIndex; i < event.results.length; i++) {
        const res = event.results[i]
        if (!res.isFinal) continue
        const chunk = String(res[0]?.transcript ?? '').trim()
        if (!chunk) continue
        setQuery((q) => {
          const base = q.trim()
          return base ? `${base} ${chunk}` : chunk
        })
      }
    }
    rec.onerror = () => stopVoice()
    rec.onend = () => {
      voiceRecRef.current = null
      setVoiceListening(false)
    }
    voiceRecRef.current = rec
    setVoiceListening(true)
    try {
      rec.start()
    } catch {
      stopVoice()
    }
  }, [hi, stopVoice])

  useEffect(() => {
    return () => stopVoice()
  }, [stopVoice])

  useEffect(() => {
    startTransition(() => stopVoice())
  }, [hi, stopVoice])

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

  const stateOptions = useMemo(() => uniqueStatesFromRows(rows), [rows])

  const activeQuickTopic = useMemo(
    () => getActiveQuickTopicKey(facets, query.trim()),
    [facets, query],
  )

  const layoutQuickTopic = useMemo(() => {
    if (pinnedQuickTopic && searchStillMatchesTopicQuery(query.trim(), pinnedQuickTopic)) {
      return pinnedQuickTopic
    }
    return activeQuickTopic
  }, [pinnedQuickTopic, query, activeQuickTopic])

  const facetRowOrder = useMemo(() => {
    const topicOrder = facetOrderForTopic(layoutQuickTopic)
    return topicOrder ?? FACET_ORDER
  }, [layoutQuickTopic])

  const effectiveFacets = useMemo(() => {
    if (!layoutQuickTopic) return facets
    const next = { ...facets }
    for (const fk of facetRowOrder) {
      const allowed = facetValuesForTopic(layoutQuickTopic, fk)
      if (allowed.length && next[fk] !== '' && !allowed.includes(next[fk])) {
        next[fk] = ''
      }
    }
    return next
  }, [facets, layoutQuickTopic, facetRowOrder])

  const filtered = useMemo(() => {
    const list = filterSchemesAdvanced(rows, {
      query: deferredQuery,
      minQueryLen: MIN_QUERY_LEN,
      state: effectiveFacets.state,
      gender: effectiveFacets.gender,
      pension: effectiveFacets.pension,
      age: effectiveFacets.age,
      income: effectiveFacets.income,
      document: effectiveFacets.document,
      schemeName: effectiveFacets.schemeName,
      benefit: effectiveFacets.benefit,
    })
    return sortSchemesStateOrder(list, effectiveFacets.state)
  }, [rows, deferredQuery, effectiveFacets])

  const visible = useMemo(() => filtered.slice(0, MAX_RESULTS), [filtered])
  const totalMatches = filtered.length
  const isStale = query.trim() !== deferredQuery

  const hasFacetFilters = facetsActive(effectiveFacets)
  const hasActiveFilters = deferredQuery.length >= MIN_QUERY_LEN || hasFacetFilters

  function applyQuickTopic(tagKey) {
    const preset = QUICK_TOPIC_PRESETS[tagKey]
    if (!preset) return
    setPinnedQuickTopic(tagKey)
    setFacets({ ...preset.facets })
    setQuery(preset.query)
  }

  function setFacet(key, value) {
    setFacets((prev) => ({ ...prev, [key]: value }))
  }

  function clearAllFilters() {
    setPinnedQuickTopic(null)
    setFacets({ ...INITIAL_FACETS })
    setQuery('')
  }

  function stateLabel(st) {
    const k = `states.${st}`
    const tr = t(k)
    return tr === k ? st : tr
  }

  function facetOptionLabels(facetKey) {
    const raw = t(`home.facet.${facetKey}.opts`, { returnObjects: true })
    return Array.isArray(raw) ? raw : []
  }

  function labelForFacetOption(facetKey, value, labelsRow) {
    const idx = FACET_VALUES[facetKey].indexOf(value)
    if (idx >= 0) return labelsRow[idx] ?? value
    return value
  }

  function topicFacetLabel(facetKey, field) {
    const baseKey = `home.facet.${facetKey}.${field}`
    if (!layoutQuickTopic) return t(baseKey)
    const overKey = `home.topicFacet.${layoutQuickTopic}.${facetKey}.${field}`
    const tr = t(overKey)
    return tr === overKey ? t(baseKey) : tr
  }

  return (
    <div className="scheme-app scheme-app--home">
      <SchemeDetailModal scheme={selected} onClose={() => setSelected(null)} />

      <section className="home-hero" aria-labelledby="home-hero-title">
        <div
          className="home-hero__media"
          role="img"
          aria-label={t('home.heroAria')}
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
            <span>{t('home.badge')}</span>
          </div>
          <h1 id="home-hero-title">{t('home.title')}</h1>
          <p className="home-hero__tagline">{t('home.tagline')}</p>

          <p className="home-hero__search-hint" id="home-search-hint">
            {t('home.searchModesHint')}
          </p>
          <div className="home-hero__search-row">
            <label className="scheme-search scheme-search--hero home-hero__search-field" htmlFor="scheme-q">
              <Search className="scheme-search-icon" size={20} strokeWidth={2} aria-hidden />
              <input
                id="scheme-q"
                type="search"
                lang={i18n.language}
                placeholder={t('home.searchPlaceholder')}
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                autoComplete="off"
                disabled={loadState !== 'ready'}
                aria-describedby="home-search-hint"
              />
            </label>
            <button
              type="button"
              className={`home-hero__voice-btn${voiceListening ? ' is-listening' : ''}`}
              disabled={!speechSupported || loadState !== 'ready'}
              aria-pressed={voiceListening}
              aria-label={voiceListening ? t('home.voiceStop') : t('home.voiceStart')}
              title={!speechSupported ? t('home.voiceUnsupported') : undefined}
              onClick={() => (voiceListening ? stopVoice() : startVoice())}
            >
              {voiceListening ? (
                <MicOff size={22} strokeWidth={2} aria-hidden />
              ) : (
                <Mic size={22} strokeWidth={2} aria-hidden />
              )}
            </button>
          </div>
          {voiceListening ? (
            <p className="home-hero__voice-status" role="status">
              {t('home.voiceListening')}
            </p>
          ) : null}

          <p className="home-hero__chips-label">{t('home.popularTopics')}</p>
          <p className="home-hero__chips-sub">{t('home.popularTopicsHint')}</p>
          <div className="home-hero__chips" role="group" aria-label={t('home.quickTopicsAria')}>
            {QUICK_TAG_KEYS.map((tag) => (
              <button
                key={tag}
                type="button"
                className={`home-hero__chip${layoutQuickTopic === tag ? ' is-active' : ''}`}
                aria-pressed={layoutQuickTopic === tag}
                onClick={() => applyQuickTopic(tag)}
                disabled={loadState !== 'ready'}
              >
                {t(`home.quickTags.${tag}`)}
              </button>
            ))}
          </div>

          <div className="home-hero__links">
            <Link to="/chatbot" className="home-hero__pill">
              {t('home.chatbot')}
            </Link>
            <Link to="/features" className="home-hero__pill home-hero__pill--ghost">
              {t('home.features')}
            </Link>
          </div>
        </Motion.div>
      </section>

      <div className="home-below">
        <section className="home-ideas" aria-labelledby="home-ideas-title">
          <div className="home-ideas__head">
            <p className="home-ideas__eyebrow">{t('home.filtersEyebrow')}</p>
            <h2 id="home-ideas-title" className="home-ideas__title">
              {layoutQuickTopic
                ? t(`home.topicFilters.title.${layoutQuickTopic}`, { defaultValue: t('home.filtersTitle') })
                : t('home.filtersTitle')}
            </h2>
            <p className="home-ideas__sub">
              {layoutQuickTopic
                ? t(`home.topicFilters.intro.${layoutQuickTopic}`, { defaultValue: t('home.filtersIntro') })
                : t('home.filtersIntro')}
            </p>
          </div>

          <div className="home-filters">
            <p className="home-filters__title">
              {layoutQuickTopic
                ? t(`home.topicFilters.panelTitle.${layoutQuickTopic}`, { defaultValue: t('home.allFilters') })
                : t('home.allFilters')}
            </p>
            <div className="home-filters__grid home-filters__grid--dense">
              <div className="home-select-wrap">
                <label className="home-select-label" htmlFor="facet-state">
                  {t('home.stateLabel')}
                </label>
                <span className="home-select-hint">{t('home.stateHint')}</span>
                <select
                  id="facet-state"
                  className="home-select"
                  value={facets.state}
                  onChange={(e) => setFacet('state', e.target.value)}
                  disabled={loadState !== 'ready'}
                >
                  <option value="">{t('home.anyState')}</option>
                  {stateOptions.map((st) => (
                    <option key={st} value={st}>
                      {stateLabel(st)}
                    </option>
                  ))}
                </select>
              </div>

              {facetRowOrder.map((facetKey) => {
                const values = facetValuesForTopic(layoutQuickTopic, facetKey)
                const labels = facetOptionLabels(facetKey)
                return (
                  <div key={facetKey} className="home-select-wrap">
                    <label className="home-select-label" htmlFor={FACET_IDS[facetKey]}>
                      {topicFacetLabel(facetKey, 'label')}
                    </label>
                    <span className="home-select-hint">{topicFacetLabel(facetKey, 'hint')}</span>
                    <select
                      id={FACET_IDS[facetKey]}
                      className="home-select"
                      value={effectiveFacets[facetKey]}
                      onChange={(e) => setFacet(facetKey, e.target.value)}
                      disabled={loadState !== 'ready'}
                    >
                      {values.map((v) => (
                        <option key={v || `any-${facetKey}`} value={v}>
                          {labelForFacetOption(facetKey, v, labels)}
                        </option>
                      ))}
                    </select>
                  </div>
                )
              })}
            </div>
            {hasFacetFilters && (
              <button type="button" className="home-filters__clear" onClick={clearAllFilters}>
                {t('home.clearFilters')}
              </button>
            )}
          </div>
        </section>

        <section className="scheme-section scheme-section--tight" aria-label={t('home.resultsAria')}>
          {loadState === 'loading' && (
            <div className="scheme-panel scheme-panel--glass">
              <div className="scheme-panel__row">
                <div className="scheme-panel__icon scheme-panel__icon--pulse">
                  <Loader2 size={22} className="home-spin" aria-hidden />
                </div>
                <div className="scheme-panel__body">
                  <p className="scheme-panel__title">{t('home.loadingTitle')}</p>
                  <p className="scheme-panel__text">{t('home.loadingText')}</p>
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
              <p className="scheme-panel__title">{t('home.errorTitle')}</p>
              <p className="scheme-panel__text">{loadError}</p>
            </div>
          )}

          {loadState === 'ready' && !hasActiveFilters && (
            <div className="scheme-panel scheme-panel--glass scheme-panel--accent-edge">
              <div className="scheme-panel__row">
                <div className="scheme-panel__icon">
                  <Database size={22} strokeWidth={2} aria-hidden />
                </div>
                <div className="scheme-panel__body">
                  <p className="scheme-panel__title">{t('home.readyTitle')}</p>
                  <p className="scheme-panel__text">
                    {t('home.readyText', {
                      count: rows.length.toLocaleString(),
                      min: MIN_QUERY_LEN,
                    })}
                  </p>
                </div>
              </div>
            </div>
          )}

          {loadState === 'ready' && hasActiveFilters && totalMatches === 0 && (
            <div className="scheme-panel scheme-panel--muted scheme-panel--glass">
              <p className="scheme-panel__title">{t('home.noMatchTitle')}</p>
              <p className="scheme-panel__text">{t('home.noMatchText')}</p>
            </div>
          )}

          {loadState === 'ready' && hasActiveFilters && totalMatches > 0 && (
            <>
              <div className="scheme-section__head scheme-section__head--modern">
                <div>
                  <p className="scheme-section__eyebrow">{t('home.directoryEyebrow')}</p>
                  <h2 className="scheme-section-title">{t('home.resultsTitle')}</h2>
                </div>
                <span className="scheme-section__count scheme-section__count--pill">
                  {isStale ? (
                    '…'
                  ) : (
                    <>
                      {totalMatches === 1
                        ? t('home.matchOne', { count: totalMatches })
                        : t('home.matchMany', { count: totalMatches.toLocaleString() })}
                      {totalMatches > MAX_RESULTS ? t('home.topN', { n: MAX_RESULTS }) : ''}
                    </>
                  )}
                </span>
              </div>
              <ul className="scheme-list scheme-list--results">
                {visible.map((row, i) => (
                  <li key={`${i18n.language}-${i}-${row[COL.name]?.slice(0, 40) ?? i}`}>
                    <button
                      type="button"
                      className="scheme-result-card"
                      onClick={() => setSelected(row)}
                    >
                      <div className="scheme-result-card__main">
                        <div className="scheme-result-card__top">
                          <span className="scheme-result-card__name">
                            <TranslatedText
                              text={row[COL.name] || t('home.untitled')}
                              active={hi}
                              as="span"
                            />
                          </span>
                          {row[COL.state] ? (
                            <span className="scheme-pill scheme-pill--muted">
                              {stateLabel(row[COL.state])}
                            </span>
                          ) : null}
                        </div>
                        {row[COL.occupation] ? (
                          <p className="scheme-result-card__meta">
                            <TranslatedText text={String(row[COL.occupation])} active={hi} as="span" />
                          </p>
                        ) : null}
                        <TranslatedText
                          text={previewText(row)}
                          active={hi}
                          as="p"
                          className="scheme-result-card__preview"
                        />
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
