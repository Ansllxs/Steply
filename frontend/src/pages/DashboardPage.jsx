import bunny from '../assets/saludo.png'
import BottomNav from '../components/BottomNav'
import Button from '../components/Button'
import DashboardHeader from '../components/DashboardHeader'
import HabitCard from '../components/HabitCard'
import { dashboardSummary, todayHabits } from '../data/dashboard'

export default function DashboardPage() {
  return (
    <main className="dashboard">
      <div className="dashboard-frame">
        <DashboardHeader />
        <p className="dashboard-kicker">TU RESUMEN</p>
        <h1>Hola, {dashboardSummary.name}</h1>
        <p className="dashboard-stats">{dashboardSummary.stats}</p>
        <section className="motivation" aria-label="Mensaje de Steply">
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
            <h2>{dashboardSummary.encouragementTitle}</h2>
            <p>
              {dashboardSummary.encouragementLines[0]}
              <br />
              {dashboardSummary.encouragementLines[1]}
            </p>
          </div>
        </section>
        <h2 className="dashboard-section">Mis hábitos de hoy</h2>
        <ul className="habit-list">
          {todayHabits.map((habit) => (
            <HabitCard key={habit.id} habit={habit} />
          ))}
        </ul>
        <div className="dashboard-actions">
          <Button to="/habits" variant="secondary">Ver todos mis hábitos</Button>
          <Button to="/habits/new">Crear hábito</Button>
          <Button to="/calendar" variant="outline">Ver calendario</Button>
        </div>
      </div>
      <BottomNav />
    </main>
  )
}
