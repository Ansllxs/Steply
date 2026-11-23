import { useEffect, useRef, useState } from 'react'
import { useLocation } from 'react-router-dom'
import flameIcon from '../assets/icon-flame.svg'
import imageIcon from '../assets/icon-image.svg'
import logoutIcon from '../assets/icon-logout.svg'
import pencilIcon from '../assets/icon-pencil.svg'
import starIcon from '../assets/icon-star.svg'
import BottomNav from '../components/BottomNav'
import Button from '../components/Button'
import DashboardHeader from '../components/DashboardHeader'
import HabitCard from '../components/HabitCard'
import ProfilePhotoEditor from '../components/ProfilePhotoEditor'
import {
  maxProfilePhotoBytes,
  profileActions,
  profilePhotoTypes,
} from '../data/profile'
import { translatePhrase } from '../i18n/phrases'
import { usePreferences } from '../state/usePreferences'
import { useProfile } from '../state/useProfile'
import { loadImage } from '../utils/cropImage'

export default function ProfilePage() {
  const { language, t } = usePreferences()
  const { profile, photoUrl, updatePhoto } = useProfile()
  const location = useLocation()
  const pendingUrlRef = useRef('')
  const [pendingUrl, setPendingUrl] = useState('')
  const [photoError, setPhotoError] = useState('')
  const [photoNotice, setPhotoNotice] = useState('')
  const [notice, setNotice] = useState('')

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
      setPhotoNotice('')
      return
    }

    if (file.size > maxProfilePhotoBytes) {
      setPhotoError('profile.photoSize')
      setPhotoNotice('')
      return
    }

    const url = URL.createObjectURL(file)

    try {
      await loadImage(url)
    } catch {
      URL.revokeObjectURL(url)
      setPhotoError('profile.photoRead')
      setPhotoNotice('')
      return
    }

    setPhotoError('')
    replacePendingUrl(url)
  }

  function handleAccept(blob) {
    updatePhoto(blob)
    setPhotoNotice('profile.photoReady')
    setPhotoError('')
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
              {photoUrl ? (
                <img className="is-preview" src={photoUrl} alt="" />
              ) : (
                <img src={imageIcon} alt="" width="28" height="28" />
              )}
            </label>
            <label className="profile-edit" htmlFor="profile-photo-input">
              <span className="visually-hidden">{t('profile.changePhoto')}</span>
              <img src={pencilIcon} alt="" width="16" height="16" />
            </label>
          </div>
          <div>
            <h1>{profile.name}</h1>
            <p className="profile-handle">@{profile.username}</p>
          </div>
        </section>
        {location.state?.savedLocally ? (
          <p className="auth-notice profile-save-note" role="status">
            {t('profile.savedLocally')}
          </p>
        ) : null}
        {photoError ? (
          <p className="field-error" role="alert">
            {t(photoError)}
          </p>
        ) : null}
        {photoNotice ? (
          <p className="profile-photo-status" role="status">
            {t(photoNotice)}
          </p>
        ) : null}
        {pendingUrl ? (
          <ProfilePhotoEditor
            imageUrl={pendingUrl}
            onCancel={closeEditor}
            onAccept={handleAccept}
          />
        ) : null}
        <div className="profile-stats">
          <article className="profile-stat">
            <span className="profile-stat-icon">
              <img src={flameIcon} alt="" width="18" height="18" />
            </span>
            <span>
              <strong>{translatePhrase(language, profile.streak)}</strong>
              <span>{t('profile.streakCaption')}</span>
            </span>
          </article>
          <article className="profile-stat">
            <span className="profile-stat-icon">
              <img src={starIcon} alt="" width="18" height="18" />
            </span>
            <span>
              <strong>{profile.points}</strong>
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
              onClick={
                action.notice
                  ? () => {
                      setNotice(action.notice)
                    }
                  : undefined
              }
            />
          ))}
        </ul>
        <div className="profile-logout">
          <Button
            variant="secondary"
            onClick={() => {
              setNotice('profile.logoutNotice')
            }}
          >
            <img src={logoutIcon} alt="" width="18" height="18" />
            {t('profile.logout')}
          </Button>
          {notice ? (
            <p className="auth-notice" role="status">
              {t(notice)}
            </p>
          ) : null}
        </div>
      </div>
      <BottomNav />
    </main>
  )
}
