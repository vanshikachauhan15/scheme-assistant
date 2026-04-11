import { useTranslation } from 'react-i18next'

export default function About() {
  const { t } = useTranslation()

  return (
    <div className="page page-about">
      <header className="page-hero">
        <h1>{t('about.title')}</h1>
        <p className="page-lead">{t('about.lead')}</p>
      </header>

      <section className="page-section">
        <h2>{t('about.whatTitle')}</h2>
        <ul className="page-list">
          <li>{t('about.li1')}</li>
          <li>{t('about.li2')}</li>
          <li>{t('about.li3')}</li>
        </ul>
      </section>

      <section className="page-section">
        <h2>{t('about.disclaimerTitle')}</h2>
        <p>{t('about.disclaimer')}</p>
      </section>
    </div>
  )
}
