import { useMemo, useState } from 'react'
import { profile as defaultProfile } from '../data/profile'
import { ProfileContext } from './profile-context'

const STORAGE_KEY = 'steply-profile-demo'

function readStoredIdentity() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)

    if (!raw) return null

    const parsed = JSON.parse(raw)

    if (
      !parsed ||
      typeof parsed.name !== 'string' ||
      typeof parsed.username !== 'string'
    ) {
      return null
    }

    return {
      name: parsed.name,
      username: parsed.username,
    }
  } catch {
    return null
  }
}

export function ProfileProvider({ children }) {
  const [identity, setIdentity] = useState(
    () =>
      readStoredIdentity() ?? {
        name: defaultProfile.name,
        username: defaultProfile.username,
      },
  )

  const value = useMemo(() => {
    function updateIdentity(next) {
      const stored = {
        name: next.name.trim(),
        username: next.username.trim(),
      }

      setIdentity(stored)

      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(stored))
      } catch {
        // The screen still updates for this visit when storage is unavailable.
      }
    }

    return {
      profile: {
        ...defaultProfile,
        ...identity,
      },
      updateIdentity,
    }
  }, [identity])

  return (
    <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
  )
}
