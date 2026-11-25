import { api } from './api'

export function searchUsers(query) {
  return api(`/usuarios?buscar=${encodeURIComponent(query)}`)
}

export function listFriendships() {
  return api('/amistades')
}

export function sendFriendRequest(usuarioId) {
  return api('/amistades', { method: 'POST', body: { usuarioId } })
}

export function acceptFriendRequest(id) {
  return api(`/amistades/${encodeURIComponent(id)}/aceptar`, { method: 'POST', body: {} })
}

export function rejectFriendRequest(id) {
  return api(`/amistades/${encodeURIComponent(id)}/rechazar`, { method: 'POST', body: {} })
}

export function removeFriendship(id) {
  return api(`/amistades/${encodeURIComponent(id)}`, { method: 'DELETE' })
}

export function listGroups() {
  return api('/grupos')
}

export function getGroup(id) {
  return api(`/grupos/${encodeURIComponent(id)}`)
}

export function createGroup(body) {
  return api('/grupos', { method: 'POST', body })
}

export function groupChallenges(id) {
  return api(`/grupos/${encodeURIComponent(id)}/retos`)
}

export function groupRanking(id) {
  return api(`/grupos/${encodeURIComponent(id)}/ranking`)
}

export function inviteToGroup(groupId, usuarioId) {
  return api(`/grupos/${encodeURIComponent(groupId)}/invitaciones`, { method: 'POST', body: { usuarioId } })
}

export function groupInvitations(groupId) {
  return api(`/grupos/${encodeURIComponent(groupId)}/invitaciones`)
}

export function myGroupInvitations() {
  return api('/grupos/invitaciones')
}

export function acceptGroupInvitation(id) {
  return api(`/grupos/invitaciones/${encodeURIComponent(id)}/aceptar`, { method: 'POST', body: {} })
}

export function rejectGroupInvitation(id) {
  return api(`/grupos/invitaciones/${encodeURIComponent(id)}/rechazar`, { method: 'POST', body: {} })
}
