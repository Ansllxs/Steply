import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import backIcon from '../assets/back.svg'
import Button from '../components/Button'
import HabitCard from '../components/HabitCard'
import LoadingIndicator from '../components/LoadingIndicator'
import { durationText, frequencyText, habitErrorText, isHabitId } from '../services/habits'
import { getGroup, groupChallenges } from '../services/social'
import { usePreferences } from '../state/usePreferences'

export default function ManageGroupHabitsPage() {
  const { t, language } = usePreferences()
  const { id } = useParams()
  const [result, setResult] = useState({ id: '', status: 'loading', group: null, retos: [], error: '' })

  useEffect(() => {
    if (!isHabitId(id)) return undefined
    let active = true
    Promise.all([getGroup(id), groupChallenges(id)])
      .then(([groupData, retosData]) => {
        if (!active) return
        setResult({ id, status: 'ready', group: groupData.grupo, retos: retosData.retos ?? [], error: '' })
      })
      .catch((err) => {
        if (!active) return
        const missing = err?.status === 404 || err?.codigo === 'NO_ENCONTRADO' || err?.status === 403
        setResult({
          id,
          status: missing ? 'missing' : 'error',
          group: null,
          retos: [],
          error: missing ? '' : habitErrorText(err, t),
        })
      })
    return () => {
      active = false
    }
  }, [id, t])

  const status = !isHabitId(id) ? 'missing' : result.id === id ? result.status : 'loading'
  const group = result.id === id ? result.group : null

  if (status === 'loading') {
    return (
      <main className="sheet">
        <div className="sheet-frame">
          <LoadingIndicator />
        </div>
      </main>
    )
  }

  if (status !== 'ready' || !group) {
    return (
      <main className="sheet">
        <div className="sheet-frame">
          <Link className="auth-back" to="/groups" aria-label={t('common.back')}>
            <img src={backIcon} alt="" width="22" height="22" />
          </Link>
          <p className="dashboard-kicker">{t('manage.kicker')}</p>
          <h1>{t('manage.title')}</h1>
          <p className="dashboard-stats">{status === 'error' ? result.error : t('group.missingLead')}</p>
        </div>
      </main>
    )
  }

  const canCreate = group.miRol === 'ADMIN' || !group.soloAdminsCreanRetos

  return (
    <main className="sheet group-manage">
      <div className="sheet-frame">
        <Link className="auth-back" to={`/groups/${group.id}`} aria-label={t('common.back')}>
          <img src={backIcon} alt="" width="22" height="22" />
        </Link>
        <p className="dashboard-kicker">{t('manage.kicker')}</p>
        <h1>{t('manage.title')}</h1>
        <p className="dashboard-stats">
          {canCreate
            ? t(group.miRol === 'ADMIN' ? 'manage.role' : 'manage.member', { name: group.nombre })
            : t('manage.onlyAdmin', { name: group.nombre })}
        </p>
        <h2 className="sheet-section">{t('manage.list')}</h2>
        {result.retos.length ? (
          <ul className="habit-list">
            {result.retos.map((reto) => (
              <HabitCard
                key={reto.id}
                habit={{
                  id: reto.id,
                  title: reto.nombre,
                  status: `${frequencyText(reto, t)} · ${durationText(reto, t, language)}`,
                  icon: 'book',
                }}
                to={`/habits/${reto.id}`}
                state={{ from: `/groups/${group.id}/manage` }}
              />
            ))}
          </ul>
        ) : (
          <p className="empty-note">{t('group.empty')}</p>
        )}
        <div className="group-manage-actions">
          {canCreate ? (
            <Button to={`/habits/new?grupo=${group.id}`} state={{ from: `/groups/${group.id}/manage` }}>
              {t('manage.add')}
            </Button>
          ) : null}
          <Button variant="secondary" to={`/groups/${group.id}`}>
            {t('manage.back')}
          </Button>
        </div>
      </div>
    </main>
  )
}
