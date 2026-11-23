import { useState } from 'react'
import BottomNav from '../components/BottomNav'
import Button from '../components/Button'
import DashboardHeader from '../components/DashboardHeader'
import HabitCard from '../components/HabitCard'
import { habits } from '../data/habits'
import { usePreferences } from '../state/usePreferences'

const filters = [
  { id: 'all', label: 'habits.all' },
  { id: 'personal', label: 'habits.personal' },
  { id: 'group', label: 'habits.group' },
]

export default function HabitsPage() {
  const { t } = usePreferences()
  const [filter, setFilter] = useState('all')
  const visibleHabits =
    filter === 'all' ? habits : habits.filter((habit) => habit.scope === filter)

  return (
    <main className="dashboard habits-page">
      <div className="dashboard-frame">
        <DashboardHeader />
        <p className="dashboard-kicker">{t('habits.kicker')}</p>
        <h1>{t('habits.title')}</h1>
        <p className="dashboard-stats">{t('habits.lead')}</p>
        <div className="habit-filters" role="group" aria-label={t('habits.filter')}>
          {filters.map((item) => (
            <button
              key={item.id}
              type="button"
              className={
                filter === item.id ? 'habit-filter is-selected' : 'habit-filter'
              }
              aria-pressed={filter === item.id}
              onClick={() => setFilter(item.id)}
            >
              {t(item.label)}
            </button>
          ))}
        </div>
        {visibleHabits.length ? (
          <ul className="habit-list">
            {visibleHabits.map((habit) => (
              <HabitCard key={habit.id} habit={habit} state={{ from: '/habits' }} />
            ))}
          </ul>
        ) : (
          <p className="empty-note">{t('habits.empty')}</p>
        )}
        <div className="dashboard-actions">
          <Button to="/habits/new">{t('habit.create')}</Button>
          <Button to="/calendar" variant="secondary">{t('habits.calendar')}</Button>
        </div>
      </div>
      <BottomNav />
    </main>
  )
}
