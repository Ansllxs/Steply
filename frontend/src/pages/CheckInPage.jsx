import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
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
  const previewRef = useRef('')
  const fileInputRef = useRef(null)
  const requestRef = useRef(0)

  useEffect(() => {
    return () => {
      if (previewRef.current) URL.revokeObjectURL(previewRef.current)
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

  async function handleSubmit(event) {
    event.preventDefault()
    if (submitting) return

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

    setSubmitting(true)
    setError('')
    setNotice('')
    setSaved(false)
    try {
      await saveCheckIn(habit.id, { completed: choice === 'yes', file: choice === 'yes' ? file : null })
      setNotice(file && choice === 'yes' ? 'check.uploaded' : choice === 'yes' ? 'check.saved' : 'check.savedNo')
      setSaved(choice === 'yes')
      if (file && choice === 'yes') clearFile()
      try {
        const todayData = await todayProgress()
        const nextToday = (todayData.hoy ?? []).find((item) => item.reto.id === habit.id) ?? null
        setPage((current) => ({ ...current, today: nextToday }))
      } catch {
        // The record is already stored. A failed refresh should not undo that confirmation.
      }
    } catch (err) {
      setError(habitErrorText(err, t))
      setNotice('')
      setSaved(false)
    } finally {
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
  const alreadyRecorded = todayItem?.registroId
  const statusLabels = {
    yes: 'check.selectedYes',
    no: 'check.selectedNo',
  }
  const choiceStatus = error || (choice ? statusLabels[choice] : 'check.choose')
  const todayLabel = formatCalendarDate(calendarDate(user.zonaHoraria || 'America/Costa_Rica'), language)

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
        <form className="check-form" onSubmit={handleSubmit} noValidate>
          <div className="choice-group" role="group" aria-label={t('check.group')}>
            {choices.map((item) => {
              const selected = choice === item.id
              const className = [
                'choice',
                item.id === 'yes' ? 'choice-yes' : 'choice-no',
                selected ? 'is-selected' : '',
              ]
                .filter(Boolean)
                .join(' ')

              return (
                <button
                  key={item.id}
                  type="button"
                  className={className}
                  aria-pressed={selected}
                  disabled={submitting || Boolean(blocked)}
                  onClick={() => {
                    setChoice(item.id)
                    setError('')
                  }}
                >
                  {t(item.label)}
                </button>
              )
            })}
            <p
              className={error ? 'choice-status is-alert' : 'choice-status'}
              role={error ? 'alert' : undefined}
            >
              {error && !error.startsWith('check.') ? error : t(choiceStatus)}
            </p>
          </div>
          {blocked ? <p className="field-error" role="alert">{t(blocked)}</p> : null}
          {alreadyRecorded && !blocked ? <p className="dashboard-stats">{t('check.already')}</p> : null}
          <div className="evidence-upload">
            <input
              id="evidence-file"
              ref={fileInputRef}
              className="file-input"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/heic,.jpg,.jpeg,.png,.webp,.heic"
              disabled={submitting || Boolean(blocked)}
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
              <Button type="button" variant="secondary" onClick={clearFile} disabled={submitting}>
                {t('check.removeImage')}
              </Button>
            ) : null}
            {fileError ? (
              <p className="file-name is-alert" role="alert">
                {t(fileError)}
              </p>
            ) : null}
          </div>
          <div className="check-save">
            <Button type="submit" disabled={submitting || Boolean(blocked)}>
              {submitting ? t('check.saving') : t('check.save')}
            </Button>
            <AnimatedToast message={notice ? (notice.startsWith('check.') ? t(notice) : notice) : ''} />
          </div>
        </form>
        <CelebrationOverlay
          open={saved}
          onClose={() => setSaved(false)}
        />
      </div>
    </main>
  )
}
