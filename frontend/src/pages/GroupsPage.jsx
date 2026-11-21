import { Link } from 'react-router-dom'
import PlaceholderPage from '../components/PlaceholderPage'

export default function GroupsPage() {
  return (
    <PlaceholderPage
      title="Grupos"
      description="Listado de grupos. El contenido todavía no está implementado."
    >
      <ul className="page-links">
        <li>
          <Link to="/groups/new">Nuevo grupo</Link>
        </li>
        <li>
          <Link to="/groups/1">Ejemplo: grupo 1</Link>
        </li>
      </ul>
    </PlaceholderPage>
  )
}
