import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import backIcon from '../assets/back.svg'
import BottomNav from '../components/BottomNav'
import Button from '../components/Button'
import TextField from '../components/TextField'
import { validateProfileIdentity } from '../data/profile'
import { useProfile } from '../state/useProfile'

export default function EditProfilePage() {
  const navigate = useNavigate()
  const { profile, updateIdentity } = useProfile()
  const [name, setName] = useState(profile.name)
  const [username, setUsername] = useState(profile.username)
  const [errors, setErrors] = useState({})

  function handleSubmit(event) {
    event.preventDefault()
    const nextErrors = validateProfileIdentity(name, username)
    setErrors(nextErrors)

    if (Object.keys(nextErrors).length > 0) return

    updateIdentity({ name, username })
    navigate('/profile', { state: { savedLocally: true } })
  }

  return (
    <main className="dashboard edit-profile">
      <div className="dashboard-frame">
        <Link className="auth-back" to="/profile" aria-label="Volver">
          <img src={backIcon} alt="" width="22" height="22" />
        </Link>
        <h1>Editar perfil</h1>
        <p className="dashboard-stats">
          El nombre y el usuario se guardan solo en este dispositivo.
        </p>
        <form className="edit-profile-form" onSubmit={handleSubmit} noValidate>
          <TextField
            id="profile-name"
            name="name"
            label="Nombre"
            value={name}
            autoComplete="name"
            onChange={(event) => setName(event.target.value)}
            error={errors.name}
          />
          <TextField
            id="profile-username"
            name="username"
            label="Nombre de usuario"
            value={username}
            autoComplete="username"
            onChange={(event) => setUsername(event.target.value)}
            error={errors.username}
          />
          <div className="auth-actions">
            <Button type="submit">Guardar cambios</Button>
            <Button variant="secondary" to="/profile">
              Cancelar
            </Button>
          </div>
        </form>
      </div>
      <BottomNav current="Perfil" />
    </main>
  )
}
