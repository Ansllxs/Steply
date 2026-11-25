import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import backIcon from '../assets/back.svg'
import celebration from '../assets/celebracion.png'
import LoadingIndicator from '../components/LoadingIndicator'
import { habitErrorText, isHabitId } from '../services/habits'
import { displayMediaUrl } from '../services/media'
import { getGroup, groupRanking } from '../services/social'
import { useAuth } from '../state/useAuth'
import { usePreferences } from '../state/usePreferences'

export default function GroupRankingPage() {
  const { t } = usePreferences()
  const { user } = useAuth()
  const { id } = useParams()
  const [result, setResult] = useState({ id: '', status: 'loading', group: null, ranking: [], error: '' })

  useEffect(() => {
    if (!isHabitId(id)) return undefined
    let active = true
    Promise.all([getGroup(id), groupRanking(id)])
      .then(([groupData, rankingData]) => {
        if (!active) return
        setResult({
          id,
          status: 'ready',
          group: groupData.grupo,
          ranking: rankingData.ranking ?? [],
          error: '',
        })
      })
      .catch((err) => {
        if (!active) return
        const missing = err?.status === 404 || err?.codigo === 'NO_ENCONTRADO'
        setResult({
          id,
          status: missing ? 'missing' : 'error',
          group: null,
          ranking: [],
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
          <p className="dashboard-kicker">{t('ranking.kicker')}</p>
          <h1>{t('ranking.title')}</h1>
          <p className="dashboard-stats">{status === 'error' ? result.error : t('group.missingLead')}</p>
        </div>
      </main>
    )
  }

  return (
    <main className="sheet group-ranking">
      <div className="sheet-frame">
        <Link className="auth-back" to={`/groups/${group.id}`} aria-label={t('common.back')}>
          <img src={backIcon} alt="" width="22" height="22" />
        </Link>
        <p className="dashboard-kicker">{t('ranking.kicker')}</p>
        <h1>{t('ranking.title')}</h1>
        <p className="dashboard-stats">
          {t('ranking.sample', { name: group.nombre, count: result.ranking.length })}
        </p>
        {result.ranking.length ? (
          <ol className="rank-list">
            {result.ranking.map((entry) => (
              <li
                key={entry.usuario.id}
                className={entry.usuario.id === user.id ? 'rank-row is-current' : 'rank-row'}
              >
                <span className={entry.posicion === 1 ? 'rank-medal is-first' : 'rank-medal'}>
                  {entry.posicion}
                </span>
                <span className="rank-name friend-identity">
                  {displayMediaUrl(entry.usuario.fotoUrl) ? (
                    <img className="friend-avatar" src={displayMediaUrl(entry.usuario.fotoUrl)} alt="" width="36" height="36" />
                  ) : null}
                  {entry.usuario.nombre}
                </span>
                <span className="rank-points">{t('ranking.points', { count: entry.puntos })}</span>
              </li>
            ))}
          </ol>
        ) : (
          <p className="empty-note">{t('ranking.empty')}</p>
        )}
        <div className="celebration" aria-hidden="true">
          <img src={celebration} alt="" width="124" height="121" />
        </div>
      </div>
    </main>
  )
}
