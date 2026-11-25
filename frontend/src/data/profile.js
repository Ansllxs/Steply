export const maxProfilePhotoBytes = 5 * 1024 * 1024

export const profilePhotoTypes = ['image/jpeg', 'image/png', 'image/webp']

export const profile = {
  name: 'Angie Alpízar',
  username: 'angiealpizar',
  email: 'angie@ejemplo.com',
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
    id: 'friends',
    title: 'Mis amigos',
    status: 'Busca personas y revisa solicitudes',
    icon: 'groups',
    to: '/friends',
  },
  {
    id: 'edit',
    title: 'Editar perfil',
    status: 'Actualiza tu información',
    icon: 'profile',
    to: '/profile/edit',
  },
  {
    id: 'settings',
    title: 'Ajustes',
    status: 'Notificaciones y preferencias',
    icon: 'settings',
    to: '/settings',
  },
]

export const USERNAME_MAX_LENGTH = 30

/**
 * Demo username rule, checked only in the browser:
 * 1–30 letters (including accents), numbers, underscores, or periods.
 * Spaces are not allowed. Availability is not checked.
 */
export const USERNAME_PATTERN = /^[\p{L}\p{N}_.]{1,30}$/u

export function validateProfileIdentity(name, username) {
  const errors = {}
  const trimmedName = name.trim()
  const trimmedUsername = username.trim()

  if (!trimmedName || trimmedName.length > 80) {
    errors.name = trimmedName ? 'validation.nameLength' : 'validation.nameRequired'
  }

  if (!trimmedUsername) {
    errors.username = 'validation.usernameRequired'
  } else if (/\s/.test(username)) {
    errors.username = 'validation.usernameSpaces'
  } else if (!USERNAME_PATTERN.test(trimmedUsername)) {
    errors.username = 'validation.usernameCharset'
  }

  return errors
}
