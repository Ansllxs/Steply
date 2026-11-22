import { useState } from 'react'
import { Link } from 'react-router-dom'
import backIcon from '../assets/back.svg'
import bunny from '../assets/corriendo.png'
import logo from '../assets/logo.png'
import Button from '../components/Button'
import TextField from '../components/TextField'

const emailPattern = /^[^\s@]+@[^\s@]+\.[^\s@]+$/

function validateRegistration(name, email, password) {
  const errors = {}

  if (!name.trim()) {
    errors.name = 'Ingresa tu nombre.'
  }

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

export default function RegisterPage() {
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

    setNotice(
      'Tu información se ve bien. Conectaremos el registro cuando el servidor esté disponible.',
    )
  }

  return (
    <main className="auth register">
      <div className="auth-frame">
        <Link className="auth-back" to="/" aria-label="Volver">
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
        <h1>Crea tu cuenta</h1>
        <p className="auth-lead">Empieza con un pequeño paso.</p>
        <form className="auth-form" onSubmit={handleSubmit} noValidate>
          <TextField
            id="register-name"
            name="name"
            label="Nombre"
            value={name}
            placeholder="Angie"
            autoComplete="name"
            error={errors.name}
            onChange={(event) => {
              setName(event.target.value)
              setNotice('')
              setErrors((current) => ({ ...current, name: undefined }))
            }}
          />
          <TextField
            id="register-email"
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
            id="register-password"
            name="password"
            label="Contraseña"
            type="password"
            value={password}
            placeholder="••••••••"
            autoComplete="new-password"
            error={errors.password}
            onChange={(event) => {
              setPassword(event.target.value)
              setNotice('')
              setErrors((current) => ({ ...current, password: undefined }))
            }}
          />
          <div className="auth-actions">
            <Button type="submit">Registrarme</Button>
            {notice ? (
              <p className="auth-notice" role="status">
                {notice}
              </p>
            ) : null}
          </div>
        </form>
        <Link className="register-login" to="/login">
          Ya tengo cuenta · Iniciar sesión
        </Link>
      </div>
    </main>
  )
}
