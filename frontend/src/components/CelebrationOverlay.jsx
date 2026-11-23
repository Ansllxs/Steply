import { useEffect, useId, useRef } from 'react'
import celebration from '../assets/celebracion.png'
import { usePreferences } from '../state/usePreferences'
import Button from './Button'

const pieces = [
  { left: '8%', color: 'var(--color-soft)', delay: '0ms' },
  { left: '18%', color: 'var(--color-pink)', delay: '40ms' },
  { left: '30%', color: 'var(--color-primary)', delay: '90ms' },
  { left: '42%', color: 'var(--color-purple)', delay: '20ms' },
  { left: '54%', color: 'var(--color-pink)', delay: '120ms' },
  { left: '66%', color: 'var(--color-soft)', delay: '60ms' },
  { left: '76%', color: 'var(--color-primary)', delay: '140ms' },
  { left: '88%', color: 'var(--color-pink)', delay: '30ms' },
  { left: '24%', color: 'var(--color-purple)', delay: '160ms' },
  { left: '60%', color: 'var(--color-soft)', delay: '100ms' },
]

export default function CelebrationOverlay({ open, onClose, preview = false }) {
  const { t } = usePreferences()
  const titleId = useId()
  const noteId = useId()
  const closeRef = useRef(null)
  const onCloseRef = useRef(onClose)

  useEffect(() => {
    onCloseRef.current = onClose
  })

  useEffect(() => {
    if (!open) return undefined

    const previous = document.activeElement
    closeRef.current?.focus()

    function onKeyDown(event) {
      if (event.key === 'Escape') {
        event.preventDefault()
        onCloseRef.current()
      }
    }

    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.removeEventListener('keydown', onKeyDown)
      if (previous instanceof HTMLElement) previous.focus()
    }
  }, [open])

  if (!open) return null

  return (
    <div
      className="celebration-backdrop"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) onClose()
      }}
    >
      <div
        className="celebration-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby={titleId}
        aria-describedby={preview ? noteId : undefined}
      >
        <div className="celebration-confetti" aria-hidden="true">
          {pieces.map((piece) => (
            <span
              key={`${piece.left}-${piece.delay}`}
              style={{ left: piece.left, background: piece.color, animationDelay: piece.delay }}
            />
          ))}
        </div>
        <img className="celebration-bunny" src={celebration} alt="" width="148" height="148" />
        <span className="celebration-check" aria-hidden="true">
          <svg viewBox="0 0 64 64">
            <circle cx="32" cy="32" r="28" />
            <path d="M20 33.5 28 41.5 45 23.5" />
          </svg>
        </span>
        {preview ? (
          <p id={noteId} className="celebration-preview-label">
            {t('celebration.previewLabel')}
          </p>
        ) : null}
        <h2 id={titleId}>{t('celebration.title')}</h2>
        <p>{t('celebration.lead')}</p>
        <Button variant="secondary" onClick={onClose} ref={closeRef}>
          {t('common.close')}
        </Button>
      </div>
    </div>
  )
}
