import { NavLink } from 'react-router-dom'
import groupsIcon from '../assets/nav-groups.svg'
import habitsIcon from '../assets/nav-habits.svg'
import homeIcon from '../assets/nav-home.svg'
import profileIcon from '../assets/nav-profile.svg'

const items = [
  { label: 'Inicio', icon: homeIcon, to: '/dashboard' },
  { label: 'Hábitos', icon: habitsIcon, to: '/habits' },
  { label: 'Grupos', icon: groupsIcon },
  { label: 'Perfil', icon: profileIcon },
]

export default function BottomNav({ current }) {
  return (
    <nav className="bottom-nav" aria-label="Principal">
      {items.map((item) => {
        const content = (
          <>
            <span className="bottom-nav-icon">
              <img src={item.icon} alt="" width="21" height="21" />
            </span>
            <span>{item.label}</span>
          </>
        )

        if (item.to) {
          return (
            <NavLink
              key={item.label}
              to={item.to}
              end={item.to === '/dashboard' || item.to === '/habits'}
              className={({ isActive }) =>
                (current ? current === item.label : isActive)
                  ? 'bottom-nav-item is-active'
                  : 'bottom-nav-item'
              }
            >
              {content}
            </NavLink>
          )
        }

        return (
          <button key={item.label} type="button" className="bottom-nav-item">
            {content}
          </button>
        )
      })}
    </nav>
  )
}
