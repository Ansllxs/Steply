import { Link, useLocation, useParams } from 'react-router-dom'
import backIcon from '../assets/back.svg'
import cameraIcon from '../assets/icon-camera.svg'
import checkIcon from '../assets/icon-check.svg'
import Button from '../components/Button'
import { habitDetails, habits, weekDays } from '../data/habits'

export default function HabitDetailPage() {
  const { id } = useParams()
  const location = useLocation()
  const backTo = location.state?.from || '/habits'
  const habit = habits.find((item) => item.id === id)
  const detail = habitDetails[id]

  if (!habit || !detail) {
    return (
      <main className="sheet">
        <div className="sheet-frame">
          <Link className="auth-back" to="/habits" aria-label="Volver">
            <img src={backIcon} alt="" width="22" height="22" />
          </Link>
          <p className="dashboard-kicker">DETALLE DEL HÁBITO</p>
          <h1>Hábito no disponible</h1>
          <p className="dashboard-stats">
            Este hábito no está en los datos de ejemplo.
          </p>
        </div>
      </main>
    )
  }

  return (
    <main className="sheet">
      <div className="sheet-frame">
        <Link className="auth-back" to={backTo} aria-label="Volver">
          <img src={backIcon} alt="" width="22" height="22" />
        </Link>
        <p className="dashboard-kicker">DETALLE DEL HÁBITO</p>
        <h1>{habit.title}</h1>
        <p className="dashboard-stats">{detail.subtitle}</p>
        <h2 className="sheet-section">Progreso de la semana</h2>
        <ol className="week-progress">
          {weekDays.map((day, index) => {
            const done = detail.week[index]
            return (
              <li key={day.id}>
                <span
                  className={done ? 'week-mark is-done' : 'week-mark'}
                  role="img"
                  aria-label={done ? `${day.name} completado` : `${day.name} pendiente`}
                >
                  {done ? <img src={checkIcon} alt="" width="18" height="18" /> : null}
                </span>
                <span className="week-label">{day.label}</span>
              </li>
            )
          })}
        </ol>
        <div className="stat-grid">
          <article className="stat-card">
            <p className="stat-value">{detail.streak}</p>
            <p className="stat-label">Racha actual</p>
          </article>
          <article className="stat-card">
            <p className="stat-value">{detail.points}</p>
            <p className="stat-label">Puntos totales</p>
          </article>
        </div>
        <h2 className="sheet-section sheet-section-evidence">Evidencias</h2>
        <button type="button" className="evidence-link">
          <img src={cameraIcon} alt="" width="24" height="24" />
          <span>Fotos de registros anteriores</span>
        </button>
        <div className="sheet-submit">
          <Button to={`/habits/${habit.id}/check-in`} state={location.state}>
            Registrar cumplimiento
          </Button>
        </div>
      </div>
    </main>
  )
}
