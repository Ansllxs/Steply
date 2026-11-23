import { useState } from 'react'
import { Link, useLocation, useSearchParams } from 'react-router-dom'
import backIcon from '../assets/back.svg'
import Button from '../components/Button'
import TextField from '../components/TextField'
import { administrableGroups } from '../data/groups'
import { usePreferences } from '../state/usePreferences'

const types = [{ id: 'personal' }, { id: 'group' }]

function validateHabit(name, frequency, type, groupId) {
  const errors = {}

  if (!name.trim()) {
    errors.name = 'validation.habitName'
  }

  if (!frequency.trim()) {
    errors.frequency = 'validation.frequency'
  }

  if (type === 'group' && !groupId) {
    errors.group = 'validation.group'
  }

  return errors
}

export default function CreateHabitPage() {
  const { t } = usePreferences()
  const location = useLocation()
  const [params] = useSearchParams()
  const managedGroups = administrableGroups()
  const presetGroup = managedGroups.some((group) => group.id === params.get('grupo'))
    ? params.get('grupo')
    : ''
  const [name, setName] = useState('')
  const [type, setType] = useState(presetGroup ? 'group' : 'personal')
  const [groupId, setGroupId] = useState(presetGroup)
  const [frequency, setFrequency] = useState('')
  const [errors, setErrors] = useState({})
  const [notice, setNotice] = useState('')
  const backTo = location.state?.from || (presetGroup ? `/groups/${presetGroup}/manage` : '/habits')

  function handleSubmit(event) {
    event.preventDefault()
    const nextErrors = validateHabit(name, frequency, type, groupId)
    setErrors(nextErrors)

    if (Object.keys(nextErrors).length > 0) {
      setNotice('')
      return
    }

    setNotice('habit.notice')
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
            placeholder="Leer"
            autoComplete="off"
            onChange={(event) => setName(event.target.value)}
            error={errors.name ? t(errors.name) : undefined}
          />
          <fieldset className="type-field">
            <legend>{t('habit.type')}</legend>
            <div className="type-options" role="radiogroup" aria-label={t('habit.type')}>
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
                aria-invalid={Boolean(errors.group)}
                aria-describedby={errors.group ? 'habit-group-error' : undefined}
                onChange={(event) => setGroupId(event.target.value)}
              >
                <option value="">{t('habit.chooseGroup')}</option>
                {managedGroups.map((group) => (
                  <option key={group.id} value={group.id}>
                    {group.name}
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
          <TextField
            id="habit-frequency"
            name="frequency"
            label={t('habit.frequency')}
            value={frequency}
            placeholder={t('habit.dailyPlaceholder')}
            autoComplete="off"
            onChange={(event) => setFrequency(event.target.value)}
            error={errors.frequency ? t(errors.frequency) : undefined}
          />
          <div className="create-habit-actions">
            <Button type="submit">{t('habit.create')}</Button>
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
