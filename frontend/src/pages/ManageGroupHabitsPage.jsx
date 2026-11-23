import { Link, useParams } from 'react-router-dom'
import backIcon from '../assets/back.svg'
import Button from '../components/Button'
import HabitCard from '../components/HabitCard'
import { findGroup } from '../data/groups'

export default function ManageGroupHabitsPage() {
  const { id } = useParams()
  const group = findGroup(id)

  if (!group) {
    return (
      <main className="sheet">
        <div className="sheet-frame">
          <Link className="auth-back" to="/groups" aria-label="Volver">
            <img src={backIcon} alt="" width="22" height="22" />
          </Link>
          <p className="dashboard-kicker">ADMINISTRACIÓN</p>
          <h1>Gestionar hábitos</h1>
          <p className="dashboard-stats">Este grupo no está en los datos de ejemplo.</p>
        </div>
      </main>
    )
  }

  if (!group.isAdmin) {
    return (
      <main className="sheet">
        <div className="sheet-frame">
          <Link className="auth-back" to={`/groups/${group.id}`} aria-label="Volver">
            <img src={backIcon} alt="" width="22" height="22" />
          </Link>
          <p className="dashboard-kicker">ADMINISTRACIÓN</p>
          <h1>Gestionar hábitos</h1>
          <p className="dashboard-stats">
            Solo el administrador puede gestionar los hábitos de {group.name}.
          </p>
          <div className="group-manage-actions">
            <Button to={`/groups/${group.id}`}>Volver al grupo</Button>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="sheet group-manage">
      <div className="sheet-frame">
        <Link className="auth-back" to={`/groups/${group.id}`} aria-label="Volver">
          <img src={backIcon} alt="" width="22" height="22" />
        </Link>
        <p className="dashboard-kicker">ADMINISTRACIÓN</p>
        <h1>Gestionar hábitos</h1>
        <p className="dashboard-stats">{group.name} · Administrador del grupo</p>
        <h2 className="sheet-section">Hábitos grupales</h2>
        {group.habits.length ? (
          <ul className="habit-list">
            {group.habits.map((habit) => (
              <HabitCard
                key={habit.id}
                habit={{ ...habit, status: 'Hábito grupal' }}
                to={`/habits/${habit.id}`}
                state={{ from: `/groups/${group.id}/manage` }}
              />
            ))}
          </ul>
        ) : (
          <p className="empty-note">Todavía no hay hábitos grupales.</p>
        )}
        <div className="group-manage-actions">
          <Button
            to={`/habits/new?grupo=${group.id}`}
            state={{ from: `/groups/${group.id}/manage` }}
          >
            Agregar hábito grupal
          </Button>
          <Button variant="secondary" to={`/groups/${group.id}`}>
            Volver al grupo
          </Button>
        </div>
      </div>
    </main>
  )
}
