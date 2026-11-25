import { translate } from './messages'

const exact = {
  'Personal · Diario': 'status.personalDaily',
  'Completado hoy': 'status.completedToday',
  Pendiente: 'status.pending',
  'Pendiente de registro': 'status.pendingRecord',
  'Hábito grupal': 'status.groupHabit',
  'Diario · Hábito personal': 'status.dailyPersonal',
  'Mis hábitos': 'profile.habits',
  'Consulta y gestiona tus hábitos': 'profile.habitsHelp',
  'Mis grupos': 'profile.groups',
  'Administra tus grupos y hábitos': 'profile.groupsHelp',
  'Mis amigos': 'friends.tabFriends',
  'Busca personas y revisa solicitudes': 'friends.lead',
  'Editar perfil': 'profile.edit',
  'Actualiza tu información': 'profile.editHelp',
  Ajustes: 'profile.settings',
  'Notificaciones y preferencias': 'profile.settingsHelp',
}

export function translatePhrase(language, text) {
  if (!text) return text

  const key = exact[text]
  if (key) return translate(language, key)

  const completed = text.match(/^(\d+) de (\d+) completaron hoy$/)
  if (completed) {
    return translate(language, 'groups.completedToday', {
      done: completed[1],
      total: completed[2],
    })
  }

  const days = text.match(/^(\d+) días$/)
  if (days) return translate(language, 'stats.days', { count: days[1] })

  if (text.endsWith(' · Diario')) {
    return `${text.slice(0, -' · Diario'.length)} · ${translate(language, 'status.daily')}`
  }

  if (text.startsWith('Diario · ')) {
    return `${translate(language, 'status.daily')} · ${text.slice('Diario · '.length)}`
  }

  return text
}
