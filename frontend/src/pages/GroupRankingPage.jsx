import { Link, useParams } from 'react-router-dom'
import backIcon from '../assets/back.svg'
import celebration from '../assets/celebracion.png'
import { findGroup } from '../data/groups'
import { usePreferences } from '../state/usePreferences'

export default function GroupRankingPage() {
  const { t } = usePreferences()
  const { id } = useParams()
  const group = findGroup(id)

  if (!group) {
    return (
      <main className="sheet">
        <div className="sheet-frame">
          <Link className="auth-back" to="/groups" aria-label={t('common.back')}>
            <img src={backIcon} alt="" width="22" height="22" />
          </Link>
          <p className="dashboard-kicker">{t('ranking.kicker')}</p>
          <h1>{t('ranking.title')}</h1>
          <p className="dashboard-stats">{t('group.missingLead')}</p>
        </div>
      </main>
    )
  }

  const ranking = [...group.ranking]
    .sort((a, b) => b.points - a.points)
    .map((entry, index) => ({ ...entry, place: index + 1 }))

  return (
    <main className="sheet group-ranking">
      <div className="sheet-frame">
        <Link className="auth-back" to={`/groups/${group.id}`} aria-label={t('common.back')}>
          <img src={backIcon} alt="" width="22" height="22" />
        </Link>
        <p className="dashboard-kicker">{t('ranking.kicker')}</p>
        <h1>{t('ranking.title')}</h1>
        <p className="dashboard-stats">
          {ranking.length
            ? t('ranking.sample', { name: group.name, count: ranking.length })
            : group.name}
        </p>
        {ranking.length ? (
          <ol className="rank-list">
            {ranking.map((entry) => (
              <li
                key={entry.place}
                className={entry.current ? 'rank-row is-current' : 'rank-row'}
              >
                <span className={entry.place === 1 ? 'rank-medal is-first' : 'rank-medal'}>
                  {entry.place}
                </span>
                <span className="rank-name">{entry.name}</span>
                <span className="rank-points">{t('ranking.points', { count: entry.points })}</span>
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
