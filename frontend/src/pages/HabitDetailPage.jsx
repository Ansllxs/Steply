import { Link, useParams } from 'react-router-dom'
import PlaceholderPage from '../components/PlaceholderPage'

export default function HabitDetailPage() {
  const { id } = useParams()

  return (
    <PlaceholderPage
      title="Detalle del hábito"
      description={`Vista temporal del hábito ${id}.`}
    >
      <ul className="page-links">
        <li>
          <Link to={`/habits/${id}/check-in`}>Registrar check-in</Link>
        </li>
        <li>
          <Link to="/habits">Volver a hábitos</Link>
        </li>
      </ul>
    </PlaceholderPage>
  )
}
