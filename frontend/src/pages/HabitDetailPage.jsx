import { useEffect, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import backIcon from '../assets/back.svg'
import cameraIcon from '../assets/icon-camera.svg'
import checkIcon from '../assets/icon-check.svg'
import Button from '../components/Button'
import LoadingIndicator from '../components/LoadingIndicator'
import MediaImage from '../components/MediaImage'
import TextField from '../components/TextField'
import {
  calendarDate,
  deleteHabit,
  durationText,
  formatCalendarDate,
  frequencyText,
  getHabit,
  habitErrorText,
  habitHistory,
  isHabitId,
  recordDate,
  updateHabit,
  weekMarks,
} from '../services/habits'
import { displayMediaUrl } from '../services/media'
import { useAuth } from '../state/useAuth'
import { usePreferences } from '../state/usePreferences'

export default function HabitDetailPage() {
  const { t, language } = usePreferences()
  const { user } = useAuth()
  const { id } = useParams()
  const location = useLocation()
  const navigate = useNavigate()
  const backTo = location.state?.from || '/habits'
  const [result, setResult] = useState({ id: '', status: 'loading', error: '', habit: null, records: [] })
  const [editing, setEditing] = useState(false)
  const [name, setName] = useState('')
  const [editError, setEditError] = useState('')
  const [notice, setNotice] = useState('')
  const [busy, setBusy] = useState('')

  useEffect(() => {
    if (!isHabitId(id)) return undefined

    let active = true
    Promise.all([getHabit(id), habitHistory(id)])
      .then(([data, history]) => {
        if (!active) return
        setResult({
          id,
          status: 'ready',
          error: '',
          habit: data.reto,
          records: history.historial ?? [],
        })
        setName(data.reto.nombre)
      })
      .catch((err) => {
        if (!active) return
        if (err?.status === 404 || err?.codigo === 'NO_ENCONTRADO' || err?.codigo === 'VALIDACION') {
          setResult({ id, status: 'missing', error: '', habit: null, records: [] })
          return
        }
        setResult({ id, status: 'error', error: habitErrorText(err, t), habit: null, records: [] })
      })
    return () => {
      active = false
    }
  }, [id, location.key, t])

  const status = !isHabitId(id) ? 'missing' : result.id === id ? result.status : 'loading'
  const error = result.error
  const habit = result.id === id ? result.habit : null
  const records = result.id === id ? result.records : []

  if (status === 'loading') {
    return (
      <main className="sheet">
        <div className="sheet-frame">
          <Link className="auth-back" to={backTo} aria-label={t('common.back')}>
            <img src={backIcon} alt="" width="22" height="22" />
          </Link>
          <LoadingIndicator />
        </div>
      </main>
    )
  }

  if (status !== 'ready' || !habit) {
    return (
      <main className="sheet">
        <div className="sheet-frame">
          <Link className="auth-back" to="/habits" aria-label={t('common.back')}>
            <img src={backIcon} alt="" width="22" height="22" />
          </Link>
          <p className="dashboard-kicker">{t('detail.kicker')}</p>
          <h1>{t('detail.missing')}</h1>
          <p className="dashboard-stats" role={status === 'error' ? 'alert' : undefined}>
            {status === 'error' ? error : t('detail.missingLead')}
          </p>
        </div>
      </main>
    )
  }

  const mine = habit.participantes?.find((item) => item.usuarioId === user.id || item.usuario?.id === user.id)
  const canManage = habit.creadorId === user.id || habit.creador?.id === user.id
  const today = calendarDate(user.zonaHoraria || 'America/Costa_Rica')
  const days = weekMarks(records, today)
  const photos = records.flatMap((record) => record.evidencias ?? []).slice(0, 5)
  const scopeLabel = habit.tipo === 'GRUPAL'
    ? (habit.grupo?.nombre || t('habit.groupType'))
    : t('habit.personal')
  const summary = `${frequencyText(habit, t)} · ${scopeLabel}${habit.meta ? ` · ${habit.meta}` : ''}`
  const start = recordDate(habit.fechaInicio)
  const end = recordDate(habit.fechaFin)
  const paused = mine?.estado === 'PAUSADO'
  const statusKey = habit.estado === 'FINALIZADO'
    ? 'detail.statusFinished'
    : paused
      ? 'detail.statusPaused'
      : end && today > end
        ? 'detail.statusEnded'
        : 'detail.statusActive'

  async function handleSave(event) {
    event.preventDefault()
    if (busy) return
    const trimmed = name.trim()
    if (!trimmed) {
      setEditError('validation.habitName')
      setNotice('')
      return
    }
    if (trimmed.length > 80) {
      setEditError('validation.nameLength')
      setNotice('')
      return
    }

    setBusy('save')
    setEditError('')
    setNotice('')
    try {
      const data = await updateHabit(habit.id, { nombre: trimmed })
      setResult((current) => ({ ...current, habit: { ...current.habit, ...data.reto, participantes: current.habit.participantes } }))
      setName(data.reto.nombre)
      setEditing(false)
      setNotice('detail.saved')
    } catch (err) {
      setEditError(habitErrorText(err, t))
    } finally {
      setBusy('')
    }
  }

  async function handleDelete() {
    if (busy) return
    if (!window.confirm(t('detail.deleteConfirm'))) return
    setBusy('delete')
    setNotice('')
    try {
      await deleteHabit(habit.id)
      navigate('/habits', { replace: true })
    } catch (err) {
      setNotice(habitErrorText(err, t))
      setBusy('')
    }
  }

  return (
    <main className="sheet">
      <div className="sheet-frame">
        <Link className="auth-back" to={backTo} aria-label={t('common.back')}>
          <img src={backIcon} alt="" width="22" height="22" />
        </Link>
        <p className="dashboard-kicker">{t('detail.kicker')}</p>
        <h1>{habit.nombre}</h1>
        <p className="dashboard-stats">{summary}</p>
        <p className="dashboard-stats">
          {start ? `${t('detail.starts', { date: formatCalendarDate(start, language) })} · ` : ''}
          {durationText(habit, t, language)}
          {` · ${t(statusKey)}`}
        </p>
        {habit.descripcion ? <p className="dashboard-stats">{habit.descripcion}</p> : null}
        <h2 className="sheet-section">{t('detail.week')}</h2>
        <p className="dashboard-stats">{t('detail.weekNote')}</p>
        <ol className="week-progress">
          {days.map((day) => (
            <li key={day.id}>
              <span
                className={day.done ? 'week-mark is-done' : 'week-mark'}
                role="img"
                aria-label={
                  day.done
                    ? t('detail.done', { day: t(`weekday.${day.id}`) })
                    : t('detail.pending', { day: t(`weekday.${day.id}`) })
                }
              >
                {day.done ? <img src={checkIcon} alt="" width="18" height="18" /> : null}
              </span>
              <span className="week-label">{t(`weekday.short.${day.id}`)}</span>
            </li>
          ))}
        </ol>
        <div className="stat-grid">
          <article className="stat-card">
            <p className="stat-value">{mine ? mine.rachaActual : '—'}</p>
            <p className="stat-label">{t('detail.streak')}</p>
          </article>
          <article className="stat-card">
            <p className="stat-value">{mine ? mine.puntos : '—'}</p>
            <p className="stat-label">{t('detail.points')}</p>
          </article>
        </div>
        <h2 className="sheet-section sheet-section-evidence">{t('detail.evidence')}</h2>
        <Link className="evidence-link" to={`/habits/${habit.id}/check-in`} state={location.state}>
          <img src={cameraIcon} alt="" width="24" height="24" />
          <span>{t('detail.photos')}</span>
        </Link>
        {photos.map((photo) => (
          <figure className="evidence-preview" key={photo.id}>
            <MediaImage src={displayMediaUrl(photo.url, photo.publicId)} />
          </figure>
        ))}
        {editing ? (
          <form className="create-habit-form" onSubmit={handleSave} noValidate>
            <TextField
              id="habit-edit-name"
              name="name"
              label={t('habit.name')}
              value={name}
              disabled={Boolean(busy)}
              onChange={(event) => setName(event.target.value)}
              error={editError ? (editError.startsWith('validation.') ? t(editError) : editError) : undefined}
            />
            <div className="dashboard-actions">
              <Button type="submit" disabled={Boolean(busy)}>
                {busy === 'save' ? t('detail.saving') : t('detail.saveEdit')}
              </Button>
              <Button type="button" variant="secondary" disabled={Boolean(busy)} onClick={() => setEditing(false)}>
                {t('common.back')}
              </Button>
            </div>
          </form>
        ) : null}
        {notice ? (
          <p className={notice === 'detail.saved' ? 'auth-notice' : 'field-error'} role={notice === 'detail.saved' ? 'status' : 'alert'}>
            {notice.startsWith('detail.') ? t(notice) : notice}
          </p>
        ) : null}
        <div className="sheet-submit">
          <Button to={`/habits/${habit.id}/check-in`} state={location.state}>
            {t('detail.checkIn')}
          </Button>
          {canManage && !editing ? (
            <Button type="button" variant="secondary" disabled={Boolean(busy)} onClick={() => setEditing(true)}>
              {t('detail.edit')}
            </Button>
          ) : null}
          {canManage ? (
            <Button type="button" variant="outline" disabled={Boolean(busy)} onClick={handleDelete}>
              {busy === 'delete' ? t('detail.deleting') : t('detail.delete')}
            </Button>
          ) : null}
        </div>
      </div>
    </main>
  )
}
