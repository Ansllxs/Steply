import { Link } from 'react-router-dom'
import PlaceholderPage from '../components/PlaceholderPage'

export default function LoginPage() {
  return (
    <PlaceholderPage
      title="Iniciar sesión"
      description="Inicio de sesión. La autenticación todavía no está implementada."
    >
      <ul className="page-links">
        <li>
          <Link to="/register">¿No tienes cuenta? Regístrate</Link>
        </li>
      </ul>
    </PlaceholderPage>
  )
}
