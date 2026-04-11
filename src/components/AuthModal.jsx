import { useEffect, useRef, useState, startTransition } from 'react'
import { X } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { GoogleLogin } from '@react-oauth/google'
import { parseGoogleCredentialJwt } from '../lib/googleJwt.js'
import { useAuth } from '../context/AuthContext.jsx'
import { hasGoogleClientId } from '../lib/googleClientId.js'

/**
 * @param {{ open: boolean; onClose: () => void }} props
 */
export default function AuthModal({ open, onClose }) {
  const { t, i18n } = useTranslation()
  const { login } = useAuth()
  const closeRef = useRef(null)
  const [googleError, setGoogleError] = useState(false)
  const hasClient = hasGoogleClientId()

  useEffect(() => {
    if (!open) return
    startTransition(() => setGoogleError(false))
    const prev = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    closeRef.current?.focus()
    const onKey = (e) => {
      if (e.key === 'Escape') onClose()
    }
    document.addEventListener('keydown', onKey)
    return () => {
      document.body.style.overflow = prev
      document.removeEventListener('keydown', onKey)
    }
  }, [open, onClose])

  if (!open) return null

  function onGoogleSuccess(credentialResponse) {
    setGoogleError(false)
    const cred = credentialResponse?.credential
    const payload = cred ? parseGoogleCredentialJwt(cred) : null
    if (!payload?.sub) return
    login({
      sub: payload.sub,
      email: payload.email,
      name: payload.name,
      picture: payload.picture,
    })
    onClose()
  }

  return (
    <div className="auth-modal-root" role="presentation">
      <button type="button" className="auth-modal-backdrop" aria-label={t('auth.close')} onClick={onClose} />
      <div className="auth-modal" role="dialog" aria-modal="true" aria-labelledby="auth-modal-title">
        <header className="auth-modal__head">
          <h2 id="auth-modal-title" className="auth-modal__title">
            {t('auth.title')}
          </h2>
          <button
            ref={closeRef}
            type="button"
            className="auth-modal__close"
            onClick={onClose}
            aria-label={t('auth.close')}
          >
            <X size={20} />
          </button>
        </header>
        <div className="auth-modal__body">
          <p className="auth-modal__lead">{t('auth.leadSingle')}</p>
          {hasClient ? (
            <div className="auth-modal__google">
              <GoogleLogin
                onSuccess={onGoogleSuccess}
                onError={() => setGoogleError(true)}
                useOneTap={false}
                auto_select={false}
                theme="outline"
                size="large"
                type="standard"
                width={320}
                text="continue_with"
                shape="rectangular"
                locale={i18n.language === 'hi' ? 'hi' : 'en'}
              />
            </div>
          ) : (
            <p className="auth-modal__missing">{t('auth.missingClient')}</p>
          )}
          {googleError ? <p className="auth-modal__err">{t('auth.googleError')}</p> : null}
          <p className="auth-modal__fine">{t('auth.finePrint')}</p>
        </div>
      </div>
    </div>
  )
}
