export const navLinks = [
  { to: '/', label: 'Inicio', end: true, icon: 'home', primary: true },
  { to: '/dashboard', label: 'Panel' },
  { to: '/habits', label: 'Hábitos', icon: 'habits', primary: true },
  { to: '/calendar', label: 'Calendario', icon: 'calendar', primary: true },
  { to: '/groups', label: 'Grupos', icon: 'groups', primary: true },
  { to: '/profile', label: 'Perfil', icon: 'profile', primary: true },
  { to: '/login', label: 'Ingresar' },
  { to: '/register', label: 'Registro' },
]

export const primaryLinks = navLinks.filter((link) => link.primary)
export const utilityLinks = navLinks.filter((link) => !link.primary)

export function navLinkClass({ isActive }) {
  return isActive ? 'nav-link is-active' : 'nav-link'
}
