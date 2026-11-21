import { NavLink } from 'react-router-dom'
import NavIcon from './NavIcon'
import { navLinkClass, primaryLinks } from './navLinks'

export default function BottomNav() {
  return (
    <nav className="bottom-nav" aria-label="Principal">
      {primaryLinks.map((link) => (
        <NavLink
          key={link.to}
          to={link.to}
          end={link.end ?? false}
          className={navLinkClass}
        >
          <NavIcon name={link.icon} />
          <span>{link.label}</span>
        </NavLink>
      ))}
    </nav>
  )
}
