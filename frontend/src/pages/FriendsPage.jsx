import { useEffect, useState } from 'react'
import searchIcon from '../assets/icon-search.svg'
import BottomNav from '../components/BottomNav'
import Button from '../components/Button'
import DashboardHeader from '../components/DashboardHeader'
import LoadingIndicator from '../components/LoadingIndicator'
import { habitErrorText } from '../services/habits'
import {
  acceptFriendRequest,
  acceptGroupInvitation,
  listFriendships,
  myGroupInvitations,
  rejectFriendRequest,
  rejectGroupInvitation,
  removeFriendship,
  searchUsers,
  sendFriendRequest,
} from '../services/social'
import { usePreferences } from '../state/usePreferences'

const tabs = [
  { id: 'friends', label: 'friends.tabFriends' },
  { id: 'requests', label: 'friends.tabRequests' },
  { id: 'search', label: 'friends.tabSearch' },
]

export default function FriendsPage() {
  const { t } = usePreferences()
  const [tab, setTab] = useState('friends')
  const [request, setRequest] = useState(0)
  const [social, setSocial] = useState({ request: -1, friends: null, invites: [], error: '' })
  const [query, setQuery] = useState('')
  const [search, setSearch] = useState({ query: '', status: 'idle', users: [], error: '' })
  const [busy, setBusy] = useState('')
  const [notice, setNotice] = useState('')

  useEffect(() => {
    let active = true
    Promise.all([listFriendships(), myGroupInvitations()])
      .then(([friends, invites]) => {
        if (!active) return
        setSocial({ request, friends, invites: invites.invitaciones ?? [], error: '' })
      })
      .catch((err) => {
        if (!active) return
        setSocial({ request, friends: null, invites: [], error: habitErrorText(err, t) })
      })
    return () => {
      active = false
    }
  }, [request, t])

  useEffect(() => {
    const text = query.trim()
    if (text.length < 2) return undefined
    const timer = window.setTimeout(() => {
      searchUsers(text)
        .then((data) => {
          setSearch((current) => (
            current.query === text || query.trim() === text
              ? { query: text, status: 'ready', users: data.usuarios ?? [], error: '' }
              : current
          ))
        })
        .catch((err) => {
          setSearch({ query: text, status: 'error', users: [], error: habitErrorText(err, t) })
        })
    }, 300)
    return () => window.clearTimeout(timer)
  }, [query, t])

  const ready = social.request === request
  const friends = social.friends
  const incoming = (friends?.recibidas?.length ?? 0) + social.invites.length

  async function run(key, action) {
    if (busy) return
    setBusy(key)
    setNotice('')
    try {
      await action()
      setRequest((current) => current + 1)
      if (query.trim().length >= 2) {
        const data = await searchUsers(query.trim())
        setSearch({ query: query.trim(), status: 'ready', users: data.usuarios ?? [], error: '' })
      }
    } catch (err) {
      setNotice(habitErrorText(err, t))
    } finally {
      setBusy('')
    }
  }

  function personRow(person, actions) {
    return (
      <li key={person.amistadId || person.id} className="friend-row">
        <div>
          <p className="friend-name">{person.usuario?.nombre || person.nombre}</p>
          <p className="friend-handle">@{person.usuario?.nombreUsuario || person.nombreUsuario}</p>
        </div>
        <div className="friend-actions">{actions}</div>
      </li>
    )
  }

  return (
    <main className="dashboard friends-page">
      <div className="dashboard-frame">
        <DashboardHeader />
        <p className="dashboard-kicker">{t('friends.kicker')}</p>
        <h1>{t('friends.title')}</h1>
        <p className="dashboard-stats">{t('friends.lead')}</p>
        <div className="habit-filters" role="tablist" aria-label={t('friends.tabs')}>
          {tabs.map((item) => (
            <button
              key={item.id}
              type="button"
              className={tab === item.id ? 'habit-filter is-selected' : 'habit-filter'}
              aria-selected={tab === item.id}
              onClick={() => setTab(item.id)}
            >
              {t(item.label)}
              {item.id === 'requests' && incoming ? ` (${incoming})` : ''}
            </button>
          ))}
        </div>
        {!ready ? <LoadingIndicator /> : null}
        {ready && social.error ? <p className="empty-note" role="alert">{social.error}</p> : null}
        {notice ? <p className="field-error" role="alert">{notice}</p> : null}

        {ready && tab === 'friends' ? (
          friends?.amigos?.length ? (
            <ul className="friend-list">
              {friends.amigos.map((item) => personRow(item, (
                <Button
                  type="button"
                  variant="secondary"
                  disabled={Boolean(busy)}
                  onClick={() => {
                    if (window.confirm(t('friends.removeConfirm', { name: item.usuario.nombre }))) {
                      run(item.amistadId, () => removeFriendship(item.amistadId))
                    }
                  }}
                >
                  {t('friends.remove')}
                </Button>
              )))}
            </ul>
          ) : (
            <p className="empty-note">{t('friends.emptyFriends')}</p>
          )
        ) : null}

        {ready && tab === 'requests' ? (
          <>
            <h2 className="dashboard-section">{t('friends.incoming')}</h2>
            {friends?.recibidas?.length ? (
              <ul className="friend-list">
                {friends.recibidas.map((item) => personRow(item, (
                  <>
                    <Button type="button" disabled={Boolean(busy)} onClick={() => run(item.amistadId, () => acceptFriendRequest(item.amistadId))}>
                      {t('friends.accept')}
                    </Button>
                    <Button type="button" variant="secondary" disabled={Boolean(busy)} onClick={() => run(`${item.amistadId}-no`, () => rejectFriendRequest(item.amistadId))}>
                      {t('friends.reject')}
                    </Button>
                  </>
                )))}
              </ul>
            ) : <p className="empty-note">{t('friends.emptyIncoming')}</p>}
            <h2 className="dashboard-section">{t('friends.outgoing')}</h2>
            {friends?.enviadas?.length ? (
              <ul className="friend-list">
                {friends.enviadas.map((item) => personRow(item, (
                  <Button type="button" variant="secondary" disabled={Boolean(busy)} onClick={() => run(item.amistadId, () => removeFriendship(item.amistadId))}>
                    {t('friends.cancel')}
                  </Button>
                )))}
              </ul>
            ) : <p className="empty-note">{t('friends.emptyOutgoing')}</p>}
            <h2 className="dashboard-section">{t('friends.groupInvites')}</h2>
            {social.invites.length ? (
              <ul className="friend-list">
                {social.invites.map((item) => (
                  <li key={item.id} className="friend-row">
                    <div>
                      <p className="friend-name">{item.grupo.nombre}</p>
                      <p className="friend-handle">{t('friends.invitedBy', { name: item.invitador.nombre })}</p>
                    </div>
                    <div className="friend-actions">
                      <Button type="button" disabled={Boolean(busy)} onClick={() => run(item.id, () => acceptGroupInvitation(item.id))}>
                        {t('friends.accept')}
                      </Button>
                      <Button type="button" variant="secondary" disabled={Boolean(busy)} onClick={() => run(`${item.id}-no`, () => rejectGroupInvitation(item.id))}>
                        {t('friends.reject')}
                      </Button>
                    </div>
                  </li>
                ))}
              </ul>
            ) : <p className="empty-note">{t('friends.emptyGroups')}</p>}
          </>
        ) : null}

        {tab === 'search' ? (
          <>
            <div className="group-search">
              <label htmlFor="friend-search">{t('friends.search')}</label>
              <div className="group-search-field">
                <img src={searchIcon} alt="" width="22" height="22" />
                <input
                  id="friend-search"
                  type="search"
                  value={query}
                  placeholder={t('friends.searchPlaceholder')}
                  onChange={(event) => {
                    const value = event.target.value
                    setQuery(value)
                    setSearch({ query: value.trim(), status: value.trim().length < 2 ? 'idle' : 'loading', users: [], error: '' })
                  }}
                />
              </div>
            </div>
            {query.trim().length < 2 ? <p className="empty-note">{t('friends.searchHint')}</p> : null}
            {search.status === 'loading' ? <LoadingIndicator /> : null}
            {search.status === 'error' ? <p className="empty-note" role="alert">{search.error}</p> : null}
            {search.status === 'ready' && search.query === query.trim() && search.users.length ? (
              <ul className="friend-list">
                {search.users.map((user) => {
                  const state = user.relacion?.estado
                  let action = (
                    <Button type="button" disabled={Boolean(busy)} onClick={() => run(user.id, () => sendFriendRequest(user.id))}>
                      {t('friends.add')}
                    </Button>
                  )
                  if (state === 'AMIGOS') action = <p className="friend-handle">{t('friends.already')}</p>
                  if (state === 'ENVIADA') action = (
                    <Button type="button" variant="secondary" disabled={Boolean(busy)} onClick={() => run(user.id, () => removeFriendship(user.relacion.amistadId))}>
                      {t('friends.sent')}
                    </Button>
                  )
                  if (state === 'RECIBIDA') action = (
                    <Button type="button" disabled={Boolean(busy)} onClick={() => run(user.id, () => acceptFriendRequest(user.relacion.amistadId))}>
                      {t('friends.accept')}
                    </Button>
                  )
                  return personRow(user, action)
                })}
              </ul>
            ) : null}
            {search.status === 'ready' && search.query === query.trim() && !search.users.length ? (
              <p className="empty-note">{t('friends.searchEmpty')}</p>
            ) : null}
          </>
        ) : null}
      </div>
      <BottomNav />
    </main>
  )
}
