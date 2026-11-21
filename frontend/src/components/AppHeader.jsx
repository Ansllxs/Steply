import { NavLink } from 'react-router-dom'
import { navLinkClass, navLinks, utilityLinks } from './navLinks'

export default function AppHeader() {
  return (
    <header className="app-header">
      <div className="header-inner">
        <NavLink to="/" className="brand" end>
          Steply
        </NavLink>
        <nav className="header-actions" aria-label="Accesos">
          {utilityLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end ?? false}
              className={navLinkClass}
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
        <nav className="app-nav" aria-label="Principal">
          {navLinks.map((link) => (
            <NavLink
              key={link.to}
              to={link.to}
              end={link.end ?? false}
              className={navLinkClass}
            >
              {link.label}
            </NavLink>
          ))}
        </nav>
      </div>
    </header>
  )
}
