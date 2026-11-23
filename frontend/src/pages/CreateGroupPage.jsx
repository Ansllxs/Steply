import { useState } from 'react'
import { Link } from 'react-router-dom'
import backIcon from '../assets/back.svg'
import bunny from '../assets/saludo.png'
import Button from '../components/Button'
import TextField from '../components/TextField'
import { usePreferences } from '../state/usePreferences'

export default function CreateGroupPage() {
  const { t } = usePreferences()
  const [name, setName] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')

  function handleSubmit(event) {
    event.preventDefault()

    if (!name.trim()) {
      setError('validation.groupName')
      setNotice('')
      return
    }

    setError('')
    setNotice('groupCreate.notice')
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
            onChange={(event) => setName(event.target.value)}
            error={error ? t(error) : undefined}
          />
          <p className="create-group-help">{t('groupCreate.help')}</p>
          <div className="create-group-actions">
            <Button type="submit">{t('groupCreate.submit')}</Button>
            <Button variant="secondary" to="/groups">
              {t('common.cancel')}
            </Button>
            {notice ? (
              <p className="auth-notice" role="status">
                {t(notice)}
              </p>
            ) : null}
          </div>
        </form>
      </div>
    </main>
  )
}
