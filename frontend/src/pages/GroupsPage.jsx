import { useState } from 'react'
import searchIcon from '../assets/icon-search.svg'
import BottomNav from '../components/BottomNav'
import Button from '../components/Button'
import DashboardHeader from '../components/DashboardHeader'
import HabitCard from '../components/HabitCard'
import { groups } from '../data/groups'
import { usePreferences } from '../state/usePreferences'

export default function GroupsPage() {
  const { t } = usePreferences()
  const [query, setQuery] = useState('')
  const normalized = query.trim().toLocaleLowerCase('es')
  const visibleGroups = normalized
    ? groups.filter((group) => group.name.toLocaleLowerCase('es').includes(normalized))
    : groups

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
        <ul className="habit-list group-list">
          {visibleGroups.map((group) => (
            <HabitCard
              key={group.id}
              habit={{
                id: group.id,
                title: group.name,
                status: t(group.members === 1 ? 'groups.member' : 'groups.members', {
                  count: group.members,
                }),
                icon: 'groups',
              }}
              to={`/groups/${group.id}`}
            />
          ))}
        </ul>
        <div className="groups-actions">
          <Button to="/groups/new">{t('groups.create')}</Button>
        </div>
      </div>
      <BottomNav />
    </main>
  )
}
