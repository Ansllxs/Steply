import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import bunny from '../assets/saludo.png'
import BottomNav from '../components/BottomNav'
import Button from '../components/Button'
import DashboardHeader from '../components/DashboardHeader'
import HabitCard from '../components/HabitCard'
import LoadingIndicator from '../components/LoadingIndicator'
import { habitCardFromToday, habitErrorText, progressSummary, todayProgress } from '../services/habits'
import { useAuth } from '../state/useAuth'
import { usePreferences } from '../state/usePreferences'

function encouragement(habits, due, t) {
  if (habits.length === 0) return t('dashboard.noHabits')
  if (due.length === 0) return t('dashboard.noneToday')
  const pending = due.filter((item) => item.estadoHoy === 'PENDIENTE' || item.estadoHoy === 'RECHAZADO').length
  if (pending === 0) return t('dashboard.pendingNone')
  if (pending === 1) return t('dashboard.pendingOne')
  return t('dashboard.pendingMany', { count: pending })
}

export default function DashboardPage() {
  const { t } = usePreferences()
  const { user } = useAuth()
  const location = useLocation()
  const [result, setResult] = useState({ ready: false, error: '', summary: null, habits: [] })

  useEffect(() => {
    let active = true
    Promise.all([todayProgress(), progressSummary()])
      .then(([today, summaryData]) => {
        if (!active) return
        setResult({
          ready: true,
          error: '',
          summary: summaryData.resumen,
          habits: today.hoy ?? [],
        })
      })
      .catch((err) => {
        if (!active) return
        setResult({ ready: true, error: habitErrorText(err, t), summary: null, habits: [] })
      })
    return () => {
      active = false
    }
  }, [location.key, t])

  const status = result.ready ? (result.error ? 'error' : 'ready') : 'loading'
  const error = result.error
  const summary = result.summary
  const habits = result.habits

  const due = habits.filter((item) => item.estadoHoy !== 'NO_PROGRAMADO')
  const scheduled = due.filter((item) => item.estadoHoy !== 'PAUSADO')
  const completed = scheduled.filter((item) => item.estadoHoy === 'COMPLETADO').length
  const percent = scheduled.length ? Math.round((completed / scheduled.length) * 100) : 0

  return (
    <main className="dashboard">
      <div className="dashboard-frame">
        <DashboardHeader />
        <p className="dashboard-kicker">{t('dashboard.kicker')}</p>
        <h1>{t('dashboard.hello', { name: user.nombre })}</h1>
        {status === 'loading' ? <LoadingIndicator /> : null}
        {status === 'error' ? <p className="empty-note" role="alert">{error}</p> : null}
        {status === 'ready' && summary ? (
          <>
            <p className="dashboard-stats">
              {t(summary.rachaActual === 1 ? 'dashboard.statsOne' : 'dashboard.stats', { streak: summary.rachaActual, points: summary.puntosTotales })}
            </p>
            {scheduled.length ? (
              <p className="dashboard-stats">
                {t('dashboard.completion', { done: completed, total: scheduled.length, percent })}
              </p>
            ) : null}
            <section className="motivation" aria-label={t('common.steplyMessage')}>
              <div className="motivation-avatar">
                <img className="motivation-bunny" src={bunny} alt="" width="69" height="78" />
              </div>
              <div>
                <h2>{t('dashboard.encouragement')}</h2>
                <p>{encouragement(habits, due, t)}</p>
              </div>
            </section>
            <h2 className="dashboard-section">{t('dashboard.today')}</h2>
            {due.length ? (
              <ul className="habit-list">
                {due.map((item) => (
                  <HabitCard
                    key={item.reto.id}
                    habit={habitCardFromToday(item, t)}
                    state={{ from: '/dashboard' }}
                  />
                ))}
              </ul>
            ) : (
              <p className="empty-note">
                {habits.length === 0 ? t('dashboard.noHabits') : t('dashboard.noneToday')}
              </p>
            )}
          </>
        ) : null}
        <div className="dashboard-actions">
          <Button to="/habits" variant="secondary">{t('dashboard.allHabits')}</Button>
          <Button to="/habits/new">{t('dashboard.createHabit')}</Button>
          <Button to="/calendar" variant="outline">{t('dashboard.calendar')}</Button>
        </div>
      </div>
      <BottomNav />
    </main>
  )
}
