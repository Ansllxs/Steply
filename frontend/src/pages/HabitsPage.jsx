import { Link } from 'react-router-dom'
import PlaceholderPage from '../components/PlaceholderPage'

export default function HabitsPage() {
  return (
    <PlaceholderPage
      title="Hábitos"
      description="Listado de hábitos. El contenido todavía no está implementado."
    >
      <ul className="page-links">
        <li>
          <Link to="/habits/new">Nuevo hábito</Link>
        </li>
        <li>
          <Link to="/habits/1">Ejemplo: hábito 1</Link>
        </li>
      </ul>
    </PlaceholderPage>
  )
}
