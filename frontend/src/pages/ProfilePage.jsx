import { useEffect, useState } from 'react'
import flameIcon from '../assets/icon-flame.svg'
import imageIcon from '../assets/icon-image.svg'
import logoutIcon from '../assets/icon-logout.svg'
import pencilIcon from '../assets/icon-pencil.svg'
import starIcon from '../assets/icon-star.svg'
import BottomNav from '../components/BottomNav'
import Button from '../components/Button'
import DashboardHeader from '../components/DashboardHeader'
import HabitCard from '../components/HabitCard'
import {
  logoutNotice,
  maxProfilePhotoBytes,
  profile,
  profileActions,
} from '../data/profile'

export default function ProfilePage() {
  const [photoUrl, setPhotoUrl] = useState('')
  const [photoError, setPhotoError] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    return () => {
      if (photoUrl) URL.revokeObjectURL(photoUrl)
    }
  }, [photoUrl])

  function handlePhoto(event) {
    const file = event.target.files?.[0]

    if (!file) return

    if (!file.type.startsWith('image/')) {
      setPhotoError('Elige una imagen.')
      event.target.value = ''
      return
    }

    if (file.size > maxProfilePhotoBytes) {
      setPhotoError('La imagen debe pesar 5 MB o menos.')
      event.target.value = ''
      return
    }

    setPhotoError('')
    setPhotoUrl((current) => {
      if (current) URL.revokeObjectURL(current)
      return URL.createObjectURL(file)
    })
  }

  return (
    <main className="dashboard profile-page">
      <div className="dashboard-frame">
        <DashboardHeader label="PERFIL" />
        <section className="profile-identity">
          <div className="profile-avatar">
            <div className="profile-photo">
              {photoUrl ? (
                <img className="is-preview" src={photoUrl} alt="" />
              ) : (
                <img src={imageIcon} alt="" width="28" height="28" />
              )}
            </div>
            <label className="profile-edit">
              <span className="visually-hidden">Cambiar foto de perfil</span>
              <input
                type="file"
                accept="image/*"
                onChange={handlePhoto}
              />
              <img src={pencilIcon} alt="" width="16" height="16" />
            </label>
          </div>
          <div>
            <h1>{profile.name}</h1>
            <p className="profile-handle">@{profile.username}</p>
          </div>
        </section>
        {photoError ? (
          <p className="field-error" role="alert">
            {photoError}
          </p>
        ) : null}
        <div className="profile-stats">
          <article className="profile-stat">
            <span className="profile-stat-icon">
              <img src={flameIcon} alt="" width="18" height="18" />
            </span>
            <span>
              <strong>{profile.streak}</strong>
              <span>{profile.streakCaption}</span>
            </span>
          </article>
          <article className="profile-stat">
            <span className="profile-stat-icon">
              <img src={starIcon} alt="" width="18" height="18" />
            </span>
            <span>
              <strong>{profile.points}</strong>
              <span>{profile.pointsCaption}</span>
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
              setNotice(logoutNotice)
            }}
          >
            <img src={logoutIcon} alt="" width="18" height="18" />
            Cerrar sesión
          </Button>
          {notice ? (
            <p className="auth-notice" role="status">
              {notice}
            </p>
          ) : null}
        </div>
      </div>
      <BottomNav />
    </main>
  )
}
