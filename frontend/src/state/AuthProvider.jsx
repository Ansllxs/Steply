import { useCallback, useEffect, useMemo, useState } from 'react'
import { api, ApiError, clearToken, readToken, saveToken } from '../services/api'
import { AuthContext } from './auth-context'

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [status, setStatus] = useState(() => (readToken() ? 'loading' : 'ready'))
  const [holding, setHolding] = useState(false)

  useEffect(() => {
    if (!readToken()) return undefined

    let cancelled = false

    api('/auth/me')
      .then((data) => {
        if (!cancelled) setUser(data.usuario)
      })
      .catch(() => {
        clearToken()
        if (!cancelled) setUser(null)
      })
      .finally(() => {
        if (!cancelled) setStatus('ready')
      })

    return () => {
      cancelled = true
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
