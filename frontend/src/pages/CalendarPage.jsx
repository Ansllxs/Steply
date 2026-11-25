import { useEffect, useState } from 'react'
import backIcon from '../assets/back.svg'
import BottomNav from '../components/BottomNav'
import Button from '../components/Button'
import HabitCard from '../components/HabitCard'
import LoadingIndicator from '../components/LoadingIndicator'
import { calendarCard, calendarDate, dateParts, habitErrorText, monthCalendar } from '../services/habits'
import { useAuth } from '../state/useAuth'
import { usePreferences } from '../state/usePreferences'

const weekIds = ['l', 'm', 'x', 'j', 'v', 's', 'd']

function dateKey(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function buildCells(year, month) {
  const first = new Date(Date.UTC(year, month, 1))
  const leading = (first.getUTCDay() + 6) % 7
  const count = new Date(Date.UTC(year, month + 1, 0)).getUTCDate()
  const cells = Array.from({ length: leading }, () => null)

  for (let day = 1; day <= count; day += 1) {
    cells.push(day)
  }

  while (cells.length % 7 !== 0) {
    cells.push(null)
  }

  return cells
}

function weekdayIndex(year, month, day) {
  return new Date(Date.UTC(year, month, day)).getUTCDay()
}

export default function CalendarPage() {
  const { t } = usePreferences()
  const { user } = useAuth()
  const today = dateParts(calendarDate(user.zonaHoraria || 'America/Costa_Rica'))
  const [year, setYear] = useState(today.year)
  const [month, setMonth] = useState(today.month)
  const [day, setDay] = useState(today.day)
  const [request, setRequest] = useState(0)
  const [result, setResult] = useState({ key: '', status: 'loading', error: '', days: [] })

  useEffect(() => {
    const key = `${year}-${month}-${request}`
    let active = true
    monthCalendar(year, month)
      .then((data) => {
        if (!active) return
        setResult({ key, status: 'ready', error: '', days: data.calendario?.dias ?? [] })
      })
      .catch((err) => {
        if (!active) return
        setResult({ key, status: 'error', error: habitErrorText(err, t), days: [] })
      })
    return () => {
      active = false
    }
  }, [year, month, request, t])

  const cells = buildCells(year, month)
  const selectedKey = dateKey(year, month, day)
  const selected = result.days.find((item) => item.fecha === selectedKey)
  const habitsForDay = (selected?.retos ?? []).map((item) => calendarCard(item, t))
  const recorded = new Set(result.days.filter((item) => item.conRegistro).map((item) => item.fecha))
  const viewKey = `${year}-${month}-${request}`
  const viewStatus = result.key === viewKey ? result.status : 'loading'

  function changeMonth(offset) {
    const next = new Date(Date.UTC(year, month + offset, 1))
    const nextCount = new Date(Date.UTC(next.getUTCFullYear(), next.getUTCMonth() + 1, 0)).getUTCDate()
    setYear(next.getUTCFullYear())
    setMonth(next.getUTCMonth())
    setDay((current) => Math.min(current, nextCount))
  }

  return (
    <main className="sheet">
      <div className="sheet-frame sheet-calendar">
        <p className="dashboard-kicker">{t('calendar.kicker')}</p>
        <h1>{t('calendar.title')}</h1>
        <p className="dashboard-stats">{t('calendar.lead')}</p>
        <section className="month-card" aria-label={t('calendar.region')}>
          <div className="month-header">
            <button
              type="button"
              className="auth-back"
              aria-label={t('calendar.previous')}
              onClick={() => changeMonth(-1)}
            >
              <img src={backIcon} alt="" width="22" height="22" />
            </button>
            <p className="month-title">
              {t(`month.${month}`)} {year}
            </p>
            <button
              type="button"
              className="auth-back month-next"
              aria-label={t('calendar.next')}
              onClick={() => changeMonth(1)}
            >
              <img src={backIcon} alt="" width="22" height="22" />
            </button>
          </div>
          <div className="calendar-week" aria-hidden="true">
            {weekIds.map((id) => (
              <span key={id}>{t(`weekday.short.${id}`)}</span>
            ))}
          </div>
          {viewStatus === 'loading' ? <LoadingIndicator /> : null}
          {viewStatus === 'error' ? (
            <div className="dashboard-actions">
              <p className="empty-note" role="alert">{result.error || t('calendar.loadError')}</p>
              <Button type="button" variant="secondary" onClick={() => setRequest((current) => current + 1)}>
                {t('calendar.retry')}
              </Button>
            </div>
          ) : null}
          {viewStatus === 'ready' ? (
            <div className="calendar-grid">
              {cells.map((value, index) => {
                if (!value) {
                  return <span key={`empty-${index}`} />
                }

                const key = dateKey(year, month, value)
                const isSelected = value === day
                const className = [
                  'calendar-day',
                  isSelected ? 'is-selected' : '',
                  !isSelected && recorded.has(key) ? 'is-registered' : '',
                ]
                  .filter(Boolean)
                  .join(' ')

                return (
                  <button
                    key={key}
                    type="button"
                    className={className}
                    aria-pressed={isSelected}
                    aria-label={t('calendar.day', { day: value, month: t(`month.${month}`) })}
                    onClick={() => setDay(value)}
                  >
                    {value}
                  </button>
                )
              })}
            </div>
          ) : null}
        </section>
        <p className="calendar-legend">
          <span className="legend-swatch is-registered" aria-hidden="true" />
          {t('calendar.legendRecorded')}
          <span className="legend-swatch" aria-hidden="true" />
          {t('calendar.legendEmpty')}
        </p>
        <h2 className="sheet-section">
          {t('calendar.dayHabits', { weekday: t(`weekday.${weekdayIndex(year, month, day)}`), day })}
        </h2>
        {viewStatus === 'ready' && habitsForDay.length ? (
          <ul className="habit-list calendar-habits">
            {habitsForDay.map((habit) => (
              <HabitCard key={habit.id} habit={habit} state={{ from: '/calendar' }} />
            ))}
          </ul>
        ) : null}
        {viewStatus === 'ready' && !habitsForDay.length ? (
          <p className="empty-note">{t('calendar.empty')}</p>
        ) : null}
      </div>
      <BottomNav current="habits" />
    </main>
  )
}
