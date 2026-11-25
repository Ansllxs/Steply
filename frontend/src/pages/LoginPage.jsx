import { useRef, useState } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import backIcon from '../assets/back.svg'
import logo from '../assets/logo.png'
import AuthSuccess from '../components/AuthSuccess'
import Button from '../components/Button'
import LoadingIndicator from '../components/LoadingIndicator'
import TextField from '../components/TextField'
import { USERNAME_PATTERN } from '../data/profile'
import { describeApiError } from '../services/auth-errors'
import { useAuth } from '../state/useAuth'
import { usePreferences } from '../state/usePreferences'

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function normalizeIdentifier(identifier) {
  const value = identifier.trim()
  if (value.startsWith('@') && !value.includes('@', 1)) return value.slice(1)
  return value
}

function validateLogin(identifier, password) {
  const errors = {}
  const value = normalizeIdentifier(identifier)

  if (!value) {
    errors.identifier = 'validation.identifierRequired'
  } else if (value.includes('@')) {
    if (!emailPattern.test(value)) errors.identifier = 'validation.emailInvalid'
  } else if (!USERNAME_PATTERN.test(value)) {
    errors.identifier = 'validation.usernameCharset'
  }

  if (!password) {
    errors.password = 'validation.passwordRequired'
  }

  return errors
}

function successDelay() {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  return new Promise((resolve) => {
    window.setTimeout(resolve, reduce ? 600 : 1100)
  })
}

export default function LoginPage() {
  const { t } = usePreferences()
  const { login, finishTransition } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [identifier, setIdentifier] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState({})
  const [notice, setNotice] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)
  const lockRef = useRef(false)

  async function handleSubmit(event) {
    event.preventDefault()
    if (lockRef.current) return

    const nextErrors = validateLogin(identifier, password)
    setErrors(nextErrors)
    setNotice('')

    if (Object.keys(nextErrors).length > 0) return

    lockRef.current = true
    setSubmitting(true)

    try {
      await login({ identificador: normalizeIdentifier(identifier), password })
      setSuccess(true)
      await successDelay()
      finishTransition()
      const from = location.state?.from?.pathname
      const destination = from && from !== '/login' && from !== '/register' ? from : '/dashboard'
      navigate(destination, { replace: true })
    } catch (error) {
      const result = describeApiError(error)
      setErrors(result.fields)
      setNotice(result.form)
      lockRef.current = false
      setSubmitting(false)
    }
  }

  return (
    <main className="auth">
      <div className="auth-frame">
        <Link className="auth-back" to="/" aria-label={t('common.back')}>
          <img src={backIcon} alt="" width="22" height="22" />
        </Link>
        <img
          className="auth-logo"
          src={logo}
          alt="Steply"
          width="179"
          height="119"
        />
        <h1>{t('login.hello')}</h1>
        <p className="auth-lead">{t('login.lead')}</p>
        {success ? (
          <AuthSuccess message={t('auth.welcomeBack')} />
        ) : (
          <form className="auth-form" onSubmit={handleSubmit} noValidate aria-busy={submitting}>
            <TextField
              id="login-identifier"
              name="username"
              label={t('login.identifier')}
              type="text"
              value={identifier}
              placeholder={t('login.identifierPlaceholder')}
              autoComplete="username"
              error={errors.identifier ? t(errors.identifier) : undefined}
              onChange={(event) => {
                setIdentifier(event.target.value)
                setNotice('')
                setErrors((current) => ({ ...current, identifier: undefined }))
              }}
            />
            <TextField
              id="login-password"
              name="password"
              label={t('login.password')}
              type="password"
              value={password}
              placeholder={t('register.passwordPlaceholder')}
              autoComplete="current-password"
              revealable
              error={errors.password ? t(errors.password) : undefined}
              onChange={(event) => {
                setPassword(event.target.value)
                setNotice('')
                setErrors((current) => ({ ...current, password: undefined }))
              }}
            />
            <div className="auth-actions">
              <Button type="submit" disabled={submitting}>{t('login.submit')}</Button>
              {submitting ? <LoadingIndicator message={t('auth.working')} /> : null}
              {notice ? (
                <p className="auth-notice" role="alert">
                  {t(notice)}
                </p>
              ) : null}
              <Button to="/register" variant="secondary">
                {t('login.create')}
              </Button>
            </div>
          </form>
        )}
      </div>
    </main>
  )
}
