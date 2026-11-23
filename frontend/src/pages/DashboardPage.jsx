import bunny from '../assets/saludo.png'
import BottomNav from '../components/BottomNav'
import Button from '../components/Button'
import DashboardHeader from '../components/DashboardHeader'
import HabitCard from '../components/HabitCard'
import { todayHabits } from '../data/dashboard'
import { useAuth } from '../state/useAuth'
import { usePreferences } from '../state/usePreferences'

export default function DashboardPage() {
  const { t } = usePreferences()
  const { user } = useAuth()
  return (
    <main className="dashboard">
      <div className="dashboard-frame">
        <DashboardHeader />
        <p className="dashboard-kicker">{t('dashboard.kicker')}</p>
        <h1>{t('dashboard.hello', { name: user.nombre })}</h1>
        <p className="dashboard-stats">{t('dashboard.stats')}</p>
        <section className="motivation" aria-label={t('common.steplyMessage')}>
          <div className="motivation-avatar">
            <img
              className="motivation-bunny"
              src={bunny}
              alt=""
              width="69"
              height="78"
            />
          </div>
          <div>
            <h2>{t('dashboard.encouragement')}</h2>
            <p>
              {t('dashboard.encouragementLine1')}
              <br />
              {t('dashboard.encouragementLine2')}
            </p>
          </div>
        </section>
        <h2 className="dashboard-section">{t('dashboard.today')}</h2>
        <ul className="habit-list">
          {todayHabits.map((habit) => (
            <HabitCard key={habit.id} habit={habit} state={{ from: '/dashboard' }} />
          ))}
        </ul>
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
