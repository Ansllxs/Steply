import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import backIcon from '../assets/back.svg'
import BottomNav from '../components/BottomNav'
import Button from '../components/Button'
import TextField from '../components/TextField'
import { USERNAME_MAX_LENGTH, validateProfileIdentity } from '../data/profile'
import { usePreferences } from '../state/usePreferences'
import { useProfile } from '../state/useProfile'

export default function EditProfilePage() {
  const navigate = useNavigate()
  const { t } = usePreferences()
  const { profile, updateIdentity } = useProfile()
  const [name, setName] = useState(profile.name)
  const [username, setUsername] = useState(profile.username)
  const [errors, setErrors] = useState({})

  function handleSubmit(event) {
    event.preventDefault()
    const nextErrors = validateProfileIdentity(name, username)
    setErrors(nextErrors)

    if (Object.keys(nextErrors).length > 0) return

    updateIdentity({ name, username })
    navigate('/profile', { state: { savedLocally: true } })
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
            onChange={(event) => setName(event.target.value)}
            error={errors.name ? t(errors.name) : undefined}
          />
          <TextField
            id="profile-username"
            name="username"
            label={t('edit.username')}
            value={username}
            autoComplete="username"
            onChange={(event) => setUsername(event.target.value)}
            error={
              errors.username
                ? t(errors.username, { max: USERNAME_MAX_LENGTH })
                : undefined
            }
          />
          <div className="auth-actions">
            <Button type="submit">{t('edit.save')}</Button>
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
