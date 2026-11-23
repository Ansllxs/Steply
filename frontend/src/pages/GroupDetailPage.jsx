import { Link, useParams } from 'react-router-dom'
import backIcon from '../assets/back.svg'
import bunny from '../assets/saludo.png'
import Button from '../components/Button'
import HabitCard from '../components/HabitCard'
import { findGroup } from '../data/groups'

export default function GroupDetailPage() {
  const { id } = useParams()
  const group = findGroup(id)

  if (!group) {
    return (
      <main className="sheet">
        <div className="sheet-frame">
          <Link className="auth-back" to="/groups" aria-label="Volver">
            <img src={backIcon} alt="" width="22" height="22" />
          </Link>
          <p className="dashboard-kicker">DETALLE DEL GRUPO</p>
          <h1>Grupo no disponible</h1>
          <p className="dashboard-stats">Este grupo no está en los datos de ejemplo.</p>
        </div>
      </main>
    )
  }

  return (
    <main className="sheet group-detail">
      <div className="sheet-frame">
        <Link className="auth-back" to="/groups" aria-label="Volver">
          <img src={backIcon} alt="" width="22" height="22" />
        </Link>
        <p className="dashboard-kicker">DETALLE DEL GRUPO</p>
        <h1>{group.name}</h1>
        <p className="dashboard-stats">
          {group.members} {group.members === 1 ? 'integrante' : 'integrantes'}
        </p>
        <section className="motivation" aria-label="Mensaje de Steply">
          <div className="motivation-avatar">
            <img className="motivation-bunny" src={bunny} alt="" width="69" height="78" />
          </div>
          <div>
            <h2>Cada paso cuenta</h2>
            <p>
              Hábitos compartidos y
              <br />
              progreso en equipo.
            </p>
          </div>
        </section>
        <h2 className="sheet-section">Hábitos del grupo</h2>
        {group.habits.length ? (
          <ul className="habit-list">
            {group.habits.map((habit) => (
              <HabitCard key={habit.id} habit={habit} to={null} />
            ))}
          </ul>
        ) : (
          <p className="empty-note">Todavía no hay hábitos grupales.</p>
        )}
        <div className="group-detail-actions">
          <Button to={`/groups/${group.id}/ranking`}>Ver ranking</Button>
          {group.isAdmin ? (
            <Button variant="secondary" to={`/groups/${group.id}/manage`}>
              Gestionar hábitos del grupo
            </Button>
          ) : null}
        </div>
      </div>
    </main>
  )
}
