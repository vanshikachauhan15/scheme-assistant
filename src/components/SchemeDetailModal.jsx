import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { COL } from '../lib/schemesCsv.js'
import TranslatedText from './TranslatedText.jsx'

const SECTIONS = [
  { key: COL.state, fieldKey: 'state' },
  { key: COL.occupation, fieldKey: 'occupation' },
  { key: COL.minAge, fieldKey: 'minAge' },
  { key: COL.maxAge, fieldKey: 'maxAge' },
  { key: COL.incomeLimit, fieldKey: 'incomeLimit' },
  { key: COL.benefits, fieldKey: 'benefits' },
  { key: COL.documents, fieldKey: 'documents' },
  { key: COL.fullText, fieldKey: 'fullText' },
]

function displayValue(schemeKey, raw, t) {
  const empty = raw == null || String(raw).trim() === ''
  if (empty) return '—'
  const text = String(raw).trim()
  if (schemeKey === COL.state) {
    const k = `states.${text}`
    const tr = t(k)
    return tr === k ? text : tr
  }
  return text
}

export default function SchemeDetailModal({ scheme, onClose }) {
  const { t, i18n } = useTranslation()
  const closeBtnRef = useRef(null)
  const hi = i18n.language === 'hi'

  useEffect(() => {
    if (!scheme) return
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeBtnRef.current?.focus()
    return () => {
      document.body.style.overflow = prev
    }
  }, [scheme])

  useEffect(() => {
    if (!scheme) return
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => document.removeEventListener('keydown', onKey)
  }, [scheme, onClose])

  if (!scheme) return null

  const rawTitle = scheme[COL.name]?.trim() || ''
  const titleForTranslate = rawTitle || t('modal.fallbackTitle')

  return (
    <div className="scheme-modal-root" role="presentation">
      <button
        type="button"
        className="scheme-modal-backdrop"
        aria-label={t('modal.closeDialog')}
        onClick={onClose}
      />
      <div
        className="scheme-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="scheme-modal-title"
      >
        <header className="scheme-modal__head">
          <h2 id="scheme-modal-title" className="scheme-modal__title">
            <TranslatedText
              text={titleForTranslate}
              active={hi}
              as="span"
              deferUntilVisible={false}
            />
          </h2>
          <button
            ref={closeBtnRef}
            type="button"
            className="scheme-modal__close"
            onClick={onClose}
            aria-label={t('modal.close')}
          >
            <X size={20} />
          </button>
        </header>
        <div className="scheme-modal__body">
          <p className="scheme-modal__data-note">{hi ? t('modal.dataNoteHi') : t('modal.dataNote')}</p>
          {SECTIONS.map(({ key, fieldKey }) => {
            const raw = scheme[key]
            const text = displayValue(key, raw, t)
            const translateBody = hi && fieldKey !== 'state'
            return (
              <section key={key} className="scheme-modal__section">
                <h3 className="scheme-modal__label">{t(`modal.fields.${fieldKey}`)}</h3>
                <TranslatedText
                  text={text}
                  active={translateBody}
                  as="div"
                  className="scheme-modal__value"
                  deferUntilVisible={false}
                />
              </section>
            )
          })}
        </div>
      </div>
    </div>
  )
}
