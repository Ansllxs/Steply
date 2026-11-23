import { useState } from 'react'
import { Link } from 'react-router-dom'
import backIcon from '../assets/back.svg'
import bunny from '../assets/corriendo.png'
import logo from '../assets/logo.png'
import Button from '../components/Button'
import TextField from '../components/TextField'
import { usePreferences } from '../state/usePreferences'

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function validateRegistration(name, email, password) {
  const errors = {}

  if (!name.trim()) {
    errors.name = 'validation.nameRequired'
  }

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

export default function RegisterPage() {
  const { t } = usePreferences()
  const [name, setName] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [errors, setErrors] = useState({})
  const [notice, setNotice] = useState('')

  function handleSubmit(event) {
    event.preventDefault()
    const nextErrors = validateRegistration(name, email, password)
    setErrors(nextErrors)

    if (Object.keys(nextErrors).length > 0) {
      setNotice('')
      return
    }

    setNotice('register.notice')
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
        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <TextField
            id="register-name"
            name="name"
            label={t('register.name')}
            value={name}
            placeholder="Angie"
            autoComplete="name"
            error={errors.name ? t(errors.name) : undefined}
            onChange={(event) => {
              setName(event.target.value)
              setNotice('')
              setErrors((current) => ({ ...current, name: undefined }))
            }}
          />
          <TextField
            id="register-email"
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
            id="register-password"
            name="password"
            label={t('login.password')}
            type="password"
            value={password}
            placeholder="••••••••"
            autoComplete="new-password"
            error={errors.password ? t(errors.password) : undefined}
            onChange={(event) => {
              setPassword(event.target.value)
              setNotice('')
              setErrors((current) => ({ ...current, password: undefined }))
            }}
          />
          <div className="auth-actions">
            <Button type="submit">{t('register.submit')}</Button>
            {notice ? (
              <p className="auth-notice" role="status">
                {t(notice)}
              </p>
            ) : null}
          </div>
        </form>
        <Link className="register-login" to="/login">
          {t('register.login')}
        </Link>
      </div>
    </main>
  )
}
