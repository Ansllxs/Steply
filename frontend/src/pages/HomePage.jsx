import bunny from '../assets/corriendo.png'
import logo from '../assets/logo.png'
import Button from '../components/Button'
import { usePreferences } from '../state/usePreferences'

export default function HomePage() {
  const { t } = usePreferences()
  return (
    <main className="welcome">
      <div className="welcome-inner">
        <img
          className="welcome-logo"
          src={logo}
          alt="Steply"
          width="192"
          height="127"
        />
        <div className="welcome-hero">
          <span className="welcome-halo" aria-hidden="true" />
          <span className="welcome-dot welcome-dot-pink" aria-hidden="true" />
          <span className="welcome-dot welcome-dot-lilac" aria-hidden="true" />
          <img
            className="welcome-bunny"
            src={bunny}
            alt=""
            width="174"
            height="254"
          />
        </div>
        <p className="welcome-kicker">{t('welcome.kicker')}</p>
        <h1>
          {t('welcome.titleLine1')}
          <br />
          {t('welcome.titleLine2')}
        </h1>
        <p className="welcome-copy">
          {t('welcome.copyLine1')}
          <br />
          {t('welcome.copyLine2')}
        </p>
        <div className="welcome-actions">
          <Button to="/register">{t('welcome.start')}</Button>
          <Button to="/login" variant="secondary">
            {t('welcome.login')}
          </Button>
        </div>
      </div>
    </main>
  )
}
