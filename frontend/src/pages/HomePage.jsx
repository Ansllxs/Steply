import { Link } from 'react-router-dom'
import PlaceholderPage from '../components/PlaceholderPage'

export default function HomePage() {
  return (
    <PlaceholderPage
      title="Inicio"
      description="Punto de entrada de Steply. Esta pantalla es un marcador de posición."
    >
      <ul className="page-links">
        <li>
          <Link to="/login">Ingresar</Link>
        </li>
        <li>
          <Link to="/register">Crear cuenta</Link>
        </li>
        <li>
          <Link to="/dashboard">Ir al panel</Link>
        </li>
      </ul>
    </PlaceholderPage>
  )
}
