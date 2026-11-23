import { Link, useParams } from 'react-router-dom'
import backIcon from '../assets/back.svg'
import Button from '../components/Button'
import HabitCard from '../components/HabitCard'
import { findGroup } from '../data/groups'
import { usePreferences } from '../state/usePreferences'

export default function ManageGroupHabitsPage() {
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
          <p className="dashboard-kicker">{t('manage.kicker')}</p>
          <h1>{t('manage.title')}</h1>
          <p className="dashboard-stats">{t('group.missingLead')}</p>
        </div>
      </main>
    )
  }

  if (!group.isAdmin) {
    return (
      <main className="sheet">
        <div className="sheet-frame">
          <Link className="auth-back" to={`/groups/${group.id}`} aria-label={t('common.back')}>
            <img src={backIcon} alt="" width="22" height="22" />
          </Link>
          <p className="dashboard-kicker">{t('manage.kicker')}</p>
          <h1>{t('manage.title')}</h1>
          <p className="dashboard-stats">{t('manage.onlyAdmin', { name: group.name })}</p>
          <div className="group-manage-actions">
            <Button to={`/groups/${group.id}`}>{t('manage.back')}</Button>
          </div>
        </div>
      </main>
    )
  }

  return (
    <main className="sheet group-manage">
      <div className="sheet-frame">
        <Link className="auth-back" to={`/groups/${group.id}`} aria-label={t('common.back')}>
          <img src={backIcon} alt="" width="22" height="22" />
        </Link>
        <p className="dashboard-kicker">{t('manage.kicker')}</p>
        <h1>{t('manage.title')}</h1>
        <p className="dashboard-stats">{t('manage.role', { name: group.name })}</p>
        <h2 className="sheet-section">{t('manage.list')}</h2>
        {group.habits.length ? (
          <ul className="habit-list">
            {group.habits.map((habit) => (
              <HabitCard
                key={habit.id}
                habit={{ ...habit, status: 'Hábito grupal' }}
                to={`/habits/${habit.id}`}
                state={{ from: `/groups/${group.id}/manage` }}
              />
            ))}
          </ul>
        ) : (
          <p className="empty-note">{t('group.empty')}</p>
        )}
        <div className="group-manage-actions">
          <Button
            to={`/habits/new?grupo=${group.id}`}
            state={{ from: `/groups/${group.id}/manage` }}
          >
            {t('manage.add')}
          </Button>
          <Button variant="secondary" to={`/groups/${group.id}`}>
            {t('manage.back')}
          </Button>
        </div>
      </div>
    </main>
  )
}
