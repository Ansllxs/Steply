import { Link } from 'react-router-dom'
import backIcon from '../assets/back.svg'
import BottomNav from '../components/BottomNav'
import { useProfile } from '../state/useProfile'
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
  const { profile } = useProfile()
  const { language, theme, notifications, setLanguage, setTheme, setNotification, t } =
    usePreferences()

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
          <p className="settings-email">{profile.email}</p>
          <p>{t('settings.emailHelp')}</p>
        </section>

        <section className="settings-section" aria-labelledby="settings-security">
          <h2 id="settings-security">{t('settings.security')}</h2>
          <div className="settings-security">
            <h3>{t('settings.password')}</h3>
            <p>{t('settings.passwordHelp')}</p>
          </div>
        </section>
      </div>
      <BottomNav current="profile" />
    </main>
  )
}
