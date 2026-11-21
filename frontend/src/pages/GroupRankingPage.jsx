import { Link, useParams } from 'react-router-dom'
import PlaceholderPage from '../components/PlaceholderPage'

export default function GroupRankingPage() {
  const { id } = useParams()

  return (
    <PlaceholderPage
      title="Ranking del grupo"
      description={`Ranking temporal del grupo ${id}.`}
    >
      <ul className="page-links">
        <li>
          <Link to={`/groups/${id}`}>Volver al grupo</Link>
        </li>
      </ul>
    </PlaceholderPage>
  )
}
