import { useState } from 'react'
import { Link } from 'react-router-dom'
import backIcon from '../assets/back.svg'
import BottomNav from '../components/BottomNav'
import Button from '../components/Button'
import TextField from '../components/TextField'
import { changePassword } from '../services/account'
import { habitErrorText } from '../services/habits'
import { useAuth } from '../state/useAuth'
import { usePreferences } from '../state/usePreferences'

const languages = [
  { id: 'es', label: 'settings.spanish' },
  { id: 'en', label: 'settings.english' },
]

const themes = [
  { id: 'light', label: 'settings.light' },
  { id: 'dark', label: 'settings.dark' },
  { id: 'system', label: 'settings.system' },
]

const notificationItems = [
  { id: 'habits', title: 'settings.habitsReminder', help: 'settings.habitsReminderHelp' },
  { id: 'groups', title: 'settings.groupActivity', help: 'settings.groupActivityHelp' },
  { id: 'achievements', title: 'settings.achievements', help: 'settings.achievementsHelp' },
]

export default function SettingsPage() {
  const { user } = useAuth()
  const { language, theme, notifications, setLanguage, setTheme, setNotification, t } =
    usePreferences()
  const [currentPassword, setCurrentPassword] = useState('')
  const [nextPassword, setNextPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordError, setPasswordError] = useState('')
  const [passwordNotice, setPasswordNotice] = useState('')
  const [savingPassword, setSavingPassword] = useState(false)

  async function handlePassword(event) {
    event.preventDefault()
    if (savingPassword) return
    setPasswordNotice('')

    if (!currentPassword) {
      setPasswordError(t('validation.passwordRequired'))
      return
    }
    if (nextPassword.length < 8) {
      setPasswordError(t('validation.passwordShort'))
      return
    }
    if (nextPassword !== confirmPassword) {
      setPasswordError(t('validation.passwordMismatch'))
      return
    }

    setSavingPassword(true)
    setPasswordError('')
    try {
      await changePassword({ actual: currentPassword, nueva: nextPassword })
      setCurrentPassword('')
      setNextPassword('')
      setConfirmPassword('')
      setPasswordNotice(t('settings.passwordSaved'))
    } catch (err) {
      setPasswordError(habitErrorText(err, t))
    } finally {
      setSavingPassword(false)
    }
  }

  return (
    <main className="dashboard settings-page">
      <div className="dashboard-frame">
        <Link className="auth-back" to="/profile" aria-label={t('common.back')}>
          <img src={backIcon} alt="" width="22" height="22" />
        </Link>
        <p className="dashboard-kicker">{t('settings.kicker')}</p>
        <h1>{t('settings.title')}</h1>
        <p className="dashboard-stats">{t('settings.lead')}</p>

        <section className="settings-section" aria-labelledby="settings-language">
          <h2 id="settings-language">{t('settings.language')}</h2>
          <p>{t('settings.languageHelp')}</p>
          <div className="settings-choices" role="radiogroup" aria-labelledby="settings-language">
            {languages.map((item) => (
              <button
                key={item.id}
                type="button"
                className={language === item.id ? 'type-option is-selected' : 'type-option'}
                role="radio"
                aria-checked={language === item.id}
                onClick={() => setLanguage(item.id)}
              >
                {t(item.label)}
              </button>
            ))}
          </div>
        </section>

        <section className="settings-section" aria-labelledby="settings-appearance">
          <h2 id="settings-appearance">{t('settings.appearance')}</h2>
          <p>{t('settings.appearanceHelp')}</p>
          <div className="settings-choices" role="radiogroup" aria-labelledby="settings-appearance">
            {themes.map((item) => (
              <button
                key={item.id}
                type="button"
                className={theme === item.id ? 'type-option is-selected' : 'type-option'}
                role="radio"
                aria-checked={theme === item.id}
                onClick={() => setTheme(item.id)}
              >
                {t(item.label)}
              </button>
            ))}
          </div>
        </section>

        <section className="settings-section" aria-labelledby="settings-notifications">
          <h2 id="settings-notifications">{t('settings.notifications')}</h2>
          <p>{t('settings.notificationsHelp')}</p>
          <div className="settings-switches">
            {notificationItems.map((item) => {
              const enabled = notifications[item.id]
              return (
                <button
                  key={item.id}
                  type="button"
                  className={enabled ? 'settings-switch is-on' : 'settings-switch'}
                  role="switch"
                  aria-checked={enabled}
                  onClick={() => setNotification(item.id, !enabled)}
                >
                  <span>
                    <span className="settings-switch-title">{t(item.title)}</span>
                    <span className="settings-switch-help">{t(item.help)}</span>
                  </span>
                  <span className="settings-switch-track" aria-hidden="true" />
                </button>
              )
            })}
          </div>
        </section>

        <section className="settings-section" aria-labelledby="settings-email">
          <h2 id="settings-email">{t('settings.email')}</h2>
          <p className="settings-email">{user.correo}</p>
          <p>{t('settings.emailHelp')}</p>
        </section>

        <section className="settings-section" aria-labelledby="settings-security">
          <h2 id="settings-security">{t('settings.security')}</h2>
          <div className="settings-security">
            <h3>{t('settings.password')}</h3>
            <p>{t('settings.passwordHelp')}</p>
            <form className="settings-password" onSubmit={handlePassword} noValidate>
              <TextField
                id="password-current"
                name="current-password"
                type="password"
                label={t('settings.passwordCurrent')}
                value={currentPassword}
                autoComplete="current-password"
                revealable
                disabled={savingPassword}
                onChange={(event) => setCurrentPassword(event.target.value)}
              />
              <TextField
                id="password-new"
                name="new-password"
                type="password"
                label={t('settings.passwordNew')}
                value={nextPassword}
                autoComplete="new-password"
                revealable
                disabled={savingPassword}
                onChange={(event) => setNextPassword(event.target.value)}
              />
              <TextField
                id="password-confirm"
                name="confirm-password"
                type="password"
                label={t('settings.passwordConfirm')}
                value={confirmPassword}
                autoComplete="new-password"
                revealable
                disabled={savingPassword}
                onChange={(event) => setConfirmPassword(event.target.value)}
              />
              {passwordError ? (
                <p className="field-error" role="alert">
                  {passwordError}
                </p>
              ) : null}
              {passwordNotice ? (
                <p className="auth-notice" role="status">
                  {passwordNotice}
                </p>
              ) : null}
              <Button type="submit" disabled={savingPassword}>
                {savingPassword ? t('settings.passwordSaving') : t('settings.passwordSave')}
              </Button>
            </form>
          </div>
        </section>
      </div>
      <BottomNav current="profile" />
    </main>
  )
}
