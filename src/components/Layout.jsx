import { NavLink, Outlet } from 'react-router-dom'
import { LogIn, Menu, X } from 'lucide-react'
import { useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { setAppLanguage } from '../i18n.js'
import { subscribeTranslatorStatus } from '../lib/hiTranslate.js'
import { applySeoMeta } from '../lib/seoMeta.js'
import { useAuth } from '../context/AuthContext.jsx'
import AuthModal from './AuthModal.jsx'

const ROUTES = [
  { to: '/', key: 'home', end: true },
  { to: '/about', key: 'about' },
  { to: '/chatbot', key: 'chatbot' },
  { to: '/features', key: 'features' },
]

function Layout() {
  const { t, i18n } = useTranslation()
  const { user, logout } = useAuth()
  const [open, setOpen] = useState(false)
  const [translatorBusy, setTranslatorBusy] = useState(false)
  const [authOpen, setAuthOpen] = useState(false)

  useEffect(() => {
    return subscribeTranslatorStatus(({ loading }) => setTranslatorBusy(loading))
  }, [])

  useEffect(() => {
    applySeoMeta({
      title: t('seo.title'),
      description: t('seo.description'),
      lang: i18n.language === 'hi' ? 'hi' : 'en',
    })
  }, [t, i18n.language])

  function openAuth() {
    setAuthOpen(true)
    setOpen(false)
  }

  return (
    <div className="site">
      <a href="#main" className="site-skip">
        {t('layout.skip')}
      </a>

      <header className="site-header">
        <NavLink to="/" className="site-logo-link" end onClick={() => setOpen(false)}>
          <span className="site-logo-mark" aria-hidden>
            SA
          </span>
          <span className="site-logo-text">{t('layout.brand')}</span>
        </NavLink>

        <div className="site-header__auth" aria-label={t('auth.title')}>
          {user ? (
            <div className="site-auth-user">
              {user.picture ? (
                <img
                  src={user.picture}
                  alt=""
                  className="site-auth-avatar"
                  width={32}
                  height={32}
                  referrerPolicy="no-referrer"
                />
              ) : null}
              <span className="site-auth-name">{user.name || user.email || user.sub}</span>
              <button type="button" className="site-auth-btn site-auth-btn--ghost" onClick={() => logout()}>
                {t('layout.logout')}
              </button>
            </div>
          ) : (
            <button type="button" className="site-auth-btn site-auth-btn--primary" onClick={openAuth}>
              <LogIn size={16} strokeWidth={2} aria-hidden />
              <span>{t('layout.signIn')}</span>
            </button>
          )}
        </div>

        <div className="site-header__mid" role="group" aria-label={t('layout.language')}>
          <div className="site-lang">
            <button
              type="button"
              className={i18n.language === 'en' ? 'is-active' : undefined}
              onClick={() => setAppLanguage('en')}
            >
              {t('layout.langEn')}
            </button>
            <button
              type="button"
              className={i18n.language === 'hi' ? 'is-active' : undefined}
              onClick={() => setAppLanguage('hi')}
            >
              {t('layout.langHi')}
            </button>
          </div>
        </div>

        <button
          type="button"
          className="site-nav-toggle"
          aria-expanded={open}
          aria-controls="site-nav"
          onClick={() => setOpen((v) => !v)}
        >
          {open ? <X size={22} /> : <Menu size={22} />}
          <span className="sr-only">{t('layout.menu')}</span>
        </button>

        <nav id="site-nav" className={`site-nav ${open ? 'is-open' : ''}`}>
          <ul className="site-nav__routes">
            {ROUTES.map(({ to, key, end }) => (
              <li key={to}>
                <NavLink
                  to={to}
                  end={end}
                  className={({ isActive }) => (isActive ? 'is-active' : undefined)}
                  onClick={() => setOpen(false)}
                >
                  {t(`nav.${key}`)}
                </NavLink>
              </li>
            ))}
          </ul>
          {!user ? (
            <div className="site-nav__auth">
              <button type="button" className="site-nav__auth-btn site-nav__auth-btn--accent" onClick={openAuth}>
                {t('layout.signIn')}
              </button>
            </div>
          ) : (
            <div className="site-nav__auth site-nav__auth--user">
              <span className="site-nav__auth-name">{user.name || user.email}</span>
              <button type="button" className="site-nav__auth-btn" onClick={() => logout()}>
                {t('layout.logout')}
              </button>
            </div>
          )}
        </nav>
      </header>

      <AuthModal open={authOpen} onClose={() => setAuthOpen(false)} />

      {i18n.language === 'hi' && translatorBusy ? (
        <p className="site-translator-banner" role="status">
          {t('layout.translatorLoading')}
        </p>
      ) : null}

      <main id="main" className="site-main">
        <Outlet />
      </main>

      <footer className="site-footer">
        <div className="site-footer-inner">
          <p className="site-footer-brand">{t('layout.brand')}</p>
          <p className="site-footer-note">{t('layout.footerNote')}</p>
          <p className="site-footer-copy">{t('layout.copyright', { year: new Date().getFullYear() })}</p>
        </div>
      </footer>
    </div>
  )
}

export default Layout
