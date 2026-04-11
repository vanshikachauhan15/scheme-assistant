import { Search, MessageCircle, Bell, FileCheck, Users, BookOpen } from 'lucide-react'
import { useTranslation } from 'react-i18next'

const items = [
  { icon: Search, fkey: 'f1', statusKey: 'live' },
  { icon: MessageCircle, fkey: 'f2', statusKey: 'live' },
  { icon: FileCheck, fkey: 'f3', statusKey: 'planned' },
  { icon: Bell, fkey: 'f4', statusKey: 'planned' },
  { icon: Users, fkey: 'f5', statusKey: 'idea' },
  { icon: BookOpen, fkey: 'f6', statusKey: 'idea' },
]

export default function Features() {
  const { t } = useTranslation()

  return (
    <div className="page page-features">
      <header className="page-hero">
        <h1>{t('features.title')}</h1>
        <p className="page-lead">{t('features.lead')}</p>
      </header>

      <ul className="feature-grid">
        {items.map(({ icon, fkey, statusKey }) => {
          const FeatureIcon = icon
          const title = t(`features.${fkey}.title`)
          const desc = t(`features.${fkey}.desc`)
          const status = t(`features.${statusKey}`)
          const isLive = statusKey === 'live'
          return (
            <li key={fkey}>
              <article className="feature-card">
                <div className="feature-card-icon" aria-hidden>
                  <FeatureIcon size={22} strokeWidth={2} />
                </div>
                <div className="feature-card-body">
                  <div className="feature-card-top">
                    <h2>{title}</h2>
                    <span
                      className={`feature-badge feature-badge--${isLive ? 'live' : 'soon'}`}
                    >
                      {status}
                    </span>
                  </div>
                  <p>{desc}</p>
                </div>
              </article>
            </li>
          )
        })}
      </ul>
    </div>
  )
}
