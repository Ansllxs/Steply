import bunny from '../assets/corriendo.png'
import logo from '../assets/logo.png'
import Button from '../components/Button'

export default function HomePage() {
  return (
    <main className="welcome">
      <div className="welcome-inner">
        <img
          className="welcome-logo"
          src={logo}
          alt="Steply"
          width="192"
          height="127"
        />
        <div className="welcome-hero">
          <span className="welcome-halo" aria-hidden="true" />
          <span className="welcome-dot welcome-dot-pink" aria-hidden="true" />
          <span className="welcome-dot welcome-dot-lilac" aria-hidden="true" />
          <img
            className="welcome-bunny"
            src={bunny}
            alt=""
            width="174"
            height="254"
          />
        </div>
        <p className="welcome-kicker">ESTE ES TU PRIMER PASO</p>
        <h1>
          Pequeños pasos,
          <br />
          grandes cambios
        </h1>
        <p className="welcome-copy">
          Crea hábitos a tu ritmo y celebra
          <br />
          tu progreso con Steply.
        </p>
        <div className="welcome-actions">
          <Button to="/register">Comenzar</Button>
          <Button to="/login" variant="secondary">
            Ya tengo una cuenta
          </Button>
        </div>
      </div>
    </main>
  )
}
