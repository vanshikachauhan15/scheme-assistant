import { useEffect, useRef, useState, startTransition } from 'react'
import { useTranslation } from 'react-i18next'
import { shouldSkipTranslate, translateEnToHi } from '../lib/hiTranslate.js'

/**
 * When `active`, translates English scheme strings to Hindi (async, cached).
 */
export default function TranslatedText({
  text,
  active,
  className,
  as = 'span',
  deferUntilVisible = true,
}) {
  const { t } = useTranslation()
  const rootRef = useRef(null)
  const [visible, setVisible] = useState(!deferUntilVisible)
  const [out, setOut] = useState('')
  const skip = !active || shouldSkipTranslate(text)
  const [pending, setPending] = useState(() => Boolean(active && visible && !skip))

  useEffect(() => {
    if (!deferUntilVisible || !active) {
      startTransition(() => setVisible(true))
      return undefined
    }
    startTransition(() => setVisible(false))
    const el = rootRef.current
    if (!el) return undefined
    const obs = new IntersectionObserver(
      ([e]) => {
        if (e.isIntersecting) startTransition(() => setVisible(true))
      },
      { rootMargin: '180px' },
    )
    obs.observe(el)
    return () => obs.disconnect()
  }, [deferUntilVisible, active, text])

  useEffect(() => {
    if (!active) {
      startTransition(() => {
        setOut('')
        setPending(false)
      })
      return undefined
    }
    if (shouldSkipTranslate(text)) {
      startTransition(() => {
        setOut(text)
        setPending(false)
      })
      return undefined
    }
    if (!visible) {
      startTransition(() => {
        setOut('')
        setPending(false)
      })
      return undefined
    }

    let cancelled = false
    startTransition(() => {
      setPending(true)
      setOut('')
    })
    translateEnToHi(text).then((hi) => {
      if (!cancelled) {
        startTransition(() => {
          setOut(hi)
          setPending(false)
        })
      }
    })
    return () => {
      cancelled = true
    }
  }, [text, active, visible])

  let display = text
  if (active) {
    if (!visible && deferUntilVisible) display = '\u2026'
    else if (shouldSkipTranslate(text)) display = text
    else if (pending && !out) display = t('common.translating')
    else display = out || text
  }

  const common = { ref: rootRef, className, lang: active ? 'hi' : undefined, children: display }
  if (as === 'p') return <p {...common} />
  if (as === 'div') return <div {...common} />
  return <span {...common} />
}
