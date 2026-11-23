import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'

const EXIT_MS = 220

export default function AnimatedToast({
  message,
  title,
  subtitle,
  tone = 'neutral',
  floating = false,
  open = false,
  token = 0,
  duration = 2500,
  onClose,
}) {
  const [shown, setShown] = useState({ token: 0, phase: 'enter' })
  const onCloseRef = useRef(onClose)

  useEffect(() => {
    onCloseRef.current = onClose
  })

  useEffect(() => {
    if (!floating || !open) return undefined

    const exitTimer = window.setTimeout(() => {
      setShown((current) => (current.token > token ? current : { token, phase: 'exit' }))
    }, duration)
    const closeTimer = window.setTimeout(() => {
      onCloseRef.current?.()
    }, duration + EXIT_MS)

    return () => {
      window.clearTimeout(exitTimer)
      window.clearTimeout(closeTimer)
    }
  }, [floating, open, token, duration])

  if (!floating) {
    if (!message) return null

    return (
      <p className={`animated-toast is-${tone}`} role="status">
        {message}
      </p>
    )
  }

  if (!open) return null

  const phase = shown.token === token ? shown.phase : 'enter'

  return createPortal(
    <div
      key={token}
      className={`animated-toast is-floating is-${phase}`}
      role="status"
      aria-live="polite"
    >
      <span className="toast-check" aria-hidden="true">
        <svg viewBox="0 0 32 32">
          <circle cx="16" cy="16" r="12" />
          <path d="M10.5 16.5 14.2 20.2 21.8 12.2" />
        </svg>
      </span>
      <span className="toast-copy">
        <strong>{title}</strong>
        {subtitle ? <span>{subtitle}</span> : null}
      </span>
    </div>,
    document.body,
  )
}
