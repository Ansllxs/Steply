import { Link, useParams } from 'react-router-dom'
import PlaceholderPage from '../components/PlaceholderPage'

export default function GroupManagePage() {
  const { id } = useParams()

  return (
    <PlaceholderPage
      title="Administrar grupo"
      description={`Administración temporal del grupo ${id}.`}
    >
      <ul className="page-links">
        <li>
          <Link to={`/groups/${id}`}>Volver al grupo</Link>
        </li>
      </ul>
    </PlaceholderPage>
  )
}
