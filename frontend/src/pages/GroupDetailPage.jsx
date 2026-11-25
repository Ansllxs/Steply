import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import backIcon from '../assets/back.svg'
import bunny from '../assets/saludo.png'
import Button from '../components/Button'
import HabitCard from '../components/HabitCard'
import LoadingIndicator from '../components/LoadingIndicator'
import MediaImage from '../components/MediaImage'
import { frequencyText, habitErrorText, isHabitId } from '../services/habits'
import { displayMediaUrl } from '../services/media'
import {
  getGroup,
  groupChallenges,
  groupInvitations,
  inviteToGroup,
  listFriendships,
} from '../services/social'
import { usePreferences } from '../state/usePreferences'

export default function GroupDetailPage() {
  const { t } = usePreferences()
  const { id } = useParams()
  const [result, setResult] = useState({ id: '', status: 'loading', group: null, retos: [], error: '' })
  const [inviting, setInviting] = useState(false)
  const [friends, setFriends] = useState([])
  const [pendingIds, setPendingIds] = useState([])
  const [busy, setBusy] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    if (!isHabitId(id)) return undefined
    let active = true
    Promise.all([getGroup(id), groupChallenges(id)])
      .then(([groupData, retosData]) => {
        if (!active) return
        setResult({ id, status: 'ready', group: groupData.grupo, retos: retosData.retos ?? [], error: '' })
      })
      .catch((err) => {
        if (!active) return
        const missing = err?.status === 404 || err?.codigo === 'NO_ENCONTRADO'
        setResult({
          id,
          status: missing ? 'missing' : 'error',
          group: null,
          retos: [],
          error: missing ? '' : habitErrorText(err, t),
        })
      })
    return () => {
      active = false
    }
  }, [id, t])

  const status = !isHabitId(id) ? 'missing' : result.id === id ? result.status : 'loading'
  const group = result.id === id ? result.group : null

  async function openInvites() {
    setInviting(true)
    setNotice('')
    try {
      const [friendData, inviteData] = await Promise.all([listFriendships(), groupInvitations(id)])
      const memberIds = new Set((group?.miembros ?? []).map((member) => member.id))
      const pending = (inviteData.invitaciones ?? []).map((item) => item.invitado.id)
      setPendingIds(pending)
      setFriends((friendData.amigos ?? []).filter((item) => !memberIds.has(item.usuario.id) && !pending.includes(item.usuario.id)))
    } catch (err) {
      setNotice(habitErrorText(err, t))
    }
  }

  async function invite(usuarioId) {
    setBusy(usuarioId)
    setNotice('')
    try {
      await inviteToGroup(id, usuarioId)
      setFriends((current) => current.filter((item) => item.usuario.id !== usuarioId))
      setPendingIds((current) => [...current, usuarioId])
      setNotice('group.invited')
    } catch (err) {
      setNotice(habitErrorText(err, t))
    } finally {
      setBusy('')
    }
  }

  if (status === 'loading') {
    return (
      <main className="sheet">
        <div className="sheet-frame">
          <Link className="auth-back" to="/groups" aria-label={t('common.back')}>
            <img src={backIcon} alt="" width="22" height="22" />
          </Link>
          <LoadingIndicator />
        </div>
      </main>
    )
  }

  if (status !== 'ready' || !group) {
    return (
      <main className="sheet">
        <div className="sheet-frame">
          <Link className="auth-back" to="/groups" aria-label={t('common.back')}>
            <img src={backIcon} alt="" width="22" height="22" />
          </Link>
          <p className="dashboard-kicker">{t('group.kicker')}</p>
          <h1>{t('group.missing')}</h1>
          <p className="dashboard-stats" role={status === 'error' ? 'alert' : undefined}>
            {status === 'error' ? result.error : t('group.missingLead')}
          </p>
        </div>
      </main>
    )
  }

  const count = group.miembros?.length ?? 0
  const isAdmin = group.miRol === 'ADMIN'
  const canCreate = isAdmin || !group.soloAdminsCreanRetos

  return (
    <main className="sheet group-detail">
      <div className="sheet-frame">
        <Link className="auth-back" to="/groups" aria-label={t('common.back')}>
          <img src={backIcon} alt="" width="22" height="22" />
        </Link>
        <p className="dashboard-kicker">{t('group.kicker')}</p>
        <h1>{group.nombre}</h1>
        <p className="dashboard-stats">
          {t(count === 1 ? 'groups.member' : 'groups.members', { count })}
          {group.descripcion ? ` · ${group.descripcion}` : ''}
        </p>
        <section className="motivation" aria-label={t('common.steplyMessage')}>
          <div className="motivation-avatar">
            <img className="motivation-bunny" src={bunny} alt="" width="69" height="78" />
          </div>
          <div>
            <h2>{t('group.motivation')}</h2>
            <p>
              {t('group.motivationLine1')}
              <br />
              {t('group.motivationLine2')}
            </p>
          </div>
        </section>
        <h2 className="sheet-section">{t('group.members')}</h2>
        <ul className="friend-list">
          {group.miembros.map((member) => (
            <li key={member.id} className="friend-row">
              <div className="friend-identity">
                <MediaImage className="friend-avatar" src={displayMediaUrl(member.fotoUrl)} width="36" height="36" />
                <div>
                  <p className="friend-name">{member.nombre}</p>
                  <p className="friend-handle">@{member.nombreUsuario}</p>
                </div>
              </div>
              <p className="friend-handle">{member.rol === 'ADMIN' ? t('group.admin') : t('group.memberRole')}</p>
            </li>
          ))}
        </ul>
        <h2 className="sheet-section">{t('group.habits')}</h2>
        {result.retos.length ? (
          <ul className="habit-list">
            {result.retos.map((reto) => (
              <HabitCard
                key={reto.id}
                habit={{
                  id: reto.id,
                  title: reto.nombre,
                  status: frequencyText(reto, t),
                  icon: 'book',
                }}
                state={{ from: `/groups/${group.id}` }}
              />
            ))}
          </ul>
        ) : (
          <p className="empty-note">{t('group.empty')}</p>
        )}
        {isAdmin ? (
          <div className="dashboard-actions">
            <Button type="button" variant="secondary" onClick={openInvites}>
              {t('group.invite')}
            </Button>
          </div>
        ) : null}
        {inviting ? (
          friends.length ? (
            <ul className="friend-list">
              {friends.map((item) => (
                <li key={item.usuario.id} className="friend-row">
                  <div className="friend-identity">
                    <MediaImage className="friend-avatar" src={displayMediaUrl(item.usuario.fotoUrl)} width="36" height="36" />
                    <div>
                      <p className="friend-name">{item.usuario.nombre}</p>
                      <p className="friend-handle">@{item.usuario.nombreUsuario}</p>
                    </div>
                  </div>
                  <Button type="button" disabled={busy === item.usuario.id} onClick={() => invite(item.usuario.id)}>
                    {t('group.inviteFriend')}
                  </Button>
                </li>
              ))}
            </ul>
          ) : <p className="empty-note">{t('group.noFriendsToInvite')}</p>
        ) : null}
        {pendingIds.length ? <p className="dashboard-stats">{t('group.pendingInvites', { count: pendingIds.length })}</p> : null}
        {notice ? (
          <p className={notice === 'group.invited' ? 'auth-notice' : 'field-error'} role={notice === 'group.invited' ? 'status' : 'alert'}>
            {notice.startsWith('group.') ? t(notice) : notice}
          </p>
        ) : null}
        <div className="group-detail-actions">
          <Button to={`/groups/${group.id}/ranking`}>{t('group.ranking')}</Button>
          {canCreate ? (
            <Button variant="secondary" to={`/groups/${group.id}/manage`}>
              {t('group.manage')}
            </Button>
          ) : null}
        </div>
      </div>
    </main>
  )
}
