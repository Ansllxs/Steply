export const maxProfilePhotoBytes = 5 * 1024 * 1024

export const profile = {
  name: 'Angie Alpízar',
  username: 'angiealpizar',
  streak: '12 días',
  streakCaption: 'Racha activa',
  points: '1 250 pts',
  pointsCaption: 'Puntos acumulados',
}

export const profileActions = [
  {
    id: 'habits',
    title: 'Mis hábitos',
    status: 'Consulta y gestiona tus hábitos',
    icon: 'calendar',
    to: '/habits',
  },
  {
    id: 'groups',
    title: 'Mis grupos',
    status: 'Administra tus grupos y hábitos',
    icon: 'groups',
    to: '/groups',
  },
  {
    id: 'edit',
    title: 'Editar perfil',
    status: 'Actualiza tu información',
    icon: 'profile',
    notice: 'Editar perfil todavía no está disponible.',
  },
  {
    id: 'settings',
    title: 'Ajustes',
    status: 'Notificaciones y preferencias',
    icon: 'settings',
    notice: 'Ajustes todavía no está disponible.',
  },
]

export const logoutNotice =
  'Cerrar sesión todavía no está disponible. Lo conectaremos cuando la autenticación esté lista.'
