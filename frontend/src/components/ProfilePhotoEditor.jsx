import { useEffect, useId, useRef, useState } from 'react'
import Cropper from 'react-easy-crop'
import Button from './Button'
import LoadingIndicator from './LoadingIndicator'
import { usePreferences } from '../state/usePreferences'
import { cropImageToBlob } from '../utils/cropImage'

export default function ProfilePhotoEditor({ imageUrl, onCancel, onAccept }) {
  const { t } = usePreferences()
  const titleId = useId()
  const dialogRef = useRef(null)
  const onCancelRef = useRef(onCancel)
  const busyRef = useRef(false)
  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [pixels, setPixels] = useState(null)
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    onCancelRef.current = onCancel
    busyRef.current = busy
  })

  useEffect(() => {
    const dialog = dialogRef.current

    function focusable() {
      if (!dialog) return []
      return [...dialog.querySelectorAll('button, input, [tabindex="0"]')].filter(
        (element) => !element.disabled,
      )
    }

    const frame = requestAnimationFrame(() => {
      dialog?.querySelector('[data-testid="cropper"]')?.focus()
    })

    function onKeyDown(event) {
      if (event.key === 'Escape' && !busyRef.current) {
        event.preventDefault()
        onCancelRef.current()
        return
      }

      if (event.key !== 'Tab' || !dialog) return

      const items = focusable()
      if (items.length === 0) return

      const first = items[0]
      const last = items[items.length - 1]

      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault()
        last.focus()
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault()
        first.focus()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => {
      cancelAnimationFrame(frame)
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [])

  async function handleAccept() {
    if (!pixels || busy) return

    setBusy(true)
    setError('')

    try {
      const blob = await cropImageToBlob(imageUrl, pixels)
      await onAccept(blob)
    } catch (err) {
      const message = err instanceof Error && err.message ? err.message : 'profile.photoCropError'
      setError(message.startsWith('profile.') ? message : message || 'profile.photoCropError')
      setBusy(false)
    }
  }

  return (
    <div
      className="photo-crop-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget && !busy) onCancel()
      }}
    >
      <div
        ref={dialogRef}
        className="photo-crop-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-busy={busy || undefined}
      >
        <h2 id={titleId}>{t('profile.cropTitle')}</h2>
        <p>{t('profile.cropLead')}</p>
        <div className="photo-crop-stage">
          <Cropper
            image={imageUrl}
            crop={crop}
            zoom={zoom}
            aspect={1}
            cropShape="round"
            showGrid={false}
            objectFit="cover"
            minZoom={1}
            maxZoom={3}
            onCropChange={setCrop}
            onZoomChange={setZoom}
            onCropComplete={(_area, nextPixels) => setPixels(nextPixels)}
            style={{
              cropAreaStyle: {
                color: 'rgba(37, 20, 66, 0.55)',
                border: '2px solid #FCF7F0',
              },
            }}
            cropperProps={{
              'aria-label': t('profile.cropArea'),
            }}
          />
        </div>
        <label className="photo-crop-zoom">
          {t('profile.zoom')}
          <input
            type="range"
            min="1"
            max="3"
            step="0.01"
            value={zoom}
            aria-valuemin={1}
            aria-valuemax={3}
            aria-valuenow={Number(zoom.toFixed(2))}
            onChange={(event) => setZoom(Number(event.target.value))}
          />
        </label>
        {busy ? <LoadingIndicator /> : null}
        {error ? (
          <p className="field-error" role="alert">
            {error.startsWith('profile.') ? t(error) : error}
          </p>
        ) : null}
        <div className="photo-crop-actions">
          <Button variant="secondary" onClick={onCancel} disabled={busy}>
            {t('common.cancel')}
          </Button>
          <Button onClick={handleAccept} disabled={!pixels || busy}>
            {t('profile.accept')}
          </Button>
        </div>
      </div>
    </div>
  )
}
