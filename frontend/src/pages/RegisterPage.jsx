import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import backIcon from '../assets/back.svg'
import bunny from '../assets/corriendo.png'
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

function validateRegistration(name, username, email, password, confirmPassword) {
  const errors = {}

  if (!name.trim()) {
    errors.name = 'validation.nameRequired'
  } else if (name.trim().length > 80) {
    errors.name = 'validation.nameLength'
  }

  if (!username.trim()) {
    errors.username = 'validation.usernameRequired'
  } else if (/\s/.test(username)) {
    errors.username = 'validation.usernameSpaces'
  } else if (!USERNAME_PATTERN.test(username.trim())) {
    errors.username = 'validation.usernameCharset'
  }

  if (!email.trim()) {
    errors.email = 'validation.emailRequired'
  } else if (!emailPattern.test(email.trim())) {
    errors.email = 'validation.emailInvalid'
  }

  if (!password) {
    errors.password = 'validation.passwordRequired'
  } else if (password.length < 8) {
    errors.password = 'validation.passwordShort'
  }

  if (!confirmPassword) {
    errors.confirmPassword = 'validation.passwordRequired'
  } else if (password !== confirmPassword) {
    errors.confirmPassword = 'validation.passwordMismatch'
  }

  return errors
}

function successDelay() {
  const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  return new Promise((resolve) => {
    window.setTimeout(resolve, reduce ? 600 : 1100)
  })
}

export default function RegisterPage() {
  const { t } = usePreferences()
  const { register, finishTransition } = useAuth()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [errors, setErrors] = useState({})
  const [notice, setNotice] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [success, setSuccess] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    if (submitting) return

    const nextErrors = validateRegistration(name, username, email, password, confirmPassword)
    setErrors(nextErrors)
    setNotice('')

    if (Object.keys(nextErrors).length > 0) return

    setSubmitting(true)

    try {
      await register({
        nombre: name.trim(),
        nombreUsuario: username.trim(),
        correo: email.trim(),
        password,
      })
      setSuccess(true)
      await successDelay()
      finishTransition()
      navigate('/dashboard', { replace: true })
    } catch (error) {
      const result = describeApiError(error)
      setErrors((current) => ({ ...current, ...result.fields }))
      setNotice(result.form)
      setSubmitting(false)
    }
  }

  return (
    <main className="auth register">
      <div className="auth-frame">
        <Link className="auth-back" to="/" aria-label={t('common.back')}>
          <img src={backIcon} alt="" width="22" height="22" />
        </Link>
        <img
          className="register-logo"
          src={logo}
          alt="Steply"
          width="124"
          height="82"
        />
        <div className="register-hero">
          <img
            className="register-bunny"
            src={bunny}
            alt=""
            width="67"
            height="98"
          />
        </div>
        <h1>{t('register.title')}</h1>
        <p className="auth-lead">{t('register.lead')}</p>
        {success ? (
          <AuthSuccess message={t('auth.accountCreated')} />
        ) : (
          <form className="auth-form" onSubmit={handleSubmit} noValidate aria-busy={submitting}>
            <TextField
              id="register-name"
              name="name"
              label={t('register.name')}
              value={name}
              autoComplete="name"
              error={errors.name ? t(errors.name) : undefined}
              onChange={(event) => {
                setName(event.target.value)
                setNotice('')
                setErrors((current) => ({ ...current, name: undefined }))
              }}
            />
            <TextField
              id="register-username"
              name="username"
              label={t('register.username')}
              value={username}
              autoComplete="username"
              error={errors.username ? t(errors.username) : undefined}
              onChange={(event) => {
                setUsername(event.target.value)
                setNotice('')
                setErrors((current) => ({ ...current, username: undefined }))
              }}
            />
            <TextField
              id="register-email"
              name="email"
              label={t('login.email')}
              type="email"
              value={email}
              autoComplete="email"
              error={errors.email ? t(errors.email) : undefined}
              onChange={(event) => {
                setEmail(event.target.value)
                setNotice('')
                setErrors((current) => ({ ...current, email: undefined }))
              }}
            />
            <TextField
              id="register-password"
              name="password"
              label={t('login.password')}
              type="password"
              value={password}
              autoComplete="new-password"
              revealable
              hint={t('register.passwordHelp')}
              error={errors.password ? t(errors.password) : undefined}
              onChange={(event) => {
                setPassword(event.target.value)
                setNotice('')
                setErrors((current) => ({ ...current, password: undefined }))
              }}
            />
            <TextField
              id="register-confirm"
              name="confirmPassword"
              label={t('register.confirm')}
              type="password"
              value={confirmPassword}
              autoComplete="new-password"
              revealable
              error={errors.confirmPassword ? t(errors.confirmPassword) : undefined}
              onChange={(event) => {
                setConfirmPassword(event.target.value)
                setNotice('')
                setErrors((current) => ({ ...current, confirmPassword: undefined }))
              }}
            />
            <div className="auth-actions">
              <Button type="submit" disabled={submitting}>{t('register.submit')}</Button>
              {submitting ? <LoadingIndicator message={t('auth.working')} /> : null}
              {notice ? (
                <p className="auth-notice" role="alert">
                  {t(notice)}
                </p>
              ) : null}
            </div>
          </form>
        )}
        {success ? null : (
          <Link className="register-login" to="/login">
            {t('register.login')}
          </Link>
        )}
      </div>
    </main>
  )
}
