import { useEffect, useRef, useState } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import flameIcon from '../assets/icon-flame.svg'
import imageIcon from '../assets/icon-image.svg'
import logoutIcon from '../assets/icon-logout.svg'
import pencilIcon from '../assets/icon-pencil.svg'
import starIcon from '../assets/icon-star.svg'
import AnimatedToast from '../components/AnimatedToast'
import BottomNav from '../components/BottomNav'
import Button from '../components/Button'
import DashboardHeader from '../components/DashboardHeader'
import HabitCard from '../components/HabitCard'
import LoadingIndicator from '../components/LoadingIndicator'
import MediaImage from '../components/MediaImage'
import ProfilePhotoEditor from '../components/ProfilePhotoEditor'
import {
  maxProfilePhotoBytes,
  profileActions,
  profilePhotoTypes,
} from '../data/profile'
import { uploadAvatar } from '../services/account'
import { habitErrorText, progressSummary } from '../services/habits'
import { useAuth } from '../state/useAuth'
import { usePreferences } from '../state/usePreferences'
import { loadImage } from '../utils/cropImage'

export default function ProfilePage() {
  const { t } = usePreferences()
  const { user, logout, updateUser } = useAuth()
  const location = useLocation()
  const navigate = useNavigate()
  const pendingUrlRef = useRef('')
  const [pendingUrl, setPendingUrl] = useState('')
  const [photoError, setPhotoError] = useState('')
  const [photoToast, setPhotoToast] = useState(0)
  const [toastVisible, setToastVisible] = useState(false)
  const [photoLoading, setPhotoLoading] = useState(false)
  const [summary, setSummary] = useState({ status: 'loading', error: '', data: null })

  useEffect(() => {
    let active = true
    progressSummary()
      .then((data) => {
        if (active) setSummary({ status: 'ready', error: '', data: data.resumen })
      })
      .catch((err) => {
        if (active) setSummary({ status: 'error', error: habitErrorText(err, t), data: null })
      })
    return () => {
      active = false
    }
  }, [t, location.key])

  useEffect(() => {
    return () => {
      if (pendingUrlRef.current) URL.revokeObjectURL(pendingUrlRef.current)
    }
  }, [])

  function replacePendingUrl(nextUrl) {
    if (pendingUrlRef.current) URL.revokeObjectURL(pendingUrlRef.current)
    pendingUrlRef.current = nextUrl
    setPendingUrl(nextUrl)
  }

  function closeEditor() {
    replacePendingUrl('')
    requestAnimationFrame(() => {
      document.getElementById('profile-photo-input')?.focus()
    })
  }

  async function handlePhoto(event) {
    const file = event.target.files?.[0]
    event.target.value = ''

    if (!file) return

    if (!profilePhotoTypes.includes(file.type)) {
      setPhotoError('profile.photoType')
      return
    }

    if (file.size > maxProfilePhotoBytes) {
      setPhotoError('profile.photoSize')
      return
    }

    const url = URL.createObjectURL(file)
    setPhotoLoading(true)
    setPhotoError('')

    try {
      await loadImage(url)
    } catch {
      URL.revokeObjectURL(url)
      setPhotoError('profile.photoRead')
      setPhotoLoading(false)
      return
    }

    setPhotoLoading(false)
    replacePendingUrl(url)
  }

  async function handleAccept(blob) {
    const file = new File([blob], 'perfil.jpg', { type: blob.type || 'image/jpeg' })
    const data = await uploadAvatar(file)
    updateUser(data.usuario)
    setPhotoError('')
    setPhotoToast((current) => current + 1)
    setToastVisible(true)
    closeEditor()
  }

  return (
    <main className="dashboard profile-page">
      <div className="dashboard-frame">
        <DashboardHeader label={t('profile.wordmark')} />
        <section className="profile-identity">
          <div className="profile-avatar">
            <input
              id="profile-photo-input"
              className="visually-hidden"
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handlePhoto}
            />
            <label id="profile-photo-trigger" htmlFor="profile-photo-input" className="profile-photo">
              <MediaImage
                key={user.fotoUrl || 'sin-foto'}
                src={user.fotoUrl}
                className="is-preview"
                fallback={<img src={imageIcon} alt="" width="28" height="28" />}
              />
            </label>
            <label className="profile-edit" htmlFor="profile-photo-input">
              <span className="visually-hidden">{t('profile.changePhoto')}</span>
              <img src={pencilIcon} alt="" width="16" height="16" />
            </label>
          </div>
          <div>
            <h1>{user.nombre}</h1>
            <p className="profile-handle">@{user.nombreUsuario}</p>
            <p className="profile-handle">{user.correo}</p>
          </div>
        </section>
        {location.state?.saved ? (
          <p className="auth-notice profile-save-note" role="status">
            {t('profile.saved')}
          </p>
        ) : null}
        {photoLoading && !pendingUrl ? <LoadingIndicator message={t('loading.image')} /> : null}
        {photoError ? (
          <p className="field-error" role="alert">
            {photoError.startsWith('profile.') ? t(photoError) : photoError}
          </p>
        ) : null}
        {pendingUrl ? (
          <ProfilePhotoEditor
            imageUrl={pendingUrl}
            onCancel={closeEditor}
            onAccept={handleAccept}
          />
        ) : null}
        {summary.error ? <p className="field-error" role="alert">{summary.error}</p> : null}
        <div className="profile-stats">
          <article className="profile-stat">
            <span className="profile-stat-icon">
              <img src={flameIcon} alt="" width="18" height="18" />
            </span>
            <span>
              <strong>{summary.data ? summary.data.rachaActual : '—'}</strong>
              <span>{t('profile.streakCaption')}</span>
            </span>
          </article>
          <article className="profile-stat">
            <span className="profile-stat-icon">
              <img src={starIcon} alt="" width="18" height="18" />
            </span>
            <span>
              <strong>{summary.data ? summary.data.puntosTotales : '—'}</strong>
              <span>{t('profile.pointsCaption')}</span>
            </span>
          </article>
        </div>
        <ul className="habit-list">
          {profileActions.map((action) => (
            <HabitCard
              key={action.id}
              habit={action}
              to={action.to ?? null}
            />
          ))}
        </ul>
        <div className="profile-logout">
          <Button
            variant="secondary"
            onClick={() => {
              logout()
              navigate('/login', { replace: true })
            }}
          >
            <img src={logoutIcon} alt="" width="18" height="18" />
            {t('profile.logout')}
          </Button>
        </div>
      </div>
      <BottomNav />
      <AnimatedToast
        floating
        open={toastVisible}
        token={photoToast}
        title={t('profile.photoUpdated')}
        subtitle={t('profile.photoReadyDetail')}
        onClose={() => setToastVisible(false)}
      />
    </main>
  )
}
