import { useState } from 'react'
import { Link } from 'react-router-dom'
import backIcon from '../assets/back.svg'
import logo from '../assets/logo.png'
import Button from '../components/Button'
import TextField from '../components/TextField'

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function validateLogin(email, password) {
  const errors = {}

  if (!email.trim()) {
    errors.email = 'Ingresa tu correo.'
  } else if (!emailPattern.test(email.trim())) {
    errors.email = 'Ingresa un correo válido.'
  }

  if (!password) {
    errors.password = 'Ingresa tu contraseña.'
  }

  return errors
}

export default function LoginPage() {
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

    setNotice(
      'Tu información se ve bien. Conectaremos el inicio de sesión cuando el servidor esté disponible.',
    )
  }

  return (
    <main className="auth">
      <div className="auth-frame">
        <Link className="auth-back" to="/" aria-label="Volver">
          <img src={backIcon} alt="" width="22" height="22" />
        </Link>
        <img
          className="auth-logo"
          src={logo}
          alt="Steply"
          width="179"
          height="119"
        />
        <h1>¡Hola!</h1>
        <p className="auth-lead">Qué bueno verte de nuevo.</p>
        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <TextField
            id="login-email"
            name="email"
            label="Correo"
            type="email"
            value={email}
            placeholder="angie@ejemplo.com"
            autoComplete="email"
            error={errors.email}
            onChange={(event) => {
              setEmail(event.target.value)
              setNotice('')
              setErrors((current) => ({ ...current, email: undefined }))
            }}
          />
          <TextField
            id="login-password"
            name="password"
            label="Contraseña"
            type="password"
            value={password}
            placeholder="••••••••"
            autoComplete="current-password"
            error={errors.password}
            onChange={(event) => {
              setPassword(event.target.value)
              setNotice('')
              setErrors((current) => ({ ...current, password: undefined }))
            }}
          />
          <div className="auth-actions">
            <Button type="submit">Iniciar sesión</Button>
            {notice ? (
              <p className="auth-notice" role="status">
                {notice}
              </p>
            ) : null}
            <Button to="/register" variant="secondary">
              Crear una cuenta
            </Button>
          </div>
        </form>
      </div>
    </main>
  )
}
