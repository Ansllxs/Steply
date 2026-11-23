import { useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import backIcon from '../assets/back.svg'
import Button from '../components/Button'
import { checkInDateLabel, habitDetails, habits } from '../data/habits'

const choices = [
  { id: 'yes', label: 'Sí, lo completé' },
  { id: 'no', label: 'No lo completé' },
]

export default function CheckInPage() {
  const { id } = useParams()
  const habit = habits.find((item) => item.id === id)
  const detail = habitDetails[id]
  const [choice, setChoice] = useState('')
  const [fileName, setFileName] = useState('')
  const [fileError, setFileError] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  if (!habit || !detail) {
    return (
      <main className="sheet">
        <div className="sheet-frame">
          <Link className="auth-back" to="/habits" aria-label="Volver">
            <img src={backIcon} alt="" width="22" height="22" />
          </Link>
          <p className="dashboard-kicker">CUMPLIMIENTO</p>
          <h1>Hábito no disponible</h1>
        </div>
      </main>
    )
  }

  function handleFile(event) {
    const file = event.target.files?.[0]

    if (!file) {
      setFileName('')
      setFileError('')
      return
    }

    if (!file.type.startsWith('image/')) {
      setFileName('')
      setFileError('Elige una imagen.')
      event.target.value = ''
      return
    }

    setFileError('')
    setFileName(file.name)
  }

  function handleSubmit(event) {
    event.preventDefault()

    if (!choice) {
      setError('Elige una opción.')
      setNotice('')
      return
    }

    setError('')
    setNotice(
      'Tu información se ve bien. Conectaremos el guardado del registro cuando el servidor esté disponible.',
    )
  }

  const statusLabels = {
    yes: 'Seleccionado · Completado',
    no: 'Seleccionado · Sin completar',
  }
  const status = error || (choice ? statusLabels[choice] : 'Elige una opción.')

  return (
    <main className="sheet">
      <div className="sheet-frame">
        <Link className="auth-back" to={`/habits/${habit.id}`} aria-label="Volver">
          <img src={backIcon} alt="" width="22" height="22" />
        </Link>
        <p className="dashboard-kicker">CUMPLIMIENTO</p>
        <h1>Registro de hoy</h1>
        <p className="dashboard-stats">
          {habit.title} · {checkInDateLabel}
        </p>
        <h2 className="sheet-section sheet-question">¿Completaste tu hábito?</h2>
        <div className="check-halo" aria-hidden="true" />
        <form className="check-form" onSubmit={handleSubmit} noValidate>
          <div className="choice-group" role="group" aria-label="Cumplimiento">
            {choices.map((item) => {
              const selected = choice === item.id
              const className = [
                'choice',
                item.id === 'yes' ? 'choice-yes' : 'choice-no',
                selected ? 'is-selected' : '',
              ]
                .filter(Boolean)
                .join(' ')

              return (
                <button
                  key={item.id}
                  type="button"
                  className={className}
                  aria-pressed={selected}
                  onClick={() => {
                    setChoice(item.id)
                    setError('')
                  }}
                >
                  {item.label}
                </button>
              )
            })}
            <p
              className={error ? 'choice-status is-alert' : 'choice-status'}
              role={error ? 'alert' : undefined}
            >
              {status}
            </p>
          </div>
          <div className="evidence-upload">
            <input
              id="evidence-file"
              className="file-input"
              type="file"
              accept="image/*"
              onChange={handleFile}
            />
            <label className="btn btn-outline" htmlFor="evidence-file">
              + Agregar evidencia (opcional)
            </label>
            {fileName ? <p className="file-name">{fileName}</p> : null}
            {fileError ? (
              <p className="file-name is-alert" role="alert">
                {fileError}
              </p>
            ) : null}
          </div>
          <div className="check-save">
            <Button type="submit">Guardar registro</Button>
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
