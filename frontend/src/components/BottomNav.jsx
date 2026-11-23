import { NavLink } from 'react-router-dom'
import { usePreferences } from '../state/usePreferences'
import groupsIcon from '../assets/nav-groups.svg'
import habitsIcon from '../assets/nav-habits.svg'
import homeIcon from '../assets/nav-home.svg'
import profileIcon from '../assets/nav-profile.svg'

const items = [
  { id: 'home', label: 'nav.home', icon: homeIcon, to: '/dashboard' },
  { id: 'habits', label: 'nav.habits', icon: habitsIcon, to: '/habits' },
  { id: 'groups', label: 'nav.groups', icon: groupsIcon, to: '/groups' },
  { id: 'profile', label: 'nav.profile', icon: profileIcon, to: '/profile' },
]

export default function BottomNav({ current }) {
  const { t } = usePreferences()

  return (
    <nav className="bottom-nav" aria-label={t('nav.main')}>
      {items.map((item) => {
        const content = (
          <>
            <span className="bottom-nav-icon">
              <img src={item.icon} alt="" width="21" height="21" />
            </span>
            <span>{t(item.label)}</span>
          </>
        )

        if (item.to) {
          return (
            <NavLink
              key={item.id}
              to={item.to}
              end={
                item.to === '/dashboard' ||
                item.to === '/habits' ||
                item.to === '/groups' ||
                item.to === '/profile'
              }
              className={({ isActive }) =>
                (current ? current === item.id : isActive)
                  ? 'bottom-nav-item is-active'
                  : 'bottom-nav-item'
              }
            >
              {content}
            </NavLink>
          )
        }

        return (
          <button key={item.id} type="button" className="bottom-nav-item">
            {content}
          </button>
        )
      })}
    </nav>
  )
}
