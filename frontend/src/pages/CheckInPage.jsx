import { useEffect, useRef, useState } from 'react'
import { Link, useLocation, useParams } from 'react-router-dom'
import backIcon from '../assets/back.svg'
import AnimatedToast from '../components/AnimatedToast'
import Button from '../components/Button'
import CelebrationOverlay from '../components/CelebrationOverlay'
import LoadingSkeleton from '../components/LoadingSkeleton'
import SuccessFeedback from '../components/SuccessFeedback'
import { habitDetails, habits } from '../data/habits'
import { usePreferences } from '../state/usePreferences'
import { loadImage } from '../utils/cropImage'

const choices = [
  { id: 'yes', label: 'check.yes' },
  { id: 'no', label: 'check.no' },
]

export default function CheckInPage() {
  const { t } = usePreferences()
  const { id } = useParams()
  const location = useLocation()
  const maxEvidenceBytes = 5 * 1024 * 1024
  const habit = habits.find((item) => item.id === id)
  const detail = habitDetails[id]
  const [choice, setChoice] = useState('')
  const [fileName, setFileName] = useState('')
  const [previewUrl, setPreviewUrl] = useState('')
  const [previewLoading, setPreviewLoading] = useState(false)
  const [fileError, setFileError] = useState('')
  const [error, setError] = useState('')
  const [notice, setNotice] = useState('')
  const [previewOpen, setPreviewOpen] = useState(false)
  const previewRef = useRef('')
  const requestRef = useRef(0)

  useEffect(() => {
    return () => {
      if (previewRef.current) URL.revokeObjectURL(previewRef.current)
    }
  }, [])

  if (!habit || !detail) {
    return (
      <main className="sheet">
        <div className="sheet-frame">
          <Link className="auth-back" to="/habits" aria-label={t('common.back')}>
            <img src={backIcon} alt="" width="22" height="22" />
          </Link>
          <p className="dashboard-kicker">{t('check.kicker')}</p>
          <h1>{t('detail.missing')}</h1>
          <p className="dashboard-stats">{t('detail.missingLead')}</p>
        </div>
      </main>
    )
  }

  function replacePreview(nextUrl) {
    if (previewRef.current) URL.revokeObjectURL(previewRef.current)
    previewRef.current = nextUrl
    setPreviewUrl(nextUrl)
  }

  async function handleFile(event) {
    const file = event.target.files?.[0]
    const request = requestRef.current + 1
    requestRef.current = request

    if (!file) {
      replacePreview('')
      setFileName('')
      setFileError('')
      setPreviewLoading(false)
      return
    }

    if (!file.type.startsWith('image/')) {
      replacePreview('')
      setFileName('')
      setFileError('check.imageType')
      setPreviewLoading(false)
      event.target.value = ''
      return
    }

    if (file.size > maxEvidenceBytes) {
      replacePreview('')
      setFileName('')
      setFileError('check.imageSize')
      setPreviewLoading(false)
      event.target.value = ''
      return
    }

    const url = URL.createObjectURL(file)
    setFileError('')
    setFileName('')
    setPreviewLoading(true)

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
    setFileName(file.name)
    setPreviewLoading(false)
  }

  function handleSubmit(event) {
    event.preventDefault()

    if (!choice) {
      setError('check.choose')
      setNotice('')
      return
    }

    if (fileError) {
      setNotice('')
      return
    }

    setError('')
    setNotice(
      'check.notice',
    )
  }

  const statusLabels = {
    yes: 'check.selectedYes',
    no: 'check.selectedNo',
  }
  const status = error || (choice ? statusLabels[choice] : 'check.choose')

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
          {habit.title} · {t('check.date')}
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
              {t(status)}
            </p>
          </div>
          <div className="evidence-upload">
            <input
              id="evidence-file"
              className="file-input"
              type="file"
              accept="image/*"
              onChange={handleFile}
            />
            <label className="btn btn-outline" htmlFor="evidence-file">
              {t('check.evidence')}
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
            {fileError ? (
              <p className="file-name is-alert" role="alert">
                {t(fileError)}
              </p>
            ) : null}
          </div>
          <div className="check-save">
            <Button type="submit">{t('check.save')}</Button>
            <AnimatedToast message={notice ? t(notice) : ''} />
          </div>
          <div className="celebration-preview">
            <Button type="button" variant="secondary" onClick={() => setPreviewOpen(true)}>
              {t('celebration.preview')}
            </Button>
            <p className="file-name">{t('celebration.previewHelp')}</p>
          </div>
        </form>
        <CelebrationOverlay
          open={previewOpen}
          preview
          onClose={() => setPreviewOpen(false)}
        />
      </div>
    </main>
  )
}
