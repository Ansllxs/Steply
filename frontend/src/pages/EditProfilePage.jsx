import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import backIcon from '../assets/back.svg'
import BottomNav from '../components/BottomNav'
import Button from '../components/Button'
import TextField from '../components/TextField'
import { USERNAME_MAX_LENGTH, validateProfileIdentity } from '../data/profile'
import { updateProfile } from '../services/account'
import { habitErrorText } from '../services/habits'
import { useAuth } from '../state/useAuth'
import { usePreferences } from '../state/usePreferences'

export default function EditProfilePage() {
  const navigate = useNavigate()
  const { t } = usePreferences()
  const { user, updateUser } = useAuth()
  const [name, setName] = useState(user.nombre)
  const [username, setUsername] = useState(user.nombreUsuario)
  const [errors, setErrors] = useState({})
  const [formError, setFormError] = useState('')
  const [saving, setSaving] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    if (saving) return

    const nextErrors = validateProfileIdentity(name, username)
    setErrors(nextErrors)
    setFormError('')
    if (Object.keys(nextErrors).length > 0) return

    setSaving(true)
    try {
      const data = await updateProfile({
        nombre: name.trim(),
        nombreUsuario: username.trim(),
      })
      updateUser(data.usuario)
      navigate('/profile', { state: { saved: true } })
    } catch (err) {
      const field = err?.detalles?.errores?.find((item) => item.campo === 'nombreUsuario' || item.campo === 'nombre')
      if (field?.campo === 'nombreUsuario') {
        setErrors({ username: field.mensaje })
      } else if (field?.campo === 'nombre') {
        setErrors({ name: field.mensaje })
      } else {
        setFormError(habitErrorText(err, t))
      }
    } finally {
      setSaving(false)
    }
  }

  return (
    <main className="dashboard edit-profile">
      <div className="dashboard-frame">
        <Link className="auth-back" to="/profile" aria-label={t('common.back')}>
          <img src={backIcon} alt="" width="22" height="22" />
        </Link>
        <h1>{t('edit.title')}</h1>
        <p className="dashboard-stats">{t('edit.lead')}</p>
        <form className="edit-profile-form" onSubmit={handleSubmit} noValidate>
          <TextField
            id="profile-name"
            name="name"
            label={t('register.name')}
            value={name}
            autoComplete="name"
            disabled={saving}
            onChange={(event) => setName(event.target.value)}
            error={errors.name ? (errors.name.startsWith('validation.') ? t(errors.name) : errors.name) : undefined}
          />
          <TextField
            id="profile-username"
            name="username"
            label={t('edit.username')}
            value={username}
            autoComplete="username"
            disabled={saving}
            onChange={(event) => setUsername(event.target.value)}
            error={
              errors.username
                ? errors.username.startsWith('validation.')
                  ? t(errors.username, { max: USERNAME_MAX_LENGTH })
                  : errors.username
                : undefined
            }
          />
          {formError ? (
            <p className="field-error" role="alert">
              {formError}
            </p>
          ) : null}
          <div className="auth-actions">
            <Button type="submit" disabled={saving}>
              {saving ? t('edit.saving') : t('edit.save')}
            </Button>
            <Button variant="secondary" to="/profile">
              {t('common.cancel')}
            </Button>
          </div>
        </form>
      </div>
      <BottomNav current="profile" />
    </main>
  )
}
