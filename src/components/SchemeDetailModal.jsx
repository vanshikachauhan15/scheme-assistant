import { useEffect, useRef } from 'react'
import { X } from 'lucide-react'
import { COL } from '../lib/schemesCsv.js'

const SECTIONS = [
  { key: COL.state, label: 'State' },
  { key: COL.occupation, label: 'Occupation / sector' },
  { key: COL.minAge, label: 'Min age' },
  { key: COL.maxAge, label: 'Max age' },
  { key: COL.incomeLimit, label: 'Income limit' },
  { key: COL.benefits, label: 'Benefits' },
  { key: COL.documents, label: 'Documents' },
  { key: COL.fullText, label: 'Full details' },
]

export default function SchemeDetailModal({ scheme, onClose }) {
  const closeBtnRef = useRef(null)

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

  return (
    <div className="scheme-modal-root" role="presentation">
      <button
        type="button"
        className="scheme-modal-backdrop"
        aria-label="Close dialog"
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
            {scheme[COL.name]?.trim() || 'Scheme details'}
          </h2>
          <button
            ref={closeBtnRef}
            type="button"
            className="scheme-modal__close"
            onClick={onClose}
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </header>
        <div className="scheme-modal__body">
          {SECTIONS.map(({ key, label }) => {
            const raw = scheme[key]
            const text = raw != null && String(raw).trim() !== '' ? String(raw).trim() : '—'
            return (
              <section key={key} className="scheme-modal__section">
                <h3 className="scheme-modal__label">{label}</h3>
                <div className="scheme-modal__value">{text}</div>
              </section>
            )
          })}
        </div>
      </div>
    </div>
  )
}
