import { Link, useParams } from 'react-router-dom'
import PlaceholderPage from '../components/PlaceholderPage'

export default function HabitCheckInPage() {
  const { id } = useParams()

  return (
    <PlaceholderPage
      title="Check-in"
      description={`Registro temporal del hábito ${id}.`}
    >
      <ul className="page-links">
        <li>
          <Link to={`/habits/${id}`}>Volver al hábito</Link>
        </li>
      </ul>
    </PlaceholderPage>
  )
}
