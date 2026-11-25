import { useId, useRef, useState } from 'react'
import { usePreferences } from '../state/usePreferences'

function EyeIcon({ off }) {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" aria-hidden="true">
      <path
        d="M2.2 10s2.7-4.5 7.8-4.5S17.8 10 17.8 10s-2.7 4.5-7.8 4.5S2.2 10 2.2 10Z"
        stroke="currentColor"
        strokeWidth="1.6"
        strokeLinejoin="round"
      />
      <circle cx="10" cy="10" r="2.2" stroke="currentColor" strokeWidth="1.6" />
      {off ? <path d="M4 16 16 4" stroke="currentColor" strokeWidth="1.6" strokeLinecap="round" /> : null}
    </svg>
  )
}

export default function TextField({
  id,
  label,
  type = 'text',
  name,
  value,
  onChange,
  error,
  hint,
  placeholder,
  autoComplete,
  revealable = false,
  disabled = false,
}) {
  const { t } = usePreferences()
  const inputRef = useRef(null)
  const [visible, setVisible] = useState(false)
  const hintId = useId()
  const errorId = `${id}-error`
  const describedBy = [hint ? hintId : null, error ? errorId : null].filter(Boolean).join(' ') || undefined
  const inputType = revealable && visible ? 'text' : type

  function toggleVisibility() {
    setVisible((current) => !current)
    inputRef.current?.focus()
  }

  return (
    <div className="field">
      <label htmlFor={id}>{label}</label>
      <div className={revealable ? 'field-control' : undefined}>
        <input
          ref={inputRef}
          id={id}
          name={name}
          type={inputType}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          aria-invalid={Boolean(error)}
          aria-describedby={describedBy}
          aria-required="true"
          disabled={disabled}
        />
        {revealable ? (
          <button
            type="button"
            className="field-reveal"
            aria-label={visible ? t('auth.hidePassword') : t('auth.showPassword')}
            aria-pressed={visible}
            onMouseDown={(event) => event.preventDefault()}
            onClick={toggleVisibility}
          >
            <EyeIcon off={visible} />
          </button>
        ) : null}
      </div>
      {hint ? (
        <p className="field-help" id={hintId}>
          {hint}
        </p>
      ) : null}
      {error ? (
        <p className="field-error" id={errorId} role="alert">
          {error}
        </p>
      ) : null}
    </div>
  )
}
