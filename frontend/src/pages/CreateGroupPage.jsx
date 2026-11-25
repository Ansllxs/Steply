import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import backIcon from '../assets/back.svg'
import bunny from '../assets/saludo.png'
import Button from '../components/Button'
import TextField from '../components/TextField'
import { habitErrorText } from '../services/habits'
import { createGroup } from '../services/social'
import { usePreferences } from '../state/usePreferences'

export default function CreateGroupPage() {
  const { t } = usePreferences()
  const navigate = useNavigate()
  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [submitting, setSubmitting] = useState(false)

  async function handleSubmit(event) {
    event.preventDefault()
    if (submitting) return
    const trimmed = name.trim()
    if (!trimmed) {
      setError('validation.groupName')
      setNotice('')
      return
    }
    if (trimmed.length > 80) {
      setError('validation.nameLength')
      setNotice('')
      return
    }

    setSubmitting(true)
    setError('')
    setNotice('')
    try {
      const data = await createGroup({
        nombre: trimmed,
        descripcion: description.trim() || null,
      })
      setNotice('groupCreate.created')
      navigate(`/groups/${data.grupo.id}`, { replace: true })
    } catch (err) {
      setNotice(habitErrorText(err, t))
      setSubmitting(false)
    }
  }

  return (
    <main className="sheet create-group">
      <div className="sheet-frame">
        <Link className="auth-back" to="/groups" aria-label={t('common.back')}>
          <img src={backIcon} alt="" width="22" height="22" />
        </Link>
        <p className="dashboard-kicker">{t('groupCreate.kicker')}</p>
        <h1>{t('groupCreate.title')}</h1>
        <p className="dashboard-stats">{t('groupCreate.lead')}</p>
        <div className="create-group-art">
          <img src={bunny} alt="" width="117" height="132" />
        </div>
        <form className="create-group-form" onSubmit={handleSubmit} noValidate>
          <TextField
            id="group-name"
            name="name"
            label={t('groupCreate.name')}
            value={name}
            placeholder="Compu squad"
            autoComplete="off"
            disabled={submitting}
            onChange={(event) => setName(event.target.value)}
            error={error ? t(error) : undefined}
          />
          <TextField
            id="group-description"
            name="description"
            label={t('groupCreate.description')}
            value={description}
            autoComplete="off"
            disabled={submitting}
            onChange={(event) => setDescription(event.target.value)}
          />
          <p className="create-group-help">{t('groupCreate.help')}</p>
          <div className="create-group-actions">
            <Button type="submit" disabled={submitting}>
              {submitting ? t('groupCreate.creating') : t('groupCreate.submit')}
            </Button>
            <Button variant="secondary" to="/groups">
              {t('common.cancel')}
            </Button>
            {notice ? (
              <p className={notice === 'groupCreate.created' ? 'auth-notice' : 'field-error'} role={notice === 'groupCreate.created' ? 'status' : 'alert'}>
                {notice.startsWith('groupCreate.') ? t(notice) : notice}
              </p>
            ) : null}
          </div>
        </form>
      </div>
    </main>
  )
}
