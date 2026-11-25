import { ApiError, api, apiForm } from './api'

const DAY_KEYS = ['l', 'm', 'x', 'j', 'v', 's', 'd']
const IMAGE_TYPES = new Set(['image/jpeg', 'image/jpg', 'image/png', 'image/webp', 'image/heic'])

export function listHabits() {
  return api('/retos')
}

export function getHabit(id) {
  return api(`/retos/${encodeURIComponent(id)}`)
}

export function createPersonalHabit(body) {
  return api('/retos', { method: 'POST', body })
}

export function updateHabit(id, body) {
  return api(`/retos/${encodeURIComponent(id)}`, { method: 'PATCH', body })
}

export function deleteHabit(id) {
  return api(`/retos/${encodeURIComponent(id)}`, { method: 'DELETE' })
}

export function habitHistory(id, { desde, hasta } = {}) {
  const params = new URLSearchParams()
  if (desde) params.set('desde', desde)
  if (hasta) params.set('hasta', hasta)
  const query = params.toString()
  return api(`/retos/${encodeURIComponent(id)}/registros${query ? `?${query}` : ''}`)
}

export function saveCheckIn(id, { completed, file }) {
  const form = new FormData()
  form.append('cumplido', completed ? 'true' : 'false')
  if (file) form.append('fotos', file, file.name)
  return apiForm(`/retos/${encodeURIComponent(id)}/registros`, { formData: form })
}

export function todayProgress() {
  return api('/hoy')
}

export function progressSummary() {
  return api('/resumen')
}

export function monthCalendar(year, monthIndex) {
  return api(`/calendario?anio=${year}&mes=${monthIndex + 1}`)
}

export function isHabitId(id) {
  return /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(id ?? '')
}

export function isAllowedEvidence(file) {
  if (!file) return false
  if (IMAGE_TYPES.has(file.type)) return true
  return /\.(jpe?g|png|webp|heic)$/i.test(file.name ?? '')
}

export function habitErrorText(error, t) {
  if (!(error instanceof ApiError) || error.codigo === 'RED' || error.status === 0) {
    return t('auth.unavailable')
  }
  return error.mensaje || t('auth.unexpected')
}

export function calendarDate(timeZone = 'America/Costa_Rica', now = new Date()) {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(now)
}

export function shiftDate(key, days) {
  const [year, month, day] = key.split('-').map(Number)
  const date = new Date(Date.UTC(year, month - 1, day))
  date.setUTCDate(date.getUTCDate() + days)
  return date.toISOString().slice(0, 10)
}

export function isoWeekday(key) {
  const [year, month, day] = key.split('-').map(Number)
  const weekday = new Date(Date.UTC(year, month - 1, day)).getUTCDay()
  return weekday === 0 ? 7 : weekday
}

export function startOfWeek(key) {
  return shiftDate(key, 1 - isoWeekday(key))
}

export function dateParts(key) {
  const [year, month, day] = key.split('-').map(Number)
  return { year, month: month - 1, day }
}

export function recordDate(value) {
  if (typeof value === 'string') return value.slice(0, 10)
  return ''
}

export function formatCalendarDate(key, language) {
  const [year, month, day] = key.split('-').map(Number)
  return new Intl.DateTimeFormat(language === 'en' ? 'en-US' : 'es-CR', {
    timeZone: 'UTC',
    day: 'numeric',
    month: 'long',
    year: 'numeric',
  }).format(new Date(Date.UTC(year, month - 1, day)))
}

export function frequencyText(reto, t) {
  if (reto.frecuencia === 'DIARIA') return t('habit.frequencyDaily')
  if (reto.frecuencia === 'SEMANAL') {
    return t('habit.frequencyWeeklyCount', { count: reto.vecesPorSemana })
  }
  const days = (reto.diasSemana ?? [])
    .map((day) => t(`weekday.short.${DAY_KEYS[day - 1]}`))
    .filter(Boolean)
  return days.join(' ')
}

export function habitCardFromParticipation(row, t) {
  const reto = row.reto
  const scopeLabel = reto.tipo === 'GRUPAL'
    ? (reto.grupo?.nombre || t('habit.groupType'))
    : t('habit.personal')
  return {
    id: reto.id,
    title: reto.nombre,
    scope: reto.tipo === 'GRUPAL' ? 'group' : 'personal',
    status: `${scopeLabel} · ${frequencyText(reto, t)}`,
    icon: 'book',
  }
}

const todayStatus = {
  COMPLETADO: 'habit.statusCompleted',
  PENDIENTE: 'habit.statusPending',
  NO_COMPLETADO: 'habit.statusMissed',
  PAUSADO: 'habit.statusPaused',
  PENDIENTE_APROBACION: 'habit.statusReview',
  RECHAZADO: 'habit.statusRejected',
}

export function habitCardFromToday(item, t) {
  const scheduled = item.estadoHoy !== 'PAUSADO' && item.estadoHoy !== 'NO_PROGRAMADO'
  const weekly = item.reto.frecuencia === 'SEMANAL' && item.semana
  let progress
  if (weekly) progress = `${item.semana.cumplidos}/${item.semana.requeridos}`
  else if (scheduled) progress = item.estadoHoy === 'COMPLETADO' ? '1/1' : '0/1'

  return {
    id: item.reto.id,
    title: item.reto.nombre,
    scope: item.reto.tipo === 'GRUPAL' ? 'group' : 'personal',
    status: t(todayStatus[item.estadoHoy] ?? 'habit.statusPending'),
    progress,
    icon: 'book',
  }
}

export function calendarCard(item, t) {
  const completed = Boolean(item.cumplido && item.estado === 'APROBADO')
  let status = 'habit.statusPending'
  if (!item.registroId && item.programado) status = 'habit.statusPending'
  else if (item.estado === 'PENDIENTE') status = 'habit.statusReview'
  else if (item.estado === 'RECHAZADO') status = 'habit.statusRejected'
  else if (item.registroId && !item.cumplido) status = 'habit.statusMissed'
  else if (completed) status = 'habit.statusCompleted'

  return {
    id: item.retoId,
    title: item.nombre,
    scope: 'personal',
    status: t(status),
    progress: completed ? '1/1' : '0/1',
    icon: 'book',
  }
}

export function weekMarks(records, today) {
  const start = startOfWeek(today)
  const byDate = new Map((records ?? []).map((record) => [recordDate(record.fecha), record]))
  return DAY_KEYS.map((id, index) => {
    const date = shiftDate(start, index)
    const record = byDate.get(date)
    return {
      id,
      date,
      done: Boolean(record?.cumplido && record.estado === 'APROBADO'),
    }
  })
}
