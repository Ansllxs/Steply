import { useState } from 'react'
import { Link } from 'react-router-dom'
import backIcon from '../assets/back.svg'
import Button from '../components/Button'
import TextField from '../components/TextField'

const types = [
  { id: 'personal', label: 'Personal' },
  { id: 'group', label: 'Grupal' },
]

function validateHabit(name, frequency) {
  const errors = {}

  if (!name.trim()) {
    errors.name = 'Ingresa el nombre del hábito.'
  }

  if (!frequency.trim()) {
    errors.frequency = 'Ingresa la frecuencia.'
  }

  return errors
}

export default function CreateHabitPage() {
  const [name, setName] = useState('')
  const [type, setType] = useState('personal')
  const [frequency, setFrequency] = useState('')
  const [errors, setErrors] = useState({})
  const [notice, setNotice] = useState('')

  function handleSubmit(event) {
    event.preventDefault()
    const nextErrors = validateHabit(name, frequency)
    setErrors(nextErrors)

    if (Object.keys(nextErrors).length > 0) {
      setNotice('')
      return
    }

    setNotice(
      'Tu información se ve bien. Conectaremos el guardado del hábito cuando el servidor esté disponible.',
    )
  }

  return (
    <main className="create-habit">
      <div className="create-habit-frame">
        <Link className="auth-back" to="/habits" aria-label="Volver">
          <img src={backIcon} alt="" width="22" height="22" />
        </Link>
        <p className="dashboard-kicker">NUEVA RUTINA</p>
        <h1>Crear hábito</h1>
        <p className="dashboard-stats">Define un hábito personal o grupal.</p>
        <div className="create-habit-art" />
        <div className="create-habit-bunny" aria-hidden="true" />
        <form className="create-habit-form" onSubmit={handleSubmit} noValidate>
          <TextField
            id="habit-name"
            name="name"
            label="Nombre del hábito"
            value={name}
            placeholder="Leer"
            autoComplete="off"
            onChange={(event) => setName(event.target.value)}
            error={errors.name}
          />
          <fieldset className="type-field">
            <legend>Tipo</legend>
            <div className="type-options" role="radiogroup" aria-label="Tipo">
              {types.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={
                    type === item.id ? 'type-option is-selected' : 'type-option'
                  }
                  role="radio"
                  aria-checked={type === item.id}
                  onClick={() => setType(item.id)}
                >
                  {item.label}
                </button>
              ))}
            </div>
          </fieldset>
          <TextField
            id="habit-frequency"
            name="frequency"
            label="Frecuencia"
            value={frequency}
            placeholder="Diario"
            autoComplete="off"
            onChange={(event) => setFrequency(event.target.value)}
            error={errors.frequency}
          />
          <div className="create-habit-actions">
            <Button type="submit">Crear hábito</Button>
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
