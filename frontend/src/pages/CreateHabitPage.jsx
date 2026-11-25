import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import backIcon from '../assets/back.svg'
import Button from '../components/Button'
import TextField from '../components/TextField'
import { addCalendarMonths, calendarDate, createPersonalHabit, habitErrorText } from '../services/habits'
import { listGroups } from '../services/social'
import { useAuth } from '../state/useAuth'
import { usePreferences } from '../state/usePreferences'

const types = [{ id: 'personal' }, { id: 'group' }]
const frequencies = [
  { id: 'DIARIA', label: 'habit.frequencyDaily' },
  { id: 'SEMANAL', label: 'habit.frequencyWeekly' },
  { id: 'DIAS_ESPECIFICOS', label: 'habit.frequencyDays' },
]
const dayOptions = [
  { value: 1, id: 'l' },
  { value: 2, id: 'm' },
  { value: 3, id: 'x' },
  { value: 4, id: 'j' },
  { value: 5, id: 'v' },
  { value: 6, id: 's' },
  { value: 7, id: 'd' },
]

const durations = [
  { id: '1', months: 1, label: 'habit.duration1' },
  { id: '3', months: 3, label: 'habit.duration3' },
  { id: '6', months: 6, label: 'habit.duration6' },
  { id: '12', months: 12, label: 'habit.duration12' },
  { id: 'custom', label: 'habit.durationCustom' },
  { id: 'none', label: 'habit.durationNone' },
]

const datePattern = /^\d{4}-\d{2}-\d{2}$/

function isRealDate(value) {
  if (!datePattern.test(value)) return false
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))
  return date.toISOString().slice(0, 10) === value
}

function validateHabit(name, frequency, times, days, type, groupId, duration, endDate, start) {
  const errors = {}
  const trimmed = name.trim()

  if (!trimmed) errors.name = 'validation.habitName'
  else if (trimmed.length > 80) errors.name = 'validation.nameLength'

  if (!frequency) errors.frequency = 'validation.frequency'
  else if (frequency === 'SEMANAL' && !times) errors.times = 'validation.times'
  else if (frequency === 'DIAS_ESPECIFICOS' && days.length === 0) errors.days = 'validation.days'

  if (type === 'group' && !groupId) errors.group = 'validation.group'

  if (!duration) errors.duration = 'validation.duration'
  else if (duration === 'custom') {
    if (!endDate) errors.endDate = 'validation.endDate'
    else if (!isRealDate(endDate)) errors.endDate = 'validation.dateInvalid'
    else if (endDate < start) errors.endDate = 'validation.endBeforeStart'
  }

  return errors
}

export default function CreateHabitPage() {
  const { t } = usePreferences()
  const { user } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const [params] = useSearchParams()
  const presetGroup = params.get('grupo') || ''
  const [groups, setGroups] = useState([])
  const [name, setName] = useState('')
  const [type, setType] = useState(presetGroup ? 'group' : 'personal')
  const [groupId, setGroupId] = useState(presetGroup)
  const [frequency, setFrequency] = useState('')
  const [times, setTimes] = useState('')
  const [days, setDays] = useState([])
  const [duration, setDuration] = useState('')
  const [endDate, setEndDate] = useState('')
  const [errors, setErrors] = useState({})
  const [notice, setNotice] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const lockRef = useRef(false)
  const backTo = location.state?.from || (presetGroup ? `/groups/${presetGroup}/manage` : '/habits')
  const start = calendarDate(user?.zonaHoraria || 'America/Costa_Rica')

  useEffect(() => {
    let active = true
    listGroups()
      .then((data) => {
        if (active) setGroups(data.grupos ?? [])
      })
      .catch(() => {
        if (active) setGroups([])
      })
    return () => {
      active = false
    }
  }, [])

  function toggleDay(value) {
    setDays((current) => (
      current.includes(value)
        ? current.filter((day) => day !== value)
        : [...current, value].sort((a, b) => a - b)
    ))
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (lockRef.current) return

    const nextErrors = validateHabit(name, frequency, times, days, type, groupId, duration, endDate, start)
    setErrors(nextErrors)
    if (Object.keys(nextErrors).length > 0) {
      setNotice('')
      return
    }

    const selected = durations.find((item) => item.id === duration)
    const body = {
      tipo: type === 'group' ? 'GRUPAL' : 'PERSONAL',
      nombre: name.trim(),
      frecuencia: frequency,
      fechaInicio: start,
      fechaFin: duration === 'none' ? null : duration === 'custom' ? endDate : addCalendarMonths(start, selected.months),
    }
    if (type === 'group') body.grupoId = groupId
    if (frequency === 'SEMANAL') body.vecesPorSemana = Number(times)
    if (frequency === 'DIAS_ESPECIFICOS') body.diasSemana = days

    lockRef.current = true
    setSubmitting(true)
    setNotice('')
    try {
      const data = await createPersonalHabit(body)
      setNotice('habit.created')
      const reduce = window.matchMedia('(prefers-reduced-motion: reduce)').matches
      await new Promise((resolve) => {
        window.setTimeout(resolve, reduce ? 400 : 800)
      })
      navigate(`/habits/${data.reto.id}`, { replace: true })
    } catch (error) {
      const campo = error?.detalles?.campo
      if (campo === 'nombre') setErrors({ name: habitErrorText(error, t) })
      else if (campo === 'frecuencia' || campo === 'vecesPorSemana' || campo === 'diasSemana') {
        setErrors({ frequency: habitErrorText(error, t) })
      } else if (campo === 'fechaInicio' || campo === 'fechaFin') {
        setErrors({ endDate: habitErrorText(error, t) })
      } else {
        setNotice(habitErrorText(error, t))
      }
      lockRef.current = false
      setSubmitting(false)
    }
  }

  return (
    <main className="create-habit">
      <div className="create-habit-frame">
        <Link className="auth-back" to={backTo} aria-label={t('common.back')}>
          <img src={backIcon} alt="" width="22" height="22" />
        </Link>
        <p className="dashboard-kicker">{t('habit.kicker')}</p>
        <h1>{t('habit.createTitle')}</h1>
        <p className="dashboard-stats">{t('habit.createLead')}</p>
        <div className="create-habit-art" />
        <div className="create-habit-bunny" aria-hidden="true" />
        <form className="create-habit-form" onSubmit={handleSubmit} noValidate>
          <TextField
            id="habit-name"
            name="name"
            label={t('habit.name')}
            value={name}
            autoComplete="off"
            disabled={submitting}
            onChange={(event) => setName(event.target.value)}
            error={errors.name ? (errors.name.startsWith('validation.') ? t(errors.name) : errors.name) : undefined}
          />
          <fieldset className="type-field">
            <legend>{t('habit.type')}</legend>
            <div className="type-options" role="radiogroup" aria-label={t('habit.type')}>
              {types.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={type === item.id ? 'type-option is-selected' : 'type-option'}
                  role="radio"
                  aria-checked={type === item.id}
                  disabled={submitting}
                  onClick={() => setType(item.id)}
                >
                  {t(item.id === 'personal' ? 'habit.personal' : 'habit.groupType')}
                </button>
              ))}
            </div>
          </fieldset>
          {type === 'group' ? (
            <div className="field">
              <label htmlFor="habit-group">{t('habit.group')}</label>
              <select
                id="habit-group"
                name="group"
                value={groupId}
                disabled={submitting}
                aria-invalid={Boolean(errors.group)}
                aria-describedby={errors.group ? 'habit-group-error' : undefined}
                onChange={(event) => setGroupId(event.target.value)}
              >
                <option value="">{t('habit.chooseGroup')}</option>
                {groups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.nombre}
                  </option>
                ))}
              </select>
              {errors.group ? (
                <p className="field-error" id="habit-group-error" role="alert">
                  {t(errors.group)}
                </p>
              ) : null}
            </div>
          ) : null}
          <fieldset className="type-field">
            <legend>{t('habit.frequency')}</legend>
            <div className="type-options frequency" role="radiogroup" aria-label={t('habit.frequency')}>
              {frequencies.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={frequency === item.id ? 'type-option is-selected' : 'type-option'}
                  role="radio"
                  aria-checked={frequency === item.id}
                  disabled={submitting}
                  onClick={() => setFrequency(item.id)}
                >
                  {t(item.label)}
                </button>
              ))}
            </div>
            {errors.frequency ? (
              <p className="field-error" role="alert">
                {errors.frequency.startsWith('validation.') || errors.frequency.startsWith('habit.')
                  ? t(errors.frequency)
                  : errors.frequency}
              </p>
            ) : null}
          </fieldset>
          {frequency === 'SEMANAL' ? (
            <div className="field">
              <label htmlFor="habit-times">{t('habit.timesPerWeek')}</label>
              <select
                id="habit-times"
                name="times"
                value={times}
                disabled={submitting}
                aria-invalid={Boolean(errors.times)}
                aria-describedby={errors.times ? 'habit-times-error' : undefined}
                onChange={(event) => setTimes(event.target.value)}
              >
                <option value="">{t('habit.timesPlaceholder')}</option>
                {[1, 2, 3, 4, 5, 6, 7].map((count) => (
                  <option key={count} value={count}>{count}</option>
                ))}
              </select>
              {errors.times ? (
                <p className="field-error" id="habit-times-error" role="alert">{t(errors.times)}</p>
              ) : null}
            </div>
          ) : null}
          {frequency === 'DIAS_ESPECIFICOS' ? (
            <fieldset className="type-field">
              <legend>{t('habit.days')}</legend>
              <div className="type-options days" role="group" aria-label={t('habit.days')}>
                {dayOptions.map((day) => (
                  <button
                    key={day.value}
                    type="button"
                    className={days.includes(day.value) ? 'type-option is-selected' : 'type-option'}
                    aria-pressed={days.includes(day.value)}
                    disabled={submitting}
                    onClick={() => toggleDay(day.value)}
                  >
                    {t(`weekday.short.${day.id}`)}
                  </button>
                ))}
              </div>
              {errors.days ? (
                <p className="field-error" role="alert">{t(errors.days)}</p>
              ) : null}
            </fieldset>
          ) : null}
          <fieldset className="type-field">
            <legend>{t('habit.duration')}</legend>
            <div className="type-options duration" role="radiogroup" aria-label={t('habit.duration')}>
              {durations.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  className={duration === item.id ? 'type-option is-selected' : 'type-option'}
                  role="radio"
                  aria-checked={duration === item.id}
                  disabled={submitting}
                  onClick={() => setDuration(item.id)}
                >
                  {t(item.label)}
                </button>
              ))}
            </div>
            {errors.duration ? (
              <p className="field-error" role="alert">{t(errors.duration)}</p>
            ) : null}
          </fieldset>
          {duration === 'custom' ? (
            <div className="field">
              <label htmlFor="habit-end">{t('habit.endDate')}</label>
              <input
                id="habit-end"
                name="end"
                type="date"
                value={endDate}
                min={start}
                disabled={submitting}
                aria-invalid={Boolean(errors.endDate)}
                aria-describedby={errors.endDate ? 'habit-end-error' : undefined}
                onChange={(event) => setEndDate(event.target.value)}
              />
              {errors.endDate ? (
                <p className="field-error" id="habit-end-error" role="alert">
                  {errors.endDate.startsWith('validation.') ? t(errors.endDate) : errors.endDate}
                </p>
              ) : null}
            </div>
          ) : null}
          <div className="create-habit-actions">
            <Button type="submit" disabled={submitting}>
              {submitting ? t('habit.creating') : t('habit.create')}
            </Button>
            {notice ? (
              <p className={notice === 'habit.created' ? 'auth-notice' : 'field-error'} role={notice === 'habit.created' ? 'status' : 'alert'}>
                {notice.startsWith('habit.') || notice.startsWith('auth.') ? t(notice) : notice}
              </p>
            ) : null}
          </div>
        </form>
      </div>
    </main>
  )
}
