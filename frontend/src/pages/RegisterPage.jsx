import { Link } from 'react-router-dom'
import PlaceholderPage from '../components/PlaceholderPage'

export default function RegisterPage() {
  return (
    <PlaceholderPage
      title="Registro"
      description="Creación de cuenta. La autenticación todavía no está implementada."
    >
      <ul className="page-links">
        <li>
          <Link to="/login">¿Ya tienes cuenta? Ingresa</Link>
        </li>
      </ul>
    </PlaceholderPage>
  )
}
