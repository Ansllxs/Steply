import { useEffect, useMemo, useState } from 'react'
import { translate } from '../i18n/messages'
import { PreferencesContext } from './preferences-context'

const STORAGE_KEY = 'steply-preferences'
const languages = ['es', 'en']
const themes = ['light', 'dark', 'system']

const defaultPreferences = {
  language: 'es',
  theme: 'system',
  notifications: {
    habits: false,
    groups: false,
    achievements: false,
  },
}

function readPreferences() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return defaultPreferences

    const parsed = JSON.parse(raw)
    const notifications = parsed?.notifications ?? {}

    return {
      language: languages.includes(parsed?.language) ? parsed.language : 'es',
      theme: themes.includes(parsed?.theme) ? parsed.theme : 'system',
      notifications: {
        habits: Boolean(notifications.habits),
        groups: Boolean(notifications.groups),
        achievements: Boolean(notifications.achievements),
      },
    }
  } catch {
    return defaultPreferences
  }
}

export function PreferencesProvider({ children }) {
  const [preferences, setPreferences] = useState(readPreferences)

  useEffect(() => {
    document.documentElement.lang = preferences.language

    const media = window.matchMedia('(prefers-color-scheme: dark)')
    const applyTheme = () => {
      const resolved =
        preferences.theme === 'system' ? (media.matches ? 'dark' : 'light') : preferences.theme
      document.documentElement.dataset.theme = resolved
    }

    applyTheme()

    if (preferences.theme !== 'system') return undefined

    media.addEventListener('change', applyTheme)
    return () => media.removeEventListener('change', applyTheme)
  }, [preferences.language, preferences.theme])

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(preferences))
    } catch {
      // Preferences still apply for this visit when storage is unavailable.
    }
  }, [preferences])

  const value = useMemo(() => {
    function t(key, vars) {
      return translate(preferences.language, key, vars)
    }

    function setLanguage(language) {
      if (!languages.includes(language)) return
      setPreferences((current) => ({ ...current, language }))
    }

    function setTheme(theme) {
      if (!themes.includes(theme)) return
      setPreferences((current) => ({ ...current, theme }))
    }

    function setNotification(name, enabled) {
      setPreferences((current) => ({
        ...current,
        notifications: {
          ...current.notifications,
          [name]: Boolean(enabled),
        },
      }))
    }

    return {
      language: preferences.language,
      theme: preferences.theme,
      notifications: preferences.notifications,
      t,
      setLanguage,
      setTheme,
      setNotification,
    }
  }, [preferences])

  return (
    <PreferencesContext.Provider value={value}>{children}</PreferencesContext.Provider>
  )
}
