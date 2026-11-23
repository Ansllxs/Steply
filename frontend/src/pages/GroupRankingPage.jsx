import { Link, useParams } from 'react-router-dom'
import backIcon from '../assets/back.svg'
import { findGroup } from '../data/groups'

export default function GroupRankingPage() {
  const { id } = useParams()
  const group = findGroup(id)

  if (!group) {
    return (
      <main className="sheet">
        <div className="sheet-frame">
          <Link className="auth-back" to="/groups" aria-label="Volver">
            <img src={backIcon} alt="" width="22" height="22" />
          </Link>
          <p className="dashboard-kicker">PUNTOS ACUMULADOS</p>
          <h1>Ranking</h1>
          <p className="dashboard-stats">Este grupo no está en los datos de ejemplo.</p>
        </div>
      </main>
    )
  }

  return (
    <main className="sheet group-ranking">
      <div className="sheet-frame">
        <Link className="auth-back" to={`/groups/${group.id}`} aria-label="Volver">
          <img src={backIcon} alt="" width="22" height="22" />
        </Link>
        <p className="dashboard-kicker">PUNTOS ACUMULADOS</p>
        <h1>Ranking</h1>
        <p className="dashboard-stats">
          {group.name} · {group.ranking.length} posiciones de ejemplo
        </p>
        <ol className="rank-list">
          {group.ranking.map((entry) => (
            <li
              key={entry.place}
              className={entry.current ? 'rank-row is-current' : 'rank-row'}
            >
              <span className={entry.place === 1 ? 'rank-medal is-first' : 'rank-medal'}>
                {entry.place}
              </span>
              <span className="rank-name">{entry.name}</span>
              <span className="rank-points">{entry.points} pts</span>
            </li>
          ))}
        </ol>
        <div className="celebration" aria-hidden="true" />
      </div>
    </main>
  )
}
