import { useState } from 'react'
import { Link } from 'react-router-dom'
import backIcon from '../assets/back.svg'
import bunny from '../assets/saludo.png'
import Button from '../components/Button'
import TextField from '../components/TextField'

export default function CreateGroupPage() {
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  function handleSubmit(event) {
    event.preventDefault()

    if (!name.trim()) {
      setError('Ingresa el nombre del grupo.')
      setNotice('')
      return
    }

    setError('')
    setNotice(
      'Tu información se ve bien. Conectaremos la creación del grupo cuando el servidor esté disponible.',
    )
  }

  return (
    <main className="sheet create-group">
      <div className="sheet-frame">
        <Link className="auth-back" to="/groups" aria-label="Volver">
          <img src={backIcon} alt="" width="22" height="22" />
        </Link>
        <p className="dashboard-kicker">NUEVO GRUPO</p>
        <h1>Crear grupo</h1>
        <p className="dashboard-stats">Empieza una rutina en equipo.</p>
        <div className="create-group-art">
          <img src={bunny} alt="" width="117" height="132" />
        </div>
        <form className="create-group-form" onSubmit={handleSubmit} noValidate>
          <TextField
            id="group-name"
            name="name"
            label="Nombre del grupo"
            value={name}
            placeholder="Compu squad"
            autoComplete="off"
            onChange={(event) => setName(event.target.value)}
            error={error}
          />
          <p className="create-group-help">Al crear el grupo, serás su administrador.</p>
          <div className="create-group-actions">
            <Button type="submit">Crear grupo</Button>
            <Button variant="secondary" to="/groups">
              Cancelar
            </Button>
            {notice ? (
              <p className="auth-notice" role="status">
                {notice}
              </p>
            ) : null}
          </div>
        </form>
      </div>
    </main>
  )
}
