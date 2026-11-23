import { useState } from 'react'
import backIcon from '../assets/back.svg'
import BottomNav from '../components/BottomNav'
import HabitCard from '../components/HabitCard'
import { calendarHabits, calendarStart, registeredDates } from '../data/habits'
import { usePreferences } from '../state/usePreferences'

const weekIds = ['l', 'm', 'x', 'j', 'v', 's', 'd']

function dateKey(year, month, day) {
  return `${year}-${String(month + 1).padStart(2, '0')}-${String(day).padStart(2, '0')}`
}

function buildCells(year, month) {
  const firstWeekday = new Date(year, month, 1).getDay()
  const leading = (firstWeekday + 6) % 7
  const count = new Date(year, month + 1, 0).getDate()
  const cells = Array.from({ length: leading }, () => null)

  for (let day = 1; day <= count; day += 1) {
    cells.push(day)
  }

  while (cells.length % 7 !== 0) {
    cells.push(null)
  }

  return cells
}

export default function CalendarPage() {
  const { t } = usePreferences()
  const [year, setYear] = useState(calendarStart.year)
  const [month, setMonth] = useState(calendarStart.month)
  const [day, setDay] = useState(calendarStart.day)
  const cells = buildCells(year, month)
  const selectedKey = dateKey(year, month, day)
  const habitsForDay = calendarHabits[selectedKey] ?? []
  const headingDate = new Date(year, month, day)

  function changeMonth(offset) {
    const next = new Date(year, month + offset, 1)
    const nextCount = new Date(next.getFullYear(), next.getMonth() + 1, 0).getDate()
    setYear(next.getFullYear())
    setMonth(next.getMonth())
    setDay(Math.min(day, nextCount))
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
          <div className="calendar-grid">
            {cells.map((value, index) => {
              if (!value) {
                return <span key={`empty-${index}`} />
              }

              const key = dateKey(year, month, value)
              const selected = value === day
              const registered = registeredDates.includes(key)
              const className = [
                'calendar-day',
                selected ? 'is-selected' : '',
                !selected && registered ? 'is-registered' : '',
              ]
                .filter(Boolean)
                .join(' ')

              return (
                <button
                  key={key}
                  type="button"
                  className={className}
                  aria-pressed={selected}
                  aria-label={t('calendar.day', { day: value, month: t(`month.${month}`) })}
                  onClick={() => setDay(value)}
                >
                  {value}
                </button>
              )
            })}
          </div>
        </section>
        <p className="calendar-legend">
          <span className="legend-swatch is-registered" aria-hidden="true" />
          {t('calendar.legendRecorded')}
          <span className="legend-swatch" aria-hidden="true" />
          {t('calendar.legendEmpty')}
        </p>
        <h2 className="sheet-section">
          {t('calendar.dayHabits', { weekday: t(`weekday.${headingDate.getDay()}`), day })}
        </h2>
        {habitsForDay.length ? (
          <ul className="habit-list calendar-habits">
            {habitsForDay.map((habit) => (
              <HabitCard key={habit.id} habit={habit} state={{ from: '/calendar' }} />
            ))}
          </ul>
        ) : (
          <p className="empty-note">{t('calendar.empty')}</p>
        )}
      </div>
      <BottomNav current="habits" />
    </main>
  )
}
