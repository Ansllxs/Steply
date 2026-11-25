import { useEffect, useState } from 'react'
import searchIcon from '../assets/icon-search.svg'
import BottomNav from '../components/BottomNav'
import Button from '../components/Button'
import DashboardHeader from '../components/DashboardHeader'
import HabitCard from '../components/HabitCard'
import LoadingIndicator from '../components/LoadingIndicator'
import { habitErrorText } from '../services/habits'
import { listGroups } from '../services/social'
import { usePreferences } from '../state/usePreferences'

export default function GroupsPage() {
  const { t } = usePreferences()
  const [query, setQuery] = useState('')
  const [result, setResult] = useState({ status: 'loading', groups: [], error: '' })

  useEffect(() => {
    let active = true
    listGroups()
      .then((data) => {
        if (active) setResult({ status: 'ready', groups: data.grupos ?? [], error: '' })
      })
      .catch((err) => {
        if (active) setResult({ status: 'error', groups: [], error: habitErrorText(err, t) })
      })
    return () => {
      active = false
    }
  }, [t])

  const normalized = query.trim().toLocaleLowerCase('es')
  const visibleGroups = result.groups.filter((group) => (
    !normalized || group.nombre.toLocaleLowerCase('es').includes(normalized)
  ))

  return (
    <main className="dashboard groups-page">
      <div className="dashboard-frame">
        <DashboardHeader />
        <p className="dashboard-kicker">{t('groups.kicker')}</p>
        <h1>{t('groups.title')}</h1>
        <p className="dashboard-stats">{t('groups.lead')}</p>
        <div className="group-search">
          <label htmlFor="group-search">{t('groups.search')}</label>
          <div className="group-search-field">
            <img src={searchIcon} alt="" width="22" height="22" />
            <input
              id="group-search"
              type="search"
              value={query}
              placeholder={t('groups.searchPlaceholder')}
              onChange={(event) => setQuery(event.target.value)}
            />
          </div>
        </div>
        {result.status === 'loading' ? <LoadingIndicator /> : null}
        {result.status === 'error' ? <p className="empty-note" role="alert">{result.error}</p> : null}
        {result.status === 'ready' && visibleGroups.length ? (
          <ul className="habit-list group-list">
            {visibleGroups.map((group) => (
              <HabitCard
                key={group.id}
                habit={{
                  id: group.id,
                  title: group.nombre,
                  status: t(group.cantidadMiembros === 1 ? 'groups.member' : 'groups.members', {
                    count: group.cantidadMiembros,
                  }),
                  icon: 'groups',
                }}
                to={`/groups/${group.id}`}
              />
            ))}
          </ul>
        ) : null}
        {result.status === 'ready' && !visibleGroups.length ? (
          <p className="empty-note">{normalized ? t('groups.searchEmpty') : t('groups.empty')}</p>
        ) : null}
        <div className="groups-actions">
          <Button to="/groups/new">{t('groups.create')}</Button>
          <Button to="/friends" variant="secondary">{t('friends.open')}</Button>
        </div>
      </div>
      <BottomNav />
    </main>
  )
}
