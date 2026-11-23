import { Link, useParams } from 'react-router-dom'
import backIcon from '../assets/back.svg'
import bunny from '../assets/saludo.png'
import Button from '../components/Button'
import HabitCard from '../components/HabitCard'
import { findGroup } from '../data/groups'
import { usePreferences } from '../state/usePreferences'

export default function GroupDetailPage() {
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
          <p className="dashboard-kicker">{t('group.kicker')}</p>
          <h1>{t('group.missing')}</h1>
          <p className="dashboard-stats">{t('group.missingLead')}</p>
        </div>
      </main>
    )
  }

  return (
    <main className="sheet group-detail">
      <div className="sheet-frame">
        <Link className="auth-back" to="/groups" aria-label={t('common.back')}>
          <img src={backIcon} alt="" width="22" height="22" />
        </Link>
        <p className="dashboard-kicker">{t('group.kicker')}</p>
        <h1>{group.name}</h1>
        <p className="dashboard-stats">
          {t(group.members === 1 ? 'groups.member' : 'groups.members', { count: group.members })}
        </p>
        <section className="motivation" aria-label={t('common.steplyMessage')}>
          <div className="motivation-avatar">
            <img className="motivation-bunny" src={bunny} alt="" width="69" height="78" />
          </div>
          <div>
            <h2>{t('group.motivation')}</h2>
            <p>
              {t('group.motivationLine1')}
              <br />
              {t('group.motivationLine2')}
            </p>
          </div>
        </section>
        <h2 className="sheet-section">{t('group.habits')}</h2>
        {group.habits.length ? (
          <ul className="habit-list">
            {group.habits.map((habit) => (
              <HabitCard key={habit.id} habit={habit} to={null} />
            ))}
          </ul>
        ) : (
          <p className="empty-note">{t('group.empty')}</p>
        )}
        <div className="group-detail-actions">
          <Button to={`/groups/${group.id}/ranking`}>{t('group.ranking')}</Button>
          {group.isAdmin ? (
            <Button variant="secondary" to={`/groups/${group.id}/manage`}>
              {t('group.manage')}
            </Button>
          ) : null}
        </div>
      </div>
    </main>
  )
}
