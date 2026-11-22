import { useState } from 'react'
import BottomNav from '../components/BottomNav'
import Button from '../components/Button'
import DashboardHeader from '../components/DashboardHeader'
import HabitCard from '../components/HabitCard'
import { habitFilters, habits } from '../data/habits'

export default function HabitsPage() {
  const [filter, setFilter] = useState('all')
  const visibleHabits =
    filter === 'all' ? habits : habits.filter((habit) => habit.scope === filter)

  return (
    <main className="dashboard habits-page">
      <div className="dashboard-frame">
        <DashboardHeader />
        <p className="dashboard-kicker">TU RUTINA</p>
        <h1>Mis hábitos</h1>
        <p className="dashboard-stats">Hábitos personales y de tus grupos</p>
        <div className="habit-filters" role="group" aria-label="Filtrar hábitos">
          {habitFilters.map((item) => (
            <button
              key={item.id}
              type="button"
              className={
                filter === item.id ? 'habit-filter is-selected' : 'habit-filter'
              }
              aria-pressed={filter === item.id}
              onClick={() => setFilter(item.id)}
            >
              {item.label}
            </button>
          ))}
        </div>
        <ul className="habit-list">
          {visibleHabits.map((habit) => (
            <HabitCard key={habit.id} habit={habit} />
          ))}
        </ul>
        <div className="dashboard-actions">
          <Button to="/habits/new">Crear hábito</Button>
          <Button to="/calendar" variant="secondary">Ver calendario</Button>
        </div>
      </div>
      <BottomNav />
    </main>
  )
}
