/* eslint-disable react-refresh/only-export-components -- hook + provider live together for a tiny app */
import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import { googleLogout } from '@react-oauth/google'

const STORAGE_KEY = 'scheme-assistant-auth'

/** @typedef {{ sub: string; email?: string; name?: string; picture?: string }} AuthUser */

const AuthContext = createContext(null)

function readStoredUser() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const data = JSON.parse(raw)
    if (data && typeof data.sub === 'string') return data
  } catch {
    /* ignore */
  }
  return null
}

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => (typeof localStorage !== 'undefined' ? readStoredUser() : null))

  const login = useCallback((/** @type {AuthUser} */ profile) => {
    setUser(profile)
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(profile))
    } catch {
      /* ignore */
    }
  }, [])

  const logout = useCallback(() => {
    setUser(null)
    try {
      localStorage.removeItem(STORAGE_KEY)
    } catch {
      /* ignore */
    }
    try {
      googleLogout()
    } catch {
      /* ignore — only works after GSI script loaded */
    }
  }, [])

  const value = useMemo(() => ({ user, login, logout }), [user, login, logout])
  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
