import { Link, useLocation, useParams } from 'react-router-dom'
import backIcon from '../assets/back.svg'
import cameraIcon from '../assets/icon-camera.svg'
import checkIcon from '../assets/icon-check.svg'
import Button from '../components/Button'
import { habitDetails, habits, weekDays } from '../data/habits'
import { translatePhrase } from '../i18n/phrases'
import { usePreferences } from '../state/usePreferences'

export default function HabitDetailPage() {
  const { language, t } = usePreferences()
  const { id } = useParams()
  const location = useLocation()
  const backTo = location.state?.from || '/habits'
  const habit = habits.find((item) => item.id === id)
  const detail = habitDetails[id]

  if (!habit || !detail) {
    return (
      <main className="sheet">
        <div className="sheet-frame">
          <Link className="auth-back" to="/habits" aria-label={t('common.back')}>
            <img src={backIcon} alt="" width="22" height="22" />
          </Link>
          <p className="dashboard-kicker">{t('detail.kicker')}</p>
          <h1>{t('detail.missing')}</h1>
          <p className="dashboard-stats">{t('detail.missingLead')}</p>
        </div>
      </main>
    )
  }

  return (
    <main className="sheet">
      <div className="sheet-frame">
        <Link className="auth-back" to={backTo} aria-label={t('common.back')}>
          <img src={backIcon} alt="" width="22" height="22" />
        </Link>
        <p className="dashboard-kicker">{t('detail.kicker')}</p>
        <h1>{habit.title}</h1>
        <p className="dashboard-stats">{translatePhrase(language, detail.subtitle)}</p>
        <h2 className="sheet-section">{t('detail.week')}</h2>
        <ol className="week-progress">
          {weekDays.map((day, index) => {
            const done = detail.week[index]
            return (
              <li key={day.id}>
                <span
                  className={done ? 'week-mark is-done' : 'week-mark'}
                  role="img"
                  aria-label={
                    done
                      ? t('detail.done', { day: t(`weekday.${day.id}`) })
                      : t('detail.pending', { day: t(`weekday.${day.id}`) })
                  }
                >
                  {done ? <img src={checkIcon} alt="" width="18" height="18" /> : null}
                </span>
                <span className="week-label">{t(`weekday.short.${day.id}`)}</span>
              </li>
            )
          })}
        </ol>
        <div className="stat-grid">
          <article className="stat-card">
            <p className="stat-value">{translatePhrase(language, detail.streak)}</p>
            <p className="stat-label">{t('detail.streak')}</p>
          </article>
          <article className="stat-card">
            <p className="stat-value">{detail.points}</p>
            <p className="stat-label">{t('detail.points')}</p>
          </article>
        </div>
        <h2 className="sheet-section sheet-section-evidence">{t('detail.evidence')}</h2>
        <button type="button" className="evidence-link">
          <img src={cameraIcon} alt="" width="24" height="24" />
          <span>{t('detail.photos')}</span>
        </button>
        <div className="sheet-submit">
          <Button to={`/habits/${habit.id}/check-in`} state={location.state}>
            {t('detail.checkIn')}
          </Button>
        </div>
      </div>
    </main>
  )
}
