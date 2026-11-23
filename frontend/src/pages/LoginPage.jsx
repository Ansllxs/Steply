import { useState } from 'react'
import { Link } from 'react-router-dom'
import backIcon from '../assets/back.svg'
import logo from '../assets/logo.png'
import Button from '../components/Button'
import TextField from '../components/TextField'
import { usePreferences } from '../state/usePreferences'

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function validateLogin(email, password) {
  const errors = {}

  if (!email.trim()) {
    errors.email = 'validation.emailRequired'
  } else if (!emailPattern.test(email.trim())) {
    errors.email = 'validation.emailInvalid'
  }

  if (!password) {
    errors.password = 'validation.passwordRequired'
  }

  return errors
}

export default function LoginPage() {
  const { t } = usePreferences()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState({})
  const [notice, setNotice] = useState('')

  function handleSubmit(event) {
    event.preventDefault()
    const nextErrors = validateLogin(email, password)
    setErrors(nextErrors)

    if (Object.keys(nextErrors).length > 0) {
      setNotice('')
      return
    }

    setNotice('login.notice')
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
        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <TextField
            id="login-email"
            name="email"
            label={t('login.email')}
            type="email"
            value={email}
            placeholder="angie@ejemplo.com"
            autoComplete="email"
            error={errors.email ? t(errors.email) : undefined}
            onChange={(event) => {
              setEmail(event.target.value)
              setNotice('')
              setErrors((current) => ({ ...current, email: undefined }))
            }}
          />
          <TextField
            id="login-password"
            name="password"
            label={t('login.password')}
            type="password"
            value={password}
            placeholder="••••••••"
            autoComplete="current-password"
            error={errors.password ? t(errors.password) : undefined}
            onChange={(event) => {
              setPassword(event.target.value)
              setNotice('')
              setErrors((current) => ({ ...current, password: undefined }))
            }}
          />
          <div className="auth-actions">
            <Button type="submit">{t('login.submit')}</Button>
            {notice ? (
              <p className="auth-notice" role="status">
                {t(notice)}
              </p>
            ) : null}
            <Button to="/register" variant="secondary">
              {t('login.create')}
            </Button>
          </div>
        </form>
      </div>
    </main>
  )
}
