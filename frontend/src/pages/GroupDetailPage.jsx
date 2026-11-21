import { Link, useParams } from 'react-router-dom'
import PlaceholderPage from '../components/PlaceholderPage'

export default function GroupDetailPage() {
  const { id } = useParams()

  return (
    <PlaceholderPage
      title="Detalle del grupo"
      description={`Vista temporal del grupo ${id}.`}
    >
      <ul className="page-links">
        <li>
          <Link to={`/groups/${id}/ranking`}>Ranking</Link>
        </li>
        <li>
          <Link to={`/groups/${id}/manage`}>Administrar</Link>
        </li>
        <li>
          <Link to="/groups">Volver a grupos</Link>
        </li>
      </ul>
    </PlaceholderPage>
  )
}
