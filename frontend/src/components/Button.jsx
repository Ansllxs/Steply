import { Link } from 'react-router-dom'

export default function Button({
  to,
  variant = 'primary',
  type = 'button',
  onClick,
  state,
  disabled = false,
  children,
}) {
  const className = `btn btn-${variant}`

  if (to) {
    return (
      <Link to={to} className={className} state={state} aria-disabled={disabled || undefined}>
        {children}
      </Link>
    )
  }

  return (
    <button type={type} className={className} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  )
}
