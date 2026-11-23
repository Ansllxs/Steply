import { Link } from 'react-router-dom'

export default function Button({
  to,
  variant = 'primary',
  type = 'button',
  onClick,
  state,
  children,
}) {
  const className = `btn btn-${variant}`

  if (to) {
    return (
      <Link to={to} className={className} state={state}>
        {children}
      </Link>
    )
  }

  return (
    <button type={type} className={className} onClick={onClick}>
      {children}
    </button>
  )
}
