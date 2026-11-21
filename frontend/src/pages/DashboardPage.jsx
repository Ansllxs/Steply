import { Link } from 'react-router-dom'
import PlaceholderPage from '../components/PlaceholderPage'

export default function DashboardPage() {
  return (
    <PlaceholderPage
      title="Panel"
      description="Resumen personal. El contenido todavía no está implementado."
    >
      <ul className="page-links">
        <li>
          <Link to="/habits">Hábitos</Link>
        </li>
        <li>
          <Link to="/calendar">Calendario</Link>
        </li>
        <li>
          <Link to="/groups">Grupos</Link>
        </li>
      </ul>
    </PlaceholderPage>
  )
}
