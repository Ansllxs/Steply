import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useNavigate, useParams } from 'react-router-dom'
import backIcon from '../assets/back.svg'
import AnimatedToast from '../components/AnimatedToast'
import Button from '../components/Button'
import CelebrationOverlay from '../components/CelebrationOverlay'
import LoadingIndicator from '../components/LoadingIndicator'
import LoadingSkeleton from '../components/LoadingSkeleton'
import SuccessFeedback from '../components/SuccessFeedback'
import {
  calendarDate,
  formatCalendarDate,
  getHabit,
  habitErrorText,
  isAllowedEvidence,
  isHabitId,
  saveCheckIn,
  todayProgress,
} from '../services/habits'
import { useAuth } from '../state/useAuth'
import { usePreferences } from '../state/usePreferences'
import { loadImage } from '../utils/cropImage'

const choices = [
  { id: 'yes', label: 'check.yes' },
  { id: 'no', label: 'check.no' },
]
const maxEvidenceBytes = 5 * 1024 * 1024

export default function CheckInPage() {
  const { t, language } = usePreferences()
  const { user } = useAuth()
  const { id } = useParams()
  const location = useLocation()
  const [page, setPage] = useState({ id: '', status: 'loading', error: '', habit: null, today: null })
  const [choice, setChoice] = useState('')
  const [file, setFile] = useState(null)
  const [fileName, setFileName] = useState('')
  const [previewUrl, setPreviewUrl] = useState('')
  const [previewLoading, setPreviewLoading] = useState(false)
  const [fileError, setFileError] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [saved, setSaved] = useState(false)
  const [earnedPoints, setEarnedPoints] = useState(null)
  const previewRef = useRef('')
  const fileInputRef = useRef(null)
  const requestRef = useRef(0)
  const lockRef = useRef(false)
  const returnTimer = useRef(0)
  const navigate = useNavigate()

  useEffect(() => {
    return () => {
      if (previewRef.current) URL.revokeObjectURL(previewRef.current)
      window.clearTimeout(returnTimer.current)
    }
  }, [])

  useEffect(() => {
    if (!isHabitId(id)) return undefined
    let active = true
    Promise.all([getHabit(id), todayProgress()])
      .then(([habitData, todayData]) => {
        if (!active) return
        const today = (todayData.hoy ?? []).find((item) => item.reto.id === id) ?? null
        setPage({ id, status: 'ready', error: '', habit: habitData.reto, today })
        if (today?.estadoHoy === 'COMPLETADO' || today?.estadoHoy === 'PENDIENTE_APROBACION') setChoice('yes')
        else if (today?.estadoHoy === 'NO_COMPLETADO' || today?.estadoHoy === 'RECHAZADO') setChoice('no')
      })
      .catch((err) => {
        if (!active) return
        if (err?.status === 404 || err?.codigo === 'NO_ENCONTRADO') {
          setPage({ id, status: 'missing', error: '', habit: null, today: null })
          return
        }
        setPage({ id, status: 'error', error: habitErrorText(err, t), habit: null, today: null })
      })
    return () => {
      active = false
    }
  }, [id, t])

  const status = !isHabitId(id) ? 'missing' : page.id === id ? page.status : 'loading'
  const habit = page.id === id ? page.habit : null
  const todayItem = page.id === id ? page.today : null

  function replacePreview(nextUrl) {
    if (previewRef.current) URL.revokeObjectURL(previewRef.current)
    previewRef.current = nextUrl
    setPreviewUrl(nextUrl)
  }

  function clearFile() {
    replacePreview('')
    setFile(null)
    setFileName('')
    setFileError('')
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  async function handleFile(event) {
    const nextFile = event.target.files?.[0]
    const request = requestRef.current + 1
    requestRef.current = request

    if (!nextFile) {
      replacePreview('')
      setFile(null)
      setFileName('')
      setFileError('')
      setPreviewLoading(false)
      return
    }

    if (!isAllowedEvidence(nextFile)) {
      replacePreview('')
      setFile(null)
      setFileName('')
      setFileError('check.imageType')
      setPreviewLoading(false)
      event.target.value = ''
      return
    }

    if (nextFile.size > maxEvidenceBytes) {
      replacePreview('')
      setFile(null)
      setFileName('')
      setFileError('check.imageSize')
      setPreviewLoading(false)
      event.target.value = ''
      return
    }

    const heic = nextFile.type === 'image/heic' || /\.heic$/i.test(nextFile.name)
    setFileError('')
    setFile(null)
    setFileName('')
    setPreviewLoading(!heic)

    if (heic) {
      replacePreview('')
      setFile(nextFile)
      setFileName(nextFile.name)
      return
    }

    const url = URL.createObjectURL(nextFile)

    try {
      await loadImage(url)
    } catch {
      URL.revokeObjectURL(url)
      if (request !== requestRef.current) return
      replacePreview('')
      setFileError('check.imageRead')
      setPreviewLoading(false)
      event.target.value = ''
      return
    }

    if (request !== requestRef.current) {
      URL.revokeObjectURL(url)
      return
    }

    replacePreview(url)
    setFile(nextFile)
    setFileName(nextFile.name)
    setPreviewLoading(false)
  }

  function selectChoice(next) {
    setChoice(next)
    setError('')
    if (next !== 'yes') clearFile()
  }

  function moveChoice(event) {
    if (!['ArrowDown', 'ArrowUp', 'ArrowRight', 'ArrowLeft'].includes(event.key)) return
    event.preventDefault()
    const index = choices.findIndex((item) => item.id === choice)
    const forward = event.key === 'ArrowDown' || event.key === 'ArrowRight'
    const start = index < 0 ? 0 : index
    const nextIndex = forward
      ? (start + (index < 0 ? 0 : 1)) % choices.length
      : (start - 1 + choices.length) % choices.length
    const next = choices[nextIndex].id
    selectChoice(next)
    event.currentTarget.querySelector(`[data-choice="${next}"]`)?.focus()
  }

  function leaveToHabits() {
    window.clearTimeout(returnTimer.current)
    navigate('/habits', { replace: true })
  }

  async function handleSubmit(event) {
    event.preventDefault()
    if (lockRef.current) return

    if (!choice) {
      setError('check.choose')
      setNotice('')
      return
    }

    if (fileError) {
      setNotice('')
      return
    }

    if (choice === 'no' && file) {
      setError('check.photoNeedsYes')
      setNotice('')
      return
    }

    if (habit?.requiereEvidencia && choice === 'yes' && !file && todayItem?.estadoHoy !== 'COMPLETADO') {
      setError('check.evidenceMissing')
      setNotice('')
      return
    }

    lockRef.current = true
    setSubmitting(true)
    setError('')
    setNotice('')
    setSaved(false)
    try {
      const result = await saveCheckIn(habit.id, { completed: choice === 'yes', file: choice === 'yes' ? file : null })
      if (choice === 'yes') {
        const points = Number(result?.puntosRegistro)
        setEarnedPoints(Number.isFinite(points) && points > 0 ? points : null)
        setSaved(true)
        returnTimer.current = window.setTimeout(() => {
          navigate('/habits', { replace: true })
        }, 2200)
        return
      }
      setNotice('check.savedNo')
      navigate('/habits', { replace: true })
    } catch (err) {
      lockRef.current = false
      setError(habitErrorText(err, t))
      setNotice('')
      setSaved(false)
      setSubmitting(false)
    }
  }

  if (status === 'loading') {
    return (
      <main className="sheet">
        <div className="sheet-frame">
          <Link className="auth-back" to="/habits" aria-label={t('common.back')}>
            <img src={backIcon} alt="" width="22" height="22" />
          </Link>
          <LoadingIndicator />
        </div>
      </main>
    )
  }

  if (status !== 'ready' || !habit) {
    return (
      <main className="sheet">
        <div className="sheet-frame">
          <Link className="auth-back" to="/habits" aria-label={t('common.back')}>
            <img src={backIcon} alt="" width="22" height="22" />
          </Link>
          <p className="dashboard-kicker">{t('check.kicker')}</p>
          <h1>{t('detail.missing')}</h1>
          <p className="dashboard-stats" role={status === 'error' ? 'alert' : undefined}>
            {status === 'error' ? page.error : t('detail.missingLead')}
          </p>
        </div>
      </main>
    )
  }

  const blocked = todayItem?.estadoHoy === 'NO_PROGRAMADO'
    ? 'check.notScheduled'
    : todayItem?.estadoHoy === 'PAUSADO'
      ? 'check.paused'
      : !todayItem
        ? 'check.unavailable'
        : ''
  const finished = todayItem?.estadoHoy === 'COMPLETADO' || todayItem?.estadoHoy === 'PENDIENTE_APROBACION'
  const busy = submitting || saved
  const alreadyRecorded = todayItem?.registroId && !finished
  const todayLabel = formatCalendarDate(calendarDate(user.zonaHoraria || 'America/Costa_Rica'), language)
  const choiceMessage = error ? (error.startsWith('check.') ? t(error) : error) : ''

  return (
    <main className="sheet">
      <div className="sheet-frame">
        <Link
          className="auth-back"
          to={`/habits/${habit.id}`}
          state={location.state}
          aria-label={t('common.back')}
        >
          <img src={backIcon} alt="" width="22" height="22" />
        </Link>
        <p className="dashboard-kicker">{t('check.kicker')}</p>
        <h1>{t('check.title')}</h1>
        <p className="dashboard-stats">
          {habit.nombre} · {todayLabel}
        </p>
        <h2 className="sheet-section sheet-question">{t('check.question')}</h2>
        <div className="check-halo" aria-hidden="true" />
        {finished && !saved ? (
          <div className="check-save">
            <p className="dashboard-stats" role="status">
              {todayItem.estadoHoy === 'PENDIENTE_APROBACION' ? t('check.pendingReview') : t('check.doneToday')}
            </p>
            <Button to="/habits">{t('check.backToHabits')}</Button>
          </div>
        ) : null}
        {!finished && !saved ? (
        <form className="check-form" onSubmit={handleSubmit} noValidate>
          <div className="choice-group" role="radiogroup" aria-label={t('check.group')} onKeyDown={moveChoice}>
            {choices.map((item) => {
              const selected = choice === item.id
              return (
                <button
                  key={item.id}
                  type="button"
                  className={selected ? 'choice is-selected' : 'choice'}
                  role="radio"
                  data-choice={item.id}
                  aria-checked={selected}
                  tabIndex={choice ? (selected ? 0 : -1) : item.id === 'yes' ? 0 : -1}
                  disabled={busy || Boolean(blocked)}
                  onClick={() => selectChoice(item.id)}
                >
                  <span>{t(item.label)}</span>
                  <span className="choice-mark" aria-hidden="true">
                    {selected ? (
                      <svg width="18" height="18" viewBox="0 0 18 18" fill="none">
                        <path d="M3.75 9.25L7.1 12.6L14.25 5.4" stroke="currentColor" strokeWidth="1.75" strokeLinecap="round" strokeLinejoin="round" />
                      </svg>
                    ) : null}
                  </span>
                </button>
              )
            })}
            {choiceMessage ? (
              <p className="choice-status is-alert" role="alert">
                {choiceMessage}
              </p>
            ) : null}
          </div>
          {blocked ? <p className="field-error" role="alert">{t(blocked)}</p> : null}
          {alreadyRecorded && !blocked ? <p className="dashboard-stats">{t('check.already')}</p> : null}
          {choice === 'yes' ? (
          <div className="evidence-upload">
            <input
              id="evidence-file"
              ref={fileInputRef}
              className="file-input"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/heic,.jpg,.jpeg,.png,.webp,.heic"
              disabled={busy || Boolean(blocked)}
              onChange={handleFile}
            />
            <label className="btn btn-outline" htmlFor="evidence-file">
              {habit.requiereEvidencia ? t('check.evidenceRequired') : t('check.evidence')}
            </label>
            {previewLoading ? <LoadingSkeleton message={t('loading.image')} /> : null}
            {previewUrl ? (
              <figure className="evidence-preview">
                <img src={previewUrl} alt="" />
                <figcaption>
                  <SuccessFeedback message={t('check.imageSelected')} />
                  {fileName ? <p className="file-name">{fileName}</p> : null}
                </figcaption>
              </figure>
            ) : null}
            {file ? (
              <Button type="button" variant="secondary" onClick={clearFile} disabled={busy}>
                {t('check.removeImage')}
              </Button>
            ) : null}
            {fileError ? (
              <p className="file-name is-alert" role="alert">
                {t(fileError)}
              </p>
            ) : null}
          </div>
          ) : null}
          <div className="check-save">
            <Button type="submit" disabled={busy || Boolean(blocked)}>
              {submitting ? t('check.saving') : choice === 'yes' ? t('check.complete') : t('check.save')}
            </Button>
            <AnimatedToast message={notice ? (notice.startsWith('check.') ? t(notice) : notice) : ''} />
          </div>
        </form>
        ) : null}
        <CelebrationOverlay
          open={saved}
          points={earnedPoints}
          onClose={leaveToHabits}
        />
      </div>
    </main>
  )
}
