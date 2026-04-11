import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from './locales/en.json'
import hi from './locales/hi.json'
import { preloadHiTranslator } from './lib/hiTranslate.js'

const STORAGE_KEY = 'scheme-assistant-lang'

i18n.use(initReactI18next).init({
  resources: {
    en: { translation: en },
    hi: { translation: hi },
  },
  lng: typeof localStorage !== 'undefined' ? localStorage.getItem(STORAGE_KEY) || 'en' : 'en',
  fallbackLng: 'en',
  interpolation: { escapeValue: false },
})

export function setAppLanguage(code) {
  const lng = code === 'hi' ? 'hi' : 'en'
  i18n.changeLanguage(lng)
  try {
    localStorage.setItem(STORAGE_KEY, lng)
  } catch {
    /* ignore */
  }
  if (typeof document !== 'undefined') {
    document.documentElement.lang = lng
    document.documentElement.setAttribute('dir', 'ltr')
  }
  if (lng === 'hi') void preloadHiTranslator()
}

setAppLanguage(i18n.language)

export default i18n
