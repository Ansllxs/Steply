import { useEffect, useState } from 'react'
import { useLocation } from 'react-router-dom'
import searchIcon from '../assets/icon-search.svg'
import BottomNav from '../components/BottomNav'
import Button from '../components/Button'
import DashboardHeader from '../components/DashboardHeader'
import HabitCard from '../components/HabitCard'
import LoadingIndicator from '../components/LoadingIndicator'
import { habitCardFromParticipation, habitErrorText, listHabits } from '../services/habits'
import { usePreferences } from '../state/usePreferences'

const filters = [
  { id: 'all', label: 'habits.all' },
  { id: 'personal', label: 'habits.personal' },
  { id: 'group', label: 'habits.group' },
]

export default function HabitsPage() {
  const { t } = usePreferences()
  const location = useLocation()
  const [filter, setFilter] = useState('all')
  const [query, setQuery] = useState('')
  const [request, setRequest] = useState(0)
  const [result, setResult] = useState({ request: -1, habits: [], error: '' })

  useEffect(() => {
    let active = true
    listHabits()
      .then((data) => {
        if (!active) return
        setResult({
          request,
          habits: (data.retos ?? []).map((row) => habitCardFromParticipation(row, t)),
          error: '',
        })
      })
      .catch((err) => {
        if (!active) return
        setResult({ request, habits: [], error: habitErrorText(err, t) })
      })
    return () => {
      active = false
    }
  }, [request, location.key, t])

  const status = result.request === request ? (result.error ? 'error' : 'ready') : 'loading'
  const habits = result.habits
  const error = result.error
  const normalizedQuery = query.trim().toLocaleLowerCase()
  const visibleHabits = habits.filter((habit) => {
    if (filter !== 'all' && habit.scope !== filter) return false
    if (!normalizedQuery) return true
    return habit.title.toLocaleLowerCase().includes(normalizedQuery)
  })

  return (
    <main className="dashboard habits-page">
      <div className="dashboard-frame">
        <DashboardHeader />
        <p className="dashboard-kicker">{t('habits.kicker')}</p>
        <h1>{t('habits.title')}</h1>
        <p className="dashboard-stats">{t('habits.lead')}</p>
        <div className="group-search">
          <label htmlFor="habit-search">{t('habits.search')}</label>
          <div className="group-search-field">
            <img src={searchIcon} alt="" width="22" height="22" />
            <input
              id="habit-search"
              type="search"
              value={query}
              placeholder={t('habits.searchPlaceholder')}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
        </div>
        <div className="habit-filters" role="group" aria-label={t('habits.filter')}>
          {filters.map((item) => (
            <button
              key={item.id}
              type="button"
              className={filter === item.id ? 'habit-filter is-selected' : 'habit-filter'}
              aria-pressed={filter === item.id}
              onClick={() => setFilter(item.id)}
            >
              {t(item.label)}
            </button>
          ))}
        </div>
        {status === 'loading' ? <LoadingIndicator /> : null}
        {status === 'error' ? (
          <div className="dashboard-actions">
            <p className="empty-note" role="alert">{error || t('habits.loadError')}</p>
            <Button type="button" variant="secondary" onClick={() => setRequest((current) => current + 1)}>{t('habits.retry')}</Button>
          </div>
        ) : null}
        {status === 'ready' && visibleHabits.length ? (
          <ul className="habit-list">
            {visibleHabits.map((habit) => (
              <HabitCard key={habit.id} habit={habit} state={{ from: '/habits' }} />
            ))}
          </ul>
        ) : null}
        {status === 'ready' && !visibleHabits.length ? (
          <p className="empty-note">
            {normalizedQuery ? t('habits.searchEmpty') : t('habits.empty')}
          </p>
        ) : null}
        <div className="dashboard-actions">
          <Button to="/habits/new">{t('habit.create')}</Button>
          <Button to="/calendar" variant="secondary">{t('habits.calendar')}</Button>
        </div>
      </div>
      <BottomNav />
    </main>
  )
}
