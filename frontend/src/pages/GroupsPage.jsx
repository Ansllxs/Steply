import { useState } from 'react'
import searchIcon from '../assets/icon-search.svg'
import BottomNav from '../components/BottomNav'
import Button from '../components/Button'
import DashboardHeader from '../components/DashboardHeader'
import HabitCard from '../components/HabitCard'
import { groups } from '../data/groups'

export default function GroupsPage() {
  const [query, setQuery] = useState('')
  const normalized = query.trim().toLocaleLowerCase('es')
  const visibleGroups = normalized
    ? groups.filter((group) => group.name.toLocaleLowerCase('es').includes(normalized))
    : groups

  return (
    <main className="dashboard groups-page">
      <div className="dashboard-frame">
        <DashboardHeader />
        <p className="dashboard-kicker">TU COMUNIDAD</p>
        <h1>Grupos</h1>
        <p className="dashboard-stats">Encuentra los grupos en los que participas.</p>
        <div className="group-search">
          <label htmlFor="group-search">Buscar</label>
          <div className="group-search-field">
            <img src={searchIcon} alt="" width="22" height="22" />
            <input
              id="group-search"
              type="search"
              value={query}
              placeholder="Buscar mis grupos"
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
                status: `${group.members} integrantes`,
                icon: 'groups',
              }}
              to={`/groups/${group.id}`}
            />
          ))}
        </ul>
        <div className="groups-actions">
          <Button>Crear un grupo</Button>
        </div>
      </div>
      <BottomNav />
    </main>
  )
}
