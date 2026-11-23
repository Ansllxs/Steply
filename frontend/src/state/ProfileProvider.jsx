import { useEffect, useMemo, useRef, useState } from 'react'
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
  const [photoUrl, setPhotoUrl] = useState('')
  const photoUrlRef = useRef('')

  useEffect(() => {
    return () => {
      if (photoUrlRef.current) URL.revokeObjectURL(photoUrlRef.current)
    }
  }, [])

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

    function updatePhoto(blob) {
      // Session preview only. Object URLs are not written to localStorage.
      const nextUrl = URL.createObjectURL(blob)
      const previous = photoUrlRef.current
      photoUrlRef.current = nextUrl
      setPhotoUrl(nextUrl)
      if (previous) URL.revokeObjectURL(previous)
    }

    return {
      profile: {
        ...defaultProfile,
        ...identity,
      },
      photoUrl,
      updateIdentity,
      updatePhoto,
    }
  }, [identity, photoUrl])

  return (
    <ProfileContext.Provider value={value}>{children}</ProfileContext.Provider>
  )
}
