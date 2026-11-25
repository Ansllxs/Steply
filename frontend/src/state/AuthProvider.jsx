import { useCallback, useEffect, useMemo, useState } from 'react'
import { api, ApiError, clearToken, readToken, saveToken, TOKEN_KEY } from '../services/api'
import { AuthContext } from './auth-context'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [status, setStatus] = useState(() => (readToken() ? 'loading' : 'ready'))
  const [holding, setHolding] = useState(false)

  useEffect(() => {
    let request = 0

    async function load(token, { quiet = false } = {}) {
      const current = ++request

      if (!token) {
        setUser(null)
        setHolding(false)
        setStatus('ready')
        return
      }

      if (!quiet) setStatus('loading')

      try {
        const data = await api('/auth/me')
        if (current !== request || readToken() !== token) return
        setUser(data.usuario)
      } catch {
        if (current !== request || readToken() !== token) return
        clearToken()
        setUser(null)
        setHolding(false)
      } finally {
        if (current === request) setStatus('ready')
      }
    }

    load(readToken())

    function onStorage(event) {
      if (event.key !== TOKEN_KEY) return
      load(readToken(), { quiet: true })
    }

    window.addEventListener('storage', onStorage)
    return () => {
      request += 1
      window.removeEventListener('storage', onStorage)
    }
  }, [])

  const establishSession = useCallback(async (path, body) => {
    const data = await api(path, { method: 'POST', body, auth: false })

    if (!data?.token || !data?.usuario) {
      throw new ApiError(0, 'RED', '')
    }

    saveToken(data.token)
    setHolding(true)
    setUser(data.usuario)
    return data.usuario
  }, [])

  const register = useCallback(
    (body) => establishSession('/auth/registro', body),
    [establishSession],
  )
  const login = useCallback(
    (body) => establishSession('/auth/login', body),
    [establishSession],
  )
  const logout = useCallback(() => {
    clearToken()
    setHolding(false)
    setUser(null)
  }, [])
  const finishTransition = useCallback(() => {
    setHolding(false)
  }, [])
  const updateUser = useCallback((usuario) => {
    if (usuario) setUser(usuario)
  }, [])

  const value = useMemo(
    () => ({ user, status, holding, register, login, logout, finishTransition, updateUser }),
    [user, status, holding, register, login, logout, finishTransition, updateUser],
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}
